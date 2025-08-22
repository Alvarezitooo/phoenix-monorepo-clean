# 🚀 Guide Déploiement Railway - Phase 1 Bêta

## 📋 Étapes à Suivre (Dans Ton Terminal)

### 1. Connexion Railway
```bash
cd /Users/mattvaness/Desktop/IA/phoenix-production
railway login
```

### 2. Création du Projet
```bash
railway init
# Choisir "Empty project" et nommer "phoenix-production"
```

### 3. Déploiement des Services (Dans l'ordre)

#### 🌟 Luna Hub (Backend Unified) - Service Principal
```bash
cd apps/phoenix-backend-unified
railway up --service phoenix-backend-unified
cd ../..
```

#### 🎯 Phoenix CV
```bash
cd apps/phoenix-cv  
railway up --service phoenix-cv
cd ../..
```

#### ✉️ Phoenix Letters
```bash
cd apps/phoenix-letters
railway up --service phoenix-letters
cd ../..
```

#### 🌐 Phoenix Website
```bash
cd apps/phoenix-website
railway up --service phoenix-website
cd ../..
```

## 📊 Variables d'Environnement à Configurer

### Pour Luna Hub (Backend Unified):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` 
- `STRIPE_SECRET_KEY` (clé live)
- `JWT_SECRET_KEY`
- `ALLOWED_ORIGINS`
- `WORKERS=2`
- `PORT=8003`

### Pour Phoenix CV:
- `LUNA_HUB_URL` (URL Railway du Luna Hub)
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`
- `PORT=8002`

### Pour Phoenix Letters:
- `LUNA_HUB_URL` (URL Railway du Luna Hub)
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`
- `PORT=8001`

### Pour Phoenix Website:
- `NEXT_PUBLIC_LUNA_HUB_URL` (URL Railway du Luna Hub)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PORT=80`

## 🎯 Après Déploiement
1. Noter les URLs Railway de chaque service
2. Configurer les variables d'environnement
3. Tester les health checks
4. Lancer le seeding bêta

**Prêt ?** Lance la première commande ! 🚀