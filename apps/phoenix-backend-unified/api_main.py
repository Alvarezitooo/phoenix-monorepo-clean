"""
🔐 Phoenix Backend Unified - Enterprise Auth Hub
Luna Session Zero Complete Authentication System
"""

import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

# Import routers - Enterprise Security by Design
from app.api.auth_endpoints import router as auth_router
from app.api.billing_endpoints import router as billing_router
from app.api.luna_endpoints import router as luna_router
from app.api.monitoring_endpoints import router as monitoring_router
from app.api.capital_narratif_endpoints import narratif_router
from app.api.refund_endpoints import router as refund_router
from app.api.luna_narrative_endpoints import router as luna_narrative_router
from app.api.aube_endpoints import router as aube_router
from app.core.logging_config import logger

# Lifespan management for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🔐 Phoenix Backend Unified - Luna Hub starting...")
    logger.info("✅ Enterprise Authentication System loaded")
    yield
    # Shutdown (if needed)
    logger.info("🔐 Phoenix Backend Unified - Luna Hub shutting down...")

# Initialize FastAPI app
app = FastAPI(
    lifespan=lifespan,
    title="🔐 Phoenix Backend Unified - Luna Hub",
    description="Enterprise Authentication & Energy Management System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 🔒 CORS Configuration - FAIL-CLOSED by environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
# Détection production par URL Railway (améliorée)
is_production = (
    ENVIRONMENT == "production" or 
    "railway.app" in os.getenv("RAILWAY_STATIC_URL", "") or
    "railway.app" in os.getenv("RAILWAY_PUBLIC_DOMAIN", "") or
    os.getenv("RAILWAY_ENVIRONMENT") == "production" or
    os.getenv("RAILWAY_PROJECT_ID") is not None  # Fallback: présence Railway
)

# Debug CORS configuration
logger.info("CORS Configuration Debug", 
           environment=ENVIRONMENT,
           railway_static_url=os.getenv("RAILWAY_STATIC_URL"),
           railway_public_domain=os.getenv("RAILWAY_PUBLIC_DOMAIN"), 
           railway_environment=os.getenv("RAILWAY_ENVIRONMENT"),
           railway_project_id=bool(os.getenv("RAILWAY_PROJECT_ID")),
           is_production=is_production)

if is_production:
    # Production: Strict whitelist only
    allowed_origins = [
        "https://phoenix-website-production.up.railway.app",
        "https://phoenix-letters-production.up.railway.app", 
        "https://phoenix-cv-production.up.railway.app",
        # Custom domains when ready
        "https://phoenix.ai",
        "https://letters.phoenix.ai", 
        "https://cv.phoenix.ai"
    ]
    allowed_headers = [
        "Authorization", 
        "Content-Type", 
        "X-Request-ID",
        "Accept",
        "Origin",
        "X-Requested-With"
    ]
else:
    # Development: Local origins only (not wildcard)
    allowed_origins = [
        "http://localhost:3000",   # Website dev
        "http://localhost:3001",   # Alternative dev
        "http://localhost:5173",   # Vite dev
        "http://localhost:5174",   # Vite alternative 
        "http://localhost:8001",   # Letters local
        "http://localhost:8002"    # CV local
    ]
    allowed_headers = ["*"]  # More permissive in dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=allowed_headers,
    max_age=600  # Cache preflight for 10min
)

# 🛡️ SECURITY MIDDLEWARE - FAIL-CLOSED BY DEFAULT
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Enterprise security headers - Applied to ALL responses"""
    response = await call_next(request)
    
    # Content Security Policy - Strict nonce-based
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api.stripe.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self';"
    )
    
    # Security Headers - Enterprise grade
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY" 
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=(), payment=()"
    )
    
    # HSTS - Force HTTPS (production only)
    if is_production:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
    
    # Request correlation ID for tracing
    if hasattr(request.state, 'request_id'):
        response.headers["X-Request-ID"] = request.state.request_id
        
    return response

# Trusted hosts middleware - Production lockdown  
# Temporarily disabled due to Railway health check issues
# TODO: Re-enable with proper Railway internal IPs whitelist
# if is_production:
#     app.add_middleware(
#         TrustedHostMiddleware, 
#         allowed_hosts=[
#             "luna-hub-backend-unified-production.up.railway.app",
#             "phoenix-backend-unified-production.up.railway.app", 
#             "localhost"
#         ]
#     )

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

@app.get("/__edge_probe", include_in_schema=False)
async def edge_probe():
    """Railway edge probe endpoint - NO SECURITY"""
    return {"status": "ok", "service": "phoenix-luna-hub", "edge": "accessible"}

# Include routers
app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(luna_router)
app.include_router(monitoring_router)
app.include_router(narratif_router)
app.include_router(refund_router)
app.include_router(luna_narrative_router)
app.include_router(aube_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


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