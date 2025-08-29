"""
🔒 Phoenix Aube - Security Module  
Fail-secure validation and request sanitization
"""

import re
from typing import Any, Dict, Optional
from fastapi import HTTPException, status, Request
import structlog

logger = structlog.get_logger("aube_security")


class AubeSecurityError(Exception):
    """Exception de sécurité Phoenix Aube"""
    pass


def validate_user_id(user_id: str) -> str:
    """
    🔍 Valide et nettoie un ID utilisateur avec fail-secure
    
    Args:
        user_id: ID utilisateur à valider
        
    Returns:
        str: ID utilisateur nettoyé et validé
        
    Raises:
        ValueError: Si l'ID est invalide
    """
    if not user_id or not isinstance(user_id, str):
        raise ValueError("User ID must be a non-empty string")
    
    # Nettoyage et validation
    cleaned_id = user_id.strip()
    
    if not cleaned_id:
        raise ValueError("User ID cannot be empty after cleaning")
    
    if len(cleaned_id) > 50:
        raise ValueError("User ID too long (max 50 characters)")
    
    # Pattern sécurisé : alphanumerique + tirets/underscores seulement
    if not re.match(r'^[a-zA-Z0-9_-]+$', cleaned_id):
        raise ValueError("User ID contains invalid characters")
    
    return cleaned_id


def validate_signals_data(signals: Dict[str, Any]) -> Dict[str, Any]:
    """
    🧠 Valide et nettoie les données de signaux psychologiques
    
    Args:
        signals: Données de signaux à valider
        
    Returns:
        Dict: Signaux validés et nettoyés
    """
    if not isinstance(signals, dict):
        raise ValueError("Signals must be a dictionary")
    
    validated_signals = {}
    
    # Validation appétences (people vs data)
    if "appetences" in signals:
        appetences = signals["appetences"]
        if isinstance(appetences, dict):
            validated_appetences = {}
            for key, value in appetences.items():
                if key in ["people", "data"] and isinstance(value, (int, float)):
                    # Clamp values entre 0 et 100
                    validated_appetences[key] = max(0, min(100, float(value)))
            validated_signals["appetences"] = validated_appetences
    
    # Validation valeurs (top 2 values)
    if "valeurs_top2" in signals:
        valeurs = signals["valeurs_top2"]
        if isinstance(valeurs, list):
            validated_valeurs = []
            for valeur in valeurs[:2]:  # Max 2 valeurs
                if isinstance(valeur, str) and valeur.strip():
                    # Nettoyage et longueur limitée
                    clean_valeur = valeur.strip()[:100]
                    validated_valeurs.append(clean_valeur)
            validated_signals["valeurs_top2"] = validated_valeurs
    
    # Validation environnement de travail
    if "environnement" in signals:
        env = signals["environnement"]
        if isinstance(env, dict):
            validated_env = {}
            allowed_env_keys = ["taille_equipe", "flexibilite", "hierarchie", "innovation"]
            for key, value in env.items():
                if key in allowed_env_keys and isinstance(value, (int, float)):
                    validated_env[key] = max(0, min(100, float(value)))
            if validated_env:
                validated_signals["environnement"] = validated_env
    
    # Validation autonomie
    if "autonomie" in signals:
        autonomie = signals["autonomie"]
        if isinstance(autonomie, (int, float)):
            validated_signals["autonomie"] = max(0, min(100, float(autonomie)))
    
    # Validation créativité
    if "creativite" in signals:
        creativite = signals["creativite"]
        if isinstance(creativite, (int, float)):
            validated_signals["creativite"] = max(0, min(100, float(creativite)))
    
    # Validation stabilité
    if "stabilite" in signals:
        stabilite = signals["stabilite"]
        if isinstance(stabilite, (int, float)):
            validated_signals["stabilite"] = max(0, min(100, float(stabilite)))
    
    return validated_signals


def sanitize_context(context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    🧹 Nettoie et valide les données de contexte
    
    Args:
        context: Données de contexte à nettoyer
        
    Returns:
        Dict: Contexte nettoyé et sécurisé
    """
    if not context:
        return {}
    
    if not isinstance(context, dict):
        return {}
    
    sanitized = {}
    
    # Clés autorisées pour le contexte
    allowed_keys = [
        "experience_years", "current_sector", "education_level",
        "location", "mobility", "salary_expectations", "transition_timeline",
        "family_constraints", "preferred_company_size"
    ]
    
    for key, value in context.items():
        if key in allowed_keys:
            if isinstance(value, str):
                # Nettoyage string avec limite de longueur
                clean_value = value.strip()[:200]
                if clean_value:
                    sanitized[key] = clean_value
            elif isinstance(value, (int, float)):
                # Validation numérique avec limites raisonnables
                if key == "experience_years":
                    sanitized[key] = max(0, min(50, int(value)))
                elif key == "salary_expectations":
                    sanitized[key] = max(0, min(500000, int(value)))
                else:
                    sanitized[key] = value
            elif isinstance(value, bool):
                sanitized[key] = value
    
    return sanitized


async def ensure_request_is_clean(request: Request) -> None:
    """
    🛡️ Middleware de sécurité pour nettoyer les requêtes entrantes
    
    Args:
        request: Requête FastAPI à valider
        
    Raises:
        HTTPException: Si la requête est suspecte
    """
    try:
        # Vérification basique de l'User-Agent
        user_agent = request.headers.get("user-agent", "")
        if not user_agent or len(user_agent) < 10:
            logger.warning("Suspicious request: missing or short user-agent", 
                         ip=request.client.host if request.client else "unknown")
        
        # Vérification de la longueur des headers (protection contre header injection)
        total_header_length = sum(len(str(k)) + len(str(v)) for k, v in request.headers.items())
        if total_header_length > 8192:  # 8KB limit
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Headers too large"
            )
        
        # Log sécurisé de la requête
        logger.info("Request security check passed",
                   method=request.method,
                   path=request.url.path,
                   ip=request.client.host if request.client else "unknown")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Security check error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security validation failed"
        )


def validate_assessment_completeness(signals: Dict[str, Any]) -> Dict[str, Any]:
    """
    ✅ Valide que l'assessment a suffisamment de données pour être fiable
    
    Args:
        signals: Signaux à valider
        
    Returns:
        Dict: Résultat de validation avec score de complétude
    """
    required_fields = ["appetences", "valeurs_top2"]
    optional_fields = ["environnement", "autonomie", "creativite", "stabilite"]
    
    # Vérification des champs obligatoires
    missing_required = []
    for field in required_fields:
        if field not in signals or not signals[field]:
            missing_required.append(field)
    
    # Score de complétude
    total_possible = len(required_fields) + len(optional_fields)
    present_fields = len([f for f in required_fields + optional_fields if f in signals and signals[f]])
    completeness_score = present_fields / total_possible
    
    # Évaluation de la qualité des données
    quality_issues = []
    
    if "appetences" in signals:
        appetences = signals["appetences"]
        if isinstance(appetences, dict):
            people_score = appetences.get("people", 0)
            data_score = appetences.get("data", 0)
            if people_score == data_score:
                quality_issues.append("Appétences people/data équilibrées (difficile à interpréter)")
    
    if "valeurs_top2" in signals:
        valeurs = signals["valeurs_top2"]
        if isinstance(valeurs, list) and len(valeurs) < 2:
            quality_issues.append("Moins de 2 valeurs spécifiées")
    
    return {
        "is_complete": len(missing_required) == 0,
        "completeness_score": completeness_score,
        "missing_required": missing_required,
        "quality_issues": quality_issues,
        "min_score_for_matching": 0.6  # 60% minimum pour un matching fiable
    }


# ============================================================================
# UTILITAIRES DE LOGGING SÉCURISÉ
# ============================================================================

def secure_log_user_action(user_id: str, action: str, details: Dict[str, Any] = None) -> None:
    """
    📝 Log sécurisé d'action utilisateur (sans données sensibles)
    
    Args:
        user_id: ID utilisateur (sera masqué partiellement)
        action: Action effectuée
        details: Détails non-sensibles à logger
    """
    try:
        # Masquage partiel de l'ID utilisateur pour la confidentialité
        masked_user_id = user_id[:3] + "*" * (len(user_id) - 6) + user_id[-3:] if len(user_id) > 6 else "***"
        
        # Nettoyage des détails pour éviter les logs de données sensibles
        safe_details = {}
        if details:
            safe_keys = ["action_duration", "matching_count", "confidence_score", "algorithm_version"]
            safe_details = {k: v for k, v in details.items() if k in safe_keys}
        
        logger.info("User action logged",
                   masked_user_id=masked_user_id,
                   action=action,
                   **safe_details)
                   
    except Exception as e:
        logger.error("Secure logging error", error=str(e))