-- ============================================================================
-- 🔧 COMPLETE EVENTS SCHEMA - Toutes colonnes manquantes
-- Date: 2025-08-25  
-- Objectif: Ajouter TOUTES les colonnes que le code utilise
-- ============================================================================

-- Ajouter toutes les colonnes manquantes
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS event_id uuid,
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Synchroniser les données existantes avec les nouvelles colonnes
UPDATE public.events 
SET 
    event_id = COALESCE(event_id, id),
    event_type = COALESCE(event_type, type),
    metadata = COALESCE(metadata, '{}'),
    meta = COALESCE(meta, '{}'),
    processed = COALESCE(processed, FALSE)
WHERE event_id IS NULL OR event_type IS NULL OR metadata = '{}' OR meta = '{}';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_events_event_id 
    ON public.events(event_id);
    
CREATE INDEX IF NOT EXISTS idx_events_event_type 
    ON public.events(event_type);
    
CREATE INDEX IF NOT EXISTS idx_events_processed 
    ON public.events(processed);

-- Index GIN pour recherche JSONB
CREATE INDEX IF NOT EXISTS idx_events_metadata_gin 
    ON public.events USING gin(metadata);
    
CREATE INDEX IF NOT EXISTS idx_events_meta_gin 
    ON public.events USING gin(meta);

-- Commentaires pour documentation
COMMENT ON COLUMN public.events.event_id IS 'ID événement unique (peut différer de id)';
COMMENT ON COLUMN public.events.event_type IS 'Type événement (alias de type)';
COMMENT ON COLUMN public.events.metadata IS 'Métadonnées événement (luna_hub format)';
COMMENT ON COLUMN public.events.meta IS 'Métadonnées événement (events.py format)';
COMMENT ON COLUMN public.events.processed IS 'Événement traité pour analytics';

-- ============================================================================
-- ✅ SCHEMA EVENTS COMPLET - TOUS LES FORMATS SUPPORTÉS!
-- ============================================================================