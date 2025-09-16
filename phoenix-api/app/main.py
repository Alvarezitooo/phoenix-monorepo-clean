import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.routers import cv, letters, aube, rise

# 🚀 Phoenix API Gateway - Multi-SPA Architecture
app = FastAPI(
    title="Phoenix API Gateway",
    description="Pure orchestration layer for Phoenix Multi-SPA Architecture. Delegates to Luna Hub.",
    version="2.0.0"
)

# 🔒 CORS Configuration - Multi-SPA Support
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
is_production = ENVIRONMENT == "production"

if is_production:
    # Production: Railway domains + custom domains + allow direct API access
    allowed_origins = [
        "https://phoenix.ai",
        "https://www.phoenix.ai", 
        "https://hub.phoenix.ai",
        "https://phoenix-front-end-production.up.railway.app",
        "https://luna-hub-production.up.railway.app",
        "*"  # Allow direct API access for testing/integration
    ]
else:
    # Development: Local origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173", # Vite dev server
        "http://localhost:8001", # Local dev
        "http://localhost:8002"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600  # Cache preflight for 10min
)

# 🛡️ Security: Trusted hosts in production
if is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "phoenix.ai",
            "www.phoenix.ai", 
            "api.phoenix.ai",
            "phoenix-api-production.up.railway.app",
            "*.railway.app"  # Railway internal communication
        ]
    )

# Include routers for each business domain
app.include_router(cv.router, prefix="/api/v1/cv", tags=["CV"])
app.include_router(letters.router, prefix="/api/v1/letters", tags=["Letters"])  
app.include_router(aube.router, prefix="/api/v1/aube", tags=["Aube"])
app.include_router(rise.router, prefix="/api/v1/rise", tags=["Rise"])

@app.get("/", tags=["Health"])
async def read_root():
    return {"message": "Phoenix API is alive and orchestrating."}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
