-- =============================================================================
-- PHOENIX MIGRATION M0: SCRIPT DE SÉCURISATION RLS
-- ATTENTION: À appliquer sur une base de STAGING avant la production.
-- Adaptez les noms de tables et de colonnes à votre schéma.
-- =============================================================================

-- Étape 1: Révoquer les privilèges publics par défaut.
-- C'est une mesure de sécurité forte. Personne ne pourra accéder aux tables
-- sans une politique RLS explicite.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public, anon, authenticated;
COMMIT;

-- Étape 2: Activer la Row-Level Security (RLS) sur vos tables critiques.
-- Vous devez le faire pour chaque table que vous voulez protéger.
-- EXEMPLE: Décommentez et adaptez pour vos tables.
--
-- BEGIN;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- COMMIT;

-- Étape 3: Créer les politiques de sécurité.
-- C'est ici que vous définissez QUI a le droit de voir/modifier QUOI.
--
-- EXEMPLE 1: Pour une table 'profiles' où l'ID de l'utilisateur est la clé primaire.
--
-- CREATE POLICY "Les utilisateurs peuvent voir leur propre profil."
--   ON public.profiles FOR SELECT
--   USING (auth.uid() = id);
--
-- CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil."
--   ON public.profiles FOR UPDATE
--   USING (auth.uid() = id);
--
--
-- EXEMPLE 2: Pour une table 'documents' qui a une colonne 'user_id'.
--
-- CREATE POLICY "Les utilisateurs peuvent gérer leurs propres documents."
--   ON public.documents FOR ALL  -- (ALL = SELECT, INSERT, UPDATE, DELETE)
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);


-- Étape 4: Redonner les permissions aux rôles, qui seront maintenant filtrées par RLS.
-- Une fois RLS activée, même avec des GRANTs, les politiques s'appliquent.
--
-- EXEMPLE:
--
-- GRANT SELECT, UPDATE ON public.profiles TO authenticated;
-- GRANT ALL ON public.documents TO authenticated;
--
-- -- N'oubliez pas les permissions sur les séquences pour les INSERTs !
-- GRANT USAGE, SELECT ON SEQUENCE documents_id_seq TO authenticated;
