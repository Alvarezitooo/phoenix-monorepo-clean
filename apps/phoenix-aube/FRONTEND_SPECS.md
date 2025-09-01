# 🌅 Phoenix Aube Frontend - Bolt.new Specifications

## 🎯 Vue d'ensemble
**Phoenix Aube** est un service de découverte carrière avec évaluation psychologique avancée. Interface moderne React/Next.js pour assessment interactif et recommandations personnalisées.

## 🏗️ Architecture Technique

### Stack Recommandée
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Tailwind CSS + shadcn/ui
- **State**: Zustand ou React Query
- **Auth**: NextAuth.js
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📡 API Backend (Déjà Prête)

### Base URL
```
Production: https://phoenix-aube-backend.railway.app
```

### Endpoints Principaux
```typescript
// Health check
GET /aube/health

// Assessment complet (avec Luna Hub)
POST /aube/career-match-luna
Body: {
  user_id: string,
  signals: AubeSignals,
  context?: object
}

// Statut utilisateur
GET /aube/assessment/status/{user_id}

// Recommandations carrière
GET /aube/recommendations/{user_id}?limit=10&include_analysis=true

// Base métiers
GET /aube/careers/database?category=&limit=50
```

### Authentification
```typescript
Headers: {
  "Authorization": "Bearer TOKEN_LUNA_HUB",
  "Content-Type": "application/json"
}
```

## 🎨 Interface Utilisateur

### 1. Page d'Accueil (`/`)
```typescript
// Hero Section avec value proposition claire
- Titre: "Découvrez votre carrière idéale"
- Sous-titre: "Assessment psychologique professionnel + IA"
- CTA: "Commencer mon assessment" → `/assessment`
- Témoignages/social proof
- Métiers trending du jour
```

### 2. Assessment Interactif (`/assessment`)
```typescript
// Wizard multi-étapes avec progress bar
interface AssessmentStep {
  id: number
  title: string
  description: string
  questions: Question[]
  progress: number // 0-100
}

interface Question {
  id: string
  type: 'scale' | 'choice' | 'ranking'
  text: string
  options?: string[]
  required: boolean
}

// Exemple questions par dimension:
// 1. Appétences (People vs Data)
// 2. Valeurs professionnelles 
// 3. Environnement de travail
// 4. Autonomie souhaitée
// 5. Créativité/Innovation
// 6. Stabilité vs Changement
// 7. Impact social/environnemental
// 8. Apprentissage continu
```

### 3. Résultats Assessment (`/results`)
```typescript
interface AssessmentResults {
  personality_profile: {
    dimension: string
    score: number // 0-100
    description: string
  }[]
  career_matches: {
    title: string
    compatibility_score: number
    description: string
    required_skills: string[]
    transition_difficulty: 'facile' | 'modéré' | 'élevé'
    salary_range: string
    growth_outlook: string
  }[]
  insights: string[]
}

// UI: Cards avec scores visuels, graphiques radar
// Export PDF/partage social
```

### 4. Profil Utilisateur (`/profile`)
```typescript
// Dashboard personnel
- Status assessment (complété/en cours)
- Historique recommandations
- Évolution profil psychologique
- Settings et préférences
- Gestion énergie Luna Hub
```

### 5. Explorateur Métiers (`/careers`)
```typescript
// Base de données métiers avec filtres
- Recherche par nom/compétences
- Filtres: secteur, salaire, autonomie, etc.
- Fiches métier détaillées
- Compatibilité personnelle si assessment fait
```

## 🎭 UX/UI Guidelines

### Design System
```css
/* Phoenix Aube Brand Colors */
--primary: #2563eb    /* Bleu profond */
--secondary: #f97316  /* Orange énergique */
--accent: #8b5cf6     /* Purple mystique */
--success: #10b981    /* Vert validation */
--warning: #f59e0b    /* Jaune attention */
--dark: #1e293b       /* Gris sombre */
--light: #f8fafc      /* Gris clair */

/* Spacing Scale */
--space-xs: 0.5rem
--space-sm: 1rem  
--space-md: 1.5rem
--space-lg: 2rem
--space-xl: 3rem
```

### Components Essentiels
```typescript
// ProgressBar - Assessment wizard
<ProgressBar current={3} total={8} />

// ScoreCircle - Compatibility scores
<ScoreCircle score={87} size="lg" label="Compatibilité" />

// CareerCard - Recommandation métier
<CareerCard 
  title="Data Scientist" 
  score={92}
  difficulty="modéré"
  onExplore={() => {}}
/>

// DimensionRadar - Profil psychologique
<DimensionRadar data={personalityData} />

// EnergyMeter - Intégration Luna Hub
<EnergyMeter current={42} required={12} />
```

## 🔌 Intégration Luna Hub

### Gestion Énergie
```typescript
// Vérification avant actions payantes
const checkEnergy = async (action: string) => {
  const response = await fetch('/aube/energy/check', {
    method: 'POST',
    body: JSON.stringify({ user_id, action_name: action })
  })
  
  if (response.status === 402) {
    // Redirection achat énergie
    window.location.href = 'https://luna-hub.phoenix-ia.com/energy/buy'
  }
}

// Messages utilisateur
"⚡ 12 points d'énergie requis pour cette analyse"
"🔋 Énergie insuffisante - Rechargez votre compte"
```

### États d'Erreur
```typescript
// Gestion 402 Payment Required
<EnergyRequired 
  required={12} 
  current={5}
  onRecharge={() => redirectToLunaHub()}
/>

// Gestion 401 Unauthorized  
<AuthExpired onReconnect={() => refreshToken()} />
```

## 🚀 Pages Prioritaires (Phase 1)

1. **Landing page** - Hook utilisateur
2. **Assessment wizard** - Cœur du service
3. **Résultats** - Value delivery
4. **Auth/Login** - Intégration Luna Hub

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile UX
- Assessment: questions une par une
- Swipe navigation
- Bottom sheet pour détails
- Touch-friendly buttons (44px min)

## 🎨 Assets Nécessaires

### Images
- Hero illustration (career discovery theme)
- Assessment icons (8 dimensions)
- Career illustrations par secteur
- Success/celebration graphics

### Animations
- Progress transitions
- Score reveals
- Card hover effects
- Loading states

## 🔧 Configuration

### Environment Variables
```bash
# API Backend
NEXT_PUBLIC_API_URL=https://phoenix-aube-backend.railway.app
NEXT_PUBLIC_LUNA_HUB_URL=https://luna-hub.phoenix-ia.com

# Auth
NEXTAUTH_URL=https://aube.phoenix-ia.com
NEXTAUTH_SECRET=your-secret-key

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 🚀 Déploiement

### Plateforme: Railway
- Auto-deploy depuis GitHub
- Custom domain: `aube.phoenix-ia.com`
- Environment variables via Railway dashboard

---

## 📋 Checklist Bolt.new

### ✅ Prêt à implémenter:
- [ ] Setup Next.js 14 + Tailwind + shadcn/ui
- [ ] Page d'accueil avec hero section
- [ ] Assessment wizard (8 étapes)
- [ ] Intégration API Phoenix Aube
- [ ] Gestion auth Luna Hub
- [ ] Page résultats avec graphiques
- [ ] Responsive design mobile
- [ ] États d'erreur énergies
- [ ] Deploy Railway

### 🎯 Objectif:
**Interface moderne et engageante** qui transforme l'assessment psychologique en expérience utilisateur fluide et motivante.

---

*Ready for Bolt.new! 🚀*