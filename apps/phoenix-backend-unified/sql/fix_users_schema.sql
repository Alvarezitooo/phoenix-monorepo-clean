-- ============================================================================
-- 🔧 FIX USERS SCHEMA - Ajouter colonne is_active manquante
-- Date: 2025-08-25  
-- Objectif: Ajouter is_active pour compatibilité avec energy_manager.py
-- ============================================================================

-- Ajouter colonne is_active si elle n'existe pas
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Mettre à jour les valeurs NULL en TRUE par défaut
UPDATE public.users 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN public.users.is_active IS 'Utilisateur actif - utilisé par energy_manager pour unlimited check';

-- ============================================================================
-- ✅ USERS SCHEMA FIXÉ - is_active ajouté !
-- ============================================================================