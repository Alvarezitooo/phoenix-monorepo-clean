# 🚀 Phoenix - AI-Powered Career Platform

> JAMstack Multi-SPA architecture with centralized AI services

Phoenix is a next-generation career development platform powered by AI, featuring intelligent CV analysis, personalized career coaching, and automated letter generation.

## 🏗️ Architecture Overview

```
🌐 Phoenix Platform (Multi-SPA JAMstack)
├── 🎯 phoenix-api/         # Gateway & Orchestration (FastAPI)
├── 🚀 phoenix-frontend/    # Unified React SPA
└── 🌙 luna-hub/           # Central AI Hub (Gemini + Energy System)
```

### Core Features

- **🤖 Aube AI Chat** - Intelligent career counseling with narrative context
- **📄 CV Mirror Match** - Advanced CV analysis with success predictions  
- **✉️ Letter Generation** - Personalized cover letters with company research
- **⚡ Energy System** - Smart usage-based monetization
- **🔐 Enterprise Security** - Production-ready authentication & authorization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+ & pip
- PostgreSQL 14+
- Redis 6+

### Development Setup

```bash
# Clone and setup
git clone <repo-url>
cd phoenix-production

# Setup each service
cd phoenix-frontend && npm install && npm run dev
cd ../phoenix-api && pip install -r requirements.txt && python main.py
cd ../luna-hub && pip install -r requirements.txt && python api_main.py
```

### Environment Variables

```env
# Phoenix API
LUNA_HUB_URL=http://localhost:8001

# Luna Hub  
DATABASE_URL=postgresql://user:pass@localhost:5432/phoenix
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## 🌐 Production Deployment

Phoenix is optimized for **Railway** deployment with automatic scaling:

```bash
# Deploy all 3 services
railway up
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production setup.

## 📊 System Architecture

- **Frontend**: React SPA with Tailwind UI serving all Phoenix apps
- **API Gateway**: FastAPI orchestration layer with intelligent routing
- **AI Hub**: Centralized Luna service with Gemini integration
- **Database**: PostgreSQL with event sourcing for narrative context
- **Cache**: Redis for performance optimization
- **Auth**: JWT + HTTPOnly cookies for security

## 🔧 Development

### Project Structure
```
phoenix-production/
├── phoenix-frontend/       # React SPA (Vite + Tailwind)
│   ├── src/pages/         # Aube, CV, Letters pages
│   └── src/components/    # Shared UI components
├── phoenix-api/           # FastAPI Gateway
│   └── app/routes/        # Orchestration endpoints
└── luna-hub/             # AI Services Hub
    ├── app/core/         # Business logic
    ├── app/api/          # AI endpoints
    └── app/models/       # Data models
```

### API Endpoints

```http
# AI Services (via phoenix-api → luna-hub)
POST /api/aube/chat              # Aube career chat
POST /api/cv/mirror-match        # CV analysis
POST /api/letters/generate       # Letter generation

# User Management
GET  /api/users/profile          # User profile
POST /api/users/energy/purchase  # Energy purchase
```

## 🎯 Energy System

Phoenix uses an innovative energy-based monetization model:

- **Actions Cost Energy**: CV analysis (25%), Letter generation (15%), etc.
- **Energy Packs**: €2.99 (100%) to €29.99/month (unlimited)
- **Smart Tracking**: Every interaction logged for narrative context

## 🛡️ Security Features

- **Oracle Directives Compliant** - See [ORACLE_DIRECTIVES.md](./ORACLE_DIRECTIVES.md)
- **Hub-Centric Security** - All business logic in Luna Hub
- **Input Validation** - Security Guardian on all inputs
- **Rate Limiting** - Multi-layer protection
- **CORS Protection** - Strict domain whitelisting

## 📈 Performance

- **Frontend Load**: < 2s First Contentful Paint
- **API Response**: < 500ms (95th percentile)
- **AI Generation**: < 5s average
- **Success Rate**: > 95% all services
- **Concurrent Users**: 1000+ supported

## 🧪 Testing

```bash
# Run E2E tests
node test-production-readiness.js
node test-ai-services-integration.js
```

## 🤝 Contributing

1. Follow Oracle Directives (ORACLE_DIRECTIVES.md)
2. Maintain hub-centric architecture
3. All AI logic in Luna Hub only
4. Event sourcing for state changes
5. Security by design

## 📝 License

Private - Phoenix Production System

---

**Built with passion using JAMstack architecture for scalable AI-powered career development** 🌟