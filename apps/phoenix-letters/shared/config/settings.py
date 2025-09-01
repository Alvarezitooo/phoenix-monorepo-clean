"""
Configuration centralisée Phoenix Letters
Approche Clean Architecture - Configuration robuste et typée
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

def _get_secure_secret_token() -> str:
    """🔐 Helper pour secret token sécurisé"""
    secret = os.getenv("API_SECRET_TOKEN")
    if not secret:
        env = os.getenv("ENVIRONMENT", "development")
        if env == "production":
            raise ValueError("API_SECRET_TOKEN environment variable is required in production")
        else:
            # Dev fallback avec warning explicite
            import logging
            logging.getLogger(__name__).warning("Using insecure dev secret - set API_SECRET_TOKEN for production")
            return "dev-secret-change-in-prod"
    return secret


@dataclass(frozen=True)
class AISettings:
    """Configuration IA - Gemini et autres services"""
    
    google_api_key: Optional[str] = field(default_factory=lambda: os.getenv("GOOGLE_API_KEY"))
    model_name: str = "gemini-1.5-flash"
    max_tokens: int = 2048
    temperature: float = 0.7
    timeout_seconds: int = 30
    
    @property
    def is_configured(self) -> bool:
        """Vérifie si l'IA est correctement configurée"""
        return bool(self.google_api_key)


@dataclass(frozen=True)
class DatabaseSettings:
    """Configuration base de données"""
    
    supabase_url: Optional[str] = field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    supabase_anon_key: Optional[str] = field(default_factory=lambda: os.getenv("SUPABASE_ANON_KEY"))
    connection_timeout: int = 10
    max_connections: int = 5
    
    @property
    def is_configured(self) -> bool:
        """Vérifie si la DB est correctement configurée"""
        return bool(self.supabase_url and self.supabase_anon_key)


@dataclass(frozen=True)
class AuthSettings:
    """Configuration authentification"""
    
    secret_token: str = field(default_factory=lambda: _get_secure_secret_token())
    session_timeout_hours: int = 24
    max_login_attempts: int = 5
    
    
@dataclass(frozen=True)
class PaymentSettings:
    """Configuration paiements Stripe"""
    
    stripe_secret_key: Optional[str] = field(default_factory=lambda: os.getenv("STRIPE_SECRET_KEY"))
    letters_price_id: Optional[str] = field(default_factory=lambda: os.getenv("STRIPE_LETTERS_PRICE_ID"))
    bundle_price_id: Optional[str] = field(default_factory=lambda: os.getenv("STRIPE_BUNDLE_PRICE_ID"))
    webhook_secret: Optional[str] = field(default_factory=lambda: os.getenv("STRIPE_WEBHOOK_SECRET"))
    
    @property
    def is_configured(self) -> bool:
        """Vérifie si Stripe est correctement configuré"""
        return bool(self.stripe_secret_key)


@dataclass(frozen=True)
class AppSettings:
    """Configuration générale de l'application"""
    
    app_name: str = "Phoenix Letters"
    version: str = "2.0.0"
    environment: str = field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    debug: bool = field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    
    # Limites utilisateur
    free_letters_per_month: int = 3
    premium_letters_per_month: int = -1  # -1 = illimité
    
    # URLs externes
    backend_api_url: Optional[str] = field(default_factory=lambda: os.getenv("BACKEND_API_URL"))
    iris_api_url: Optional[str] = field(default_factory=lambda: os.getenv("IRIS_API_URL"))
    luna_hub_url: Optional[str] = field(default_factory=lambda: os.getenv("LUNA_HUB_URL"))
    
    @property
    def is_production(self) -> bool:
        """Vérifie si on est en production"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Vérifie si on est en développement"""
        return self.environment.lower() == "development"


@dataclass(frozen=True)
class PhoenixLettersConfig:
    """Configuration principale centralisée - Immutable et typée"""
    
    app: AppSettings = field(default_factory=AppSettings)
    ai: AISettings = field(default_factory=AISettings)
    database: DatabaseSettings = field(default_factory=DatabaseSettings)
    auth: AuthSettings = field(default_factory=AuthSettings)
    payment: PaymentSettings = field(default_factory=PaymentSettings)
    
    def validate(self) -> list[str]:
        """
        Validation complète de la configuration
        Returns: Liste des erreurs de configuration
        """
        errors = []
        
        # Validation IA (critique)
        if not self.ai.is_configured:
            errors.append("GOOGLE_API_KEY manquant - IA indisponible")
        
        # Validation production
        if self.app.is_production:
            if not self.database.is_configured:
                errors.append("Configuration Supabase manquante en production")
            if not self.payment.is_configured:
                errors.append("Configuration Stripe manquante en production")
            if not self.app.luna_hub_url:
                errors.append("LUNA_HUB_URL manquant en production - requis pour GeminiService")
            if self.auth.secret_token == "dev-secret-change-in-prod":
                errors.append("Secret token de développement en production")
        
        return errors
    
    @property
    def is_valid(self) -> bool:
        """Vérifie si la configuration est valide"""
        return len(self.validate()) == 0
    
    def get_summary(self) -> dict:
        """Résumé de l'état de la configuration pour diagnostics"""
        return {
            "app_name": self.app.app_name,
            "version": self.app.version,
            "environment": self.app.environment,
            "ai_configured": self.ai.is_configured,
            "database_configured": self.database.is_configured,
            "payment_configured": self.payment.is_configured,
            "is_valid": self.is_valid,
            "errors": self.validate()
        }


# Instance globale - Pattern Singleton
def get_config() -> PhoenixLettersConfig:
    """Factory pour obtenir la configuration (Singleton pattern)"""
    if not hasattr(get_config, "_instance"):
        get_config._instance = PhoenixLettersConfig()
    return get_config._instance


# Export principal
config = get_config()