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
