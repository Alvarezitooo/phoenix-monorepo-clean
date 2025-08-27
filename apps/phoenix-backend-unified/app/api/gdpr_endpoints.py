"""
🔐 Endpoints GDPR - Phoenix Luna Hub
API de conformité RGPD pour gestion des consentements et droits utilisateurs
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, field_validator
import structlog

from app.core.security_guardian import ensure_request_is_clean
from app.core.gdpr_compliance import gdpr_manager, ConsentType, DataCategory, ProcessingPurpose
from app.core.rate_limit_decorator import api_rate_limit

logger = structlog.get_logger()

router = APIRouter(prefix="/gdpr", tags=["GDPR Compliance"])


class ConsentRequest(BaseModel):
    """Requête de consentement utilisateur"""
    user_id: str
    consent_type: str
    consent_given: bool
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("user_id ne peut pas être vide")
        return v.strip()
    
    @field_validator('consent_type')
    @classmethod
    def validate_consent_type(cls, v):
        try:
            ConsentType(v)
            return v
        except ValueError:
            valid_types = [ct.value for ct in ConsentType]
            raise ValueError(f"consent_type doit être l'un de: {valid_types}")


class DataProcessingRequest(BaseModel):
    """Requête d'enregistrement de traitement de données"""
    user_id: str
    data_category: str
    processing_purpose: str
    data_fields: List[str]
    legal_basis: str = "legitimate_interest"
    retention_days: int = 365
    consent_required: bool = False
    automated_decision: bool = False
    third_party_sharing: bool = False
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("user_id ne peut pas être vide")
        return v.strip()
    
    @field_validator('data_category')
    @classmethod
    def validate_data_category(cls, v):
        try:
            DataCategory(v)
            return v
        except ValueError:
            valid_categories = [dc.value for dc in DataCategory]
            raise ValueError(f"data_category doit être l'un de: {valid_categories}")
    
    @field_validator('processing_purpose')
    @classmethod
    def validate_processing_purpose(cls, v):
        try:
            ProcessingPurpose(v)
            return v
        except ValueError:
            valid_purposes = [pp.value for pp in ProcessingPurpose]
            raise ValueError(f"processing_purpose doit être l'un de: {valid_purposes}")


@router.post("/consent", dependencies=[Depends(ensure_request_is_clean)])
@api_rate_limit()
async def record_user_consent(
    consent_request: ConsentRequest,
    request: Request
) -> Dict[str, Any]:
    """
    📝 Enregistre le consentement d'un utilisateur
    Conforme GDPR avec traçabilité complète
    """
    
    try:
        consent_type = ConsentType(consent_request.consent_type)
        
        # Extraire IP et user-agent pour traçabilité
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
        user_agent = request.headers.get("user-agent", "")
        
        success = await gdpr_manager.record_user_consent(
            user_id=consent_request.user_id,
            consent_type=consent_type,
            consent_given=consent_request.consent_given,
            client_ip=client_ip,
            user_agent=user_agent
        )
        
        if success:
            return {
                "success": True,
                "message": f"Consentement {consent_type.value} {'accordé' if consent_request.consent_given else 'retiré'} avec succès",
                "consent_type": consent_type.value,
                "consent_given": consent_request.consent_given,
                "user_id": consent_request.user_id[:8] + "***",
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            raise HTTPException(status_code=500, detail="Échec de l'enregistrement du consentement")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Erreur enregistrement consentement", error=str(e))
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/consent/{user_id}")
async def get_user_consent(
    user_id: str,
    consent_type: str = Query(..., description="Type de consentement à vérifier"),
    dependencies=[Depends(ensure_request_is_clean)]
) -> Dict[str, Any]:
    """
    📋 Récupère le statut de consentement actuel d'un utilisateur
    """
    
    try:
        consent_type_enum = ConsentType(consent_type)
        
        current_consent = await gdpr_manager.get_user_consent(user_id, consent_type_enum)
        
        if current_consent:
            return {
                "user_id": user_id[:8] + "***",
                "consent_type": consent_type,
                "consent_given": current_consent.consent_given,
                "consent_timestamp": current_consent.consent_timestamp.isoformat(),
                "consent_version": current_consent.consent_version,
                "withdrawn": current_consent.withdrawal_timestamp is not None,
                "withdrawal_timestamp": current_consent.withdrawal_timestamp.isoformat() if current_consent.withdrawal_timestamp else None,
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            return {
                "user_id": user_id[:8] + "***",
                "consent_type": consent_type,
                "consent_given": False,
                "message": "Aucun consentement enregistré",
                "timestamp": "2025-08-27T11:00:00Z"
            }
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Erreur récupération consentement", user_id=user_id[:8], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/data-processing", dependencies=[Depends(ensure_request_is_clean)])
async def record_data_processing(
    processing_request: DataProcessingRequest
) -> Dict[str, Any]:
    """
    📊 Enregistre un traitement de données personnelles
    Registre des traitements conforme GDPR
    """
    
    try:
        data_category = DataCategory(processing_request.data_category)
        processing_purpose = ProcessingPurpose(processing_request.processing_purpose)
        
        success = await gdpr_manager.record_data_processing(
            user_id=processing_request.user_id,
            data_category=data_category,
            processing_purpose=processing_purpose,
            data_fields=processing_request.data_fields,
            legal_basis=processing_request.legal_basis,
            retention_days=processing_request.retention_days,
            consent_required=processing_request.consent_required,
            automated_decision=processing_request.automated_decision,
            third_party_sharing=processing_request.third_party_sharing
        )
        
        if success:
            return {
                "success": True,
                "message": "Traitement de données enregistré avec succès",
                "user_id": processing_request.user_id[:8] + "***",
                "data_category": data_category.value,
                "processing_purpose": processing_purpose.value,
                "legal_basis": processing_request.legal_basis,
                "retention_days": processing_request.retention_days,
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            raise HTTPException(status_code=500, detail="Échec de l'enregistrement du traitement")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Erreur enregistrement traitement", error=str(e))
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/export/{user_id}", dependencies=[Depends(ensure_request_is_clean)])
async def export_user_data(user_id: str) -> Dict[str, Any]:
    """
    📤 Export des données utilisateur (droit d'accès GDPR)
    Génère un export complet des données personnelles
    """
    
    try:
        export_data = await gdpr_manager.export_user_data(user_id)
        
        if "error" in export_data:
            raise HTTPException(status_code=500, detail=export_data["error"])
        
        # Ajouter métadonnées d'export
        export_data["gdpr_notice"] = {
            "right": "Article 15 - Droit d'accès",
            "description": "Export de vos données personnelles traitées par Phoenix Luna Hub",
            "anonymization_applied": True,
            "retention_info": "Les données sont conservées selon nos politiques de rétention",
            "contact": "gdpr@phoenix-luna.fr"
        }
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erreur export données utilisateur", user_id=user_id[:8], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lors de l'export des données")


@router.delete("/delete/{user_id}", dependencies=[Depends(ensure_request_is_clean)])
async def delete_user_data(
    user_id: str,
    keep_anonymized: bool = Query(True, description="Conserver les données anonymisées pour l'audit"),
    confirmation: str = Query(..., description="Tapez 'CONFIRM_DELETE' pour confirmer")
) -> Dict[str, Any]:
    """
    🗑️ Suppression complète des données utilisateur (droit à l'oubli GDPR)
    
    ⚠️ ATTENTION: Cette action est irréversible !
    """
    
    if confirmation != "CONFIRM_DELETE":
        raise HTTPException(
            status_code=400, 
            detail="Confirmation requise. Utilisez confirmation=CONFIRM_DELETE"
        )
    
    try:
        deletion_summary = await gdpr_manager.delete_user_data(user_id, keep_anonymized)
        
        if "error" in deletion_summary:
            raise HTTPException(status_code=500, detail=deletion_summary["error"])
        
        # Ajouter notice GDPR
        deletion_summary["gdpr_notice"] = {
            "right": "Article 17 - Droit à l'effacement",
            "action": "Suppression complète des données personnelles",
            "anonymization": "Données conservées sous forme anonymisée pour audit" if keep_anonymized else "Toutes données supprimées",
            "irreversible": True
        }
        
        return deletion_summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erreur suppression données utilisateur", user_id=user_id[:8], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression des données")


@router.post("/cleanup", dependencies=[Depends(ensure_request_is_clean)])
async def cleanup_expired_data() -> Dict[str, Any]:
    """
    🧹 Nettoyage automatique des données expirées
    Maintenance GDPR des politiques de rétention
    """
    
    try:
        cleanup_summary = await gdpr_manager.cleanup_expired_data()
        
        if "error" in cleanup_summary:
            raise HTTPException(status_code=500, detail=cleanup_summary["error"])
        
        return {
            "success": True,
            "message": "Nettoyage automatique terminé",
            **cleanup_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erreur nettoyage automatique", error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lors du nettoyage")


@router.get("/check-consent/{user_id}")
async def check_consent_required(
    user_id: str,
    data_category: str = Query(..., description="Catégorie de données à traiter"),
    dependencies=[Depends(ensure_request_is_clean)]
) -> Dict[str, Any]:
    """
    ✅ Vérifie si un consentement est requis pour traiter une catégorie de données
    """
    
    try:
        data_category_enum = DataCategory(data_category)
        
        consent_required = await gdpr_manager.check_consent_required(user_id, data_category_enum)
        
        return {
            "user_id": user_id[:8] + "***",
            "data_category": data_category,
            "consent_required": consent_required,
            "can_process": not consent_required,
            "message": "Consentement requis" if consent_required else "Traitement autorisé",
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Erreur vérification consentement", user_id=user_id[:8], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/info/consent-types")
async def get_consent_types() -> Dict[str, Any]:
    """
    📋 Liste des types de consentement disponibles
    """
    
    consent_types = {
        ConsentType.ESSENTIAL.value: {
            "name": "Consentements essentiels",
            "description": "Nécessaires au fonctionnement du service",
            "required": True
        },
        ConsentType.ANALYTICS.value: {
            "name": "Analytics et métriques",
            "description": "Analyse d'usage et amélioration du service",
            "required": False
        },
        ConsentType.MARKETING.value: {
            "name": "Marketing",
            "description": "Communications marketing et promotionnelles",
            "required": False
        },
        ConsentType.PERSONALIZATION.value: {
            "name": "Personnalisation",
            "description": "Personnalisation de l'expérience utilisateur",
            "required": False
        },
        ConsentType.AI_PROCESSING.value: {
            "name": "Traitement IA",
            "description": "Traitement par IA (Luna, génération CV, etc.)",
            "required": False
        }
    }
    
    return {
        "consent_types": consent_types,
        "total_types": len(consent_types),
        "timestamp": "2025-08-27T11:00:00Z"
    }


@router.get("/info/data-categories")
async def get_data_categories() -> Dict[str, Any]:
    """
    📊 Liste des catégories de données traitées
    """
    
    data_categories = {
        DataCategory.IDENTITY.value: {
            "name": "Données d'identité",
            "description": "Nom, email, informations personnelles",
            "sensitive": True
        },
        DataCategory.TECHNICAL.value: {
            "name": "Données techniques",
            "description": "IP, user-agent, données de connexion",
            "sensitive": False
        },
        DataCategory.BEHAVIORAL.value: {
            "name": "Données comportementales",
            "description": "Interactions, navigation, usage",
            "sensitive": True
        },
        DataCategory.ENERGY_DATA.value: {
            "name": "Données énergétiques",
            "description": "Consommation d'énergie virtuelle",
            "sensitive": False
        },
        DataCategory.GENERATED_CONTENT.value: {
            "name": "Contenu généré",
            "description": "CV, lettres, contenus créés par IA",
            "sensitive": True
        },
        DataCategory.COMMUNICATION.value: {
            "name": "Communications",
            "description": "Messages, chat avec Luna",
            "sensitive": True
        }
    }
    
    return {
        "data_categories": data_categories,
        "total_categories": len(data_categories),
        "timestamp": "2025-08-27T11:00:00Z"
    }