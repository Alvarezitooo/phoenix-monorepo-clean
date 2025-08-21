# 📋 FICHE PRODUIT : PHOENIX LETTERS

> **Générateur de lettres de motivation IA** avec système freemium, authentification Supabase, et paiements Stripe.

## 🎯 **Essence Fonctionnelle**

Phoenix Letters est un **générateur intelligent de lettres de motivation** alimenté par l'IA Google Gemini. L'application permet aux utilisateurs de créer des lettres personnalisées et optimisées selon leur profil et l'offre d'emploi ciblée.

### **Proposition de Valeur**
- 🤖 **IA Gemini intégrée** - Génération contextualisée et personnalisée
- 💎 **Modèle freemium** - 3 lettres gratuites/mois, premium illimité
- 🎯 **Services premium** - Mirror Match, ATS Analyzer, Smart Coach
- 🌱 **Green AI** - Compensation carbone et métriques écologiques
- 🔄 **Renaissance Protocol** - Recommandations personnalisées évolutives

## 🏗️ **Architecture Réelle**

### **Frontend - Streamlit Multi-onglets**
- **Port :** 8501
- **Framework :** Streamlit avec navigation par onglets
- **Pages :** 4 onglets principaux
  - 🚀 **Générateur** - Interface de création
  - 💎 **Premium** - Gestion abonnements  
  - ⚙️ **Paramètres** - Configuration utilisateur
  - ℹ️ **À propos** - Information service

### **Authentification**
- **Système :** JWT + Supabase backend
- **Manager :** `PhoenixLettersAuthManager`
- **Features :** Login, register, session management, admin debug panel

## 🤖 **IA & Services Métier Critiques**

### **Client Gemini Production** 📍 `infrastructure/ai/gemini_client.py`
```python
class GeminiClient:
    - ✅ Client Gemini production avec retry & rate limiting
    - ✅ Mock client pour développement  
    - ✅ Batch processing pour optimisation coûts
    - ✅ Green metrics tracking empreinte carbone
    - ✅ Safety settings et content filtering
```

### **Services Premium** 📍 `core/services/`

#### **🎯 Mirror Match Service**
- **Fonction :** Adaptation lettre au profil exact du recruteur
- **Avantage :** 3x plus de chances de réussite
- **Tier :** Premium uniquement

#### **🔍 ATS Analyzer Service**  
- **Fonction :** Optimisation pour filtres automatiques
- **Avantage :** Passage systèmes de tri automatique
- **Tier :** Premium uniquement

#### **🧭 Smart Coach Service**
- **Fonction :** Conseils personnalisés temps réel
- **Avantage :** Accompagnement adaptatif
- **Tier :** Premium uniquement

#### **📈 Trajectory Builder Service**
- **Fonction :** Construction parcours professionnel cohérent
- **Avantage :** Vision long terme carrière
- **Tier :** Premium uniquement

#### **🎨 RAG Personalization Service**
- **Fonction :** Personnalisation avancée basée sur historique
- **Avantage :** Amélioration continue suggestions
- **Tier :** Premium uniquement

### **Parsers & Analyseurs**

#### **📄 Job Offer Parser**
- **Fonction :** Extraction automatique données offres emploi
- **Input :** URL offre ou texte collé
- **Output :** Structuration requirements, skills, contexte

#### **📊 Letter Analyzer** 
- **Fonction :** Analyse qualité lettres générées
- **Métriques :** Score ATS, lisibilité, personnalisation
- **Feedback :** Suggestions amélioration

#### **📈 User Limit Manager**
- **Fonction :** Gestion quotas freemium
- **Règles :** 3 lettres/mois FREE, illimité PREMIUM
- **Reset :** Quotas mensuels automatiques

## 💳 **Système de Paiement - Stripe Intégré**

### **Configuration Produits**
```bash
STRIPE_LETTERS_PRICE_ID=price_xxx     # Abonnement Letters seul
STRIPE_CV_PRICE_ID=price_xxx          # Abonnement CV seul  
STRIPE_BUNDLE_PRICE_ID=price_xxx      # Bundle complet Phoenix
```

### **Tiers Utilisateurs**
- **🆓 FREE** 
  - 3 lettres par mois
  - Générateur de base
  - Templates standards
  
- **💎 PREMIUM**
  - Lettres illimitées
  - Tous services avancés (Mirror Match, ATS, Coach, etc.)
  - Templates premium
  - Support prioritaire

### **Flow Paiement**
1. Utilisateur hit limite FREE
2. Modal upgrade vers Premium  
3. Redirection Stripe Checkout
4. Webhook confirmation paiement
5. Upgrade automatique tier utilisateur

## 🗄️ **Base de Données - Supabase PostgreSQL**

### **Tables Critiques**
- **`users`** - Authentification + profils utilisateurs
- **`letters_generated`** - Historique lettres avec métadonnées
- **`user_usage_limits`** - Tracking quotas et limites
- **`renaissance_data`** - Données Renaissance Protocol
- **`green_metrics`** - Métriques empreinte carbone
- **`payment_subscriptions`** - Gestion abonnements Stripe

### **Relations Clés**
- User → Letters (1:N)
- User → Usage Limits (1:1) 
- User → Renaissance Data (1:1)
- User → Subscriptions (1:N)

## 🔐 **Authentification & Sécurité**

### **PhoenixLettersAuthManager** 📍 `auth_manager.py`
```python
Features:
- ✅ JWT tokens (access + refresh) 
- ✅ Supabase backend integration
- ✅ Session management automatique
- ✅ Admin debug panel
- ✅ User tier management
- ✅ Password encryption (bcrypt)
```

### **Security Stack**
- **Input Validation :** Tous inputs utilisateur validés
- **SQL Protection :** Requêtes paramétrées exclusively  
- **XSS Prevention :** Sanitization HTML automatique
- **Rate Limiting :** Protection DoS par utilisateur
- **HTTPS Enforcement :** TLS/SSL obligatoire production

## 🌍 **Features Spéciales**

### **🔄 Renaissance Protocol** 📍 `core/services/renaissance_integration_service.py`
- **Fonction :** Service recommandations personnalisées évolutives
- **Logique :** Analyse patterns usage → suggestions proactives
- **Trigger :** Bannière contextuelle selon profil utilisateur
- **Data :** Stockage préférences et patterns comportementaux

### **🌱 Green AI Metrics** 📍 `infrastructure/monitoring/phoenix_green_metrics.py`
- **Fonction :** Tracking empreinte carbone requêtes IA
- **Métriques :** CO2 estimé par requête Gemini
- **Compensation :** Calcul contribution Solidarity Ecological Fund
- **Transparence :** Dashboard impact environnemental

### **💚 Solidarity Ecological Fund** 📍 `core/services/solidarity_ecological_fund.py`
- **Fonction :** Compensation carbone automatique
- **Calcul :** Percentage revenus → investissement vert
- **Transparence :** Reporting impact utilisateurs
- **Partenariats :** Projets certifiés reforestation/énergies renouvelables

## 📦 **Dépendances Critiques**

### **Core Dependencies**
```bash
streamlit>=1.30.0                    # Interface utilisateur
google-generativeai>=0.3.2          # IA Gemini  
supabase>=2.0.0                     # Database backend
stripe>=8.0.0                       # Paiements
```

### **Security & Auth** 
```bash
bcrypt>=4.0.0                       # Hash passwords
pyjwt[cryptography]>=2.8.0          # JWT tokens
cryptography>=41.0.0                # Crypto operations
passlib[bcrypt]>=1.7.4              # Password handling
```

### **Document Processing**
```bash
PyPDF2>=3.0.0                       # PDF parsing
python-docx>=1.1.0                  # DOCX handling
bleach>=6.0.0                       # HTML sanitization
```

### **Monitoring & Performance**
```bash
tenacity>=8.0.0                     # Retry logic
pandas>=2.0.0                       # Data processing
plotly>=5.15.0                      # Visualizations
```

### **Packages Vendorisés (Locaux)**
```bash
-e ./vendor/phoenix-shared-models    # Modèles de données communs
-e ./vendor/phoenix-shared-auth      # Authentification partagée
```

## 🚀 **Migration vers Monorepo Clean**

### **Adaptations Nécessaires**
1. **🔄 Suppression Shared Dependencies**
   - Remplacer imports `phoenix-shared-*` par REST calls
   - Créer clients HTTP pour backend unifié
   
2. **🔧 Configuration Autonome**  
   - Variables d'environnement complètes dans `.env`
   - Auth JWT standalone (pas de shared auth manager)
   
3. **📡 Communication REST**
   - Calls API vers `phoenix-backend-unified` pour données
   - Calls API vers `phoenix-iris-api` pour Alessio integration
   
4. **🗄️ Database Autonomie**
   - Connexion directe Supabase depuis le service
   - Pas de shared database connection

### **Priority Migration : 🔥 HIGH**
Phoenix Letters est le service **core business** avec la logique métier la plus avancée et les revenus Stripe. Migration prioritaire critique.

---

📝 **Document généré le :** `{{ datetime.now().isoformat() }}`
🔧 **Prêt pour migration vers :** `phoenix-mono-clean/apps/phoenix-letters/`