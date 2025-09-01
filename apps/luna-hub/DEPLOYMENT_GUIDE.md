# 🚀 PHOENIX PRODUCTION DEPLOYMENT GUIDE

## 🎯 STATUT: PRODUCTION READY ✅

**Date:** 31 Août 2025  
**Version:** v2.0.0 Luna Session Zero  
**Environnement:** Railway Production

---

## 📋 CHECKLIST PRÉREQUIS DÉPLOIEMENT

### ✅ Variables d'Environnement Railway (OBLIGATOIRES)

```env
# DATABASE & AUTH
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET_KEY=your_super_secret_jwt_key_32_chars_minimum

# IA SERVICES  
GOOGLE_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_fallback  # Optionnel

# PAYMENTS
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_UNLIMITED=price_your_unlimited_plan_id

# REDIS CACHE (Recommandé)
REDIS_URL=redis://your-redis-instance:6379/0

# PRODUCTION CONFIG
ENVIRONMENT=production
LOG_LEVEL=warning
```

### ✅ Systèmes Validés

- **🌙 Luna Core:** Gemini API + Fallback système ✅
- **⚡ Energy System:** Déduction réelle + Bonus célébrations ✅  
- **🔒 Security:** Rate limiting + CORS + Headers ✅
- **📊 Monitoring:** Health checks + Metrics ✅
- **🏗️ Infrastructure:** Multi-stage Docker + Circuit breakers ✅

---

## 🚀 COMMANDES DÉPLOIEMENT

### Option 1: Auto-deploy via Git (Recommandé)
```bash
git push origin main
# Railway détecte automatiquement et déploie
```

### Option 2: Railway CLI
```bash
railway login
railway up --service phoenix-backend-unified
```

### Option 3: Manual Railway Dashboard
1. Connecter repo GitHub/GitLab
2. Définir variables d'environnement
3. Deploy automatique sur push main

---

## 🏥 VÉRIFICATIONS POST-DÉPLOIEMENT

### Tests Critiques
```bash
# Health Check
curl https://your-app.railway.app/health

# Luna Chat Test
curl -X POST https://your-app.railway.app/luna/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Salut Luna!", "user_id":"test"}'

# Energy System Test  
curl https://your-app.railway.app/billing/energy/status/test-user
```

### Métriques à Surveiller
- **Latence API:** < 2000ms
- **Taux d'erreur:** < 1%
- **Luna classification:** > 95% précision
- **Energy transactions:** 100% atomicité

---

## 🛠️ MAINTENANCE & DÉPANNAGE

### Logs Essentiels
```bash
# Railway CLI
railway logs --service phoenix-backend-unified

# Filtres utiles
railway logs | grep "ERROR"
railway logs | grep "Luna"
railway logs | grep "Energy"
```

### Points de Contrôle
1. **Gemini API:** Vérifier quotas et clés actives
2. **Supabase:** Connexions pool + RLS policies
3. **Redis:** Cache hit rate > 80%
4. **Stripe:** Webhooks delivery status

### Rollback d'Urgence
```bash
# Via Railway CLI
railway rollback --service phoenix-backend-unified

# Via Dashboard: Deployments > Previous version > Deploy
```

---

## 📞 CONTACTS D'URGENCE

**Systèmes Critiques:**
- Supabase: Dashboard incidents
- Railway: Status page
- Stripe: Dashboard webhook logs
- Gemini API: Google Cloud Console

**Alertes configurées pour:**
- Latence > 5s (critique)
- Erreurs > 5% (high)  
- Energy processing > 1s (medium)
- Redis latence > 100ms (medium)

---

## 🎊 POST-LANCEMENT

### Métriques Business à Tracker
- Nouvelles inscriptions utilisateurs
- Sessions Luna quotidiennes
- Énergie consommée vs achetée
- Taux conversion Unlimited
- Satisfaction utilisateur (feedback)

### Optimisations Futures
- [ ] CDN pour assets statiques
- [ ] Database indexing avancé
- [ ] Scaling automatique > 1000 users
- [ ] Monitoring business intelligence
- [ ] A/B tests Luna personality

---

**🏆 PHOENIX EST PRÊT POUR LA PRODUCTION ! 🏆**

*Système testé, sécurisé, et optimisé pour servir des milliers d'utilisateurs simultanés.*