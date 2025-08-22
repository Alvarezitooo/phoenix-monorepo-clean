"""
🔒 Security Middleware Avancé - Phoenix Luna Hub
Directive Oracle #5: Sécurité = Fondation, pas Option
"""

import time
import json
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
import structlog

# Logger structuré
logger = structlog.get_logger()


class SecurityMiddleware:
    """
    🔒 Middleware de sécurité avancé pour Phoenix Luna Hub
    Protection multicouche selon Directive Oracle #5
    """
    
    def __init__(self):
        # Rate limiting par IP
        self.rate_limits: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
        # Tentatives de connexion suspectes
        self.suspicious_ips: Dict[str, int] = defaultdict(int)
        
        # Whitelist/Blacklist
        self.blocked_ips: set = set()
        self.trusted_ips: set = {"127.0.0.1", "::1"}  # Localhost par défaut
        
        # Patterns d'attaque connus
        self.attack_patterns = [
            "union select",
            "script>",
            "../",
            "eval(",
            "exec(",
            "system(",
            "phpinfo",
            "wp-admin",
            ".env",
            "config.php"
        ]
    
    async def __call__(self, request: Request, call_next):
        """
        🔒 Processus de sécurité multicouche
        """
        client_ip = self._get_client_ip(request)
        start_time = time.time()
        
        try:
            # 1. Vérification IP bloquée
            if client_ip in self.blocked_ips:
                logger.warning(
                    "Blocked IP attempted access",
                    ip=client_ip,
                    path=request.url.path
                )
                return self._security_error_response("Access denied")
            
            # 2. Rate Limiting
            if not self._check_rate_limit(client_ip):
                logger.warning(
                    "Rate limit exceeded",
                    ip=client_ip,
                    path=request.url.path
                )
                return self._security_error_response("Rate limit exceeded")
            
            # 3. Détection d'attaques dans l'URL et headers
            if self._detect_attack_patterns(request):
                self._flag_suspicious_ip(client_ip)
                logger.error(
                    "Attack pattern detected",
                    ip=client_ip,
                    path=request.url.path,
                    user_agent=request.headers.get("user-agent", "")
                )
                return self._security_error_response("Malicious request detected")
            
            # 4. Validation headers requis pour les endpoints sensibles
            if request.url.path.startswith("/luna/") and request.method in ["POST", "PUT", "DELETE"]:
                if not self._validate_security_headers(request):
                    logger.warning(
                        "Missing security headers",
                        ip=client_ip,
                        path=request.url.path
                    )
                    return self._security_error_response("Invalid request headers")
            
            # 5. Appel du endpoint suivant
            response = await call_next(request)
            
            # 6. Log de la requête réussie
            processing_time = time.time() - start_time
            logger.info(
                "Request processed",
                ip=client_ip,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                processing_time=round(processing_time, 3)
            )
            
            # 7. Ajout headers de sécurité à la réponse
            self._add_security_headers(response)
            
            return response
            
        except Exception as e:
            logger.error(
                "Security middleware error",
                ip=client_ip,
                path=request.url.path,
                error=str(e)
            )
            return self._security_error_response("Internal security error")
    
    def _get_client_ip(self, request: Request) -> str:
        """Récupère l'IP réelle du client (même derrière proxy)"""
        # Vérification des headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"
    
    def _check_rate_limit(self, ip: str, max_requests: int = 100, window_seconds: int = 60) -> bool:
        """
        🚦 Rate limiting par IP
        100 requêtes par minute par défaut
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Nettoyer les anciens timestamps
        while self.rate_limits[ip] and self.rate_limits[ip][0] < window_start:
            self.rate_limits[ip].popleft()
        
        # Vérifier le nombre de requêtes
        if len(self.rate_limits[ip]) >= max_requests:
            return False
        
        # Ajouter la nouvelle requête
        self.rate_limits[ip].append(now)
        return True
    
    def _detect_attack_patterns(self, request: Request) -> bool:
        """🚨 Détection de patterns d'attaque"""
        # Vérification URL
        url_path = request.url.path.lower()
        query_params = str(request.url.query).lower()
        
        for pattern in self.attack_patterns:
            if pattern in url_path or pattern in query_params:
                return True
        
        # Vérification User-Agent suspect
        user_agent = request.headers.get("user-agent", "").lower()
        suspicious_agents = ["sqlmap", "nmap", "nikto", "dirb", "gobuster", "burp"]
        
        for agent in suspicious_agents:
            if agent in user_agent:
                return True
        
        # Vérification taille excessive des headers
        for name, value in request.headers.items():
            if len(value) > 8192:  # 8KB max par header
                return True
        
        return False
    
    def _validate_security_headers(self, request: Request) -> bool:
        """✅ Validation des headers de sécurité requis"""
        # Content-Type requis pour POST/PUT
        if request.method in ["POST", "PUT"]:
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                return False
        
        # User-Agent requis (protection contre bots basiques)
        if not request.headers.get("user-agent"):
            return False
        
        # Pas de headers suspects
        suspicious_headers = ["x-forwarded-host", "x-original-host"]
        for header in suspicious_headers:
            if request.headers.get(header):
                return False
        
        return True
    
    def _flag_suspicious_ip(self, ip: str) -> None:
        """🚩 Marque une IP comme suspecte"""
        self.suspicious_ips[ip] += 1
        
        # Bloquer après 5 tentatives suspectes
        if self.suspicious_ips[ip] >= 5:
            self.blocked_ips.add(ip)
            logger.error(
                "IP blocked for suspicious activity",
                ip=ip,
                attempts=self.suspicious_ips[ip]
            )
    
    def _add_security_headers(self, response: Response) -> None:
        """🔒 Ajoute les headers de sécurité à la réponse"""
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            "X-Luna-Security": "enabled"
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
    
    def _security_error_response(self, message: str) -> JSONResponse:
        """🚨 Réponse d'erreur sécurisée standardisée"""
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "error": "security_violation",
                "message": message,
                "timestamp": time.time(),
                "security": "phoenix_luna_guardian"
            },
            headers={
                "X-Luna-Security": "blocked",
                "X-Content-Type-Options": "nosniff"
            }
        )
    
    def get_security_stats(self) -> Dict[str, Any]:
        """📊 Statistiques de sécurité pour monitoring"""
        return {
            "blocked_ips": len(self.blocked_ips),
            "suspicious_ips": len(self.suspicious_ips),
            "active_rate_limits": len(self.rate_limits),
            "trusted_ips": len(self.trusted_ips),
            "security_status": "active"
        }
    
    def whitelist_ip(self, ip: str) -> None:
        """✅ Ajoute une IP à la whitelist"""
        self.trusted_ips.add(ip)
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
        if ip in self.suspicious_ips:
            del self.suspicious_ips[ip]
        
        logger.info("IP whitelisted", ip=ip)
    
    def unblock_ip(self, ip: str) -> None:
        """🔓 Débloque une IP"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
        if ip in self.suspicious_ips:
            del self.suspicious_ips[ip]
        
        logger.info("IP unblocked", ip=ip)


# Instance globale du middleware de sécurité
security_middleware = SecurityMiddleware()