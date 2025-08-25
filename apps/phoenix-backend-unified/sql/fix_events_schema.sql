-- ============================================================================
-- 🔧 MIGRATION EVENTS SCHEMA - Production Safe
-- Date: 2025-08-24
-- Objectif: Ajouter colonnes de compatibilité sans casser l'existant
-- ============================================================================

-- 🔍 ÉTAPE 1: Vérifier l'état actuel
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current events table structure...';
    RAISE NOTICE '📊 Current events count: %', (SELECT COUNT(*) FROM public.events);
END $$;

-- 🛡️ ÉTAPE 2: Ajouter colonnes avec sécurité maximale
DO $$
BEGIN
    -- Ajouter actor_user_id (alias de user_id pour compatibilité code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='actor_user_id') THEN
        ALTER TABLE public.events ADD COLUMN actor_user_id uuid;
        RAISE NOTICE '✅ Added actor_user_id column';
    ELSE
        RAISE NOTICE '⚠️ actor_user_id already exists, skipping';
    END IF;

    -- Ajouter occurred_at (alias de ts pour compatibilité code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='occurred_at') THEN
        ALTER TABLE public.events ADD COLUMN occurred_at timestamp with time zone;
        RAISE NOTICE '✅ Added occurred_at column';
    ELSE
        RAISE NOTICE '⚠️ occurred_at already exists, skipping';
    END IF;

    -- Ajouter created_at (standard pour audit)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='created_at') THEN
        ALTER TABLE public.events ADD COLUMN created_at timestamp with time zone;
        RAISE NOTICE '✅ Added created_at column';
    ELSE
        RAISE NOTICE '⚠️ created_at already exists, skipping';
    END IF;
END $$;

-- 📋 ÉTAPE 3: Synchroniser les données existantes (BATCH SAFE)
DO $$
DECLARE
    batch_size INTEGER := 1000;
    updated_count INTEGER := 0;
    total_to_update INTEGER;
BEGIN
    -- Compter les enregistrements à mettre à jour
    SELECT COUNT(*) INTO total_to_update
    FROM public.events 
    WHERE actor_user_id IS NULL OR occurred_at IS NULL OR created_at IS NULL;
    
    RAISE NOTICE '📊 Records to update: %', total_to_update;
    
    -- Mise à jour par batch pour éviter les locks
    WHILE EXISTS (
        SELECT 1 FROM public.events 
        WHERE actor_user_id IS NULL OR occurred_at IS NULL OR created_at IS NULL
        LIMIT 1
    ) LOOP
        UPDATE public.events 
        SET 
            actor_user_id = COALESCE(actor_user_id, user_id),
            occurred_at = COALESCE(occurred_at, ts),
            created_at = COALESCE(created_at, ts)
        WHERE id IN (
            SELECT id FROM public.events 
            WHERE actor_user_id IS NULL OR occurred_at IS NULL OR created_at IS NULL
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '🔄 Updated % records', updated_count;
        
        -- Pause pour éviter surcharge
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '✅ Data synchronization complete!';
END $$;

-- 🚀 ÉTAPE 4: Index pour performance (concurrent pour éviter locks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_actor_user_id_perf 
    ON public.events(actor_user_id) 
    WHERE actor_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_occurred_at_perf 
    ON public.events(occurred_at DESC) 
    WHERE occurred_at IS NOT NULL;

-- 🔧 ÉTAPE 5: Trigger intelligent pour maintenir la sync
CREATE OR REPLACE FUNCTION maintain_events_compatibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-sync les colonnes lors des INSERT/UPDATE
    NEW.actor_user_id = COALESCE(NEW.actor_user_id, NEW.user_id);
    NEW.occurred_at = COALESCE(NEW.occurred_at, NEW.ts);
    NEW.created_at = COALESCE(NEW.created_at, NEW.ts, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer trigger existant s'il y en a un
DROP TRIGGER IF EXISTS events_compatibility_trigger ON public.events;

-- Créer nouveau trigger optimisé
CREATE TRIGGER events_compatibility_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION maintain_events_compatibility();

-- 📊 ÉTAPE 6: Validation finale
DO $$
DECLARE
    total_events INTEGER;
    synced_events INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM public.events;
    SELECT COUNT(*) INTO synced_events 
    FROM public.events 
    WHERE actor_user_id IS NOT NULL AND occurred_at IS NOT NULL AND created_at IS NOT NULL;
    
    RAISE NOTICE '📊 MIGRATION SUMMARY:';
    RAISE NOTICE '   Total events: %', total_events;
    RAISE NOTICE '   Synced events: %', synced_events;
    RAISE NOTICE '   Success rate: %%%', ROUND((synced_events::NUMERIC / total_events::NUMERIC) * 100, 2);
    
    IF synced_events = total_events THEN
        RAISE NOTICE '🎉 MIGRATION SUCCESSFUL - ALL EVENTS COMPATIBLE!';
    ELSE
        RAISE WARNING '⚠️ Some events may need manual review';
    END IF;
END $$;

-- ============================================================================
-- 🌙 LUNA HUB EVENTS SCHEMA FULLY COMPATIBLE! 
-- ============================================================================