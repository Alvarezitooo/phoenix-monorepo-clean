# 🏗️ Architecture Phoenix Clean

## Principe de Design

**Autonomie maximale** : Chaque service est 100% autonome, peut être buildé et déployé indépendamment.

**Communication REST** : Pas de shared libs, communication via HTTP/REST uniquement.

**Simplicité** : Minimal dependencies, configuration simple, débogage facile.

## Structure

```
phoenix-mono-clean/
├── apps/
│   ├── phoenix-letters/          # Frontend Streamlit
│   │   ├── main.py              # App principale
│   │   ├── requirements.txt     # Deps pip
│   │   ├── Dockerfile          # Build autonome
│   │   └── .env.example        # Config template
│   │
│   ├── phoenix-cv/             # Frontend Streamlit  
│   ├── phoenix-backend-unified/ # API FastAPI
│   └── phoenix-iris-api/       # Assistant IA FastAPI
│
├── scripts/                    # Utilitaires dev
└── docs/                      # Documentation
```

## Communication

```
┌─────────────┐    REST     ┌──────────────────┐
│   Letters   │◄───────────►│ Backend Unified  │
└─────────────┘             └──────────────────┘
                                      ▲
┌─────────────┐    REST              │
│     CV      │◄─────────────────────┤
└─────────────┘                      │
                                     ▼
┌─────────────┐    REST     ┌──────────────────┐
│   Clients   │◄───────────►│   Iris API       │
└─────────────┘             └──────────────────┘
```

## Déploiement

Chaque service = 1 container = 1 service Railway indépendant.

Pas de railway.json, pas de contexte build complexe.

## Migration Ancien Code

1. **Nettoyer** : identifier le code métier essentiel
2. **Adapter** : convertir les imports shared vers REST calls  
3. **Tester** : valider chaque endpoint individuellement
4. **Déployer** : service par service
