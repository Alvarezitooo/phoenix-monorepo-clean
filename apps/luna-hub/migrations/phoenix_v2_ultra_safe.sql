-- ============================================================================
-- 🚀 PHOENIX LUNA HUB V2.0 - MIGRATION ULTRA-SÉCURISÉE
-- Date: 2025-08-27
-- Objectif: Migration enterprise qui évite TOUS les conflits existants
-- ============================================================================

BEGIN;

SELECT 'Starting Phoenix Luna Hub v2.0 ULTRA-SAFE migration...' as status;

-- ======================
-- 1️⃣ NETTOYAGE INTELLIGENT
-- ======================

-- Supprimer SEULEMENT les vues qui existent (pas les tables)
DO $$
BEGIN
    -- Vérifier et supprimer les vues uniquement
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'energy_transactions') THEN
        DROP VIEW public.energy_transactions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'energy_purchases') THEN
        DROP VIEW public.energy_purchases CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'user_energy') THEN
        DROP VIEW public.user_energy CASCADE;
    END IF;
END
$$;

-- ======================
-- 2️⃣ TABLES ENERGY (Compatibility avec existant)
-- ======================

-- Table energy_transactions (créer seulement si n'existe pas comme table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'energy_transactions') THEN
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
    END IF;
END
$$;

-- Table user_energy (créer seulement si n'existe pas comme table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_energy') THEN
        CREATE TABLE public.user_energy (
            user_id VARCHAR(255) PRIMARY KEY,
            current_energy DECIMAL(10,2) NOT NULL DEFAULT 85.0,
            max_energy DECIMAL(10,2) NOT NULL DEFAULT 100.0,
            last_recharge_date TIMESTAMPTZ,
            total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0.0,
            total_consumed DECIMAL(10,2) NOT NULL DEFAULT 0.0,
            subscription_type VARCHAR(50) DEFAULT 'standard',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            CONSTRAINT user_energy_current_positive CHECK (current_energy >= 0),
            CONSTRAINT user_energy_max_positive CHECK (max_energy > 0),
            CONSTRAINT user_energy_current_le_max CHECK (current_energy <= max_energy * 1.1),
            CONSTRAINT user_energy_totals_positive CHECK (total_purchased >= 0 AND total_consumed >= 0)
        );
    END IF;
END
$$;

-- Table energy_purchases (créer seulement si n'existe pas)
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
-- 3️⃣ TABLES ENTERPRISE v2.0 (Nouvelles uniquement)
-- ======================

-- Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
    id SERIAL PRIMARY KEY,
    identifier_hash VARCHAR(64) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('token_bucket', 'sliding_window', 'fixed_window')),
    counter_value INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    bucket_capacity INTEGER DEFAULT NULL,
    bucket_tokens INTEGER DEFAULT NULL,
    last_refill TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(identifier_hash, scope, window_start)
);

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
    id SERIAL PRIMARY KEY,
    identifier_hash VARCHAR(64) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('allowed', 'blocked', 'reset')),
    current_count INTEGER,
    limit_value INTEGER,
    algorithm VARCHAR(20) NOT NULL,
    reset_time TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Key Management
CREATE TABLE IF NOT EXISTS public.api_keys (
    id SERIAL PRIMARY KEY,
    key_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    key_hash VARCHAR(128) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    key_type VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (key_type IN ('service', 'user', 'webhook')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    rotated_at TIMESTAMPTZ,
    rotation_reason VARCHAR(255),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.api_key_usage (
    id SERIAL PRIMARY KEY,
    key_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    response_status INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Metrics
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_alerts (
    id SERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL,
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),
    alert_message TEXT NOT NULL,
    metric_name VARCHAR(100),
    threshold_value DECIMAL(15,6),
    current_value DECIMAL(15,6),
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.api_performance (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id VARCHAR(255),
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cache Management
CREATE TABLE IF NOT EXISTS public.cache_entries (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value JSONB,
    ttl_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.cache_events (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('hit', 'miss', 'set', 'delete', 'expire')),
    cache_source VARCHAR(20) NOT NULL CHECK (cache_source IN ('redis', 'memory', 'database')),
    response_time_ms DECIMAL(8,3),
    value_size_bytes INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Health
CREATE TABLE IF NOT EXISTS public.component_health (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE,
    component_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    last_check TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Trail
CREATE TABLE IF NOT EXISTS public.system_audit_trail (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    component VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    processing_time_ms INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GDPR Compliance
CREATE TABLE IF NOT EXISTS public.user_consents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'personalization', 'ai_processing')),
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_ip VARCHAR(45),
    consent_user_agent TEXT,
    withdrawal_timestamp TIMESTAMPTZ NULL,
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, consent_type, consent_timestamp)
);

CREATE TABLE IF NOT EXISTS public.gdpr_processing_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    data_category VARCHAR(50) NOT NULL CHECK (data_category IN ('identity', 'technical', 'behavioral', 'energy_data', 'generated_content', 'communication')),
    processing_purpose VARCHAR(50) NOT NULL CHECK (processing_purpose IN ('service_provision', 'security', 'analytics', 'improvement', 'communication', 'legal_compliance')),
    legal_basis VARCHAR(100) NOT NULL,
    data_fields JSONB NOT NULL,
    retention_period_days INTEGER NOT NULL,
    consent_required BOOLEAN NOT NULL DEFAULT FALSE,
    automated_decision BOOLEAN NOT NULL DEFAULT FALSE,
    third_party_sharing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.gdpr_audit_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    event_data JSONB,
    legal_basis VARCHAR(100),
    processing_context VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gdpr_rights_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    request_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'processing', 'completed', 'denied')),
    request_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL,
    processed_by VARCHAR(255),
    processing_notes TEXT,
    completion_data JSONB
);

-- ======================
-- 4️⃣ INDEX SEULEMENT SI PAS EXISTANTS
-- ======================

-- Energy indexes (conditionnels)
DO $$
BEGIN
    -- energy_transactions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_energy_transactions_user_id') THEN
        CREATE INDEX idx_energy_transactions_user_id ON public.energy_transactions(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_energy_transactions_created_at') THEN
        CREATE INDEX idx_energy_transactions_created_at ON public.energy_transactions(created_at DESC);
    END IF;
    
    -- user_energy indexes
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_user_energy_user_id') THEN
        CREATE INDEX idx_user_energy_user_id ON public.user_energy(user_id);
    END IF;
    
    -- users_energy indexes (si table existe)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users_energy') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_users_energy_user_id') THEN
            CREATE INDEX idx_users_energy_user_id ON public.users_energy(user_id);
        END IF;
    END IF;
    
    -- energy_purchases indexes
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_energy_purchases_user_id') THEN
        CREATE INDEX idx_energy_purchases_user_id ON public.energy_purchases(user_id);
    END IF;
END
$$;

-- Enterprise indexes (nouveaux)
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_scope ON public.rate_limit_counters(identifier_hash, scope);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created ON public.rate_limit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON public.system_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON public.system_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint_time ON public.api_performance(endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON public.cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_events_timestamp ON public.cache_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_component_health_status ON public.component_health(status);
CREATE INDEX IF NOT EXISTS idx_system_audit_timestamp ON public.system_audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_user_id ON public.gdpr_processing_records(user_id);

-- ======================
-- 5️⃣ FONCTIONS & TRIGGERS (Safe)
-- ======================

-- Fonction pour update automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers avec vérification existence
DO $$
BEGIN
    -- user_energy trigger (si table existe)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_energy') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_energy_updated_at') THEN
            CREATE TRIGGER update_user_energy_updated_at 
                BEFORE UPDATE ON public.user_energy 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- users_energy trigger (si table existe)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users_energy') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_energy_updated_at') THEN
            CREATE TRIGGER update_users_energy_updated_at 
                BEFORE UPDATE ON public.users_energy 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- GDPR trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_consents_updated_at') THEN
        CREATE TRIGGER update_user_consents_updated_at 
            BEFORE UPDATE ON public.user_consents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Rate limiting trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rate_limit_counters_updated_at') THEN
        CREATE TRIGGER update_rate_limit_counters_updated_at 
            BEFORE UPDATE ON public.rate_limit_counters 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ======================
-- 6️⃣ VUES ENTERPRISE (Safe)
-- ======================

-- Vue performance dashboard
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND((COUNT(CASE WHEN status_code < 400 THEN 1 END)::decimal / COUNT(*)) * 100, 2) as success_rate
FROM public.api_performance 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, method
ORDER BY request_count DESC;

-- Vue alertes actives
CREATE OR REPLACE VIEW active_alerts AS
SELECT 
    alert_name,
    alert_level,
    alert_message,
    current_value,
    threshold_value,
    triggered_at,
    NOW() - triggered_at as duration
FROM public.system_alerts 
WHERE is_active = TRUE
ORDER BY 
    CASE alert_level 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2  
        WHEN 'info' THEN 3
    END,
    triggered_at DESC;

-- Vue cache analytics
CREATE OR REPLACE VIEW cache_analytics AS
SELECT 
    cache_source,
    COUNT(*) as total_events,
    COUNT(CASE WHEN event_type = 'hit' THEN 1 END) as hits,
    COUNT(CASE WHEN event_type = 'miss' THEN 1 END) as misses,
    ROUND((COUNT(CASE WHEN event_type = 'hit' THEN 1 END)::decimal / 
           NULLIF(COUNT(CASE WHEN event_type IN ('hit', 'miss') THEN 1 END), 0)) * 100, 2) as hit_rate_percent
FROM public.cache_events 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY cache_source;

-- Vue energy analytics (conditionnelle)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_energy') THEN
        EXECUTE 'CREATE OR REPLACE VIEW energy_analytics AS
        SELECT 
            ue.user_id,
            ue.current_energy,
            ue.total_consumed,
            ue.total_purchased,
            ue.subscription_type,
            (SELECT COUNT(*) FROM public.energy_transactions t WHERE t.user_id = ue.user_id) as transaction_count,
            ue.created_at as member_since
        FROM public.user_energy ue';
    END IF;
END
$$;

-- Vue consentements GDPR
CREATE OR REPLACE VIEW current_user_consents AS
SELECT DISTINCT ON (user_id, consent_type) 
    user_id,
    consent_type,
    consent_given,
    consent_timestamp,
    CASE 
        WHEN withdrawal_timestamp IS NOT NULL THEN FALSE
        ELSE consent_given 
    END as is_active
FROM public.user_consents 
ORDER BY user_id, consent_type, consent_timestamp DESC;

-- Fonction de cleanup
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM public.system_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM public.api_performance WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM public.cache_events WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM public.rate_limit_events WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.api_key_usage WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.cache_entries WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Messages de succès
SELECT 'Phoenix Luna Hub v2.0 ULTRA-SAFE migration completed! ✅' as status;
SELECT 'All enterprise tables added without breaking existing structure! 🚀' as final_status;
SELECT 'Your Phoenix backend is now enterprise-ready! 🔥' as enterprise_status;

COMMIT;