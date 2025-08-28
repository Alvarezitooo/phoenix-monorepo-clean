-- ============================================================================
-- 🔧 FIX ENERGY TRANSACTIONS CONFLICT
-- Date: 2025-08-27
-- Objectif: Résoudre le conflit view vs table pour energy_transactions
-- ============================================================================

BEGIN;

SELECT 'Fixing energy_transactions conflict...' as status;

-- ======================
-- 1️⃣ ANALYSER LA SITUATION
-- ======================

-- Vérifier si energy_transactions est une vue
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'energy_transactions';

-- Vérifier si energy_transactions est une table
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'energy_transactions';

-- ======================
-- 2️⃣ RÉSOUDRE LE CONFLIT
-- ======================

-- Supprimer la vue existante s'elle existe
DROP VIEW IF EXISTS public.energy_transactions CASCADE;

-- Supprimer la table existante s'elle existe (au cas où)
DROP TABLE IF EXISTS public.energy_transactions CASCADE;

-- ======================
-- 3️⃣ CRÉER LA VRAIE TABLE
-- ======================

-- Créer la table energy_transactions (version finale)
CREATE TABLE public.energy_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('consume', 'purchase', 'recharge')),
    reason VARCHAR(100) NOT NULL,
    energy_before DECIMAL(10,2) NOT NULL,
    energy_after DECIMAL(10,2) NOT NULL,
    app_source VARCHAR(50),
    feature_used VARCHAR(50),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================
-- 4️⃣ VÉRIFIER LES AUTRES TABLES ENERGY
-- ======================

-- Vérifier et créer user_energy si pas existe (STRING user_id)
CREATE TABLE IF NOT EXISTS public.user_energy (
    user_id VARCHAR(255) PRIMARY KEY,
    current_energy DECIMAL(10,2) NOT NULL DEFAULT 85.0,
    max_energy DECIMAL(10,2) NOT NULL DEFAULT 100.0,
    last_recharge_date TIMESTAMPTZ,
    total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    total_consumed DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    subscription_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT user_energy_current_positive CHECK (current_energy >= 0),
    CONSTRAINT user_energy_max_positive CHECK (max_energy > 0),
    CONSTRAINT user_energy_current_le_max CHECK (current_energy <= max_energy * 1.1),
    CONSTRAINT user_energy_totals_positive CHECK (total_purchased >= 0 AND total_consumed >= 0)
);

-- Créer users_energy (compatibility table)
CREATE TABLE IF NOT EXISTS public.users_energy (
    user_id VARCHAR(255) PRIMARY KEY,
    current_energy DECIMAL(10,2) NOT NULL DEFAULT 85.0,
    max_energy DECIMAL(10,2) NOT NULL DEFAULT 100.0,
    last_recharge_date TIMESTAMPTZ,
    total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    total_consumed DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    subscription_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes identiques
    CONSTRAINT users_energy_current_positive CHECK (current_energy >= 0),
    CONSTRAINT users_energy_max_positive CHECK (max_energy > 0),
    CONSTRAINT users_energy_current_le_max CHECK (current_energy <= max_energy * 1.1),
    CONSTRAINT users_energy_totals_positive CHECK (total_purchased >= 0 AND total_consumed >= 0)
);

-- Créer energy_purchases
CREATE TABLE IF NOT EXISTS public.energy_purchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    pack_type VARCHAR(50) NOT NULL,
    energy_amount DECIMAL(10,2) NOT NULL,
    price_cents INTEGER NOT NULL,
    stripe_payment_intent_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT energy_purchases_amount_positive CHECK (energy_amount > 0),
    CONSTRAINT energy_purchases_price_positive CHECK (price_cents > 0)
);

-- ======================
-- 5️⃣ CRÉER LES INDEX MAINTENANT
-- ======================

-- Index pour energy_transactions (maintenant que c'est une table)
CREATE INDEX IF NOT EXISTS idx_energy_transactions_user_id ON public.energy_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_created_at ON public.energy_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_action_type ON public.energy_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_app_source ON public.energy_transactions(app_source);

-- Index pour user_energy  
CREATE INDEX IF NOT EXISTS idx_user_energy_user_id ON public.user_energy(user_id);
CREATE INDEX IF NOT EXISTS idx_user_energy_subscription ON public.user_energy(subscription_type);

-- Index pour users_energy (compatibility)
CREATE INDEX IF NOT EXISTS idx_users_energy_user_id ON public.users_energy(user_id);
CREATE INDEX IF NOT EXISTS idx_users_energy_subscription ON public.users_energy(subscription_type);

-- Index pour energy_purchases
CREATE INDEX IF NOT EXISTS idx_energy_purchases_user_id ON public.energy_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_status ON public.energy_purchases(status);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_purchased_at ON public.energy_purchases(purchased_at DESC);

-- ======================
-- 6️⃣ TRIGGERS POUR UPDATED_AT
-- ======================

-- Fonction pour update automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at (avec vérification existence)
DO $$
BEGIN
    -- user_energy trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_energy_updated_at') THEN
        CREATE TRIGGER update_user_energy_updated_at 
            BEFORE UPDATE ON public.user_energy 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- users_energy trigger  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_energy_updated_at') THEN
        CREATE TRIGGER update_users_energy_updated_at 
            BEFORE UPDATE ON public.users_energy 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ======================
-- 7️⃣ VUES ANALYTICS
-- ======================

-- Vue energy analytics (utilise user_energy)
CREATE OR REPLACE VIEW energy_analytics AS
SELECT 
    ue.user_id,
    ue.current_energy,
    ue.total_consumed,
    ue.total_purchased,
    ue.subscription_type,
    (SELECT COUNT(*) FROM public.energy_transactions t WHERE t.user_id = ue.user_id) as transaction_count,
    (SELECT COUNT(*) FROM public.energy_transactions t WHERE t.user_id = ue.user_id AND t.created_at > NOW() - INTERVAL '30 days') as recent_transactions,
    ue.created_at as member_since
FROM public.user_energy ue;

-- Vue energy analytics compatibility (utilise users_energy)
CREATE OR REPLACE VIEW users_energy_analytics AS
SELECT 
    ue.user_id,
    ue.current_energy,
    ue.total_consumed,
    ue.total_purchased,
    ue.subscription_type,
    (SELECT COUNT(*) FROM public.energy_transactions t WHERE t.user_id = ue.user_id) as transaction_count,
    (SELECT COUNT(*) FROM public.energy_transactions t WHERE t.user_id = ue.user_id AND t.created_at > NOW() - INTERVAL '30 days') as recent_transactions,
    ue.created_at as member_since
FROM public.users_energy ue;

-- ======================
-- 8️⃣ COMMENTAIRES
-- ======================

COMMENT ON TABLE public.energy_transactions IS 'Historique de toutes les transactions énergétiques - TABLE (pas vue)';
COMMENT ON TABLE public.user_energy IS 'Table principale gestion énergie Luna - Format STRING user_id';
COMMENT ON TABLE public.users_energy IS 'Table alternative gestion énergie Luna - Compatibility avec legacy';
COMMENT ON TABLE public.energy_purchases IS 'Achats énergie via Stripe';

COMMENT ON VIEW energy_analytics IS 'Analytics énergie utilisateurs (basé sur user_energy)';
COMMENT ON VIEW users_energy_analytics IS 'Analytics énergie utilisateurs (basé sur users_energy - compatibility)';

-- Message final
SELECT 'Energy transactions conflict fixed! Tables created successfully ✅' as status;

COMMIT;