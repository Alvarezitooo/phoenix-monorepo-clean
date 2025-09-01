# 🔗 Guide Connexion Frontend ↔ Backend Phoenix Aube

## ✅ Statut Vérification Complète

### 🏗️ Backend Ready
- ✅ **API Main** : Configuration complète avec CORS flexible
- ✅ **Luna Hub Client** : Intégration token + énergie
- ✅ **Endpoints** : 8 endpoints prêts avec validation
- ✅ **Health Check** : `/health` et `/aube/health` 
- ✅ **Docker** : Full-stack nginx + supervisor
- ✅ **Railway Config** : Port dynamique configuré

### 🌐 URLs de Production

```bash
# Backend API
https://phoenix-aube-backend.up.railway.app

# Health Check
GET https://phoenix-aube-backend.up.railway.app/aube/health
```

## 🔌 Configuration CORS (Auto-Detection)

### Development (localhost)
```javascript
// CORS automatiquement configuré pour :
const ALLOWED_ORIGINS = [
  "http://localhost:3000",  // Next.js dev
  "http://localhost:5173",  // Vite dev
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
]
```

### Production (Railway)
```javascript
// CORS automatiquement configuré pour :
const ALLOWED_ORIGINS = [
  "https://phoenix-aube-frontend.up.railway.app",
  "https://aube.phoenix-ia.com",
  "https://phoenix-website-production.up.railway.app"
]
```

## 📡 API Endpoints Pour Frontend

### 1. Health Check
```javascript
// Test connexion backend
fetch('/aube/health')
  .then(r => r.json())
  .then(data => console.log(data))
// Réponse : { status: "healthy", service: "phoenix-aube" }
```

### 2. Assessment Complet (Avec Luna Hub)
```javascript
// Assessment psychologique + énergie Luna
const assessmentData = {
  user_id: "user123",
  signals: {
    people_orientation: 7,
    data_orientation: 8,
    values: ["autonomy", "impact"],
    environment_preferences: ["remote", "startup"],
    // ... autres dimensions
  },
  context: { source: "frontend_v2" }
}

fetch('/aube/career-match-luna', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + lunaToken
  },
  body: JSON.stringify(assessmentData)
})
```

### 3. Recommandations Carrière
```javascript
// Récupérer recommandations existantes
fetch(`/aube/recommendations/${userId}?limit=10&include_analysis=true`, {
  headers: {
    'Authorization': 'Bearer ' + lunaToken
  }
})
```

### 4. Statut Assessment
```javascript
// Vérifier si user a déjà fait l'assessment
fetch(`/aube/assessment/status/${userId}`, {
  headers: {
    'Authorization': 'Bearer ' + lunaToken
  }
})
```

## 🌙 Intégration Luna Hub (Énergie)

### Headers Obligatoires
```javascript
const headers = {
  'Authorization': 'Bearer ' + token_from_luna_hub,
  'Content-Type': 'application/json'
}
```

### Gestion Erreurs Énergie
```javascript
try {
  const response = await fetch('/aube/career-match-luna', { ... })
  
  if (response.status === 402) {
    // Énergie insuffisante
    window.location.href = 'https://luna-hub.phoenix-ia.com/energy/buy'
  }
  
  if (response.status === 401) {
    // Token expiré
    refreshToken()
  }
  
} catch (error) {
  console.error('API Error:', error)
}
```

## 🚀 Configuration Next.js (Frontend)

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/aube/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8001/aube/:path*'  // Dev local
          : '/aube/:path*'  // Prod nginx proxy
      }
    ]
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_LUNA_HUB_URL: 'https://luna-hub-backend-unified-production.up.railway.app'
  }
}

module.exports = nextConfig
```

### .env.local (Frontend Development)
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8001

# Luna Hub (pour auth)
NEXT_PUBLIC_LUNA_HUB_URL=https://luna-hub-backend-unified-production.up.railway.app

# Development
NODE_ENV=development
```

### .env (Frontend Production)
```bash
# Backend API (même domaine avec nginx proxy)
NEXT_PUBLIC_API_URL=

# Luna Hub
NEXT_PUBLIC_LUNA_HUB_URL=https://luna-hub-backend-unified-production.up.railway.app

# Production
NODE_ENV=production
```

## 🔧 Configuration API Client (Frontend)

### api/client.js
```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

class AubeAPIClient {
  constructor(tokenProvider) {
    this.tokenProvider = tokenProvider
  }
  
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tokenProvider()}`,
        ...options.headers
      }
    })
    
    if (response.status === 402) {
      throw new InsufficientEnergyError()
    }
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  // Methods spécifiques
  async assessmentStatus(userId) {
    return this.request(`/aube/assessment/status/${userId}`)
  }
  
  async careerMatch(assessmentData) {
    return this.request('/aube/career-match-luna', {
      method: 'POST',
      body: JSON.stringify(assessmentData)
    })
  }
  
  async getRecommendations(userId, limit = 10) {
    return this.request(`/aube/recommendations/${userId}?limit=${limit}&include_analysis=true`)
  }
}

export default AubeAPIClient
```

## 🎯 Tests de Connexion

### 1. Test Health Check
```bash
curl https://phoenix-aube-backend.up.railway.app/aube/health
```

### 2. Test CORS depuis Frontend
```javascript
// Dans console navigateur
fetch('/aube/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Test avec Token Luna
```javascript
// Avec vrai token Luna Hub
fetch('/aube/assessment/status/test-user', {
  headers: {
    'Authorization': 'Bearer YOUR_LUNA_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

---

## ✅ Checklist Connexion

- [ ] Backend déployé sur Railway
- [ ] Frontend Next.js configuré avec rewrites
- [ ] Token Luna Hub récupéré côté frontend  
- [ ] Tests CORS OK (dev + prod)
- [ ] Gestion erreurs 402/401 implémentée
- [ ] Health check accessible

**🚀 Ready for Frontend Connection !**