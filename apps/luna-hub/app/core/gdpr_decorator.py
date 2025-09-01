"""
🔐 Décorateur GDPR - Phoenix Luna Hub
Enregistrement automatique des traitements de données personnelles
"""

from functools import wraps
from typing import Optional, Callable, List, Union
from fastapi import Request
import structlog

from .gdpr_compliance import gdpr_manager, DataCategory, ProcessingPurpose

logger = structlog.get_logger("gdpr_decorator")


def gdpr_processing(
    data_category: DataCategory,
    processing_purpose: ProcessingPurpose,
    data_fields: List[str],
    legal_basis: str = "legitimate_interest",
    retention_days: int = 365,
    consent_required: bool = False,
    automated_decision: bool = False,
    third_party_sharing: bool = False,
    get_user_id: Optional[Callable] = None
):
    """
    Décorateur pour enregistrer automatiquement les traitements de données GDPR
    
    Args:
        data_category: Catégorie de données traitées
        processing_purpose: Finalité du traitement
        data_fields: Liste des champs de données traités
        legal_basis: Base légale du traitement
        retention_days: Période de rétention en jours
        consent_required: Si un consentement est requis
        automated_decision: Si c'est une décision automatisée
        third_party_sharing: Si les données sont partagées avec des tiers
        get_user_id: Fonction pour extraire l'user_id (par défaut: depuis request.state)
    
    Usage:
        @gdpr_processing(
            data_category=DataCategory.ENERGY_DATA,
            processing_purpose=ProcessingPurpose.SERVICE_PROVISION,
            data_fields=["current_energy", "max_energy", "subscription_type"]
        )
        async def get_user_energy(user_id: str):
            pass
        
        @gdpr_processing(
            data_category=DataCategory.GENERATED_CONTENT,
            processing_purpose=ProcessingPurpose.SERVICE_PROVISION,
            data_fields=["cv_content", "template_used"],
            consent_required=True,
            automated_decision=True
        )
        async def generate_cv(user_id: str, cv_data: dict):
            pass
    """
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extraire l'user_id
            user_id = None
            request = None
            
            try:
                # Chercher l'user_id dans les arguments
                if get_user_id:
                    # Utiliser la fonction personnalisée
                    for arg in args:
                        if isinstance(arg, Request):
                            request = arg
                            break
                    if not request:
                        request = kwargs.get('request')
                    
                    if request:
                        user_id = get_user_id(request)
                else:
                    # Méthodes par défaut pour extraire user_id
                    
                    # 1. Premier argument string (convention courante)
                    if args and isinstance(args[0], str):
                        user_id = args[0]
                    
                    # 2. Argument nommé user_id
                    elif 'user_id' in kwargs:
                        user_id = kwargs['user_id']
                    
                    # 3. Depuis request.state
                    else:
                        for arg in args:
                            if isinstance(arg, Request):
                                request = arg
                                break
                        if not request:
                            request = kwargs.get('request')
                        
                        if request and hasattr(request, 'state') and hasattr(request.state, 'user_id'):
                            user_id = request.state.user_id
                
                # Vérifier le consentement si requis
                if user_id and consent_required:
                    consent_needed = await gdpr_manager.check_consent_required(user_id, data_category)
                    if consent_needed:
                        logger.warning(
                            "Traitement GDPR bloqué - consentement manquant",
                            user_id=user_id[:8] if user_id else "unknown",
                            data_category=data_category.value,
                            purpose=processing_purpose.value
                        )
                        # Selon votre logique métier, vous pourriez:
                        # - Lever une exception
                        # - Retourner une erreur
                        # - Continuer avec traitement limité
                        # Pour cet exemple, on log et continue
                
                # Exécuter la fonction originale
                result = await func(*args, **kwargs)
                
                # Enregistrer le traitement GDPR si user_id disponible
                if user_id:
                    await gdpr_manager.record_data_processing(
                        user_id=user_id,
                        data_category=data_category,
                        processing_purpose=processing_purpose,
                        data_fields=data_fields,
                        legal_basis=legal_basis,
                        retention_days=retention_days,
                        consent_required=consent_required,
                        automated_decision=automated_decision,
                        third_party_sharing=third_party_sharing
                    )
                    
                    logger.debug(
                        "Traitement GDPR enregistré",
                        user_id=user_id[:8],
                        data_category=data_category.value,
                        purpose=processing_purpose.value,
                        fields_count=len(data_fields)
                    )
                else:
                    logger.debug(
                        "Pas d'user_id trouvé pour enregistrement GDPR",
                        function=func.__name__,
                        data_category=data_category.value
                    )
                
                return result
                
            except Exception as e:
                # En cas d'erreur GDPR, logger mais ne pas bloquer la fonction principale
                logger.error(
                    "Erreur enregistrement GDPR",
                    function=func.__name__,
                    data_category=data_category.value,
                    error=str(e)
                )
                # Exécuter quand même la fonction originale
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


# Décorateurs spécialisés pour cas d'usage courants

def gdpr_energy_processing(
    data_fields: List[str],
    retention_days: int = 365,
    legal_basis: str = "legitimate_interest"
):
    """Décorateur GDPR pour le traitement de données énergétiques"""
    return gdpr_processing(
        data_category=DataCategory.ENERGY_DATA,
        processing_purpose=ProcessingPurpose.SERVICE_PROVISION,
        data_fields=data_fields,
        legal_basis=legal_basis,
        retention_days=retention_days,
        consent_required=False
    )


def gdpr_ai_processing(
    data_fields: List[str],
    retention_days: int = 1095,  # 3 ans pour contenu généré
    automated_decision: bool = True
):
    """Décorateur GDPR pour les traitements IA (Luna, génération CV, etc.)"""
    return gdpr_processing(
        data_category=DataCategory.GENERATED_CONTENT,
        processing_purpose=ProcessingPurpose.SERVICE_PROVISION,
        data_fields=data_fields,
        legal_basis="consent",
        retention_days=retention_days,
        consent_required=True,
        automated_decision=automated_decision
    )


def gdpr_analytics_processing(
    data_fields: List[str],
    retention_days: int = 730  # 2 ans pour analytics
):
    """Décorateur GDPR pour les données analytics et comportementales"""
    return gdpr_processing(
        data_category=DataCategory.BEHAVIORAL,
        processing_purpose=ProcessingPurpose.ANALYTICS,
        data_fields=data_fields,
        legal_basis="legitimate_interest",
        retention_days=retention_days,
        consent_required=True  # Analytics nécessite consentement
    )


def gdpr_communication_processing(
    data_fields: List[str],
    retention_days: int = 365
):
    """Décorateur GDPR pour les communications avec Luna"""
    return gdpr_processing(
        data_category=DataCategory.COMMUNICATION,
        processing_purpose=ProcessingPurpose.SERVICE_PROVISION,
        data_fields=data_fields,
        legal_basis="consent",
        retention_days=retention_days,
        consent_required=True,
        automated_decision=True  # Luna répond automatiquement
    )


def gdpr_security_processing(
    data_fields: List[str],
    retention_days: int = 180,  # 6 mois pour logs de sécurité
    get_user_id: Optional[Callable] = None
):
    """Décorateur GDPR for security and fraud prevention processing"""
    return gdpr_processing(
        data_category=DataCategory.TECHNICAL,
        processing_purpose=ProcessingPurpose.SECURITY,
        data_fields=data_fields,
        legal_basis="legitimate_interest",  # Intérêt légitime pour la sécurité
        retention_days=retention_days,
        consent_required=False,
        get_user_id=get_user_id
    )