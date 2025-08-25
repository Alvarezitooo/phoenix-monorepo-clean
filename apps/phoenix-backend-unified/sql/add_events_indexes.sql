-- ============================================================================
-- 🚀 EVENTS PERFORMANCE INDEXES - Post Migration
-- Date: 2025-08-24
-- Ajoute les index pour optimiser les requêtes Luna Hub
-- ============================================================================

-- 📊 Index pour recherche par utilisateur (Capital Narratif)
CREATE INDEX IF NOT EXISTS idx_events_actor_user_id 
    ON public.events(actor_user_id) 
    WHERE actor_user_id IS NOT NULL;

-- ⏰ Index pour tri chronologique (order by occurred_at)
CREATE INDEX IF NOT EXISTS idx_events_occurred_at 
    ON public.events(occurred_at DESC) 
    WHERE occurred_at IS NOT NULL;

-- 🔍 Index composite pour requêtes utilisateur + date (plus efficace)
CREATE INDEX IF NOT EXISTS idx_events_user_time 
    ON public.events(actor_user_id, occurred_at DESC) 
    WHERE actor_user_id IS NOT NULL AND occurred_at IS NOT NULL;

-- 🏷️ Index pour filtrage par type d'événement
CREATE INDEX IF NOT EXISTS idx_events_type 
    ON public.events(type) 
    WHERE type IS NOT NULL;

-- 📋 Index composite type + utilisateur (analytics)
CREATE INDEX IF NOT EXISTS idx_events_type_user 
    ON public.events(type, actor_user_id, occurred_at DESC) 
    WHERE type IS NOT NULL AND actor_user_id IS NOT NULL;

-- ============================================================================
-- ✅ INDEXES AJOUTÉS - REQUÊTES LUNA HUB ULTRA-RAPIDES! 
-- ============================================================================