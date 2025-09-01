# 🚀 Phoenix Deployment Guide - Sprint 5

**Railway Production Deployment & Operations Manual**

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Railway Setup](#railway-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Procedures](#deployment-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Beta Seeding](#beta-seeding)
- [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### 🔧 Development Environment
- [ ] All Sprint 4 & 5 features implemented
- [ ] Tests passing (`pytest` for backends, `npm test` for frontend)
- [ ] Docker builds successful locally
- [ ] Environment check script passes (`python scripts/beta_env_check.py`)

### 🔐 Security & Credentials
- [ ] All secrets configured in Railway (never in code)
- [ ] JWT keys rotated and secure
- [ ] Stripe keys (live mode for production)
- [ ] Supabase credentials valid
- [ ] CORS origins properly configured

### 📊 Performance & Scaling
- [ ] Database connection limits reviewed
- [ ] Worker counts optimized per service
- [ ] Timeout values appropriate for workloads
- [ ] Rate limiting configured

---

## 🚂 Railway Setup

### 1. Project Creation
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway project:new phoenix-production
```

### 2. Service Configuration

Create 4 services in Railway dashboard:

| Service | Repository Path | Port | Description |
|---------|----------------|------|-------------|
| `luna-hub` | `apps/luna-hub` | 8003 | Luna Hub Core |
| `phoenix-cv` | `apps/phoenix-cv` | 8002 | CV Analysis Service |
| `phoenix-letters` | `apps/phoenix-letters` | 8001 | Letters Generation |
| `phoenix-website` | `apps/phoenix-website` | 80 | React Frontend |

### 3. Build Configuration

Each service needs a `nixpacks.toml` (auto-generated) or custom Dockerfile.

**Example nixpacks.toml for Python services:**
```toml
[phases.build]
cmds = ["python -m pip install --upgrade pip", "pip install -r requirements.txt"]

[phases.install]
cmds = ["pip install gunicorn"]

[start]
cmd = "gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT"
```

---

## ⚙️ Environment Configuration

### Luna Hub (Backend Unified)
Copy from `ops/env/backend-unified.env.sample` to Railway variables:

**Critical Variables:**
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY` (live mode)
- `JWT_SECRET_KEY`
- `ALLOWED_ORIGINS`

### Phoenix Services (CV, Letters)
Copy from respective env samples:

**Critical Variables:**
- `LUNA_HUB_URL` (pointing to deployed Luna Hub)
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`

### Website
Copy from `ops/env/website.env.sample`:

**Critical Variables:**
- `NEXT_PUBLIC_LUNA_HUB_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 🚀 Deployment Procedures

### Automatic Deployment (Recommended)

1. **Push to main branch triggers CI/CD:**
   ```bash
   git add .
   git commit -m "feat: Sprint 5 production deployment"
   git push origin main
   ```

2. **Monitor GitHub Actions:**
   - Backend Unified: `.github/workflows/backend-unified.yml`
   - CV Backend: `.github/workflows/cv-backend.yml`
   - Letters Backend: `.github/workflows/letters-backend.yml`
   - Website: `.github/workflows/website.yml`

3. **Verify deployments in Railway dashboard**

### Manual Deployment

If automatic deployment fails:

```bash
# Deploy specific service
cd apps/luna-hub
railway up --service luna-hub

cd ../phoenix-cv
railway up --service phoenix-cv

cd ../phoenix-letters
railway up --service phoenix-letters

cd ../phoenix-website
railway up --service phoenix-website
```

### Post-Deployment Verification

1. **Health Checks:**
   ```bash
   curl https://your-luna-hub.up.railway.app/health
   curl https://your-luna-hub.up.railway.app/monitoring/ready
   ```

2. **Service Connectivity:**
   ```bash
   curl https://your-cv-service.up.railway.app/health
   curl https://your-letters-service.up.railway.app/health
   curl https://your-website.up.railway.app/health
   ```

3. **Billing System:**
   ```bash
   curl https://your-luna-hub.up.railway.app/billing/health
   curl https://your-luna-hub.up.railway.app/billing/packs
   ```

---

## 📊 Monitoring & Health Checks

### Railway Native Monitoring

**Health Check Configuration:**
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Failure threshold: 3

**Metrics to Monitor:**
- CPU usage < 80%
- Memory usage < 85%
- Response time < 500ms
- Error rate < 1%

### Custom Monitoring Endpoints

**Luna Hub Advanced Monitoring:**
- `GET /monitoring/health` - Comprehensive health check
- `GET /monitoring/ready` - Readiness probe
- `GET /monitoring/metrics` - Prometheus-style metrics

**Key Metrics:**
```bash
# System health
curl https://luna-hub/monitoring/health

# Stripe connectivity
curl https://luna-hub/billing/health

# Supabase connectivity
curl https://luna-hub/monitoring/ready
```

### External Monitoring (Optional)

**Recommended Tools:**
- **Uptime monitoring:** UptimeRobot, Pingdom
- **APM:** Sentry (already configured)
- **Logs:** Railway native logging + structured JSON

---

## 🔄 Rollback Procedures

### Immediate Rollback (Critical Issues)

1. **Identify problematic deployment:**
   ```bash
   railway logs --service luna-hub
   ```

2. **Rollback via Railway dashboard:**
   - Go to service → Deployments
   - Click on previous stable deployment
   - Click "Redeploy"

3. **Or via CLI:**
   ```bash
   # List deployments
   railway deployment:list --service luna-hub
   
   # Rollback to specific deployment
   railway deployment:rollback <deployment-id> --service luna-hub
   ```

### Planned Rollback

1. **Disable CI/CD:** Add `[skip ci]` to commit messages
2. **Coordinate rollback:** Roll back services in reverse dependency order:
   - Website first (no dependencies)
   - Letters & CV second
   - Luna Hub last (core dependency)

3. **Verify rollback success:**
   ```bash
   python scripts/beta_env_check.py
   ```

### Emergency Procedures

**Critical System Down:**
1. **Immediate actions:**
   - Put maintenance page (if available)
   - Post status on social media/status page
   - Notify team via Slack/Discord

2. **Investigation:**
   ```bash
   # Check all services
   railway logs --service luna-hub --tail
   railway logs --service phoenix-cv --tail
   railway logs --service phoenix-letters --tail
   railway logs --service phoenix-website --tail
   ```

3. **Quick fixes:**
   - Scale down to 1 worker if resource issues
   - Restart services if memory leaks
   - Rollback if deployment-related

---

## 🧪 Beta Seeding

### Pre-Seeding Verification

```bash
# Run environment check
python scripts/beta_env_check.py

# Verify all services healthy
curl https://luna-hub/monitoring/health
```

### Beta User Creation

1. **Prepare user list:**
   ```csv
   # beta_users.csv
   email,name
   beta1@example.com,Beta User 1
   beta2@example.com,Beta User 2
   beta3@example.com,Beta User 3
   ```

2. **Set environment variables:**
   ```bash
   export LUNA_HUB_URL="https://your-luna-hub.up.railway.app"
   export LUNA_ADMIN_JWT="your-admin-jwt"
   export STRIPE_SECRET_KEY="sk_test_your-test-key"
   ```

3. **Run seeding script:**
   ```bash
   python scripts/beta_seed.py --csv beta_users.csv
   ```

### Seeding Verification

```bash
# Check user energy via narrative API
curl -H "Authorization: Bearer $LUNA_ADMIN_JWT" \
     https://luna-hub/luna/narrative/user-id-here

# Check billing events
curl -H "Authorization: Bearer $LUNA_ADMIN_JWT" \
     https://luna-hub/billing/history/user-id-here
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Service Won't Start**
```bash
# Check logs
railway logs --service service-name --tail

# Common causes:
# - Environment variables missing
# - Port binding issues
# - Import errors
# - Database connection failures
```

**2. 502 Bad Gateway**
```bash
# Check if service is binding to correct port
# Verify PORT environment variable
# Check health endpoint responds
```

**3. Database Connection Issues**
```bash
# Test Supabase connection
curl -H "apikey: $SUPABASE_SERVICE_KEY" \
     "$SUPABASE_URL/rest/v1/energy_events?limit=1"
```

**4. Stripe Integration Issues**
```bash
# Verify Stripe key
stripe listen --forward-to localhost:8003/webhooks/stripe

# Test payment creation
curl -X POST https://luna-hub/billing/create-intent \
     -H "Authorization: Bearer $JWT" \
     -d '{"user_id":"test","pack":"cafe_luna"}'
```

### Performance Issues

**High CPU/Memory:**
- Increase Railway resources
- Optimize worker counts
- Check for memory leaks in logs
- Review timeout settings

**Slow Response Times:**
- Check database query performance
- Verify external API timeouts
- Review worker configuration
- Check network latency between services

### Debug Mode

Enable debug logging:
```bash
# Set environment variable in Railway
LOG_LEVEL=DEBUG

# Check detailed logs
railway logs --service service-name --tail
```

---

## 📞 Support & Escalation

### Log Analysis
```bash
# Structured logs analysis
railway logs --service luna-hub | grep "ERROR"
railway logs --service luna-hub | grep "request_id"
```

### Contact Information
- **Railway Support:** Via Railway dashboard
- **Stripe Support:** dashboard.stripe.com
- **Supabase Support:** supabase.com/support

### Critical Incident Response

1. **Assess impact:** How many users affected?
2. **Communicate:** Update status page/social media
3. **Investigate:** Check logs, metrics, external services
4. **Resolve:** Apply fix or rollback
5. **Follow-up:** Post-mortem and prevention measures

---

## 🎯 Success Metrics

### Deployment Success Criteria
- [ ] All services healthy (`200` status)
- [ ] Response times < 500ms (95th percentile)
- [ ] Error rate < 0.1%
- [ ] Beta users can complete full flow
- [ ] Billing system functional
- [ ] Energy management working

### Business Metrics
- Beta user activation rate
- Payment success rate
- Feature usage analytics
- User satisfaction scores

---

*🚀 Phoenix is ready for production! Monitor, iterate, and scale to the moon! 🌙*