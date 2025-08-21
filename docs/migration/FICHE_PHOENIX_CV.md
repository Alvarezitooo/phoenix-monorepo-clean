# 📋 FICHE PRODUIT : PHOENIX CV

> **Créateur de CV IA** avec optimisation ATS, templates professionnels, et système freemium intégré.

## 🎯 **Essence Fonctionnelle**

Phoenix CV est un **créateur intelligent de CV alimenté par l'IA** qui permet aux utilisateurs de générer des CV professionnels optimisés pour les systèmes ATS (Applicant Tracking System) et adaptés aux recruteurs humains.

### **Proposition de Valeur**
- 🤖 **IA Gemini sécurisée** - Génération CV avec validation sécurisée
- 📄 **Optimisation ATS** - Passage garantie filtres automatiques  
- 🎨 **Templates professionnels** - Modèles premium et personnalisables
- 🔍 **Mirror Match Engine** - Adaptation profil recruteur ciblé
- 🏗️ **AI Trajectory Builder** - Construction parcours cohérent
- 🛡️ **Sécurité renforcée** - Stack sécurisé complet input validation

## 🏗️ **Architecture Réelle**

### **Frontend - Streamlit avec Navigation Sidebar**
- **Port :** 8502 (différencié de Letters)
- **Framework :** Streamlit avec sidebar navigation
- **Pages :** 5 pages principales
  - 📊 **Dashboard** - Tableau de bord et métriques
  - ✨ **Créateur** - Interface génération CV
  - 📋 **Templates** - Galerie modèles professionnels  
  - 📚 **Historique** - CV créés et versions
  - ⚙️ **Paramètres** - Configuration compte

### **Authentification Unifiée**
- **Système :** Même auth que Phoenix Letters (JWT + Supabase)
- **Manager :** `PhoenixCVAuthManager` 
- **Intégration :** Auth partagée ecosystem Phoenix
- **Tiers :** FREE (fonctions de base) / PREMIUM (templates + optimisations)

## 🤖 **IA & Services Métier Critiques**

### **Client Gemini Sécurisé** 📍 `phoenix_cv/services/secure_gemini_client.py`
```python
class SecureGeminiClient:
    - ✅ Client Gemini avec rate limiting avancé
    - ✅ Cache optimizer intégré (phoenix-shared-ai)
    - ✅ Security validation sur tous inputs
    - ✅ Monitoring & logging sécurisé
    - ✅ Error handling avec fallbacks
    - ✅ Threading pour performance
```

### **Services Spécialisés Premium** 📍 `phoenix_cv/services/`

#### **🔒 Secure CV Parser**
- **Fonction :** Extraction sécurisée données CV existants
- **Formats :** PDF, DOCX, TXT avec validation
- **Sécurité :** Sanitization complète, virus scanning
- **Output :** Données structurées pour optimisation

#### **🎯 ATS Optimizer**
- **Fonction :** Optimisation pour systèmes de filtrage automatique
- **Analyse :** Mots-clés, structure, formatage
- **Score :** Note ATS 0-100 avec recommandations
- **Tier :** Premium feature exclusive

#### **🎭 Mirror Match Engine**  
- **Fonction :** Adaptation CV au profil exact recruteur ciblé
- **Data :** Analyse offre emploi + profil LinkedIn recruteur
- **Personnalisation :** Adaptation vocabulaire, compétences, expérience
- **ROI :** 3x plus de chances callback

#### **🏗️ AI Trajectory Builder**
- **Fonction :** Construction parcours professionnel cohérent
- **Logique :** Analyse expérience → projections carrière
- **Suggestions :** Formations, certifications, transitions
- **Visualisation :** Timeline interactive évolution

#### **🧭 Smart Coach**
- **Fonction :** Conseils personnalisés temps réel
- **Contexte :** Analyse CV + objectifs utilisateur
- **Recommandations :** Améliorations spécifiques, lacunes
- **Mode :** Coaching adaptatif selon niveau utilisateur

#### **🎨 Template Engine**
- **Fonction :** Génération templates dynamiques personnalisés
- **Styles :** Moderne, Créatif, Tech, Executive
- **Adaptation :** Auto-ajustement contenu utilisateur
- **Export :** PDF haute qualité, formats print

### **Handlers & Parsers Sécurisés**

#### **🛡️ Secure File Handler**
- **Upload :** PDF/DOCX sécurisé avec validation MIME
- **Scanning :** Anti-virus et malware detection
- **Size Limits :** 5MB max, timeout protection
- **Storage :** Temporary encrypted storage

#### **🔄 Renaissance CV Service**
- **Fonction :** Recommandations évolutives basées usage
- **Learning :** Analyse patterns → suggestions personnalisées
- **Proactivité :** Notifications amélioration CV
- **Integration :** Renaissance Protocol ecosystem Phoenix

#### **🌉 Phoenix Ecosystem Bridge** 
- **Fonction :** Intégration avec autres services Phoenix
- **Sync :** Données profil Letters ↔ CV ↔ Backend
- **Communication :** REST APIs inter-services
- **Cohérence :** Expérience utilisateur unifiée

## 🔐 **Sécurité Renforcée - Security Stack Complet**

### **Input Validation & Sanitization** 📍 `phoenix_cv/utils/secure_validator.py`
```python
class SecureValidator:
    - ✅ Validation tous inputs utilisateur
    - ✅ Regex patterns sécurisés
    - ✅ File type verification 
    - ✅ Content length limits
    - ✅ SQL injection prevention
```

### **HTML Sanitization** 📍 `phoenix_cv/utils/html_sanitizer.py`
- **Fonction :** Protection XSS sur tout contenu HTML
- **Whitelist :** Tags autorisés uniquement
- **Attributes :** Filtrage attributs dangereux
- **Output :** HTML sécurisé pour rendering

### **Rate Limiting** 📍 `phoenix_cv/utils/rate_limiter.py`
- **Protection :** DoS et abuse prevention
- **Granularité :** Par utilisateur, par IP, par action
- **Tiers :** Limites différentes FREE vs PREMIUM
- **Redis :** Backend distributeur pour scale

### **Secure Crypto** 📍 `phoenix_cv/utils/secure_crypto.py`
- **Encryption :** Données sensibles chiffrées
- **Keys :** Rotation automatique clés
- **Hashing :** SHA-256 pour données non-réversibles
- **Storage :** Encryption at rest

### **Session Management** 📍 `phoenix_cv/services/secure_session_manager.py`
- **Sessions :** Timeout automatique
- **Cleanup :** Purge sessions expirées
- **Security :** Validation tokens à chaque requête
- **Monitoring :** Détection sessions suspectes

## 💳 **Système de Paiement - Stripe Unifié**

### **Configuration Partagée avec Letters**
```bash
# Même configuration Stripe que Letters
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_CV_PRICE_ID=price_xxx          # Abonnement CV seul
STRIPE_BUNDLE_PRICE_ID=price_xxx      # Bundle Letters + CV
```

### **Tiers & Features**
- **🆓 FREE**
  - CV de base avec template moderne  
  - 1 CV par mois
  - Export TXT uniquement
  
- **💎 PREMIUM**
  - Templates avancés (Créatif, Tech, Executive)
  - ATS Optimizer avec score
  - Mirror Match Engine
  - AI Trajectory Builder
  - Smart Coach personnalisé
  - Export PDF haute qualité
  - Historique illimité

## 🗄️ **Base de Données - Supabase PostgreSQL**

### **Tables Spécialisées CV**
- **`cv_profiles`** - Profils CV utilisateurs avec données structurées
- **`cv_generated`** - Historique CV créés avec métadonnées
- **`cv_templates`** - Templates personnalisés utilisateur
- **`ats_scores`** - Historique scores optimisation ATS
- **`trajectory_data`** - Données parcours professionnel
- **`cv_analytics`** - Métriques usage et performance

### **Relations & Indexes**
- User → CV Profiles (1:N)
- CV Profile → Generated CVs (1:N)  
- User → Templates (1:N)
- Performance indexes sur user_id, created_at

## 📦 **Dépendances Critiques**

### **Core Framework**
```bash
streamlit>=1.28.0                    # Interface utilisateur
google-generativeai>=0.3.0          # IA Gemini
openai>=1.3.0                       # IA OpenAI (fallback)
```

### **Document Processing**
```bash
python-docx>=0.8.11                 # DOCX parsing
PyPDF2>=3.0.1                       # PDF handling  
openpyxl>=3.1.2                     # Excel support
pillow>=10.0.0                      # Image processing
reportlab>=4.0.4                    # PDF generation
```

### **Security & Crypto**
```bash
cryptography>=41.0.3                # Encryption
bleach>=6.0.0                       # HTML sanitization
python-jose>=3.3.0                  # JWT handling
bcrypt>=4.0.1                       # Password hashing
```

### **Database & Storage**
```bash
supabase>=1.0.4                     # Database backend
psycopg2-binary>=2.9.7              # PostgreSQL driver
redis>=4.6.0                        # Caching & rate limiting
```

### **Data Processing**
```bash
pandas>=2.0.3                       # Data manipulation
numpy>=1.24.3                       # Numerical processing
```

### **Packages Vendorisés (Locaux)**
```bash
-e ./vendor/phoenix-shared-models    # Modèles communs
-e ./vendor/phoenix-shared-auth      # Auth partagée
-e ./vendor/phoenix-shared-ai        # Cache optimizer IA
```

## 🚀 **Migration vers Monorepo Clean**

### **Adaptations Nécessaires**
1. **🔄 Suppression Shared Dependencies**
   - Remplacer `phoenix-shared-*` par services autonomes
   - Créer HTTP clients pour communication inter-services
   
2. **🔧 Port Management**
   - Port 8502 pour éviter conflit avec Letters (8501)
   - Configuration environnement spécifique
   
3. **📡 REST Communication**
   - API calls vers Backend Unifié pour user data
   - API calls vers Iris pour suggestions Alessio
   - Synchronisation données profil cross-services
   
4. **🗄️ Database Isolation**
   - Connexion Supabase dédiée service CV
   - Tables spécifiques sans shared schemas
   - Migration données existantes

### **Security Migration Critical**
- **Input Validation** : Tout le stack sécurisé doit être préservé
- **File Upload** : Secure file handler critical pour production
- **Rate Limiting** : Protection DoS essentielle  
- **Encryption** : Données sensibles CV chiffrées

### **Priority Migration : 🔥 HIGH**
Phoenix CV est le **second service core business** avec logique métier avancée et sécurité critique. Migration prioritaire après Letters.

## 🎯 **Spécificités Techniques**

### **Template System**
- **Storage :** Templates stockés base64 en DB
- **Rendering :** HTML/CSS → PDF via ReportLab
- **Customization :** Variables template dynamiques
- **Preview :** Real-time preview avant export

### **ATS Optimization Logic**
- **Keywords :** Extraction automatique mots-clés offre
- **Density :** Calcul densité keywords optimal (2-3%)
- **Structure :** Validation format ATS-friendly
- **Score :** Algorithme scoring 100 points max

### **Performance Considerations**
- **Caching :** Cache Redis pour templates et CV fréquents
- **Async :** Processing asynchrone génération PDF
- **Queue :** Background jobs pour optimisations lourdes
- **CDN :** Assets statiques via CDN pour performance

---

📝 **Document généré le :** `{{ datetime.now().isoformat() }}`
🔧 **Prêt pour migration vers :** `phoenix-mono-clean/apps/phoenix-cv/`