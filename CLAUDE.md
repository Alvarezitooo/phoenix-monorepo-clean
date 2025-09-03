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

### ✅ Accompli (Phases 1-4)
- Architecture JAMstack Multi-SPA complète
- 3 services IA sophistiqués opérationnels
- Energy system avec événements immutables
- Frontend unifié avec composants production
- Tests E2E et monitoring complets
- Documentation technique exhaustive

### 📁 Structure Fichiers Importants
```
phoenix-production/
├── luna-hub/config/energy/     # Configs energy sauvegardées
│   ├── LUNA_ENERGY_GRID.txt   # Grille complète tarifs
│   └── energy_grid.yaml       # Config Aube coûts
├── test-*.js                   # Tests E2E production
├── monitoring-config.yaml      # Observabilité
└── *.md                       # Documentation fraîche
```

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