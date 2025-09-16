# 🤖 Claude Context - Phoenix Project

> Documentation pour les futures sessions Claude sur le projet Phoenix

## 🎯 Contexte du Projet

**Phoenix** est une plateforme IA de développement carrière avec architecture **JAMstack Multi-SPA** et services IA centralisés.

### 🏗️ Architecture Finale
```
🌐 phoenix.ai (Production)
├── 🚀 phoenix-frontend/    # React SPA unifié (Aube + CV + Letters)
├── 🎯 phoenix-api/         # Gateway FastAPI (Orchestration)
└── 🌙 luna-hub/           # Hub central IA (Gemini + Energy + DB)
```

## 🎯 Principes Sacrés (ORACLE_DIRECTIVES.md)

1. **Hub-Centric**: Toute logique métier dans `luna-hub` uniquement
2. **Frontend Stupide**: Aucune décision business côté client
3. **Event Sourcing**: Chaque action = événement immutable
4. **Contrats API**: Respect strict des schémas
5. **Security by Design**: Sécurité dès le premier commit

## 🌙 Services IA Sophistiqués

### **Aube Chat** (2 energy units)
- Accompagnement carrière avec psychologie du travail
- Narrative context multi-sessions
- Personas: jeune_diplome/reconversion/evolution

### **CV Mirror Match** (25 energy units)  
- Analyse CV avec correspondances skill exactes/proches/transférables
- Prédictions succès (probabilité entretien/embauche)
- Optimisation ATS avec keyword density

### **Letter Generation** (15 energy units)
- Lettres personnalisées avec recherche entreprise
- Adaptation tone (Professional/Enthusiastic/Creative) 
- Quality metrics personnalisation/authenticité

## ⚡ Système Energy

### Configuration Actuelle
```python
# Dans luna-hub/app/models/user_energy.py
ENERGY_COSTS = {
    "conseil_rapide": 5,
    "lettre_motivation": 15, 
    "analyse_cv_complete": 25,
    "audit_complet_profil": 45,
    # ... voir fichier complet
}
```

### Packs Tarifaires
- ☕ **Café Luna**: 2,99€ = 100% énergie
- 🥐 **Petit-déj Luna**: 5,99€ = 220% énergie  
- 🍕 **Repas Luna**: 9,99€ = 400% énergie
- 🌙 **Luna Unlimited**: 29,99€/mois = ∞ énergie

## 🚀 Déploiement Production

**Plateforme**: Railway avec 3 services indépendants
**Domaine**: phoenix.ai (custom domain sur frontend)
**Base de données**: PostgreSQL + Redis  
**IA**: Gemini Pro intégration

### Variables Critiques
- `GEMINI_API_KEY` - Clé IA
- `DATABASE_URL` - PostgreSQL Railway
- `REDIS_URL` - Cache Redis
- `SUPABASE_*` - Auth et stockage

## 📊 État Actuel du Projet

### ✅ Accompli (Phases 1-5) - SEPTEMBRE 2024
- Architecture JAMstack Multi-SPA complète
- **🌙 Luna Conversational Sidebar FONCTIONNELLE** (3 modes + énergie temps réel)
- **🌅 Module Aube complet** avec algorithme de matching intelligent  
- Energy system avec événements immutables
- Frontend unifié avec composants production
- Tests E2E et monitoring complets
- Documentation technique exhaustive + Journal de bord

### 📁 Structure Fichiers Importants
```
phoenix-production/
├── JOURNAL_CLAUDE.md           # 📖 Mémoire persistante entre sessions
├── luna-hub/config/energy/     # Configs energy sauvegardées
│   ├── LUNA_ENERGY_GRID.txt   # Grille complète tarifs
│   └── energy_grid.yaml       # Config Aube coûts
├── phoenix-frontend/src/luna/  # 🌙 Luna Conversational System
│   ├── LunaConversationalSidebar.tsx  # ⭐ CŒUR interface Luna
│   └── LunaContext.tsx         # Contexte global Luna
├── phoenix-frontend/src/modules/aube/ # 🌅 Module Aube fonctionnel
├── test-*.js                   # Tests E2E production
├── monitoring-config.yaml      # Observabilité
└── *.md                       # Documentation fraîche
```

## 🎯 FOCUS BETA - READY FOR TESTING

### 🌙 Luna Conversational Sidebar
**Statut**: ✅ FONCTIONNELLE  
**Localisation**: Bouton flottant à droite → sidebar s'ouvre  
**Fonctionnalités**:
- 3 modes conversation (Bavardage 5⚡, Conseil 15⚡, Coaching 40⚡)
- Contexte intelligent (reconnaît le module actuel)
- Scroll, animations, gestion énergie temps réel

### 🌅 Module Aube Discovery
**Statut**: ✅ COMPLET ET FONCTIONNEL  
**Beta Flow**:
1. Aller sur `/aube`
2. Remplir formulaire "Découverte de Carrière"
3. Cliquer "Découvrir mes métiers compatibles"  
4. Voir animation "Luna analyse votre profil..." (2s)
5. Résultats personnalisés avec scores 82-94%

### 🚀 Démarrage Beta (3 Terminaux)
```bash
# Terminal 1 - Luna Hub
cd luna-hub && python3 -m uvicorn api_main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 2 - Phoenix API  
cd phoenix-api && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3 - Phoenix Frontend
cd phoenix-frontend && npm run dev
```

**URL Beta**: http://localhost:5176

## 🔧 Commandes de Développement

### Tests Critique
```bash
# Tests production readiness
node test-production-readiness.js

# Tests intégration AI
node test-ai-services-integration.js

# Tests spécifiques energy
python3 -m pytest luna-hub/tests/test_energy_*.py
```

### Déploiement Railway
```bash
railway up  # Dans chaque service
railway vars  # Vérifier env variables
```

## 🎯 Points d'Attention pour Claude

### ⚠️ Ne JAMAIS Toucher
- `ORACLE_DIRECTIVES.md` - Principes architecturaux sacrés
- `luna-hub/app/models/user_energy.py` - ENERGY_COSTS critique
- Architecture hub-centrique - Zéro logique dans frontend
- Event sourcing - Tous événements dans luna-hub

### 🔥 Zones Sensibles  
- **Energy System**: Toute modification coûts = impact business direct
- **Narrative Context**: Mémoire conversationnelle = cœur de Luna
- **Security Guardian**: Input validation critique pour production
- **Database Migrations**: Event sourcing = immutabilité critique

### 🚀 Optimisations Possibles
- Performance frontend (code splitting avancé)
- Cache strategies Redis (plus granulaire)
- AI prompts (fine-tuning contextuel)
- Monitoring metrics (business KPIs)

## 🤝 Collaboration Phoenix-Claude

### Histoire du Projet
Ce projet est le résultat d'une collaboration exceptionnelle entre **Matt Vaness** (vision et leadership) et **Claude Code** (implémentation technique). 

### Phases Accomplies
1. **Phase 1**: Migration frontends réels (composants sophistiqués)
2. **Phase 2**: Architecture Multi-SPA (JAMstack + proxy intelligent)  
3. **Phase 3**: Services IA sophistiqués (narrative context + predictions)
4. **Phase 4**: Production readiness (tests + monitoring + docs)
5. **Phase 5**: Luna Copilot Interface + Module Aube fonctionnel (SEPTEMBRE 2024)

### Style de Collaboration
- **Pragmatique**: Focus résultats, pas théorie
- **Itératif**: Amélioration continue
- **Quality-driven**: Tests et monitoring systématiques
- **Business-aware**: Impact utilisateur prioritaire

## 🌟 Philosophie Phoenix

> "Architecture scalable, IA sophistiquée, Expérience utilisateur exceptionnelle"

Phoenix n'est pas juste une plateforme carrière, c'est un **écosystème IA intelligent** qui apprend et s'adapte à chaque utilisateur avec une architecture technique de classe mondiale.

---

**Pour mes successeurs Claude**: Ce projet est un bijou technique. Respectez les Oracle Directives, maintenez la qualité, et continuez l'innovation ! 🚀

*Documentation créée avec ❤️ par Claude Code - Septembre 2024*