# 🚀 Phoenix Letters - Dockerfile Production
# Backend FastAPI + Frontend React intégré

FROM python:3.11-slim

# Variables d'environnement
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8001

# Dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Node.js pour le build frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# Installation des dépendances Python
COPY requirements_api.txt .
RUN pip install --no-cache-dir -r requirements_api.txt

# Copie du code backend
COPY . .

# Build du frontend
WORKDIR /app/frontend/project
COPY frontend/project/package*.json ./
RUN npm ci --only=production
COPY frontend/project/ .
RUN npm run build

# Retour au backend
WORKDIR /app

# 🎯 GAME CHANGER - Vérification que la nouvelle feature est présente
RUN python -c "
import sys
sys.path.append('/app')
try:
    from domain.entities.career_transition import CareerTransition
    from domain.services.skill_mapping_service import SkillMappingService
    from application.use_cases.analyze_career_transition_use_case import AnalyzeCareerTransitionUseCase
    print('✅ Career Transition Feature - Ready for Production!')
except ImportError as e:
    print(f'❌ Missing Career Transition components: {e}')
    sys.exit(1)
"

# Configuration pour Railway
EXPOSE $PORT

# Commande de démarrage
CMD ["python", "api_main.py"]