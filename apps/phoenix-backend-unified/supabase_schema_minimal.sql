-- 🌙 Phoenix Luna Hub - Minimal Schema for Luna Session Zero
-- Tables essentielles pour l'authentification

-- ================================
-- USERS TABLE (Core Authentication)
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
-- REFRESH TOKENS TABLE (JWT Rotation)
-- ================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    jti UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    device_label TEXT,
    user_agent TEXT,
    ip INET,
    geo_location JSONB DEFAULT '{}',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    parent_id UUID REFERENCES refresh_tokens(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SESSIONS TABLE (Multi-Device Management)
-- ================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    device_label TEXT,
    user_agent TEXT,
    ip INET,
    geo_location JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Business constraints
    CONSTRAINT sessions_valid_dates CHECK (expires_at > created_at)
);

-- ================================
-- RATE LIMITING TABLE (Anti-Brute Force)
-- ================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(50) NOT NULL, -- 'auth_login', 'auth_register', etc.
    identifier VARCHAR(255) NOT NULL, -- IP, email, user_id
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- EVENTS TABLE (Audit Trail)
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

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Refresh Tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active ON refresh_tokens(user_id, revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_identifier ON rate_limits(scope, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Events
CREATE INDEX IF NOT EXISTS idx_events_actor_user_id ON events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);

-- ================================
-- TRIGGERS FOR AUTO-UPDATE
-- ================================

-- Auto-update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- TEST DATA (Optional)
-- ================================

-- Create a demo user for testing
INSERT INTO users (id, email, password_hash, name, subscription_type) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@phoenix.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyPw5eee0Is4wjbg/k7cLK', -- password: "demo123"
    'Demo User',
    'free'
) ON CONFLICT (email) DO NOTHING;

-- ================================
-- COMMENTS
-- ================================

COMMENT ON TABLE users IS 'Utilisateurs Phoenix Luna avec authentification';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh avec rotation pour sécurité enterprise';
COMMENT ON TABLE sessions IS 'Sessions multi-device avec contrôle granulaire';
COMMENT ON TABLE rate_limits IS 'Rate limiting anti-brute force basé sur Event Store';
COMMENT ON TABLE events IS 'Audit trail complet pour Luna Session Zero';