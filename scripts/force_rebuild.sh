#!/bin/bash
# 🚀 FORCE REBUILD RAILWAY - Anti-cache ultime
# Usage: ./scripts/force_rebuild.sh "message de commit"

set -e

COMMIT_MSG="${1:-🔄 FORCE REBUILD - Cache bust}"
TIMESTAMP=$(date +"%Y-%m-%d-%H:%M")

echo "🔧 Force rebuild Railway avec timestamp: $TIMESTAMP"

# 1. Modifier Dockerfile pour casser le cache
sed -i.bak "s/CACHE BUST.*$/CACHE BUST $TIMESTAMP/" apps/phoenix-backend-unified/Dockerfile

# 2. Modifier un fichier versionné pour forcer le changement
echo "# Force rebuild: $TIMESTAMP" >> apps/phoenix-backend-unified/.rebuild_trigger

# 3. Commit et push
git add .
git commit -m "$COMMIT_MSG - $TIMESTAMP"
git push origin main

echo "✅ Rebuild forcé ! Railway va détecter les changements."
echo "🔍 Surveillez les déploiements sur Railway Dashboard"

# Nettoyage
rm -f apps/phoenix-backend-unified/Dockerfile.bak