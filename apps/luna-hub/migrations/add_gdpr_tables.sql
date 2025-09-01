-- Migration GDPR - Tables de conformité RGPD
-- Phoenix Luna Hub - Compliance & Privacy

-- Table des consentements utilisateurs
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'personalization', 'ai_processing')),
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_ip VARCHAR(45), -- IP anonymisée
    consent_user_agent TEXT,
    withdrawal_timestamp TIMESTAMPTZ NULL,
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour performance
    INDEX idx_user_consents_user_id (user_id),
    INDEX idx_user_consents_type (consent_type),
    INDEX idx_user_consents_timestamp (consent_timestamp DESC),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(user_id, consent_type, consent_timestamp)
);

-- Table des enregistrements de traitement de données
CREATE TABLE IF NOT EXISTS gdpr_processing_records (
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
    expires_at TIMESTAMPTZ NULL,
    
    -- Index pour performance et queries
    INDEX idx_gdpr_processing_user_id (user_id),
    INDEX idx_gdpr_processing_category (data_category),
    INDEX idx_gdpr_processing_purpose (processing_purpose),
    INDEX idx_gdpr_processing_expires (expires_at),
    INDEX idx_gdpr_processing_created (created_at DESC)
);

-- Table de journalisation GDPR (audit trail)
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255), -- Peut être NULL pour les événements système
    ip_address VARCHAR(45), -- IP anonymisée
    user_agent TEXT,
    event_data JSONB,
    legal_basis VARCHAR(100),
    processing_context VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour recherche et audit
    INDEX idx_gdpr_audit_event_type (event_type),
    INDEX idx_gdpr_audit_user_id (user_id),
    INDEX idx_gdpr_audit_created (created_at DESC),
    INDEX idx_gdpr_audit_legal_basis (legal_basis)
);

-- Table des demandes de droits GDPR (optionnelle pour tracking)
CREATE TABLE IF NOT EXISTS gdpr_rights_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    request_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'processing', 'completed', 'denied')),
    request_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL,
    processed_by VARCHAR(255), -- Admin qui a traité
    processing_notes TEXT,
    completion_data JSONB, -- Données de résultat (export, etc.)
    
    -- Index pour gestion des demandes
    INDEX idx_gdpr_requests_user_id (user_id),
    INDEX idx_gdpr_requests_type (request_type),
    INDEX idx_gdpr_requests_status (request_status),
    INDEX idx_gdpr_requests_requested (requested_at DESC)
);

-- Trigger pour auto-update des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables avec updated_at
CREATE TRIGGER update_user_consents_updated_at 
    BEFORE UPDATE ON user_consents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Vues pour faciliter les requêtes GDPR

-- Vue des consentements actuels (derniers en date par type)
CREATE OR REPLACE VIEW current_user_consents AS
SELECT DISTINCT ON (user_id, consent_type) 
    user_id,
    consent_type,
    consent_given,
    consent_timestamp,
    consent_version,
    withdrawal_timestamp,
    CASE 
        WHEN withdrawal_timestamp IS NOT NULL THEN FALSE
        ELSE consent_given 
    END as is_active
FROM user_consents 
ORDER BY user_id, consent_type, consent_timestamp DESC;

-- Vue des traitements actifs (non expirés)
CREATE OR REPLACE VIEW active_processing_records AS
SELECT *
FROM gdpr_processing_records
WHERE expires_at IS NULL OR expires_at > NOW();

-- Vue des statistiques de compliance par utilisateur
CREATE OR REPLACE VIEW user_compliance_summary AS
SELECT 
    user_id,
    COUNT(DISTINCT consent_type) as total_consent_types,
    COUNT(DISTINCT CASE WHEN consent_given = TRUE AND withdrawal_timestamp IS NULL THEN consent_type END) as active_consents,
    COUNT(DISTINCT data_category) as data_categories_processed,
    MIN(created_at) as first_processing_date,
    MAX(created_at) as last_processing_date
FROM user_consents uc
LEFT JOIN gdpr_processing_records gpr USING (user_id)
GROUP BY user_id;

-- Commentaires de documentation
COMMENT ON TABLE user_consents IS 'Consentements utilisateurs pour conformité GDPR';
COMMENT ON TABLE gdpr_processing_records IS 'Registre des traitements de données personnelles';
COMMENT ON TABLE gdpr_audit_log IS 'Journal d''audit des actions GDPR';
COMMENT ON TABLE gdpr_rights_requests IS 'Demandes d''exercice des droits GDPR';

COMMENT ON COLUMN user_consents.consent_type IS 'Type de consentement : essential, analytics, marketing, personalization, ai_processing';
COMMENT ON COLUMN user_consents.consent_ip IS 'Adresse IP anonymisée du consentement';
COMMENT ON COLUMN gdpr_processing_records.legal_basis IS 'Base légale du traitement : consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest';
COMMENT ON COLUMN gdpr_processing_records.data_fields IS 'Liste des champs de données traités (format JSON)';
COMMENT ON COLUMN gdpr_processing_records.retention_period_days IS 'Période de rétention en jours (0 = indéfini)';

-- Permissions (à ajuster selon votre configuration)
-- GRANT SELECT, INSERT, UPDATE ON user_consents TO phoenix_app_user;
-- GRANT SELECT, INSERT, UPDATE ON gdpr_processing_records TO phoenix_app_user;
-- GRANT SELECT, INSERT ON gdpr_audit_log TO phoenix_app_user;
-- GRANT SELECT, INSERT, UPDATE ON gdpr_rights_requests TO phoenix_app_user;