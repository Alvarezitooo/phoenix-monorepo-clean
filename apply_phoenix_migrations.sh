#!/bin/bash

# ============================================================================
# 🚀 PHOENIX LUNA HUB V2.0 - SCRIPT D'APPLICATION MIGRATIONS
# Date: 2025-08-27
# Objectif: Applique toutes les migrations enterprise en une fois
# ============================================================================

set -e  # Exit on any error

echo "🚀 Starting Phoenix Luna Hub v2.0 migrations..."
echo "================================================"

# Configuration
PROJECT_DIR="/Users/mattvaness/Desktop/IA/phoenix-production"
BACKEND_DIR="$PROJECT_DIR/apps/phoenix-backend-unified"
MIGRATION_FILE="$BACKEND_DIR/migrations/apply_all_phoenix_v2_migrations.sql"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification des prérequis
log_info "Checking prerequisites..."

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI not found. Please install it first:"
    echo "curl -sSfL https://supabase.com/install.sh | sh"
    exit 1
fi

log_success "Supabase CLI found: $(supabase --version)"

# Se déplacer dans le répertoire racine
cd "$PROJECT_DIR"
log_info "Working directory: $(pwd)"

# Vérifier la configuration Supabase
if [ ! -f "supabase/config.toml" ]; then
    log_error "Supabase config not found. Run 'supabase init' first."
    exit 1
fi

log_success "Supabase config found"

# Vérifier le fichier de migration
if [ ! -f "$MIGRATION_FILE" ]; then
    log_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

log_success "Migration file found"

# Fonction pour appliquer les migrations via psql direct
apply_via_psql() {
    log_info "Applying migrations via direct database connection..."
    
    # Vérifier si DATABASE_URL est définie
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL not set. Please set it in your environment:"
        echo "export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
        echo ""
        log_info "You can find your DATABASE_URL in your Supabase project settings"
        return 1
    fi
    
    log_info "Applying migration using DATABASE_URL..."
    if psql "$DATABASE_URL" -f "$MIGRATION_FILE"; then
        log_success "Migrations applied successfully via psql!"
        return 0
    else
        log_error "Failed to apply migrations via psql"
        return 1
    fi
}

# Fonction pour appliquer via Supabase CLI local
apply_via_supabase_local() {
    log_info "Trying to apply migrations via Supabase local development..."
    
    # Vérifier si Docker est disponible
    if ! docker info &> /dev/null; then
        log_warning "Docker not running. Cannot use local Supabase."
        return 1
    fi
    
    # Démarrer Supabase localement si pas déjà fait
    log_info "Starting local Supabase..."
    if supabase start; then
        log_success "Local Supabase started"
    else
        log_warning "Could not start local Supabase (might already be running)"
    fi
    
    # Appliquer les migrations
    log_info "Applying migrations to local database..."
    if supabase db push --include-all; then
        log_success "Migrations pushed to local database"
        
        # Optionnel: dump le schema pour vérification
        log_info "Creating schema dump for verification..."
        supabase db dump --schema-only -f "schema_after_migration.sql"
        log_success "Schema dumped to schema_after_migration.sql"
        
        return 0
    else
        log_error "Failed to push migrations to local database"
        return 1
    fi
}

# Fonction pour créer les migrations Supabase proprement
create_supabase_migrations() {
    log_info "Creating proper Supabase migrations..."
    
    # Créer le répertoire migrations Supabase
    mkdir -p "supabase/migrations"
    
    # Copier notre migration avec un timestamp
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    SUPABASE_MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_phoenix_luna_hub_v2_enterprise.sql"
    
    cp "$MIGRATION_FILE" "$SUPABASE_MIGRATION_FILE"
    log_success "Migration file created: $SUPABASE_MIGRATION_FILE"
    
    return 0
}

# Instructions pour application manuelle
show_manual_instructions() {
    log_info "Manual migration instructions:"
    echo "================================================"
    echo ""
    echo "1. 📋 Copy the migration file content:"
    echo "   cat '$MIGRATION_FILE'"
    echo ""
    echo "2. 🌐 Go to your Supabase dashboard:"
    echo "   https://app.supabase.com/project/[your-project-id]/sql"
    echo ""
    echo "3. 📝 Paste the SQL content in the SQL editor"
    echo ""
    echo "4. ▶️  Execute the migration"
    echo ""
    echo "5. ✅ Verify tables were created:"
    echo "   - Go to Database > Tables"
    echo "   - Check for new enterprise tables:"
    echo "     • rate_limit_counters, rate_limit_events"
    echo "     • api_keys, api_key_usage"
    echo "     • system_metrics, system_alerts"
    echo "     • cache_entries, cache_events"
    echo "     • component_health, system_audit_trail"
    echo ""
    log_success "All enterprise v2.0 features will be ready! 🚀"
}

# Script principal
main() {
    log_info "Phoenix Luna Hub v2.0 Migration Script"
    echo "======================================"
    echo ""
    
    # Créer les migrations Supabase proprement
    create_supabase_migrations
    
    echo ""
    log_info "Attempting to apply migrations..."
    echo ""
    
    # Essayer d'abord via psql direct si DATABASE_URL disponible
    if apply_via_psql; then
        log_success "🎉 Migrations applied successfully via direct connection!"
        return 0
    fi
    
    # Essayer via Supabase CLI local
    if apply_via_supabase_local; then
        log_success "🎉 Migrations applied successfully via Supabase CLI!"
        return 0
    fi
    
    # Si aucune méthode automatique ne marche, donner les instructions manuelles
    log_warning "Automatic migration failed. Here are the manual steps:"
    echo ""
    show_manual_instructions
    
    return 0
}

# Exécuter le script principal
main "$@"

echo ""
echo "================================================"
log_success "Phoenix Luna Hub v2.0 migration script completed!"
echo "Your enterprise backend is ready to dominate! 🔥"