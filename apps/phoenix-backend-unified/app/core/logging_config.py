"""
📊 Configuration Logs Structurés - Phoenix Luna Hub
Observabilité production selon standards Oracle
"""

import os
import sys
import structlog
from typing import Any, Dict
from datetime import datetime


def configure_structured_logging():
    """
    📊 Configure les logs structurés JSON pour production
    Observabilité complète conforme aux standards Oracle
    """
    
    # Configuration selon l'environnement
    environment = os.getenv("ENVIRONMENT", "development")
    log_level = os.getenv("LOG_LEVEL", "info").upper()
    
    # Processeurs pour structlog
    processors = [
        # Ajout métadonnées système
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        
        # Processeur custom Phoenix
        add_phoenix_metadata,
        
        # Stacktrace pour les erreurs
        structlog.processors.StackInfoRenderer(),
    ]
    
    if environment == "production":
        # Production: JSON structuré
        processors.append(structlog.processors.JSONRenderer())
    else:
        # Développement: Format coloré lisible
        processors.append(structlog.dev.ConsoleRenderer())
    
    # Configuration structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configuration du logger Python standard
    import logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level, logging.INFO)
    )


def add_phoenix_metadata(logger, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    🌙 Ajoute les métadonnées Phoenix à chaque log
    """
    event_dict.update({
        "service": "phoenix-luna-hub",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "port": os.getenv("PORT", "8003"),
        "oracle_compliant": True
    })
    
    return event_dict


class PerformanceLogger:
    """
    ⚡ Logger de performance pour monitoring
    """
    
    def __init__(self):
        self.logger = structlog.get_logger("performance")
    
    def log_api_call(
        self, 
        endpoint: str, 
        method: str, 
        duration: float, 
        status_code: int,
        user_id: str = None,
        ip: str = None
    ):
        """Log d'appel API avec métriques"""
        self.logger.info(
            "API call completed",
            endpoint=endpoint,
            method=method,
            duration_ms=round(duration * 1000, 2),
            status_code=status_code,
            user_id=user_id,
            client_ip=ip,
            performance_tier=self._get_performance_tier(duration)
        )
    
    def log_energy_action(
        self,
        user_id: str,
        action: str,
        energy_consumed: float,
        subscription_type: str,
        duration: float
    ):
        """Log d'action énergie avec métriques business"""
        self.logger.info(
            "Energy action performed",
            user_id=user_id,
            action=action,
            energy_consumed=energy_consumed,
            subscription_type=subscription_type,
            duration_ms=round(duration * 1000, 2),
            business_impact=self._calculate_business_impact(energy_consumed, subscription_type)
        )
    
    def log_event_store_operation(
        self,
        operation: str,
        user_id: str,
        event_type: str,
        duration: float,
        success: bool
    ):
        """Log d'opération Event Store"""
        self.logger.info(
            "Event Store operation",
            operation=operation,
            user_id=user_id,
            event_type=event_type,
            duration_ms=round(duration * 1000, 2),
            success=success,
            capital_narratif_impact=True
        )
    
    def _get_performance_tier(self, duration: float) -> str:
        """Classifie la performance de l'API"""
        if duration < 0.1:
            return "excellent"
        elif duration < 0.5:
            return "good"
        elif duration < 1.0:
            return "acceptable"
        else:
            return "slow"
    
    def _calculate_business_impact(self, energy_consumed: float, subscription_type: str) -> str:
        """Calcule l'impact business d'une action"""
        if subscription_type == "unlimited":
            return "retention_high"
        elif energy_consumed > 20:
            return "revenue_potential"
        else:
            return "engagement_standard"


class SecurityLogger:
    """
    🔒 Logger spécialisé pour les événements de sécurité
    """
    
    def __init__(self):
        self.logger = structlog.get_logger("security")
    
    def log_security_event(
        self,
        event_type: str,
        ip: str,
        severity: str = "info",
        details: Dict[str, Any] = None
    ):
        """Log d'événement de sécurité"""
        log_method = getattr(self.logger, severity, self.logger.info)
        
        log_method(
            "Security event",
            event_type=event_type,
            client_ip=ip,
            severity=severity,
            oracle_directive_5=True,
            **details or {}
        )
    
    def log_rate_limit(self, ip: str, endpoint: str, attempts: int):
        """Log de dépassement rate limit"""
        self.log_security_event(
            "rate_limit_exceeded",
            ip,
            "warning",
            {"endpoint": endpoint, "attempts": attempts}
        )
    
    def log_attack_attempt(self, ip: str, pattern: str, endpoint: str):
        """Log de tentative d'attaque"""
        self.log_security_event(
            "attack_attempt",
            ip,
            "error",
            {"attack_pattern": pattern, "endpoint": endpoint}
        )
    
    def log_ip_blocked(self, ip: str, reason: str):
        """Log de blocage IP"""
        self.log_security_event(
            "ip_blocked",
            ip,
            "error",
            {"block_reason": reason}
        )


class BusinessLogger:
    """
    💼 Logger pour métriques business et analytics
    """
    
    def __init__(self):
        self.logger = structlog.get_logger("business")
    
    def log_user_onboarding(self, user_id: str, source: str):
        """Log d'onboarding utilisateur"""
        self.logger.info(
            "User onboarded",
            user_id=user_id,
            acquisition_source=source,
            funnel_stage="onboarding",
            business_metric="user_acquisition"
        )
    
    def log_energy_purchase(
        self,
        user_id: str,
        pack_type: str,
        amount_euro: float,
        energy_amount: float
    ):
        """Log d'achat d'énergie"""
        self.logger.info(
            "Energy purchase completed",
            user_id=user_id,
            pack_type=pack_type,
            revenue_euro=amount_euro,
            energy_amount=energy_amount,
            business_metric="revenue",
            funnel_stage="monetization"
        )
    
    def log_feature_usage(
        self,
        user_id: str,
        feature: str,
        app_source: str,
        subscription_type: str
    ):
        """Log d'utilisation de fonctionnalité"""
        self.logger.info(
            "Feature used",
            user_id=user_id,
            feature=feature,
            app_source=app_source,
            subscription_type=subscription_type,
            business_metric="engagement",
            product_analytics=True
        )


# Instances globales des loggers spécialisés
performance_logger = PerformanceLogger()
security_logger = SecurityLogger()
business_logger = BusinessLogger()


# Configuration automatique au chargement du module
configure_structured_logging()

# Logger principal structuré
logger = structlog.get_logger("phoenix_luna_hub")