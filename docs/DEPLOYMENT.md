# 🚀 Déploiement Railway

## Principe

Chaque service se déploie indépendamment sur Railway :
- 1 service Railway = 1 dossier apps/
- Pas de railway.json, pas de shared dependencies
- Communication REST entre services

## Étapes

### 1. Backend Unified (déployer en premier)

```bash
Railway > New Project > Deploy from GitHub
Repository: votre-repo
Root Directory: apps/phoenix-backend-unified
```

Variables d'environnement :
```
API_SECRET_TOKEN=your-secret-token
ENVIRONMENT=production
GEMINI_API_KEY=your-key (optionnel)
```

### 2. Iris API

```bash
Railway > New Service > Deploy from GitHub  
Root Directory: apps/phoenix-iris-api
```

Variables d'environnement : mêmes que Backend

### 3. Phoenix Letters

```bash
Railway > New Service > Deploy from GitHub
Root Directory: apps/phoenix-letters  
```

Variables d'environnement :
```
BACKEND_API_URL=https://your-backend.up.railway.app
API_SECRET_TOKEN=your-secret-token
```

### 4. Phoenix CV

```bash
Railway > New Service > Deploy from GitHub
Root Directory: apps/phoenix-cv
```

Variables d'environnement : mêmes que Letters

## Tests

Chaque service expose un endpoint de santé :
- Backend/Iris : `GET /health`
- Streamlit : `GET /_stcore/health`

## Domaines

Railway génère automatiquement :
- `https://phoenix-backend-unified-xxx.up.railway.app`
- `https://phoenix-iris-api-xxx.up.railway.app`  
- `https://phoenix-letters-xxx.up.railway.app`
- `https://phoenix-cv-xxx.up.railway.app`
