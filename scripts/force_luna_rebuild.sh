#!/bin/bash
# 🚀 FORCE LUNA HUB BACKEND REBUILD - Spécifique Railway
# Usage: ./scripts/force_luna_rebuild.sh

set -e

TIMESTAMP=$(date +"%Y-%m-%d-%H:%M:%S")

echo "🌙 Force rebuild LUNA HUB BACKEND: $TIMESTAMP"

# 1. Modifier Dockerfile Luna Hub
sed -i.bak "s/CACHE BUST.*$/CACHE BUST $TIMESTAMP/" apps/luna-hub/Dockerfile

# 2. Modifier version.txt spécifique Luna Hub
echo "$TIMESTAMP" > apps/luna-hub/version.txt

# 3. Modifier le main.py Luna Hub avec timestamp
sed -i.bak "s/Force Rebuild:.*$/Force Rebuild: ${TIMESTAMP}Z - Luna rebuild trigger/" apps/luna-hub/main.py

# 4. Créer un fichier rebuild trigger unique
echo "# Luna Hub rebuild: $TIMESTAMP" >> apps/luna-hub/.luna_rebuild_trigger

# 5. Modifier requirements.txt (commentaire)
echo "# Rebuild trigger: $TIMESTAMP" >> apps/luna-hub/requirements.txt

# 6. Commit et push
git add apps/luna-hub/
git commit -m "🌙 FORCE LUNA HUB REBUILD - $TIMESTAMP

Multiple file changes to ensure Railway detection:
- Dockerfile cache bust
- version.txt updated  
- main.py timestamp
- requirements.txt trigger
- .luna_rebuild_trigger

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main

echo "✅ Luna Hub rebuild forcé avec modifications multiples !"
echo "🔍 Railway DOIT maintenant détecter les changements"

# Nettoyage
rm -f apps/luna-hub/*.bak