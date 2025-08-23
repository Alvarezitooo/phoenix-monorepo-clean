# 🚀 Phoenix Backend Unified - Railway Simple
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install structlog==25.4.0 bleach==6.2.0 psutil==7.0.0 email-validator==2.2.0

# Copy application
COPY . .

# Simple start command
CMD ["python", "main.py"]
