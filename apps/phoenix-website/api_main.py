"""
🚀 Phoenix Website - FastAPI Backend
Railway-compatible architecture matching CV and Letters
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

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

# Health check endpoint (required by Railway)
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "phoenix-website"}

# Mount static files (React build output)
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    # Serve index.html for all routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't serve index.html for API routes or assets
        if full_path.startswith(("api", "health", "assets")):
            return {"error": "Not found"}
        return FileResponse("dist/index.html")
else:
    @app.get("/")
    async def fallback():
        return {"message": "Phoenix Website - Build in progress"}