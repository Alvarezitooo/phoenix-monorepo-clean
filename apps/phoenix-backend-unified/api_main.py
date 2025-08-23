"""
🔐 Phoenix Backend Unified - Enterprise Auth Hub
Luna Session Zero Complete Authentication System
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import routers - Enterprise Security by Design
from app.api.auth_endpoints import router as auth_router
from app.api.billing_endpoints import router as billing_router
from app.api.luna_endpoints import router as luna_router
from app.api.monitoring_endpoints import router as monitoring_router
from app.core.logging_config import logger

# Initialize FastAPI app
app = FastAPI(
    title="🔐 Phoenix Backend Unified - Luna Hub",
    description="Enterprise Authentication & Energy Management System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://phoenix.ai",
        "https://letters.phoenix.ai", 
        "https://cv.phoenix.ai",
        "https://aube.phoenix.ai",
        "https://rise.phoenix.ai",
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",
        "http://localhost:8501"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Railway monitoring"""
    return {
        "status": "healthy",
        "service": "phoenix-backend-unified",
        "version": "2.0.0",
        "features": [
            "luna-session-zero",
            "enterprise-auth",
            "multi-device-sessions",
            "refresh-token-rotation",
            "rate-limiting",
            "event-store-audit"
        ]
    }

# Include routers
app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(luna_router)
app.include_router(monitoring_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("🔐 Phoenix Backend Unified - Luna Hub starting...")
    logger.info("✅ Enterprise Authentication System loaded")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    
    logger.info(f"🚀 Starting Phoenix Backend Unified on port {port}")
    
    uvicorn.run(
        "api_main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )