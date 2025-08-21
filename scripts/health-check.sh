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
