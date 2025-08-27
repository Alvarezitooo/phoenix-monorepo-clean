"""
🚀 Phoenix Website - FastAPI Backend
Railway-compatible architecture matching CV and Letters
"""

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os
from typing import Optional

app = FastAPI(
    title="Phoenix Website",
    description="Phoenix AI Ecosystem - Main Website",
    version="1.0.0"
)

# CORS middleware - Configuration sécurisée
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    allowed_origins = [
        "https://phoenix-website-production.up.railway.app",
        "https://luna-hub-backend-unified-production.up.railway.app"
    ]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "*"  # Dev wildcard
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # JWT Bearer seulement, pas de cookies cross-domain
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security middleware production
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["phoenix-website-production.up.railway.app", "*.up.railway.app"]
    )

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    if ENVIRONMENT == "production":
        # Security headers production
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' https://luna-hub-backend-unified-production.up.railway.app; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://luna-hub-backend-unified-production.up.railway.app"
        )
    
    return response

# Phoenix ecosystem service URLs
PHOENIX_SERVICES = {
    "letters": "https://phoenix-letters-production.up.railway.app",
    "cv": "https://phoenix-cv-production.up.railway.app", 
    "luna-hub": "https://luna-hub-backend-unified-production.up.railway.app"
}

# Health check endpoint (required by Railway)
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "phoenix-website"}

# Phoenix services routing
@app.get("/api/services")
async def get_services():
    """Get all Phoenix service URLs"""
    return {
        "services": PHOENIX_SERVICES,
        "message": "Phoenix AI Ecosystem Services"
    }

@app.get("/api/redirect/{service}")
async def redirect_to_service(service: str):
    """Redirect to Phoenix service"""
    if service not in PHOENIX_SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return RedirectResponse(url=PHOENIX_SERVICES[service], status_code=302)

@app.get("/letters")
async def letters_redirect():
    """Direct redirect to Phoenix Letters"""
    return RedirectResponse(url=PHOENIX_SERVICES["letters"], status_code=302)

@app.get("/cv") 
async def cv_redirect():
    """Direct redirect to Phoenix CV"""
    return RedirectResponse(url=PHOENIX_SERVICES["cv"], status_code=302)

@app.get("/luna-hub")
async def luna_hub_redirect():
    """Direct redirect to Luna Hub"""
    return RedirectResponse(url=PHOENIX_SERVICES["luna-hub"], status_code=302)

# Mount static files (React build output)
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    # Serve index.html for all routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't serve index.html for API routes, assets, or service redirects
        if full_path.startswith(("api", "health", "assets", "letters", "cv", "luna-hub")):
            return {"error": "Not found"}
        return FileResponse("dist/index.html")
else:
    @app.get("/")
    async def fallback():
        return {"message": "Phoenix Website - Build in progress"}