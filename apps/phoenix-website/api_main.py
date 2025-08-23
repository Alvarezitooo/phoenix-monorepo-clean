"""
🚀 Phoenix Website - FastAPI Backend
Railway-compatible architecture matching CV and Letters
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional

app = FastAPI(
    title="Phoenix Website",
    description="Phoenix AI Ecosystem - Main Website",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phoenix ecosystem service URLs
PHOENIX_SERVICES = {
    "letters": "https://phoenix-letters-production.up.railway.app",
    "cv": "https://phoenix-cv-production.up.railway.app", 
    "luna-hub": "https://luna-hub-production.up.railway.app"
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