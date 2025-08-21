# 🔥 Phoenix CV - Dockerfile Production
# Backend FastAPI Clean Architecture

FROM python:3.11-slim

# Variables d'environnement
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8002

# Dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# 🎯 Vérification features Phoenix CV complètes
RUN python -c "import sys; sys.path.append('/app'); \
from domain.entities.cv_document import CVDocument; \
from domain.entities.mirror_match import MirrorMatchAnalysis; \
from domain.entities.chat_conversation import ChatConversation; \
from domain.entities.salary_analysis import SalaryAnalysisResult; \
from domain.entities.linkedin_integration import LinkedInIntegrationResult; \
from infrastructure.ai.cv_gemini_service import CVGeminiService; \
from infrastructure.ai.chat_ai_service import ChatAIService; \
from infrastructure.ai.salary_ai_service import SalaryAIService; \
from infrastructure.integrations.linkedin_service import LinkedInService; \
print('✅ Phoenix CV - All 4 Revolutionary Features Ready for Production!')"

# Configuration pour Railway
EXPOSE $PORT

# Commande de démarrage
CMD ["python", "api_main.py"]