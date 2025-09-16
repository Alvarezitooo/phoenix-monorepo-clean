# 🚀 Phoenix - Plateforme IA de Développement Carrière

> Architecture JAMstack Multi-SPA avec services IA centralisés

Phoenix est une plateforme de développement carrière nouvelle génération alimentée par l'IA, proposant une analyse intelligente de CV, un coaching carrière personnalisé et une génération automatisée de lettres de motivation.

## 🏗️ Vue d'ensemble de l'architecture

```
🌐 Plateforme Phoenix (JAMstack Multi-SPA)
├── 🎯 phoenix-api/         # Passerelle & Orchestration (FastAPI)
├── 🚀 phoenix-frontend/    # SPA React Unifiée
└── 🌙 luna-hub/           # Hub IA Central (Gemini + Système Energy)
```

### Fonctionnalités principales

- **🤖 Aube AI Chat** - Conseil carrière intelligent avec contexte narratif
- **📄 CV Mirror Match** - Analyse CV avancée avec prédictions de succès
- **✉️ Génération de Lettres** - Lettres de motivation personnalisées avec recherche entreprise
- **⚡ Système Energy** - Monétisation intelligente basée sur l'usage
- **🔐 Sécurité Enterprise** - Authentification & autorisation prêtes pour la production

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ & npm
- Python 3.11+ & pip
- PostgreSQL 14+
- Redis 6+

### Configuration de développement

```bash
# Cloner et configurer
git clone <repo-url>
cd phoenix-production

# Configurer chaque service
cd phoenix-frontend && npm install && npm run dev
cd ../phoenix-api && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
cd ../luna-hub && pip install -r requirements.txt && python api_main.py
```

### Variables d'environnement

```env
# Phoenix API
LUNA_HUB_URL=http://localhost:8003

# Luna Hub  
DATABASE_URL=postgresql://user:pass@localhost:5432/phoenix
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## 🌐 Déploiement Production

Phoenix est optimisé pour le déploiement **Railway** avec mise à l'échelle automatique :

```bash
# Déployer les 3 services
railway up
```

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour la configuration production détaillée.

## 📊 Architecture Système

- **Frontend** : SPA React avec interface Tailwind desservant toutes les apps Phoenix
- **Passerelle API** : Couche d'orchestration FastAPI avec routage intelligent
- **Hub IA** : Service Luna centralisé avec intégration Gemini
- **Base de données** : PostgreSQL avec event sourcing pour le contexte narratif
- **Cache** : Redis pour l'optimisation des performances
- **Authentification** : JWT + cookies HTTPOnly pour la sécurité

## 🔧 Développement

### Structure du projet
```
phoenix-production/
├── phoenix-frontend/       # SPA React (Vite + Tailwind)
│   ├── src/modules/       # Modules Aube, CV, Letters, Rise
│   └── src/components/    # Composants UI partagés
├── phoenix-api/           # Passerelle FastAPI
│   └── app/routers/       # Points de terminaison d'orchestration
└── luna-hub/             # Hub Services IA
    ├── app/core/         # Logique métier
    ├── app/api/          # Points de terminaison IA
    └── app/models/       # Modèles de données
```

### Points de terminaison API

```http
# Services IA (via phoenix-api → luna-hub)
POST /api/v1/aube/chat              # Chat carrière Aube
POST /api/v1/cv/mirror-match        # Analyse CV
POST /api/v1/letters/generate       # Génération de lettres

# Gestion utilisateur
GET  /api/v1/users/profile          # Profil utilisateur
POST /api/v1/users/energy/purchase  # Achat d'énergie
```

## 🎯 Système Energy

Phoenix utilise un modèle de monétisation innovant basé sur l'énergie :

- **Les actions coûtent de l'énergie** : Analyse CV (25%), Génération lettre (15%), etc.
- **Packs Energy** : 2,99€ (100%) à 29,99€/mois (illimité)
- **Suivi intelligent** : Chaque interaction enregistrée pour le contexte narratif

## 🛡️ Fonctionnalités de sécurité

- **Conforme aux Directives Oracle** - Voir [ORACLE_DIRECTIVES.md](./ORACLE_DIRECTIVES.md)
- **Sécurité Hub-Centrique** - Toute logique métier dans Luna Hub
- **Validation des entrées** - Security Guardian sur toutes les entrées
- **Limitation de débit** - Protection multi-couches
- **Protection CORS** - Liste blanche de domaines stricte

## 📈 Performance

- **Chargement Frontend** : < 2s First Contentful Paint
- **Réponse API** : < 500ms (95e percentile)
- **Génération IA** : < 5s en moyenne
- **Taux de succès** : > 95% tous services
- **Utilisateurs simultanés** : 1000+ supportés

## 🧪 Tests

```bash
# Exécuter les tests E2E
node test-production-readiness.js
node test-ai-services-integration.js
```

## 🤝 Contribution

1. Suivre les Directives Oracle (ORACLE_DIRECTIVES.md)
2. Maintenir l'architecture hub-centrique
3. Toute logique IA uniquement dans Luna Hub
4. Event sourcing pour les changements d'état
5. Sécurité par conception

## 📝 Licence

Privé - Système Phoenix Production

---

**Construit avec passion en utilisant l'architecture JAMstack pour un développement carrière IA scalable** 🌟