-- ============================================================================
-- 🌙 Phoenix Luna Hub - Migration Subscription Columns
-- Date: 2025-08-24
-- Objectif: Ajouter le support Luna Unlimited à la table users
-- ============================================================================

-- Ajout des colonnes subscription aux utilisateurs
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN public.users.subscription_type IS 'Type dabonnement: luna_unlimited, null=standard';
COMMENT ON COLUMN public.users.subscription_status IS 'Statut Stripe: active, trialing, past_due, canceled, unpaid';
COMMENT ON COLUMN public.users.subscription_ends_at IS 'Date de fin de la période actuelle';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'ID Customer Stripe pour facturation';

-- Index pour performance des requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON public.users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- Index composé pour la vérification Unlimited (optimisation Energy Manager)
CREATE INDEX IF NOT EXISTS idx_users_unlimited_check 
    ON public.users(subscription_type, subscription_status) 
    WHERE subscription_type = 'luna_unlimited';

-- Contraintes de données
ALTER TABLE public.users 
    ADD CONSTRAINT chk_subscription_type 
    CHECK (subscription_type IS NULL OR subscription_type IN ('luna_unlimited'));

ALTER TABLE public.users 
    ADD CONSTRAINT chk_subscription_status 
    CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'));

-- Trigger pour logging des changements de subscription (audit trail)
CREATE OR REPLACE FUNCTION log_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.subscription_type IS DISTINCT FROM NEW.subscription_type) OR 
       (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
        
        RAISE LOG 'Subscription change for user %: type % -> %, status % -> %', 
            NEW.id, 
            COALESCE(OLD.subscription_type, 'null'),
            COALESCE(NEW.subscription_type, 'null'),
            COALESCE(OLD.subscription_status, 'null'),
            COALESCE(NEW.subscription_status, 'null');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_changes_log
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.subscription_type IS DISTINCT FROM NEW.subscription_type OR 
          OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION log_subscription_changes();

-- Vue pour analytics Unlimited (optionnel)
CREATE OR REPLACE VIEW v_unlimited_users AS
SELECT 
    id,
    email,
    subscription_type,
    subscription_status,
    subscription_ends_at,
    created_at,
    CASE 
        WHEN subscription_type = 'luna_unlimited' AND subscription_status IN ('active', 'trialing')
        THEN true 
        ELSE false 
    END as is_unlimited_active
FROM public.users
WHERE subscription_type IS NOT NULL;

COMMENT ON VIEW v_unlimited_users IS 'Vue pour analytics et reporting des utilisateurs avec abonnement';

-- Mise à jour des permissions RLS (si applicable)
-- Note: À adapter selon votre configuration RLS existante
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIN MIGRATION - LUNA UNLIMITED READY! 🌙
-- ============================================================================