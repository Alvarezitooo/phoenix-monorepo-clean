# 📋 FICHE PRODUIT : PHOENIX IRIS API

> **Assistant IA conversationnel "Alessio"** spécialisé reconversion professionnelle, avec authentification JWT, analytics avancées, et rate limiting par tiers.

## 🎯 **Essence Fonctionnelle**

Phoenix Iris API héberge **Alessio**, l'assistant IA conversationnel spécialisé dans l'accompagnement de reconversion professionnelle. Il fournit des conseils personnalisés, analyses de profil, et guidance stratégique via une API FastAPI sécurisée alimentée par Google Gemini.

### **Proposition de Valeur**
- 🤖 **Alessio AI Personality** - Assistant spécialisé reconversion avec personnalité définie
- 🧠 **Google Gemini Engine** - IA conversationnelle avancée avec context awareness
- 🔐 **JWT Auth Standalone** - Authentification sécurisée avec rate limiting par tiers
- 📊 **Analytics avancées** - Tracking détaillé conversations et performance IA
- ⚡ **Performance optimisée** - Fallbacks, caching, et monitoring production-ready
- 🎯 **Spécialisation métier** - Expertise CV, lettres, entretiens, stratégie carrière

## 🏗️ **Architecture Réelle**

### **Backend - FastAPI avec Moteur Gemini**
- **Port :** 8003 (ou variable PORT)
- **Framework :** FastAPI avec middleware sécurisé
- **IA Engine :** Google Gemini 1.5 Flash
- **Auth :** JWT standalone avec user tiers
- **Analytics :** Supabase + logging structuré
- **Deployment :** Railway avec health checks

### **Personnalité Alessio**
```python
ALESSIO_PERSONALITY = {
    "name": "Alessio",
    "role": "Assistant Phoenix spécialisé reconversion",
    "tone": "Bienveillant, expert, motivant",
    "expertise": [
        "Reconversion professionnelle",
        "Optimisation CV et profil", 
        "Lettres de motivation authentiques",
        "Préparation entretiens",
        "Stratégie carrière et réseau"
    ],
    "signature": "Alessio 🤝"
}
```

## 🤖 **Moteur IA Alessio Critique**

### **Gemini Engine** 📍 `ai/gemini_alessio_engine.py`
```python
class AlessioGeminiEngine:
    - ✅ Google Gemini 1.5 Flash client optimisé
    - ✅ Personnalité Alessio prompt engineering
    - ✅ Context awareness conversationnelle  
    - ✅ Safety settings production
    - ✅ Response structuring et validation
    - ✅ Processing time tracking
    - ✅ Confidence scoring
```

### **Prompt Orchestrator** 📍 `ai/alessio_prompt_orchestrator.py`
```python  
class PromptOrchestrator:
    - ✅ Context management conversation
    - ✅ User profiling et personnalisation
    - ✅ Topic classification automatique
    - ✅ Prompt templates spécialisés
    - ✅ Response quality validation
```

### **Spécialisations Alessio**

#### **🔄 Reconversion Professionnelle**
- **Bilan compétences** - Identification skills transférables
- **Transition secteur** - Guidance changement domaine  
- **Formation** - Recommandations upskilling
- **Timing** - Stratégie transition optimale

#### **📄 CV & Profil Professionnel**
- **Structure CV** - Organisation information optimale
- **ATS Optimization** - Passage filtres automatiques
- **Compétences transférables** - Valorisation expérience passée
- **Personal branding** - Cohérence profil LinkedIn/CV

#### **✉️ Lettres de Motivation**
- **Personnalisation** - Adaptation entreprise/poste
- **Structure optimale** - Organisation persuasive  
- **Authenticité** - Expression motivation sincère
- **Call-to-action** - Incitation rencontre

#### **🎯 Entretiens d'Embauche**  
- **Questions types** - Préparation réponses STAR
- **Storytelling** - Narration expérience convaincante
- **Gestion stress** - Techniques relaxation
- **Négociation** - Conditions et rémunération

#### **📈 Stratégie Carrière**
- **LinkedIn optimization** - Profil attractif recruteurs
- **Réseau professionnel** - Techniques networking efficaces  
- **Marché caché** - Accès opportunités non publiées
- **Personal development** - Plan croissance long terme

## 🔐 **Authentification & Sécurité Phoenix Auth**

### **JWT Authentication Standalone** 📍 `security/phoenix_auth_standalone.py`
```python
class PhoenixAuthStandalone:
    - ✅ JWT token validation avec expiration
    - ✅ User tier management (FREE/PREMIUM)
    - ✅ Rate limiting intelligent par tier
    - ✅ Usage tracking avec quotas
    - ✅ Session management sécurisé
    - ✅ Brute force protection
```

### **User Tiers & Rate Limiting**
```python
TIER_LIMITS = {
    UserTier.FREE: {
        "daily_messages": 10,
        "rate_per_minute": 3,
        "context_memory": "limited"
    },
    UserTier.PREMIUM: {
        "daily_messages": -1,  # Unlimited
        "rate_per_minute": 10,
        "context_memory": "full"
    }
}
```

### **Security Middleware Stack**
- **CORS :** Configuration multi-origins Phoenix ecosystem
- **TrustedHost :** Validation host headers production
- **Request Monitoring :** Logging anonymisé avec IP hashing
- **Input Validation :** Sanitization messages utilisateur
- **Error Handling :** Responses sécurisées sans leak information

## 📊 **Analytics & Monitoring Avancées**

### **Iris Analytics** 📍 `monitoring/iris_analytics.py`
```python
class IrisAnalytics:
    - ✅ Event tracking anonymisé (RGPD compliant)
    - ✅ Chat sessions avec métriques détaillées
    - ✅ Performance monitoring (latence, erreurs)
    - ✅ User analytics individuelles
    - ✅ Public metrics dashboard
    - ✅ Error tracking et alerting
```

### **Événements Trackés**
- **Chat Requests :** Message length, user tier, app context
- **Chat Responses :** Processing time, model used, confidence
- **Errors :** Gemini failures, processing errors, auth failures  
- **Usage :** Daily quotas, rate limiting hits, tier upgrades

### **Métriques Business**
```python
ANALYTICS_METRICS = {
    "daily_requests": "Nombre requêtes quotidiennes",
    "avg_response_time": "Temps réponse moyen IA",
    "user_retention": "Rétention utilisateurs actifs", 
    "tier_conversion": "Taux conversion FREE → PREMIUM",
    "topic_popularity": "Sujets les plus demandés",
    "satisfaction_score": "Score satisfaction conversations"
}
```

## 📡 **Endpoints API Critiques**

### **🤖 Chat Principal**
```python
@app.post("/api/v1/chat", response_model=ChatResponse)  
async def chat_endpoint(
    request: ChatRequest,
    user: IrisUser = Depends(get_authenticated_user)
):
    """
    Endpoint conversation principal avec Alessio
    - Authentification JWT requise
    - Rate limiting par user tier
    - Analytics tracking automatique  
    - Fallback responses si Gemini down
    """
```

### **📚 Topics & Capabilities**
```python
@app.get("/api/v1/topics")
async def get_topics():
    """
    Liste domaines expertise Alessio
    - Reconversion professionnelle
    - CV et profil professionnel
    - Lettres de motivation  
    - Entretiens d'embauche
    - Stratégie carrière
    """
```

### **📊 Analytics Endpoints**
```python
@app.get("/api/v1/metrics")
async def get_public_metrics():
    """Métriques publiques service (anonymisées)"""

@app.get("/api/v1/user/analytics") 
async def get_user_analytics(user: IrisUser = Depends(...)):
    """Analytics personnelles utilisateur (30 jours)"""
```

### **🏥 Health & Status**
```python
@app.get("/health")
async def health_check():
    """
    Health check Railway avec vérifications:
    - Supabase connection
    - Gemini API availability  
    - Auth service status
    - Memory et performance
    """
```

## 🧠 **Fallback & Resilience**

### **Fallback Response System**
```python
FALLBACK_RESPONSES = [
    "Je suis Alessio, votre assistant Phoenix ! Comment puis-je vous aider dans votre reconversion ?",
    "En tant qu'Alessio, je suis spécialisé dans l'accompagnement professionnel. Parlons-en !",
    "Prêt(e) à transformer votre carrière ? Dites-moi vos défis ! 😊"
]

def get_fallback_response(message: str) -> ChatResponse:
    """Réponse de secours si Gemini indisponible"""
    return ChatResponse(
        response=random.choice(FALLBACK_RESPONSES),
        confidence=0.5,
        model_used="fallback",
        suggestions=[...]
    )
```

### **Error Recovery**
- **Gemini Timeout :** Fallback vers réponses pré-définies
- **Rate Limiting :** Messages explicatifs avec upgrade suggestions
- **Auth Failures :** Redirection vers authentification
- **Database Issues :** Mode dégradé sans persistance

## 🗄️ **Base de Données - Supabase Analytics**

### **Tables Analytics**
```sql
-- Événements conversations
iris_events (
    id, user_id, event_type, timestamp,
    metadata, session_id
)

-- Sessions chat avec contexte
iris_chat_sessions (
    id, user_id, session_id, started_at,
    message_count, total_tokens, avg_response_time
)

-- Métriques erreurs et performance  
iris_errors (
    id, error_type, error_message, timestamp,
    user_id, context
)

-- Usage quotidien par utilisateur
user_daily_usage (
    user_id, date, message_count, 
    tier_at_time, last_message_at
)
```

### **Indexes Performance**
```sql
CREATE INDEX idx_iris_events_user_date ON iris_events(user_id, date);
CREATE INDEX idx_chat_sessions_user ON iris_chat_sessions(user_id);  
CREATE INDEX idx_daily_usage_user_date ON user_daily_usage(user_id, date);
```

## 📦 **Dépendances Critiques**

### **Core FastAPI & IA**
```bash
fastapi>=0.104.1                     # Framework API
uvicorn[standard]>=0.24.0            # ASGI server
google-generativeai>=0.3.0          # Google Gemini
openai>=1.3.0                       # OpenAI (backup)
langchain>=0.1.0                    # IA orchestration
```

### **Database & Analytics**
```bash
supabase>=1.2.0                     # Database backend
psycopg2-binary>=2.9.7              # PostgreSQL driver
```

### **Authentication & Security**  
```bash
python-jose[cryptography]>=3.3.0    # JWT handling
passlib[bcrypt]>=1.7.4              # Password hashing
```

### **HTTP & Monitoring**
```bash
httpx>=0.25.2                       # HTTP client async
structlog>=23.2.0                   # Structured logging  
prometheus-client>=0.19.0           # Metrics collection
```

### **Data Processing**
```bash
pandas>=2.0.3                       # Analytics processing
numpy>=1.24.3                       # Numerical operations
```

## 🚀 **Migration vers Monorepo Clean**

### **Adaptations Nécessaires**  
1. **🔄 Service Autonomie**
   - Suppression shared dependencies vers modules locaux
   - Auth standalone complet (pas de shared auth)
   
2. **🔧 Configuration Indépendante**
   - Variables environnement complètes pour Gemini, Supabase
   - Secrets management Railway sécurisé
   
3. **📡 API Integration**
   - Communication REST avec Backend Unifié pour user sync
   - Integration avec Letters/CV pour context sharing
   
4. **🗄️ Analytics Migration**
   - Migration données analytics existantes Supabase
   - Preservation historique conversations utilisateurs

### **Performance Optimization**
- **Caching :** Redis pour responses fréquentes et context
- **Connection Pooling :** Database connections optimisées  
- **Async Processing :** Background jobs pour analytics lourdes
- **CDN :** Assets statiques via CDN

### **Security Hardening**
- **API Keys :** Rotation automatique clés Gemini
- **Rate Limiting :** Protection abuse utilisateurs FREE
- **Input Sanitization :** Validation stricte messages utilisateur
- **Monitoring :** Alertes sécurité et anomalies usage

### **Priority Migration : 🟡 MEDIUM**
Phoenix Iris est un **service d'engagement critique** pour retention utilisateurs mais moins prioritaire revenue que Letters/CV. Migration après stabilisation services core business.

## 🎯 **Production Considerations**

### **Scalability Strategy**
- **Horizontal Scaling :** Multiple instances Railway avec load balancing
- **Database :** Read replicas pour analytics queries lourdes
- **Caching :** Redis cluster pour haute disponibilité
- **Queue System :** Background processing analytics et notifications

### **Monitoring & Alerting**
- **Uptime :** Health checks avec SLA 99.9%
- **Performance :** Latence < 2s pour 95% requêtes
- **Errors :** Alertes slack si error rate > 1%  
- **Business :** Monitoring quotas tiers et conversion rates

### **Cost Optimization**
- **Gemini Usage :** Optimisation prompts pour réduire tokens
- **Database :** Archiving old analytics data
- **Caching :** Réduction calls API répétitifs
- **Resource :** Auto-scaling basé sur traffic patterns

---

📝 **Document généré le :** `{{ datetime.now().isoformat() }}`
🔧 **Prêt pour migration vers :** `phoenix-mono-clean/apps/phoenix-iris-api/`