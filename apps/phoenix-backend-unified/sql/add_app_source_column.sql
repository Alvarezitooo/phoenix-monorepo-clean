-- ============================================================================
-- 🔧 ADD app_source COLUMN - Fix Event Store Error
-- Date: 2025-08-25  
-- Objectif: Ajouter colonne app_source manquante dans events
-- ============================================================================

-- Ajouter la colonne app_source si elle n'existe pas
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS app_source VARCHAR(50);

-- Index pour performance (filtrage par app)
CREATE INDEX IF NOT EXISTS idx_events_app_source 
    ON public.events(app_source) 
    WHERE app_source IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN public.events.app_source IS 'App origine: phoenix-letters, phoenix-cv, phoenix-website';

-- Mise à jour des données existantes (optionnel)
UPDATE public.events 
SET app_source = 'phoenix-hub' 
WHERE app_source IS NULL AND type IS NOT NULL;

-- ============================================================================
-- ✅ COLONNE app_source AJOUTÉE - EVENT STORE FIXÉ!
-- ============================================================================