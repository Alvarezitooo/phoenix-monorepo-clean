-- ============================================================================
-- 🔧 MIGRATION EVENTS SCHEMA - Fast Execution (No Timeout)
-- Date: 2025-08-24
-- Optimisé pour éviter les timeouts Supabase Dashboard
-- ============================================================================

-- 🛡️ ÉTAPE 1: Ajouter colonnes rapidement
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS actor_user_id uuid,
    ADD COLUMN IF NOT EXISTS occurred_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 📋 ÉTAPE 2: Synchroniser données (optimisé pour vitesse)
UPDATE public.events 
SET 
    actor_user_id = user_id,
    occurred_at = ts,
    created_at = ts
WHERE actor_user_id IS NULL 
   OR occurred_at IS NULL 
   OR created_at IS NULL;

-- 🔧 ÉTAPE 3: Trigger pour futures insertions (essentiel)
CREATE OR REPLACE FUNCTION maintain_events_compatibility()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actor_user_id = COALESCE(NEW.actor_user_id, NEW.user_id);
    NEW.occurred_at = COALESCE(NEW.occurred_at, NEW.ts);
    NEW.created_at = COALESCE(NEW.created_at, NEW.ts, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer ancien trigger s'il existe
DROP TRIGGER IF EXISTS events_compatibility_trigger ON public.events;

-- Créer nouveau trigger
CREATE TRIGGER events_compatibility_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION maintain_events_compatibility();

-- ============================================================================
-- ✅ MIGRATION RAPIDE TERMINÉE - PRÊT POUR LUNA HUB!
-- ============================================================================