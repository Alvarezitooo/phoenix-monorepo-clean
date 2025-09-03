FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway provides PORT via environment variable
EXPOSE 8000

# Run the application with Railway's dynamic port (Railway will override)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]