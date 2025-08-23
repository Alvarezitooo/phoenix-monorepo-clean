-- 🌙 Phoenix Luna Hub - Supabase Schema
-- Event Store + User Energy Management
-- À exécuter dans Supabase SQL Editor

-- ================================
-- USERS TABLE (Updated for Luna Session Zero)
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    subscription_type VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Luna Session Zero fields
    luna_energy INTEGER DEFAULT 100 CHECK (luna_energy >= 0),
    capital_narratif_started BOOLEAN DEFAULT FALSE,
    narrative_id VARCHAR(255),
    initial_motivation TEXT,
    narrative_started_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- USER ENERGY TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_energy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_energy DECIMAL(5,2) DEFAULT 85.0 CHECK (current_energy >= 0 AND current_energy <= 100),
    max_energy DECIMAL(5,2) DEFAULT 100.0,
    last_recharge_date TIMESTAMP WITH TIME ZONE,
    total_purchased DECIMAL(10,2) DEFAULT 0.0,
    total_consumed DECIMAL(10,2) DEFAULT 0.0,
    subscription_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ================================
-- ENERGY TRANSACTIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS energy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('consume', 'refund', 'purchase', 'bonus')),
    amount DECIMAL(5,2) NOT NULL,
    reason VARCHAR(255),
    context JSONB DEFAULT '{}',
    app_source VARCHAR(50),
    feature_used VARCHAR(100),
    energy_before DECIMAL(5,2) NOT NULL,
    energy_after DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ENERGY PURCHASES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS energy_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pack_type VARCHAR(50) NOT NULL,
    amount_euro DECIMAL(8,2) NOT NULL,
    energy_amount DECIMAL(5,2) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    bonus_energy DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ================================
-- EVENT STORE TABLE (Capital Narratif - Updated for Luna Session Zero)
-- ================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy events table support (if needed for migration)
CREATE TABLE IF NOT EXISTS events_legacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    app_source VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

-- ================================
-- INDEXES POUR PERFORMANCE
-- ================================

-- User Energy
CREATE INDEX IF NOT EXISTS idx_user_energy_user_id ON user_energy(user_id);
CREATE INDEX IF NOT EXISTS idx_user_energy_updated_at ON user_energy(updated_at);

-- Energy Transactions
CREATE INDEX IF NOT EXISTS idx_energy_transactions_user_id ON energy_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_created_at ON energy_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_action_type ON energy_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_app_source ON energy_transactions(app_source);

-- Energy Purchases
CREATE INDEX IF NOT EXISTS idx_energy_purchases_user_id ON energy_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_payment_status ON energy_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_created_at ON energy_purchases(created_at);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_app_source ON events(app_source);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);

-- ================================
-- TRIGGERS POUR AUTO-UPDATE
-- ================================

-- Trigger pour user_energy.updated_at
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

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- RLS (ROW LEVEL SECURITY) - Optionnel
-- ================================

-- Activer RLS pour sécuriser les données utilisateur
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_energy ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE energy_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE energy_purchases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies RLS (à personnaliser selon vos besoins d'auth)
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can view own energy" ON user_energy FOR SELECT USING (auth.uid() = user_id);

-- ================================
-- DONNÉES DE TEST
-- ================================

-- Créer un utilisateur de test
INSERT INTO users (id, email, name, subscription_type) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@phoenix.ai',
    'Demo User',
    'free'
) ON CONFLICT (email) DO NOTHING;

-- Créer l'énergie pour l'utilisateur de test
INSERT INTO user_energy (user_id, current_energy, max_energy) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    85.0,
    100.0
) ON CONFLICT (user_id) DO NOTHING;

-- ================================
-- VUES UTILITAIRES
-- ================================

-- Vue pour analytics d'énergie par utilisateur
CREATE OR REPLACE VIEW user_energy_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    ue.current_energy,
    ue.max_energy,
    ue.total_consumed,
    ue.total_purchased,
    (
        SELECT COUNT(*)
        FROM energy_transactions et
        WHERE et.user_id = u.id AND et.action_type = 'consume'
    ) as total_transactions,
    (
        SELECT COUNT(*)
        FROM energy_purchases ep
        WHERE ep.user_id = u.id AND ep.payment_status = 'completed'
    ) as total_purchases,
    u.created_at as member_since,
    ue.updated_at as last_activity
FROM users u
LEFT JOIN user_energy ue ON u.id = ue.user_id;

-- Vue pour résumé des événements par app
CREATE OR REPLACE VIEW events_summary AS
SELECT 
    app_source,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', created_at) as event_date
FROM events
GROUP BY app_source, event_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_count DESC;

-- ================================
-- COMMENTAIRES
-- ================================

COMMENT ON TABLE users IS 'Utilisateurs de l''écosystème Phoenix';
COMMENT ON TABLE user_energy IS 'Gestion de l''énergie Luna par utilisateur';
COMMENT ON TABLE energy_transactions IS 'Historique des transactions d''énergie';
COMMENT ON TABLE energy_purchases IS 'Achats d''énergie Luna (packs)';
COMMENT ON TABLE events IS 'Event Store pour Capital Narratif Phoenix';

COMMENT ON COLUMN user_energy.current_energy IS 'Énergie actuelle (0-100%)';
COMMENT ON COLUMN user_energy.max_energy IS 'Énergie maximum (100% ou infini pour unlimited)';
COMMENT ON COLUMN energy_transactions.action_type IS 'Type: consume, refund, purchase, bonus';
COMMENT ON COLUMN events.event_data IS 'Données métier de l''événement';
COMMENT ON COLUMN events.metadata IS 'Métadonnées techniques (IP, user-agent, etc.)';

-- ================================
-- FONCTIONS UTILITAIRES
-- ================================

-- Fonction pour calculer le pourcentage d'énergie
CREATE OR REPLACE FUNCTION calculate_energy_percentage(current_energy DECIMAL, max_energy DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF max_energy = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((current_energy / max_energy) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si action possible
CREATE OR REPLACE FUNCTION can_perform_action(user_uuid UUID, energy_required DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_energy DECIMAL;
BEGIN
    SELECT ue.current_energy INTO current_energy
    FROM user_energy ue
    WHERE ue.user_id = user_uuid;
    
    IF current_energy IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN current_energy >= energy_required;
END;
$$ LANGUAGE plpgsql;