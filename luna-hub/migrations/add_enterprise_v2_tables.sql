-- ============================================================================
-- 🚀 PHOENIX LUNA HUB V2.0 - ENTERPRISE TABLES
-- Date: 2025-08-27
-- Objectif: Tables pour toutes les fonctionnalités enterprise v2.0
-- ============================================================================

-- ======================
-- 🛡️ RATE LIMITING TABLES
-- ======================

-- Table pour tracking rate limiting (fallback si Redis indisponible)
CREATE TABLE IF NOT EXISTS rate_limit_counters (
    id SERIAL PRIMARY KEY,
    identifier_hash VARCHAR(64) NOT NULL, -- Hash sécurisé de l'identifiant
    scope VARCHAR(50) NOT NULL,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('token_bucket', 'sliding_window', 'fixed_window')),
    counter_value INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    bucket_capacity INTEGER DEFAULT NULL, -- Pour token bucket
    bucket_tokens INTEGER DEFAULT NULL,   -- Pour token bucket
    last_refill TIMESTAMPTZ DEFAULT NULL, -- Pour token bucket
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index composite pour performance
    UNIQUE(identifier_hash, scope, window_start),
    INDEX idx_rate_limit_identifier_scope (identifier_hash, scope),
    INDEX idx_rate_limit_window_end (window_end),
    INDEX idx_rate_limit_updated (updated_at)
);

-- Table des événements de rate limiting (audit & analytics)
CREATE TABLE IF NOT EXISTS rate_limit_events (
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour monitoring et analytics
    INDEX idx_rate_limit_events_scope (scope),
    INDEX idx_rate_limit_events_action (action),
    INDEX idx_rate_limit_events_created (created_at DESC),
    INDEX idx_rate_limit_events_identifier (identifier_hash)
);

-- ======================
-- 🔑 API KEY MANAGEMENT
-- ======================

-- Table pour gestion des clés API avec rotation
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    key_hash VARCHAR(128) NOT NULL UNIQUE, -- Hash SHA-256 de la clé
    key_prefix VARCHAR(10) NOT NULL, -- Premiers caractères pour identification
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    key_type VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (key_type IN ('service', 'user', 'webhook')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    rotated_at TIMESTAMPTZ,
    rotation_reason VARCHAR(255),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0,
    
    -- Index pour recherche rapide
    INDEX idx_api_keys_hash (key_hash),
    INDEX idx_api_keys_prefix (key_prefix),
    INDEX idx_api_keys_environment (environment),
    INDEX idx_api_keys_active (is_active),
    INDEX idx_api_keys_expires (expires_at)
);

-- Table des événements d'utilisation des clés API
CREATE TABLE IF NOT EXISTS api_key_usage (
    id SERIAL PRIMARY KEY,
    key_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    response_status INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key vers api_keys
    FOREIGN KEY (key_id) REFERENCES api_keys(key_id) ON DELETE CASCADE,
    
    -- Index pour analytics
    INDEX idx_api_key_usage_key_id (key_id),
    INDEX idx_api_key_usage_endpoint (endpoint),
    INDEX idx_api_key_usage_created (created_at DESC)
);

-- ======================
-- 📊 METRICS & MONITORING
-- ======================

-- Table pour métriques système temps réel
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Partition par temps pour performance
    INDEX idx_system_metrics_name_time (metric_name, timestamp DESC),
    INDEX idx_system_metrics_type (metric_type),
    INDEX idx_system_metrics_labels_gin USING gin(labels)
);

-- Table pour alertes système
CREATE TABLE IF NOT EXISTS system_alerts (
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
    resolution_notes TEXT,
    
    -- Index pour gestion des alertes
    INDEX idx_system_alerts_name (alert_name),
    INDEX idx_system_alerts_level (alert_level),
    INDEX idx_system_alerts_active (is_active),
    INDEX idx_system_alerts_triggered (triggered_at DESC)
);

-- Table des performances API (tracking p95/p99)
CREATE TABLE IF NOT EXISTS api_performance (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id VARCHAR(255),
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour calculs de percentiles
    INDEX idx_api_performance_endpoint_time (endpoint, timestamp DESC),
    INDEX idx_api_performance_status (status_code),
    INDEX idx_api_performance_response_time (response_time_ms)
);

-- ======================
-- 💾 CACHE MANAGEMENT
-- ======================

-- Table pour tracking du cache (fallback + analytics)
CREATE TABLE IF NOT EXISTS cache_entries (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value JSONB,
    ttl_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    
    -- Index pour cleanup et performance
    INDEX idx_cache_entries_key (cache_key),
    INDEX idx_cache_entries_expires (expires_at),
    INDEX idx_cache_entries_accessed (last_accessed_at)
);

-- Table des événements de cache (hit/miss analytics)
CREATE TABLE IF NOT EXISTS cache_events (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('hit', 'miss', 'set', 'delete', 'expire')),
    cache_source VARCHAR(20) NOT NULL CHECK (cache_source IN ('redis', 'memory', 'database')),
    response_time_ms DECIMAL(8,3),
    value_size_bytes INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour analytics
    INDEX idx_cache_events_key (cache_key),
    INDEX idx_cache_events_type (event_type),
    INDEX idx_cache_events_source (cache_source),
    INDEX idx_cache_events_timestamp (timestamp DESC)
);

-- ======================
-- 🔧 SYSTEM HEALTH
-- ======================

-- Table pour health checks de composants
CREATE TABLE IF NOT EXISTS component_health (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    last_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte unique sur nom de composant
    UNIQUE(component_name),
    
    -- Index pour monitoring
    INDEX idx_component_health_status (status),
    INDEX idx_component_health_type (component_type),
    INDEX idx_component_health_last_check (last_check DESC)
);

-- ======================
-- 📝 AUDIT TRAIL AVANCÉ
-- ======================

-- Table d'audit système pour toutes les actions critiques
CREATE TABLE IF NOT EXISTS system_audit_trail (
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
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour audit et compliance
    INDEX idx_system_audit_event_type (event_type),
    INDEX idx_system_audit_component (component),
    INDEX idx_system_audit_user_id (user_id),
    INDEX idx_system_audit_timestamp (timestamp DESC),
    INDEX idx_system_audit_success (success)
);

-- ======================
-- 🔄 TRIGGERS & FONCTIONS
-- ======================

-- Fonction pour update automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_rate_limit_counters_updated_at 
    BEFORE UPDATE ON rate_limit_counters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour cleanup automatique du cache expiré
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM cache_entries 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    INSERT INTO cache_events (cache_key, event_type, cache_source)
    SELECT 'cleanup', 'expire', 'database';
END;
$$ language 'plpgsql';

-- Fonction pour cleanup des métriques anciennes (garde 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM system_metrics 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    DELETE FROM api_performance 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    DELETE FROM cache_events 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    DELETE FROM rate_limit_events 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM api_key_usage 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- ======================
-- 📊 VUES POUR MONITORING
-- ======================

-- Vue des métriques de performance en temps réel
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as p50_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND((COUNT(CASE WHEN status_code < 400 THEN 1 END)::decimal / COUNT(*)) * 100, 2) as success_rate
FROM api_performance 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, method
ORDER BY request_count DESC;

-- Vue des alertes actives
CREATE OR REPLACE VIEW active_alerts AS
SELECT 
    alert_name,
    alert_level,
    alert_message,
    current_value,
    threshold_value,
    triggered_at,
    NOW() - triggered_at as duration
FROM system_alerts 
WHERE is_active = TRUE
ORDER BY 
    CASE alert_level 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2  
        WHEN 'info' THEN 3
    END,
    triggered_at DESC;

-- Vue du cache hit rate
CREATE OR REPLACE VIEW cache_analytics AS
SELECT 
    cache_source,
    COUNT(*) as total_events,
    COUNT(CASE WHEN event_type = 'hit' THEN 1 END) as hits,
    COUNT(CASE WHEN event_type = 'miss' THEN 1 END) as misses,
    ROUND((COUNT(CASE WHEN event_type = 'hit' THEN 1 END)::decimal / 
           NULLIF(COUNT(CASE WHEN event_type IN ('hit', 'miss') THEN 1 END), 0)) * 100, 2) as hit_rate_percent,
    AVG(response_time_ms) as avg_response_time
FROM cache_events 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY cache_source;

-- Vue de l'utilisation des API keys
CREATE OR REPLACE VIEW api_key_analytics AS
SELECT 
    ak.key_prefix,
    ak.environment,
    ak.created_at,
    ak.last_used_at,
    ak.usage_count,
    COUNT(aku.id) as recent_usage,
    AVG(aku.processing_time_ms) as avg_processing_time
FROM api_keys ak
LEFT JOIN api_key_usage aku ON ak.key_id = aku.key_id 
    AND aku.created_at > NOW() - INTERVAL '24 hours'
WHERE ak.is_active = TRUE
GROUP BY ak.key_prefix, ak.environment, ak.created_at, ak.last_used_at, ak.usage_count
ORDER BY recent_usage DESC;

-- ======================
-- 💾 COMMENTAIRES DOCUMENTATION
-- ======================

COMMENT ON TABLE rate_limit_counters IS 'Fallback rate limiting quand Redis indisponible';
COMMENT ON TABLE rate_limit_events IS 'Audit trail des actions de rate limiting';
COMMENT ON TABLE api_keys IS 'Gestion des clés API avec rotation automatique';
COMMENT ON TABLE api_key_usage IS 'Tracking utilisation des clés API';
COMMENT ON TABLE system_metrics IS 'Métriques système temps réel';
COMMENT ON TABLE system_alerts IS 'Alertes système avec niveaux';
COMMENT ON TABLE api_performance IS 'Performance API pour calculs percentiles';
COMMENT ON TABLE cache_entries IS 'Cache entries fallback + analytics';
COMMENT ON TABLE cache_events IS 'Événements cache pour hit/miss analytics';
COMMENT ON TABLE component_health IS 'Status de santé des composants système';
COMMENT ON TABLE system_audit_trail IS 'Audit trail complet des actions critiques';

COMMENT ON VIEW performance_dashboard IS 'Dashboard temps réel des performances API';
COMMENT ON VIEW active_alerts IS 'Alertes système actives par priorité';
COMMENT ON VIEW cache_analytics IS 'Analytics cache hit/miss par source';
COMMENT ON VIEW api_key_analytics IS 'Analytics utilisation clés API';

-- ======================
-- ✅ ENTERPRISE V2.0 TABLES COMPLÈTES !
-- ======================