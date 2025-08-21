#!/usr/bin/env bash
set -euo pipefail

echo "🚀 PHOENIX RESET - Création du monorepo propre"
echo "=============================================="

ROOT="${PWD}"
APPS=(phoenix-letters phoenix-cv phoenix-backend-unified phoenix-iris-api phoenix-agent-ia)

# --- Structure de base ---
mkdir -p apps scripts docs

echo "📁 Structure créée : apps/, scripts/, docs/"

# --- .gitignore global ---
cat > .gitignore <<'EOF'
# Python
__pycache__/
*.pyc
*.pyo
*.pyd
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis

# IDEs
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Env files
.env
.env.local
.env.production
.env.staging

# Build
dist/
build/
*.egg-info/

# Logs
logs/
*.log

# Node (si on ajoute du front plus tard)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

echo "✅ .gitignore créé"

# --- README principal ---
cat > README.md <<'EOF'
# 🏛️ Phoenix Eco Monorepo (Reset Clean)

Monorepo Python minimal, optimisé pour Railway déploiement.

## 🎯 Architecture

**Principe :** 1 service = 1 dossier apps/, communication REST, zéro shared dependency.

```
phoenix-mono-clean/
├── apps/
│   ├── phoenix-letters/       # Streamlit - Génération lettres motivation
│   ├── phoenix-cv/           # Streamlit - Optimisation CV
│   ├── phoenix-backend-unified/ # FastAPI - API unifiée
│   └── phoenix-iris-api/     # FastAPI - Assistant IA
├── scripts/                  # Scripts utilitaires
└── docs/                     # Documentation
```

## 🚀 Services

| Service | Type | Port | Health Check |
|---------|------|------|--------------|
| phoenix-letters | Streamlit | 8501 | `/_stcore/health` |
| phoenix-cv | Streamlit | 8501 | `/_stcore/health` |
| phoenix-backend-unified | FastAPI | 8000 | `/health` |
| phoenix-iris-api | FastAPI | 8000 | `/health` |

## 🏗️ Déploiement Railway

Chaque service se déploie indépendamment :

```bash
# 1 service = 1 déploiement Railway
Railway Project > New Service > Deploy from GitHub
Root Directory: apps/phoenix-letters
```

## 🧪 Développement Local

```bash
# Backend Unified
cd apps/phoenix-backend-unified
poetry install
poetry run uvicorn main:app --reload

# Letters
cd apps/phoenix-letters  
pip install -r requirements.txt
streamlit run main.py

# CV
cd apps/phoenix-cv
pip install -r requirements.txt
streamlit run main.py

# Iris API
cd apps/phoenix-iris-api
poetry install 
poetry run uvicorn main:app --reload
```

## 🔧 Configuration

Chaque service a son `.env.example` - copier vers `.env` et configurer.

## ✅ Tests de Santé

```bash
# Backend
curl http://localhost:8000/health

# Streamlit (après démarrage)
curl http://localhost:8501/_stcore/health
```
EOF

echo "✅ README principal créé"

# --- Letters (Streamlit) ---
echo "📝 Création Phoenix Letters..."
mkdir -p apps/phoenix-letters

cat > apps/phoenix-letters/requirements.txt <<'EOF'
# Phoenix Letters - Minimal Clean Requirements
streamlit>=1.36.0
pydantic>=2.7.0
httpx>=0.27.0
python-dotenv>=1.0.0
EOF

cat > apps/phoenix-letters/main.py <<'EOF'
"""
🎯 Phoenix Letters - Clean Reset
Génération de lettres de motivation - Interface Streamlit autonome
"""

import os
import asyncio
import streamlit as st
import httpx
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")
API_TOKEN = os.getenv("API_SECRET_TOKEN", "dev-token")

# Page config
st.set_page_config(
    page_title="Phoenix Letters",
    page_icon="📝",
    layout="wide"
)

def main():
    st.title("📝 Phoenix Letters")
    st.markdown("**Générateur de lettres de motivation intelligent**")
    
    # Sidebar avec infos
    with st.sidebar:
        st.markdown("### 🔧 Configuration")
        st.code(f"Backend: {BACKEND_URL}")
        
        if st.button("🔍 Test Backend"):
            test_backend_connection()
    
    # Interface principale
    st.markdown("### ✨ Nouvelle lettre")
    
    col1, col2 = st.columns(2)
    
    with col1:
        company = st.text_input("🏢 Entreprise", placeholder="Ex: Google")
        position = st.text_input("💼 Poste", placeholder="Ex: Développeur Python")
    
    with col2:
        experience = st.selectbox("📈 Expérience", ["Junior", "Intermédiaire", "Senior"])
        tone = st.selectbox("🎭 Ton", ["Professionnel", "Enthousiaste", "Décontracté"])
    
    job_description = st.text_area(
        "📋 Description du poste (optionnel)",
        placeholder="Collez ici la description du poste...",
        height=100
    )
    
    if st.button("🚀 Générer la lettre", type="primary"):
        if company and position:
            generate_letter(company, position, job_description, experience, tone)
        else:
            st.error("❌ Veuillez renseigner l'entreprise et le poste")

async def test_backend_connection():
    """Test la connexion au backend"""
    try:
        headers = {"Authorization": f"Bearer {API_TOKEN}"}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{BACKEND_URL}/health", headers=headers)
            
        if response.status_code == 200:
            st.success(f"✅ Backend connecté : {response.json()}")
        else:
            st.error(f"❌ Backend erreur {response.status_code}")
            
    except Exception as e:
        st.error(f"❌ Connexion échouée : {e}")

def generate_letter(company, position, job_description, experience, tone):
    """Génère une lettre (placeholder pour l'instant)"""
    with st.spinner("🔄 Génération en cours..."):
        # TODO: Appel vers backend unifié pour génération IA
        
        # Placeholder pour demo
        import time
        time.sleep(2)
        
        letter = f"""
Objet : Candidature pour le poste de {position}

Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de {position} au sein de {company}.

Fort(e) d'une expérience {experience.lower()}, je suis convaincu(e) que mon profil correspond parfaitement à vos attentes.

[Contenu généré par IA - À implémenter]

Je reste à votre disposition pour un entretien.

Cordialement,
[Votre nom]
        """
        
        st.success("✅ Lettre générée !")
        st.markdown("### 📄 Votre lettre")
        st.text_area("", value=letter.strip(), height=300)
        
        # Boutons d'action
        col1, col2, col3 = st.columns(3)
        with col1:
            st.download_button("💾 Télécharger", letter, "lettre_motivation.txt")
        with col2:
            if st.button("✏️ Modifier"):
                st.info("🚧 Éditeur à implémenter")
        with col3:
            if st.button("🔄 Régénérer"):
                st.rerun()

if __name__ == "__main__":
    main()
EOF

cat > apps/phoenix-letters/.env.example <<'EOF'
# Phoenix Letters - Configuration
BACKEND_API_URL=http://localhost:8000
API_SECRET_TOKEN=dev-token

# Pour production Railway
# BACKEND_API_URL=https://your-backend.up.railway.app
# API_SECRET_TOKEN=your-production-token
EOF

cat > apps/phoenix-letters/Dockerfile <<'EOF'
# Phoenix Letters - Dockerfile Clean
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    STREAMLIT_SERVER_HEADLESS=true \
    STREAMLIT_SERVER_ENABLE_CORS=false

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . /app/

# Security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8501

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

CMD ["streamlit", "run", "main.py", "--server.port=8501", "--server.address=0.0.0.0"]
EOF

echo "✅ Phoenix Letters créé"

# --- CV (Streamlit) ---
echo "🎨 Création Phoenix CV..."
mkdir -p apps/phoenix-cv

cat > apps/phoenix-cv/requirements.txt <<'EOF'
# Phoenix CV - Minimal Clean Requirements
streamlit>=1.36.0
pydantic>=2.7.0
httpx>=0.27.0
python-dotenv>=1.0.0
EOF

cat > apps/phoenix-cv/main.py <<'EOF'
"""
🎯 Phoenix CV - Clean Reset
Optimisation de CV - Interface Streamlit autonome
"""

import os
import asyncio
import streamlit as st
import httpx
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")
API_TOKEN = os.getenv("API_SECRET_TOKEN", "dev-token")

# Page config
st.set_page_config(
    page_title="Phoenix CV",
    page_icon="📄",
    layout="wide"
)

def main():
    st.title("📄 Phoenix CV")
    st.markdown("**Optimiseur de CV intelligent**")
    
    # Sidebar
    with st.sidebar:
        st.markdown("### 🔧 Configuration")
        st.code(f"Backend: {BACKEND_URL}")
        
        if st.button("🔍 Test Backend"):
            test_backend_connection()
    
    # Upload CV
    st.markdown("### 📤 Upload votre CV")
    uploaded_file = st.file_uploader(
        "Choisissez votre fichier CV",
        type=['pdf', 'docx', 'txt'],
        help="Formats supportés: PDF, DOCX, TXT"
    )
    
    if uploaded_file:
        st.success(f"✅ Fichier uploadé: {uploaded_file.name}")
        
        # Options d'optimisation
        st.markdown("### ⚙️ Options d'optimisation")
        
        col1, col2 = st.columns(2)
        
        with col1:
            job_target = st.text_input("🎯 Poste ciblé", placeholder="Ex: Data Scientist")
            industry = st.selectbox("🏭 Secteur", ["Tech", "Finance", "Santé", "Autre"])
        
        with col2:
            experience_level = st.selectbox("📈 Niveau", ["Junior", "Intermédiaire", "Senior"])
            optimization_type = st.selectbox("🔧 Type", ["ATS", "Humain", "Les deux"])
        
        if st.button("🚀 Optimiser le CV", type="primary"):
            optimize_cv(uploaded_file, job_target, industry, experience_level, optimization_type)

async def test_backend_connection():
    """Test la connexion au backend"""
    try:
        headers = {"Authorization": f"Bearer {API_TOKEN}"}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{BACKEND_URL}/health", headers=headers)
            
        if response.status_code == 200:
            st.success(f"✅ Backend connecté : {response.json()}")
        else:
            st.error(f"❌ Backend erreur {response.status_code}")
            
    except Exception as e:
        st.error(f"❌ Connexion échouée : {e}")

def optimize_cv(file, job_target, industry, experience_level, optimization_type):
    """Optimise le CV (placeholder)"""
    with st.spinner("🔄 Analyse et optimisation en cours..."):
        # TODO: Traitement du fichier + appel backend
        import time
        time.sleep(3)
        
        st.success("✅ CV optimisé !")
        
        # Résultats placeholder
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 📊 Score ATS")
            st.metric("Score", "85%", "+15%")
            st.progress(0.85)
        
        with col2:
            st.markdown("### 🎯 Mots-clés manquants")
            keywords = ["Python", "Machine Learning", "SQL", "Docker"]
            for kw in keywords:
                st.markdown(f"• **{kw}**")
        
        st.markdown("### 📄 CV Optimisé")
        st.info("🚧 Affichage du CV optimisé à implémenter")
        
        # Actions
        col1, col2, col3 = st.columns(3)
        with col1:
            st.download_button("💾 Télécharger", "CV optimisé...", "cv_optimise.pdf")
        with col2:
            if st.button("📧 Envoyer par email"):
                st.info("🚧 Email à implémenter")
        with col3:
            if st.button("🔄 Nouvelle optimisation"):
                st.rerun()

if __name__ == "__main__":
    main()
EOF

# Copier les mêmes fichiers de config
cp apps/phoenix-letters/.env.example apps/phoenix-cv/
cp apps/phoenix-letters/Dockerfile apps/phoenix-cv/

# Adapter le Dockerfile pour CV
sed -i '' 's/Phoenix Letters/Phoenix CV/g' apps/phoenix-cv/Dockerfile

echo "✅ Phoenix CV créé"

# --- Backend Unified (FastAPI) ---
echo "⚙️ Création Backend Unified..."
mkdir -p apps/phoenix-backend-unified

cat > apps/phoenix-backend-unified/pyproject.toml <<'EOF'
[tool.poetry]
name = "phoenix-backend-unified"
version = "1.0.0"
description = "Phoenix Backend Unified - Clean Reset"
authors = ["Phoenix Team"]
package-mode = false

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.111.0"
uvicorn = {extras = ["standard"], version = "^0.30.0"}
pydantic = "^2.7.0"
httpx = "^0.27.0"
python-dotenv = "^1.0.0"
python-multipart = "^0.0.9"

[tool.poetry.group.dev.dependencies]
pytest = "^8.2.0"
pytest-asyncio = "^0.23.0"

[build-system]
requires = ["poetry-core>=1.8.0"]
build-backend = "poetry.core.masonry.api"
EOF

cat > apps/phoenix-backend-unified/main.py <<'EOF'
"""
🎯 Phoenix Backend Unified - Clean Reset
API unifiée pour tout l'écosystème Phoenix
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configuration
API_SECRET = os.getenv("API_SECRET_TOKEN", "dev-token")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Security
security = HTTPBearer()

# FastAPI app
app = FastAPI(
    title="Phoenix Backend Unified",
    description="API unifiée pour l'écosystème Phoenix (Clean Reset)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    environment: str

class EventRequest(BaseModel):
    event_type: str
    user_id: Optional[str] = None
    data: Dict[str, Any]

class APIResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: str
    timestamp: datetime

# Auth dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if ENVIRONMENT == "development":
        return True  # Skip auth in dev
    
    if credentials.credentials != API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

# Routes
@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "service": "Phoenix Backend Unified",
        "status": "operational",
        "version": "1.0.0 (clean reset)"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="phoenix-backend-unified",
        environment=ENVIRONMENT
    )

@app.post("/events", response_model=APIResponse)
async def receive_event(
    event: EventRequest,
    _: bool = Depends(verify_token)
):
    """Endpoint pour recevoir des événements des autres services"""
    # TODO: Traitement des événements, sauvegarde DB, etc.
    
    return APIResponse(
        success=True,
        data={"event_id": f"evt_{int(datetime.now().timestamp())}"},
        message=f"Event {event.event_type} received",
        timestamp=datetime.now()
    )

@app.post("/letters/generate", response_model=APIResponse)
async def generate_letter(
    request: Dict[str, Any],
    _: bool = Depends(verify_token)
):
    """Génération de lettre de motivation"""
    # TODO: Intégration IA Gemini/OpenAI
    
    return APIResponse(
        success=True,
        data={"letter": "Lettre générée par IA (à implémenter)"},
        message="Letter generated successfully",
        timestamp=datetime.now()
    )

@app.post("/cv/optimize", response_model=APIResponse)
async def optimize_cv(
    request: Dict[str, Any],
    _: bool = Depends(verify_token)
):
    """Optimisation de CV"""
    # TODO: Parser CV + optimisation IA
    
    return APIResponse(
        success=True,
        data={"optimized_cv": "CV optimisé (à implémenter)"},
        message="CV optimized successfully",
        timestamp=datetime.now()
    )

@app.get("/protected")
async def protected_route(_: bool = Depends(verify_token)):
    """Route protégée pour tester l'auth"""
    return {"message": "You have access to this protected route!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

cat > apps/phoenix-backend-unified/.env.example <<'EOF'
# Phoenix Backend Unified - Configuration
API_SECRET_TOKEN=dev-token
ENVIRONMENT=development

# IA APIs
GEMINI_API_KEY=
OPENAI_API_KEY=

# Database
SUPABASE_URL=
SUPABASE_KEY=

# Pour production Railway
# API_SECRET_TOKEN=your-production-token
# ENVIRONMENT=production
EOF

cat > apps/phoenix-backend-unified/Dockerfile <<'EOF'
# Phoenix Backend Unified - Dockerfile Clean
FROM python:3.11-slim

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Poetry
RUN pip install "poetry==$POETRY_VERSION"

# Install dependencies
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-interaction --no-ansi --only main

# Copy application
COPY . /app/

# Security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

echo "✅ Backend Unified créé"

# --- Iris API (FastAPI) ---
echo "🤖 Création Iris API..."
mkdir -p apps/phoenix-iris-api

cat > apps/phoenix-iris-api/pyproject.toml <<'EOF'
[tool.poetry]
name = "phoenix-iris-api"
version = "1.0.0"
description = "Phoenix Iris Assistant API - Clean Reset"
authors = ["Phoenix Team"]
package-mode = false

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.111.0"
uvicorn = {extras = ["standard"], version = "^0.30.0"}
pydantic = "^2.7.0"
httpx = "^0.27.0"
python-dotenv = "^1.0.0"

[build-system]
requires = ["poetry-core>=1.8.0"]
build-backend = "poetry.core.masonry.api"
EOF

cat > apps/phoenix-iris-api/main.py <<'EOF'
"""
🎯 Phoenix Iris API - Clean Reset
Assistant IA conversationnel
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment
load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# FastAPI app
app = FastAPI(
    title="Phoenix Iris API",
    description="Assistant IA conversationnel (Clean Reset)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    conversation_id: str
    message_count: int
    timestamp: datetime

# In-memory storage (TODO: remplacer par DB)
conversations: Dict[str, List[ChatMessage]] = {}

# Routes
@app.get("/")
async def root():
    return {
        "service": "Phoenix Iris API",
        "status": "operational",
        "version": "1.0.0 (clean reset)"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "phoenix-iris-api",
        "environment": ENVIRONMENT,
        "conversations_count": len(conversations)
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Endpoint de chat avec Iris"""
    
    # Générer conversation_id si nécessaire
    conv_id = request.conversation_id or f"conv_{int(datetime.now().timestamp())}"
    
    # Initialiser conversation si nouvelle
    if conv_id not in conversations:
        conversations[conv_id] = []
    
    # Ajouter message utilisateur
    user_message = ChatMessage(
        role="user",
        content=request.message,
        timestamp=datetime.now()
    )
    conversations[conv_id].append(user_message)
    
    # Générer réponse (placeholder)
    # TODO: Intégration avec IA (Gemini/OpenAI)
    ai_response = generate_ai_response(request.message, conversations[conv_id])
    
    ai_message = ChatMessage(
        role="assistant",
        content=ai_response,
        timestamp=datetime.now()
    )
    conversations[conv_id].append(ai_message)
    
    return ChatResponse(
        success=True,
        response=ai_response,
        conversation_id=conv_id,
        message_count=len(conversations[conv_id]),
        timestamp=datetime.now()
    )

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Récupère l'historique d'une conversation"""
    if conversation_id not in conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id],
        "message_count": len(conversations[conversation_id])
    }

def generate_ai_response(message: str, history: List[ChatMessage]) -> str:
    """Génère une réponse IA (placeholder)"""
    # TODO: Implémenter logique IA réelle
    
    responses = [
        f"Je comprends votre question sur '{message[:30]}...'. Comment puis-je vous aider davantage ?",
        f"C'est une excellente question ! En tant qu'assistant Phoenix, je peux vous guider sur ce sujet.",
        f"Merci pour votre message. Voici mon analyse de votre demande...",
        "Je suis Iris, votre assistant Phoenix. Que puis-je faire pour vous aujourd'hui ?",
        f"Intéressant ! Vous mentionnez '{message[:20]}...'. Laissez-moi vous expliquer..."
    ]
    
    import random
    return random.choice(responses)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

cp apps/phoenix-backend-unified/.env.example apps/phoenix-iris-api/
cp apps/phoenix-backend-unified/Dockerfile apps/phoenix-iris-api/

# Adapter le Dockerfile pour Iris
sed -i '' 's/Phoenix Backend Unified/Phoenix Iris API/g' apps/phoenix-iris-api/Dockerfile

echo "✅ Iris API créé"

# --- Scripts utilitaires ---
echo "🛠️ Création des scripts..."

cat > scripts/dev-start.sh <<'EOF'
#!/usr/bin/env bash
# Démarrage développement local

echo "🚀 Démarrage des services Phoenix..."

# Backend
echo "Starting Backend Unified..."
cd apps/phoenix-backend-unified
poetry install --quiet
poetry run uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Iris API  
echo "Starting Iris API..."
cd ../phoenix-iris-api
poetry install --quiet
poetry run uvicorn main:app --reload --port 8001 &
IRIS_PID=$!

cd ../..

echo "✅ Services démarrés:"
echo "  - Backend Unified: http://localhost:8000"
echo "  - Iris API: http://localhost:8001"
echo ""
echo "Pour démarrer les frontends:"
echo "  cd apps/phoenix-letters && streamlit run main.py --server.port 8501"
echo "  cd apps/phoenix-cv && streamlit run main.py --server.port 8502"
echo ""
echo "Press Ctrl+C to stop all services"

# Attendre interruption
trap "kill $BACKEND_PID $IRIS_PID 2>/dev/null" EXIT
wait
EOF

cat > scripts/health-check.sh <<'EOF'
#!/usr/bin/env bash
# Health check de tous les services

echo "🔍 Health Check Phoenix Services"
echo "================================="

SERVICES=(
    "Backend:http://localhost:8000/health"
    "Iris API:http://localhost:8001/health"
    "Letters:http://localhost:8501/_stcore/health"
    "CV:http://localhost:8502/_stcore/health"
)

for service in "${SERVICES[@]}"; do
    name="${service%:*}"
    url="${service#*:}"
    
    printf "%-12s " "$name"
    
    if curl -sf "$url" >/dev/null 2>&1; then
        echo "✅ UP"
    else
        echo "❌ DOWN"
    fi
done
EOF

chmod +x scripts/*.sh

echo "✅ Scripts créés"

# --- Documentation ---
echo "📚 Création documentation..."

cat > docs/DEPLOYMENT.md <<'EOF'
# 🚀 Déploiement Railway

## Principe

Chaque service se déploie indépendamment sur Railway :
- 1 service Railway = 1 dossier apps/
- Pas de railway.json, pas de shared dependencies
- Communication REST entre services

## Étapes

### 1. Backend Unified (déployer en premier)

```bash
Railway > New Project > Deploy from GitHub
Repository: votre-repo
Root Directory: apps/phoenix-backend-unified
```

Variables d'environnement :
```
API_SECRET_TOKEN=your-secret-token
ENVIRONMENT=production
GEMINI_API_KEY=your-key (optionnel)
```

### 2. Iris API

```bash
Railway > New Service > Deploy from GitHub  
Root Directory: apps/phoenix-iris-api
```

Variables d'environnement : mêmes que Backend

### 3. Phoenix Letters

```bash
Railway > New Service > Deploy from GitHub
Root Directory: apps/phoenix-letters  
```

Variables d'environnement :
```
BACKEND_API_URL=https://your-backend.up.railway.app
API_SECRET_TOKEN=your-secret-token
```

### 4. Phoenix CV

```bash
Railway > New Service > Deploy from GitHub
Root Directory: apps/phoenix-cv
```

Variables d'environnement : mêmes que Letters

## Tests

Chaque service expose un endpoint de santé :
- Backend/Iris : `GET /health`
- Streamlit : `GET /_stcore/health`

## Domaines

Railway génère automatiquement :
- `https://phoenix-backend-unified-xxx.up.railway.app`
- `https://phoenix-iris-api-xxx.up.railway.app`  
- `https://phoenix-letters-xxx.up.railway.app`
- `https://phoenix-cv-xxx.up.railway.app`
EOF

cat > docs/ARCHITECTURE.md <<'EOF'
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
EOF

echo "✅ Documentation créée"

# --- Message final ---
echo ""
echo "🎉 PHOENIX MONOREPO CLEAN CRÉÉ !"
echo "================================="
echo ""
echo "📁 Structure générée :"
echo "  ├── apps/phoenix-letters/     (Streamlit)"
echo "  ├── apps/phoenix-cv/          (Streamlit)"  
echo "  ├── apps/phoenix-backend-unified/ (FastAPI)"
echo "  ├── apps/phoenix-iris-api/    (FastAPI)"
echo "  ├── scripts/                  (Utilitaires)"
echo "  └── docs/                     (Documentation)"
echo ""
echo "🚀 Prochaines étapes :"
echo "  1. cd phoenix-mono-clean"
echo "  2. git init && git add -A"
echo "  3. git commit -m 'feat: phoenix monorepo clean reset'"
echo "  4. Configurer .env dans chaque service"
echo "  5. Tester en local : ./scripts/dev-start.sh"
echo "  6. Déployer sur Railway service par service"
echo ""
echo "✨ Fini les galères shared ! Chaque service est autonome."