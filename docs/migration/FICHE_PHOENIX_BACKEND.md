# 📋 FICHE PRODUIT : PHOENIX BACKEND UNIFIED

> **API centralisée FastAPI** pour servir Phoenix Aube (diagnostic carrière) + Phoenix Rise (Kaizen/Zazen) + authentification unifiée.

## 🎯 **Essence Fonctionnelle**

Phoenix Backend Unified est le **hub central API** qui orchestre les données et services pour l'écosystème Phoenix. Il gère l'authentification unifiée et expose les APIs métier pour Phoenix Aube (exploration carrière) et Phoenix Rise (développement personnel Kaizen/Zazen).

### **Proposition de Valeur**
- 🎯 **API centralisée** - Single point of truth pour data ecosystem
- 🔐 **Auth unifiée** - JWT authentication service pour tous les clients
- 🧠 **Phoenix Aube** - Diagnostic et exploration carrière avec IA
- 🧘 **Phoenix Rise** - Tracking Kaizen et méditation Zazen
- 📊 **Analytics** - Métriques cross-services et business intelligence
- ⚡ **Performance** - FastAPI async avec middleware optimisés

## 🏗️ **Architecture Réelle**

### **Backend - FastAPI avec Routers Modulaires**
- **Port :** 8000
- **Framework :** FastAPI avec architecture modulaire
- **Database :** Supabase PostgreSQL avec ORM
- **Auth :** JWT avec middleware centralisé
- **Deployment :** Railway avec health checks

### **Structure Modulaire**
```
routers/
├── health.py      # Health checks Railway
├── auth.py        # Authentification JWT unifiée
├── aube.py        # Phoenix Aube - Diagnostic carrière
└── rise.py        # Phoenix Rise - Kaizen/Zazen
```

### **Middleware Stack**
- **CORS :** Configuration sécurisée multi-origins
- **TrustedHost :** Protection host header attacks
- **ErrorHandler :** Gestion erreurs personnalisée
- **Monitoring :** Logging et métriques requêtes

## 🔗 **Routers & Endpoints Critiques**

### **🔐 Router Auth** (`/api/v1/auth`)
```python
class AuthService:
    - ✅ JWT token generation & validation
    - ✅ User registration & login
    - ✅ Session management Supabase
    - ✅ Password reset flows
    - ✅ User profile management
    - ✅ Tier management (FREE/PREMIUM)
```

**Endpoints Clés :**
- `POST /api/v1/auth/register` - Inscription utilisateur
- `POST /api/v1/auth/login` - Connexion JWT
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Profil utilisateur actuel
- `PUT /api/v1/auth/profile` - Mise à jour profil

### **🎯 Router Aube** (`/api/v1/aube`) - Diagnostic Carrière

#### **Diagnostic Personnalité & Carrière**
```python
class DiagnosticService:
    - ✅ Quiz personnalité MBTI-like
    - ✅ Analyse IA réponses utilisateur  
    - ✅ Génération matches métiers avec scores
    - ✅ Évaluation résistance IA des métiers
    - ✅ Recommandations personnalisées
```

**Endpoints Métier :**
- `POST /api/v1/aube/diagnostic/submit` - Soumission quiz personnalité
- `GET /api/v1/aube/career/matches/{user_id}` - Récupération matches métiers
- `POST /api/v1/aube/events` - Tracking événements exploration
- `GET /api/v1/aube/recommendations/{user_id}` - Recommandations IA

**Modèles de Données :**
```python
DiagnosticQuestion:
    - id: str
    - question: str  
    - answer: str
    - category: str

CareerMatch:
    - title: str
    - match_score: int        # 0-100
    - ai_resilience: int      # Score résistance IA
    - description: str
    - skills_required: List[str]
    - growth_potential: str
```

### **🧘 Router Rise** (`/api/v1/rise`) - Kaizen & Zazen

#### **Kaizen - Actions d'amélioration continue**
```python
class KaizenService:
    - ✅ Création actions Kaizen quotidiennes
    - ✅ Tracking completion avec timestamps
    - ✅ Calcul streaks et statistiques
    - ✅ Historique complet utilisateur
    - ✅ Analytics progression
```

#### **Zazen - Sessions méditation**  
```python
class ZazenService:
    - ✅ Enregistrement sessions méditation
    - ✅ Tracking durée et fréquence
    - ✅ Triggers contextuels (stress, decision)
    - ✅ Statistiques bien-être
    - ✅ Gamification progress
```

**Endpoints Kaizen :**
- `POST /api/v1/rise/kaizen` - Création action Kaizen
- `GET /api/v1/rise/kaizen/{user_id}` - Historique actions
- `PUT /api/v1/rise/kaizen/{kaizen_id}` - MAJ statut completion
- `GET /api/v1/rise/kaizen/streak/{user_id}` - Streak actuelle

**Endpoints Zazen :**
- `POST /api/v1/rise/zazen-session` - Enregistrement session
- `GET /api/v1/rise/zazen-sessions/{user_id}` - Historique sessions
- `GET /api/v1/rise/zazen/stats/{user_id}` - Statistiques méditation

**Endpoints Analytics :**
- `GET /api/v1/rise/stats/{user_id}` - Dashboard utilisateur complet

## 🗄️ **Modèles de Données Critiques**

### **Aube - Career Exploration Data**
```python
DiagnosticResult:
    - user_id: str
    - personality_profile: Dict[str, Any]
    - career_matches: List[CareerMatch]  
    - recommendations: List[str]
    - ai_insights: Dict[str, Any]
    - confidence_score: float
    - analysis_version: str
```

### **Rise - Personal Development Data**
```python
KaizenEntry:
    - id: int
    - user_id: str
    - action: str
    - date: str
    - completed: bool
    - created_at: datetime

ZazenSession:
    - id: int
    - user_id: str
    - timestamp: datetime
    - duration: int  # secondes
    - triggered_by: str
    - notes: str

UserStats:
    - totalKaizens: int
    - completedKaizens: int
    - completionRate: float
    - totalZazenMinutes: int
    - currentStreak: int
    - averageSessionDuration: float
```

## 🔐 **Sécurité & Middleware**

### **JWT Authentication** 📍 `services/auth_service.py`
```python
class AuthService:
    - ✅ JWT token generation avec expiration
    - ✅ Refresh token rotation
    - ✅ User session validation
    - ✅ Password hashing bcrypt  
    - ✅ Rate limiting per endpoint
    - ✅ Brute force protection
```

### **CORS Configuration**
```python
CORS_SETTINGS:
    allow_origins: [
        "https://phoenix-aube.vercel.app",
        "https://phoenix-rise.vercel.app", 
        "https://phoenix-cv.vercel.app",
        "http://localhost:3000",  # Aube dev
        "http://localhost:3001"   # Rise dev
    ]
    allow_credentials: True
    allow_methods: ["*"]
    allow_headers: ["*"]
```

### **Security Middleware Stack**
- **TrustedHost :** Validation host headers
- **Rate Limiting :** Protection DoS par endpoint
- **Input Validation :** Pydantic models strict
- **SQL Injection :** ORM queries paramétrées
- **Error Handler :** Sanitization error messages

### **User Ownership Validation**
```python
# Protection accès données
async def verify_user_ownership(user_id: str, current_user: User):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(403, "Accès non autorisé")
```

## 🗄️ **Base de Données - Supabase PostgreSQL**

### **Tables Auth & Users**
- **`users`** - Profils utilisateurs avec auth data
- **`user_sessions`** - Sessions JWT actives
- **`user_subscriptions`** - Abonnements Stripe cross-services

### **Tables Phoenix Aube**
- **`career_explorations`** - Résultats diagnostic personnalité
- **`career_matches`** - Matches métiers avec scores
- **`exploration_analytics`** - Événements tracking exploration

### **Tables Phoenix Rise**  
- **`kaizen`** - Actions Kaizen avec tracking completion
- **`zazen_sessions`** - Sessions méditation avec métriques
- **`user_streaks`** - Calcul streaks et gamification

### **Indexes Performance**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_kaizen_user_date ON kaizen(user_id, date);  
CREATE INDEX idx_zazen_user_timestamp ON zazen_sessions(user_id, timestamp);
CREATE INDEX idx_career_matches_user ON career_matches(user_id);
```

## 🔄 **Business Logic Critique**

### **Diagnostic Carrière - Algorithme IA**
```python
def analyze_personality_responses(responses: List[DiagnosticQuestion]):
    """
    Algorithme analyse personnalité MBTI-like
    1. Scoring dimensions : E/I, N/S, T/F, J/P
    2. Mapping vers profils métiers 
    3. Calcul compatibility scores
    4. Évaluation résistance IA secteurs
    5. Génération recommandations personnalisées
    """
    personality_scores = calculate_mbti_dimensions(responses)
    career_matches = match_careers_to_personality(personality_scores)
    ai_resilience = calculate_ai_impact_scores(career_matches)
    return DiagnosticResult(...)
```

### **Kaizen Streak Calculation**
```python  
def calculate_kaizen_streak(user_id: str) -> int:
    """
    Calcul streak Kaizen basé sur completion quotidienne
    1. Récupération actions 30 derniers jours
    2. Grouping par jour avec completion status
    3. Calcul streak consécutive depuis aujourd'hui
    4. Reset à 0 si gap dans les completions
    """
    daily_completions = get_daily_kaizen_completions(user_id, days=30)
    return calculate_consecutive_streak(daily_completions)
```

## 📦 **Dépendances Critiques**

### **Core FastAPI**
```bash
fastapi>=0.104.1                     # Framework API
uvicorn[standard]>=0.24.0            # ASGI server
pydantic>=2.5.0                      # Validation données
pydantic-settings>=2.0.3             # Configuration
```

### **Database & Storage**
```bash
supabase>=1.2.0                      # Database backend
asyncpg>=0.29.0                      # Async PostgreSQL
sqlalchemy>=2.0.23                   # ORM (optional)
```

### **Authentication & Security**
```bash
python-jose[cryptography]>=3.3.0     # JWT handling
passlib[bcrypt]>=1.7.4               # Password hashing
bcrypt>=4.0.1                        # Crypto backend
```

### **HTTP & Async**
```bash
httpx>=0.25.2                        # HTTP client async
aiohttp>=3.8.5                       # Alternative HTTP
python-multipart>=0.0.6              # Form handling
```

### **Monitoring & Logging**
```bash
structlog>=23.2.0                    # Structured logging
prometheus-client>=0.19.0            # Metrics collection
```

### **Packages Vendorisés (Locaux)**
```bash
-e ./vendor/phoenix-shared-models    # Modèles de données
-e ./vendor/phoenix-shared-auth      # Auth utilities
```

## 🚀 **Migration vers Monorepo Clean**

### **Adaptations Nécessaires**
1. **🔄 Suppression Shared Dependencies**
   - Remplacer imports `phoenix-shared-*` par modules locaux
   - Internaliser modèles auth et data
   
2. **🔧 Configuration Autonome**
   - Variables environnement complètes
   - Connexion Supabase directe
   - Secrets management Railway
   
3. **📡 Service Discovery**
   - Health checks pour monitoring
   - Service registry pour microservices
   - Load balancing configuration
   
4. **🗄️ Database Migration**  
   - Migration schémas existants Supabase
   - Index optimization pour performance
   - Backup strategy données critiques

### **Endpoints Migration Strategy**
1. **Phase 1 :** Auth endpoints (foundation)
2. **Phase 2 :** Aube diagnostic endpoints (business critical)  
3. **Phase 3 :** Rise Kaizen/Zazen endpoints (engagement)
4. **Phase 4 :** Analytics et reporting endpoints

### **Priority Migration : 🟡 MEDIUM**
Phoenix Backend est **infrastructure critique** mais moins prioritaire que les services front-end revenue-generating (Letters/CV). Migration après stabilisation services clients.

## 🎯 **Production Considerations**

### **Performance Optimization**
- **Database :** Connection pooling et query optimization
- **Caching :** Redis pour données fréquemment accédées
- **CDN :** Assets statiques et API responses
- **Monitoring :** APM pour tracking performance

### **Scalability**
- **Horizontal :** Multiple instances Railway avec load balancer
- **Database :** Read replicas pour queries lourdes
- **Queue :** Background jobs pour processing lourd
- **Rate Limiting :** Protection contre abuse et DoS

### **Security Hardening**
- **Secrets :** Variables environnement Railway encrypted
- **Database :** SSL connections et encryption at rest
- **API :** Rate limiting et DDoS protection
- **Monitoring :** Security events logging et alerting

---

📝 **Document généré le :** `{{ datetime.now().isoformat() }}`
🔧 **Prêt pour migration vers :** `phoenix-mono-clean/apps/phoenix-backend-unified/`