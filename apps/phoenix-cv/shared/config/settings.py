"""
🔥 Phoenix CV - Configuration centralisée
Clean Architecture - Configuration robuste et typée
"""

import os
from dataclasses import dataclass, field
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()


@dataclass(frozen=True)
class AISettings:
    """Configuration IA - Gemini et services d'analyse"""
    
    google_api_key: Optional[str] = field(default_factory=lambda: os.getenv("GOOGLE_API_KEY"))
    model_name: str = "gemini-1.5-flash"
    max_tokens: int = 4096
    temperature: float = 0.3  # Plus conservative pour l'analyse CV
    timeout_seconds: int = 45
    
    # Configuration spécifique Mirror Match
    mirror_match_model: str = "gemini-1.5-pro"  # Modèle plus puissant pour l'analyse
    ats_analysis_model: str = "gemini-1.5-flash"  # Plus rapide pour ATS
    
    @property
    def is_configured(self) -> bool:
        """Vérifie si l'IA est correctement configurée"""
        return bool(self.google_api_key)


@dataclass(frozen=True)
class DatabaseSettings:
    """Configuration base de données"""
    
    supabase_url: Optional[str] = field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    supabase_anon_key: Optional[str] = field(default_factory=lambda: os.getenv("SUPABASE_ANON_KEY"))
    connection_timeout: int = 15
    max_connections: int = 10
    
    @property
    def is_configured(self) -> bool:
        """Vérifie si la DB est correctement configurée"""
        return bool(self.supabase_url and self.supabase_anon_key)


@dataclass(frozen=True)
class ProcessingSettings:
    """Configuration traitement et performances"""
    
    # Limites Mirror Match
    max_job_description_length: int = 10000
    min_job_description_length: int = 50
    max_concurrent_analyses: int = 5
    
    # Limites ATS
    max_cv_sections: int = 15
    max_suggestions_per_analysis: int = 20
    
    # Cache et performance
    analysis_cache_ttl_hours: int = 24
    max_analysis_history_per_cv: int = 50
    
    # Timeouts
    mirror_match_timeout_seconds: int = 120
    ats_analysis_timeout_seconds: int = 60
    trajectory_build_timeout_seconds: int = 90


@dataclass(frozen=True)
class FeatureFlags:
    """Flags de fonctionnalités"""
    
    # Features principales
    mirror_match_enabled: bool = field(default_factory=lambda: os.getenv("MIRROR_MATCH_ENABLED", "true").lower() == "true")
    ats_optimization_enabled: bool = field(default_factory=lambda: os.getenv("ATS_OPTIMIZATION_ENABLED", "true").lower() == "true")
    trajectory_builder_enabled: bool = field(default_factory=lambda: os.getenv("TRAJECTORY_BUILDER_ENABLED", "true").lower() == "true")
    
    # Features expérimentales
    salary_insights_enabled: bool = field(default_factory=lambda: os.getenv("SALARY_INSIGHTS_ENABLED", "false").lower() == "true")
    culture_fit_analysis_enabled: bool = field(default_factory=lambda: os.getenv("CULTURE_FIT_ENABLED", "true").lower() == "true")
    automated_fixes_enabled: bool = field(default_factory=lambda: os.getenv("AUTOMATED_FIXES_ENABLED", "false").lower() == "true")
    
    # Analytics et monitoring
    detailed_logging_enabled: bool = field(default_factory=lambda: os.getenv("DETAILED_LOGGING_ENABLED", "false").lower() == "true")
    performance_monitoring_enabled: bool = field(default_factory=lambda: os.getenv("PERFORMANCE_MONITORING_ENABLED", "true").lower() == "true")


@dataclass(frozen=True)
class QuotaSettings:
    """Configuration quotas utilisateur"""
    
    # Quotas gratuits
    free_mirror_matches_per_month: int = 3
    free_ats_analyses_per_month: int = 5
    free_cv_optimizations_per_month: int = 2
    
    # Quotas premium
    premium_mirror_matches_per_month: int = 50
    premium_ats_analyses_per_month: int = -1  # Illimité
    premium_cv_optimizations_per_month: int = -1  # Illimité
    
    # Quotas enterprise
    enterprise_mirror_matches_per_month: int = -1  # Illimité
    enterprise_ats_analyses_per_month: int = -1  # Illimité
    enterprise_cv_optimizations_per_month: int = -1  # Illimité
    
    # Limites de rate limiting
    requests_per_minute: int = 20
    requests_per_hour: int = 200


@dataclass(frozen=True)
class AppSettings:
    """Configuration générale de l'application"""
    
    app_name: str = "Phoenix CV"
    version: str = "1.0.0"
    environment: str = field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    debug: bool = field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    
    # URLs et intégrations
    api_base_url: Optional[str] = field(default_factory=lambda: os.getenv("API_BASE_URL"))
    frontend_url: Optional[str] = field(default_factory=lambda: os.getenv("FRONTEND_URL"))
    webhook_base_url: Optional[str] = field(default_factory=lambda: os.getenv("WEBHOOK_BASE_URL"))
    
    # Templates et exports
    default_cv_template: str = "modern"
    supported_export_formats: List[str] = field(default_factory=lambda: ["pdf", "docx", "txt"])
    
    # Sécurité
    cors_origins: List[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(","))
    max_file_size_mb: int = 10
    
    @property
    def is_production(self) -> bool:
        """Vérifie si on est en production"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Vérifie si on est en développement"""
        return self.environment.lower() == "development"


@dataclass(frozen=True)
class PhoenixCVConfig:
    """Configuration principale centralisée - Immutable et typée"""
    
    app: AppSettings = field(default_factory=AppSettings)
    ai: AISettings = field(default_factory=AISettings)
    database: DatabaseSettings = field(default_factory=DatabaseSettings)
    processing: ProcessingSettings = field(default_factory=ProcessingSettings)
    features: FeatureFlags = field(default_factory=FeatureFlags)
    quotas: QuotaSettings = field(default_factory=QuotaSettings)
    
    def validate(self) -> List[str]:
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
            if not self.app.api_base_url:
                errors.append("API_BASE_URL manquant en production")
            if self.app.debug:
                errors.append("Mode debug activé en production")
        
        # Validation des features critiques
        critical_features = [
            self.features.mirror_match_enabled,
            self.features.ats_optimization_enabled
        ]
        if not any(critical_features):
            errors.append("Au moins une feature principale doit être activée")
        
        # Validation des quotas
        if self.quotas.free_mirror_matches_per_month <= 0:
            errors.append("Quotas gratuits Mirror Match invalides")
        
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
            "features_enabled": {
                "mirror_match": self.features.mirror_match_enabled,
                "ats_optimization": self.features.ats_optimization_enabled,
                "trajectory_builder": self.features.trajectory_builder_enabled,
            },
            "is_valid": self.is_valid,
            "errors": self.validate()
        }
    
    def get_feature_config(self) -> dict:
        """Configuration des features pour l'API"""
        return {
            "mirror_match": {
                "enabled": self.features.mirror_match_enabled,
                "timeout": self.processing.mirror_match_timeout_seconds,
                "model": self.ai.mirror_match_model
            },
            "ats_optimization": {
                "enabled": self.features.ats_optimization_enabled,
                "timeout": self.processing.ats_analysis_timeout_seconds,
                "model": self.ai.ats_analysis_model,
                "max_suggestions": self.processing.max_suggestions_per_analysis
            },
            "trajectory_builder": {
                "enabled": self.features.trajectory_builder_enabled,
                "timeout": self.processing.trajectory_build_timeout_seconds
            },
            "experimental": {
                "salary_insights": self.features.salary_insights_enabled,
                "culture_fit": self.features.culture_fit_analysis_enabled,
                "automated_fixes": self.features.automated_fixes_enabled
            }
        }


# Instance globale - Pattern Singleton
def get_config() -> PhoenixCVConfig:
    """Factory pour obtenir la configuration (Singleton pattern)"""
    if not hasattr(get_config, "_instance"):
        get_config._instance = PhoenixCVConfig()
    return get_config._instance


# Export principal
config = get_config()