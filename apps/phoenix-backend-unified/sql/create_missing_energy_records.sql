-- ============================================================================
-- 🔧 CREATE MISSING ENERGY RECORDS
-- Date: 2025-08-25  
-- Objectif: Créer les enregistrements energy manquants pour tous les users
-- ============================================================================

-- Créer les enregistrements users_energy manquants
INSERT INTO public.users_energy (user_id, current_energy, is_unlimited, last_recharge_at) 
SELECT 
    u.id as user_id,
    COALESCE(u.luna_energy, 100.0) as current_energy,
    CASE 
        WHEN u.subscription_type = 'luna_unlimited' OR u.subscription_type = 'unlimited' THEN TRUE
        ELSE FALSE
    END as is_unlimited,
    NOW() as last_recharge_at
FROM public.users u
WHERE u.id NOT IN (
    SELECT ue.user_id 
    FROM public.users_energy ue 
    WHERE ue.user_id IS NOT NULL
)
ON CONFLICT (user_id) DO UPDATE SET
    current_energy = EXCLUDED.current_energy,
    is_unlimited = EXCLUDED.is_unlimited,
    last_recharge_at = EXCLUDED.last_recharge_at;

-- Mettre à jour les enregistrements existants avec les bonnes valeurs
UPDATE public.users_energy 
SET 
    current_energy = COALESCE(
        (SELECT luna_energy FROM users WHERE id = users_energy.user_id), 
        current_energy
    ),
    is_unlimited = COALESCE(
        (SELECT 
            CASE 
                WHEN subscription_type = 'luna_unlimited' OR subscription_type = 'unlimited' THEN TRUE
                ELSE FALSE
            END 
         FROM users WHERE id = users_energy.user_id), 
        is_unlimited
    );

-- ============================================================================
-- ✅ ENERGY RECORDS CRÉÉS - Synchronisation users <-> users_energy !
-- ============================================================================