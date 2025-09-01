# 🚀 Guide de Déploiement Phoenix Letters - Career Transition Feature

## 📋 Vue d'ensemble

Ce guide détaille le déploiement de Phoenix Letters avec la nouvelle fonctionnalité révolutionnaire **Career Transition Analysis** sur Railway.

## ✅ Prérequis

### 1. Outils requis
```bash
# Railway CLI
npm install -g @railway/cli

# Python 3.11+
python --version

# Node.js 18+
node --version
```

### 2. Variables d'environnement Railway
Configurez ces variables dans votre projet Railway :

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_key_here

# App Configuration  
PHOENIX_LETTERS_ENVIRONMENT=production
PHOENIX_LETTERS_DEBUG=false

# Database (si utilisée)
DATABASE_URL=your_database_url

# Auth (si intégrée)
JWT_SECRET=your_jwt_secret

# Monitoring (optionnel)
SENTRY_DSN=your_sentry_dsn
```

## 🚀 Déploiement Automatisé

### Option 1: Script automatique (recommandé)
```bash
cd apps/phoenix-letters
python deploy.py
```

Le script effectue automatiquement :
- ✅ Vérification des prérequis
- 🧪 Lancement des tests (API + Career Transition)
- ⚙️ Build du frontend React
- 🚀 Déploiement Railway
- 🔍 Vérification post-déploiement

### Option 2: Déploiement manuel
```bash
# 1. Tests
python test_api.py
python test_career_transition_api.py

# 2. Build frontend
cd frontend/project
npm ci
npm run build
cd ../..

# 3. Déploiement
railway login
railway up
```

## 🎯 Vérification de la Career Transition Feature

Une fois déployé, testez la nouvelle fonctionnalité :

```bash
# Test de l'endpoint principal
curl -X POST https://your-app.railway.app/api/skills/analyze-transition \
  -H "Content-Type: application/json" \
  -d '{
    "previous_role": "Marketing Manager",
    "target_role": "Product Manager",
    "max_transferable_skills": 5
  }'

# Test du preview gratuit
curl "https://your-app.railway.app/api/skills/preview-transition?previous_role=Developer&target_role=Product%20Manager"
```

## 📊 Architecture Déployée

```
🌐 Railway App
├── 🔧 FastAPI Backend (Port 8001)
│   ├── 📝 API Lettres classique
│   ├── 🎯 NEW: Career Transition API
│   ├── 🤖 IA Gemini intégrée
│   └── 📈 Fallback intelligent
└── ⚛️ React Frontend (Intégré)
    ├── 📝 Générateur de lettres
    ├── 🎯 NEW: Analyse de transition
    ├── 💰 Modèle freemium
    └── 🎨 UI/UX premium
```

## 🔧 Configuration Production

### 1. Performance
- **Workers**: 4 en production vs 1 en développement
- **Reload**: Désactivé en production
- **Timeout**: 30s par requête
- **Rate limiting**: 60 req/min par IP

### 2. Sécurité
- **CORS**: Origins spécifiques en production
- **Headers**: Sécurité renforcée
- **Validation**: Strict sur toutes les entrées
- **Logs**: Niveau INFO en production

### 3. Monitoring
- **Health check**: `/health`
- **Metrics**: Activées si `ENABLE_METRICS=true`
- **Sentry**: Intégration pour le monitoring d'erreurs

## 📈 Quotas et Limites

### Utilisateurs Free
- **Lettres**: 5/mois
- **Analyses de transition**: 2/mois
- **Preview**: Illimité

### Utilisateurs Premium
- **Lettres**: Illimitées
- **Analyses de transition**: 20/mois
- **Features avancées**: Toutes débloquées

## 🧪 Tests de Validation

Après déploiement, validez ces scénarios :

### 1. API Classique
```bash
curl -X POST https://your-app.railway.app/api/letters/generate \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Corp",
    "position_title": "Developer",
    "use_ai": true
  }'
```

### 2. Career Transition (FREE)
```bash
curl "https://your-app.railway.app/api/skills/preview-transition?previous_role=Designer&target_role=UX%20Manager"
```

### 3. Career Transition (PREMIUM)
```bash
curl -X POST https://your-app.railway.app/api/skills/analyze-transition \
  -H "Content-Type: application/json" \
  -d '{
    "previous_role": "Sales Manager", 
    "target_role": "Customer Success Manager"
  }'
```

### 4. Health Check
```bash
curl https://your-app.railway.app/health
```

## 🚨 Troubleshooting

### Erreurs communes

#### 1. Port binding
```
Error: Port 8001 already in use
```
**Solution**: Railway gère automatiquement avec la variable `$PORT`

#### 2. Frontend non accessible
```
404 sur les routes React
```
**Solution**: Vérifier que le build frontend est inclus dans le Dockerfile

#### 3. Gemini API errors
```
AI service unavailable
```
**Solution**: 
- Vérifier `GEMINI_API_KEY` dans Railway
- Le fallback s'active automatiquement

#### 4. Career Transition 500
```
Internal server error sur /api/skills/*
```
**Solution**: 
- Vérifier les imports dans les logs Railway
- Tester en local avec `python test_career_transition_api.py`

## 📚 Ressources

- [Railway Dashboard](https://railway.app/dashboard)
- [Phoenix Letters Docs](./README.md)
- [Tests API](./test_api.py)
- [Tests Career Transition](./test_career_transition_api.py)

## 🎉 Feature Flags

La **Career Transition Analysis** peut être activée/désactivée via :

```env
SKILL_MAPPING_ENABLED=true  # false pour désactiver
```

Cette feature révolutionnaire distingue Phoenix Letters de tous ses concurrents ! 🎯Fixed Phoenix Letters port + CMD - Lun  1 sep 2025 17:48:38 CEST
