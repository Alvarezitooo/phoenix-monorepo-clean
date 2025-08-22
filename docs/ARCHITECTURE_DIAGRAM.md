# 🏗️ Phoenix Ecosystem - Architecture Cible v1.0

## 🌙 Schéma d'Architecture Luna Hub Central

```mermaid
graph TB
    %% Utilisateurs
    User[👤 Utilisateur Phoenix]
    
    %% Frontend Applications
    subgraph "🌐 Frontend Applications"
        Website[🌅 Phoenix Website<br/>Next.js - Port 3000]
        LettersFE[📝 Phoenix Letters<br/>React/Vite - Port 5173]
        CVFE[📊 Phoenix CV<br/>React/Vite - Port 5174]
    end
    
    %% Backend Hub Central
    subgraph "🌙 Luna Hub Central"
        LunaHub[🌙 Phoenix Backend Unified<br/>FastAPI - Port 8003]
        
        subgraph "📦 Luna Core Modules"
            EnergyMgr[⚡ Energy Manager]
            EventStore[📚 Event Store]
            AuthMgr[🔐 Auth Manager]
            BillingMgr[💳 Billing Manager]
        end
    end
    
    %% Backend Applications (Satellites)
    subgraph "🛰️ Backend Satellites"
        LettersBE[📝 Phoenix Letters<br/>FastAPI - Port 8001]
        CVBE[📊 Phoenix CV<br/>FastAPI - Port 8002]
    end
    
    %% Services Externes
    subgraph "☁️ Services Externes"
        Supabase[(🗄️ Supabase<br/>Event Store + DB)]
        Stripe[💳 Stripe<br/>Billing]
        Gemini[🤖 Google Gemini<br/>IA]
    end
    
    %% Connexions Utilisateur -> Frontend
    User --> Website
    User --> LettersFE
    User --> CVFE
    
    %% Connexions Frontend -> Backend Satellites UNIQUEMENT
    Website -.->|Auth + Billing<br/>Sprint 4| LunaHub
    LettersFE -->|Letters API<br/>avec Luna| LettersBE
    CVFE -->|CV API<br/>avec Luna| CVBE
    
    %% Connexions Backend Satellites -> Luna Hub (Orchestration)
    LettersBE -->|Energy + Events<br/>Sprint 2| LunaHub
    CVBE -->|Energy + Events<br/>Sprint 2| LunaHub
    
    %% Connexions Luna Hub -> Services
    LunaHub --> Supabase
    LunaHub --> Stripe
    LunaHub --> Gemini
    
    %% Connexions internes Luna Hub
    EnergyMgr --> EventStore
    AuthMgr --> EventStore
    BillingMgr --> EnergyMgr
    
    %% Styles
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef luna fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef external fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef user fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class Website,LettersFE,CVFE frontend
    class LettersBE,CVBE backend
    class LunaHub,EnergyMgr,EventStore,AuthMgr,BillingMgr luna
    class Supabase,Stripe,Gemini external
    class User user
```

## 🚀 Flux de Données Luna

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant FE as 🌐 Frontend App
    participant BE as 🛰️ Backend Satellite
    participant LH as 🌙 Luna Hub
    participant SB as 🗄️ Supabase
    
    Note over U,SB: Flux Simplifié avec Backend Orchestrateur
    
    U->>FE: Action (ex: générer lettre)
    FE->>BE: Action métier (generate letter)
    
    BE->>LH: POST /luna/energy/can-perform
    LH-->>BE: {can_perform: true, energy_required: 15}
    
    alt Énergie suffisante
        BE->>LH: POST /luna/energy/consume
        LH->>SB: Enregistrer transaction + événement
        LH-->>BE: Énergie consommée
        BE->>BE: Traitement IA
        BE-->>FE: Résultat + Énergie restante
        FE-->>U: Résultat final
    else Énergie insuffisante
        BE-->>FE: {error: "insufficient_energy", required_pack: "cafe_luna"}
        FE-->>U: Proposition d'achat énergie
        U->>FE: Achat pack Luna
        FE->>BE: Retry avec purchase
        BE->>LH: POST /luna/energy/purchase
        LH->>Stripe: Traitement paiement
        LH->>SB: Enregistrer achat
        LH-->>BE: Énergie rechargée
        BE->>BE: Traitement IA maintenant possible
        BE-->>FE: Résultat + Énergie restante
    end
```

## 📋 Mapping des Ports

| Service | Port | Description | Sprint |
|---------|------|-------------|--------|
| 🌙 **Luna Hub** | **8003** | **Hub central** | **✅ Sprint 1** |
| 📝 Phoenix Letters | 8001 | Backend Letters | Existant |
| 📊 Phoenix CV | 8002 | Backend CV | Existant |
| 🌅 Phoenix Website | 3000 | Website Next.js | Sprint 4 |
| 📝 Letters Frontend | 5173 | React/Vite Letters | Existant |
| 📊 CV Frontend | 5174 | React/Vite CV | Existant |

## 🌙 API Luna Hub - Endpoints

### ⚡ Energy Management
```
POST /luna/energy/check           - Vérifier solde énergie
POST /luna/energy/can-perform     - Vérifier action possible  
POST /luna/energy/consume         - Consommer énergie
POST /luna/energy/refund          - Rembourser énergie
POST /luna/energy/purchase        - Acheter pack énergie
GET  /luna/energy/transactions/{user_id} - Historique
GET  /luna/energy/analytics/{user_id}    - Analytics
```

### 📚 Event Store (Sprint 2)
```
POST /luna/events                 - Créer événement
GET  /luna/events/{user_id}       - Récupérer événements bruts
GET  /luna/narrative/{user_id}    - Capital Narratif (Event Sourcing)
```

**🎯 Important**: `/luna/narrative/{user_id}` reconstruit TOUJOURS le Capital Narratif en temps réel depuis l'Event Store Supabase. Aucun état intermédiaire stocké - pure logique Event Sourcing.

### 🔐 Auth Central (Sprint 3)
```
POST /auth/login                  - Connexion
POST /auth/register               - Inscription  
GET  /auth/profile                - Profil utilisateur
```

### 💳 Billing (Sprint 4)
```
POST /billing/create-intent       - Créer intention paiement
POST /billing/confirm-payment     - Confirmer paiement
GET  /billing/history/{user_id}   - Historique achats
```

## 🔄 Grille de Consommation Énergie

| Action | Énergie | App Source |
|--------|---------|------------|
| **Actions Simples (5-10%)** |
| Conseil rapide | 5% | Letters/CV |
| Correction ponctuelle | 5% | Letters/CV |
| Format lettre | 8% | Letters |
| **Actions Moyennes (10-20%)** |
| Lettre motivation | 15% | Letters |
| Optimisation CV | 12% | CV |
| Analyse offre | 10% | Letters/CV |
| **Actions Complexes (20-40%)** |
| Analyse CV complète | 25% | CV |
| Mirror Match | 30% | CV |
| Stratégie candidature | 35% | Letters |
| **Actions Premium (35-50%)** |
| Audit complet profil | 45% | CV |
| Plan reconversion | 50% | Letters |
| Simulation entretien | 40% | CV |

## 💰 Packs Énergie Luna

| Pack | Prix | Énergie | Bonus | Comportement |
|------|------|---------|-------|-------------|
| ☕ Café Luna | 2,99€ | 100% | +10% premier achat | Décompte standard |
| 🥐 Petit-déj Luna | 5,99€ | 100% | - | Décompte standard |
| 🍕 Repas Luna | 9,99€ | 100% | - | Décompte standard |
| 🌙 Luna Unlimited | 29,99€/mois | ∞ | - | **Pas de décompte, mais événements toujours enregistrés** |

### 🎯 Règles Spéciales Luna Unlimited (Oracle)

1. **Énergie** : Aucun décompte d'énergie lors des actions
2. **Événements** : TOUJOURS enregistrer dans l'Event Store pour Capital Narratif
3. **Analytics** : Actions trackées pour API Iris même sans consommation
4. **can_perform** : Retourne toujours `true` pour toute action

## 🏗️ État par Sprint

### ✅ Sprint 0 (Actuel)
- [x] Structure phoenix-backend-unified
- [x] Modèles énergie Luna
- [x] Energy Manager + APIs
- [x] Schema Supabase préparé
- [x] Diagramme architecture

### ⏳ Sprint 1 (Suivant)  
- [ ] Tests unitaires Energy Manager
- [ ] Documentation API Swagger
- [ ] Validation endpoints

### 📋 Sprint 2
- [ ] Intégration Supabase Event Store
- [ ] Middleware sécurité
- [ ] Logs structurés JSON

### 📋 Sprint 3
- [ ] Connexion Letters/CV au Hub
- [ ] Tests d'intégration
- [ ] Health checks

### 📋 Sprint 4  
- [ ] Billing Stripe
- [ ] Frontend Website
- [ ] Cycle économique complet

### 📋 Sprint 5
- [ ] Déploiement Railway
- [ ] CI/CD GitHub Actions
- [ ] Beta users

---

**🔥 Architecture Luna Hub opérationnelle - Prête pour Sprint 1 !** 🌙