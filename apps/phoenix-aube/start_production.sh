#!/bin/bash

# 🌅 Phoenix Aube Production Startup
# Runs both Next.js frontend and FastAPI backend in Railway

set -e

echo "🌅 Starting Phoenix Aube Production Services..."

# Start Next.js frontend on port 3000 in background
echo "🚀 Starting Next.js frontend..."
cd /app/frontend

# Check if Next.js build exists
if [ ! -d ".next" ]; then
    echo "❌ Next.js build not found, building now..."
    npm run build
fi

# Start FastAPI backend FIRST (Railway needs health check)
echo "🚀 Starting FastAPI backend first..."
cd /app
python api_main.py &
BACKEND_PID=$!

# Give FastAPI a moment to start
sleep 3

# Start Next.js with specific port
echo "🚀 Starting Next.js frontend..."
cd /app/frontend
NODE_ENV=production PORT=3000 npm run start &
FRONTEND_PID=$!

# Wait for Next.js to be ready (but don't block FastAPI)
echo "⏳ Waiting for Next.js to start..."
timeout=30
count=0
while ! curl -f http://localhost:3000/ 2>/dev/null && [ $count -lt $timeout ]; do
    sleep 1
    ((count++))
done

if [ $count -eq $timeout ]; then
    echo "⚠️ Next.js took too long to start, but FastAPI should handle requests"
else
    echo "✅ Next.js is ready!"
fi

# Function to gracefully stop both processes
cleanup() {
    echo "🛑 Shutting down Phoenix Aube services..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    wait
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

echo "✅ Phoenix Aube services running:"
echo "   - Frontend (Next.js): http://localhost:3000"
echo "   - Backend (FastAPI): http://localhost:${PORT:-8001}"
echo "   - Public URL: Railway will proxy traffic"

# Wait for any process to exit
wait -n
cleanup