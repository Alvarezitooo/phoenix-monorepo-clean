-- ============================================================================
-- 🔧 ADD event_data COLUMN - Fix Event Store Error #2
-- Date: 2025-08-25  
-- Objectif: Ajouter colonne event_data manquante dans events
-- ============================================================================

-- Ajouter la colonne event_data si elle n'existe pas
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}';

-- Index GIN pour recherche rapide dans JSONB
CREATE INDEX IF NOT EXISTS idx_events_event_data_gin 
    ON public.events USING gin(event_data);

-- Commentaire pour documentation  
COMMENT ON COLUMN public.events.event_data IS 'Données événement JSONB pour Capital Narratif';

-- Mise à jour des données existantes (copie depuis payload si vide)
UPDATE public.events 
SET event_data = COALESCE(event_data, payload, '{}') 
WHERE event_data IS NULL OR event_data = '{}';

-- ============================================================================
-- ✅ COLONNE event_data AJOUTÉE - EVENT STORE COMPLET!
-- ============================================================================