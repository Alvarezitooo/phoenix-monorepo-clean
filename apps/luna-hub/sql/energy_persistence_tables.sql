-- 🔧 CORRECTION CRITIQUE - Tables pour persistance Energy Manager
-- Remplace le stockage in-memory par une vraie DB

-- Table principale pour l'énergie des utilisateurs
CREATE TABLE IF NOT EXISTS user_energy (
    user_id UUID PRIMARY KEY,
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
    CONSTRAINT user_energy_current_le_max CHECK (current_energy <= max_energy * 1.1), -- Allow 10% overflow
    CONSTRAINT user_energy_totals_positive CHECK (total_purchased >= 0 AND total_consumed >= 0)
);

-- Table des transactions énergétiques (remplace _transactions in-memory)
CREATE TABLE IF NOT EXISTS energy_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('consume', 'purchase', 'recharge')),
    reason VARCHAR(100) NOT NULL,
    energy_before DECIMAL(10,2) NOT NULL,
    energy_after DECIMAL(10,2) NOT NULL,
    app_source VARCHAR(50),
    feature_used VARCHAR(50),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key vers users (si table existe)
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des achats d'énergie (remplace _purchases in-memory)  
CREATE TABLE IF NOT EXISTS energy_purchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    pack_type VARCHAR(50) NOT NULL,
    energy_amount DECIMAL(10,2) NOT NULL,
    price_cents INTEGER NOT NULL,
    stripe_payment_intent_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT energy_purchases_amount_positive CHECK (energy_amount > 0),
    CONSTRAINT energy_purchases_price_positive CHECK (price_cents > 0)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_energy_user_id ON user_energy(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_user_id ON energy_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_created_at ON energy_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_user_id ON energy_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_status ON energy_purchases(status);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_energy_updated_at 
    BEFORE UPDATE ON user_energy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue pour analytics rapides
CREATE OR REPLACE VIEW energy_analytics AS
SELECT 
    user_id,
    current_energy,
    total_consumed,
    total_purchased,
    subscription_type,
    (SELECT COUNT(*) FROM energy_transactions t WHERE t.user_id = ue.user_id) as transaction_count,
    (SELECT COUNT(*) FROM energy_transactions t WHERE t.user_id = ue.user_id AND t.created_at > NOW() - INTERVAL '30 days') as recent_transactions,
    created_at as member_since
FROM user_energy ue;

-- Commentaires pour documentation
COMMENT ON TABLE user_energy IS 'Table principale pour la gestion de l énergie Luna - remplace le stockage in-memory';
COMMENT ON TABLE energy_transactions IS 'Historique de toutes les transactions énergétiques';
COMMENT ON TABLE energy_purchases IS 'Achats d énergie via Stripe';
COMMENT ON VIEW energy_analytics IS 'Vue agrégée pour analytics rapides';