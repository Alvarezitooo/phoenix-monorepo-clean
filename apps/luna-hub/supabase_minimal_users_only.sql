-- 🔐 Luna Session Zero - Adaptation à vos tables existantes
-- Ajoute JUSTE la table users - utilise vos tables events et users_energy

-- ================================
-- TABLE USERS UNIQUEMENT
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    subscription_type VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Luna fields pour compatibility avec users_energy
    luna_energy INTEGER DEFAULT 100 CHECK (luna_energy >= 0),
    capital_narratif_started BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur email pour performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Fonction auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utilisateur de test
INSERT INTO users (email, password_hash, name) 
VALUES (
    'demo@phoenix.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyPw5eee0Is4wjbg/k7cLK', -- "demo123"
    'Demo User'
) ON CONFLICT (email) DO NOTHING;