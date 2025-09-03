-- 🔧 Phoenix Luna Hub - Schema Fix for Existing Views
-- Execute this BEFORE the main schema

-- ================================
-- DROP EXISTING VIEWS THAT CONFLICT
-- ================================

-- Drop views that conflict with our tables
DROP VIEW IF EXISTS energy_transactions CASCADE;
DROP VIEW IF EXISTS user_energy CASCADE;
DROP VIEW IF EXISTS events CASCADE;
DROP VIEW IF EXISTS rate_limits CASCADE;
DROP VIEW IF EXISTS refresh_tokens CASCADE;
DROP VIEW IF EXISTS sessions CASCADE;

-- Clean up any existing conflicting tables
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE; 
DROP TABLE IF EXISTS sessions CASCADE;

-- ================================
-- NOW EXECUTE THE MAIN SCHEMA
-- ================================
-- After running this, execute the full supabase_schema.sql content