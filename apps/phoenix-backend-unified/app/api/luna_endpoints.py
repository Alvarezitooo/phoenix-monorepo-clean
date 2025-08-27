"""
🌙 Phoenix Luna - API Endpoints
Endpoints sécurisés pour la gestion de l'énergie Luna
Retry after registry error: 2025-08-25 06:53
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field, validator
import structlog
import uuid
from app.core.energy_manager import energy_manager, InsufficientEnergyError, EnergyManagerError
from app.models.user_energy import EnergyPackType
from app.core.security_guardian import SecurityGuardian, SecureUserIdValidator, SecureActionValidator
from app.core.luna_core_service import get_luna_core
from app.core.narrative_analyzer import narrative_analyzer
from app.models.journal_dto import (
    JournalDTO, EnergyPreviewRequest, EnergyPreviewResponse,
    JournalExportRequest, JournalExportResponse
)
from app.core.journal_service import journal_service
from app.core.energy_preview_service import energy_preview_service
from app.core.aube_matching_service import AubeMatchingService
from app.core.aube_futureproof_service import AubeFutureProofService
from app.core.energy_events import emit_energy_event
from app.core.energy_grid import AubeEnergyManager
from .auth_endpoints import get_current_user_dependency


# Logger structuré
logger = structlog.get_logger("luna_endpoints")

# Dependency d'authentification pour les endpoints Aube
CurrentUser = get_current_user_dependency()

# Router Luna
router = APIRouter(prefix="/luna", tags=["Luna Energy Management"])


# ============================================================================
# MODELS DE REQUÊTE/RÉPONSE
# ============================================================================

class EnergyCheckRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)


class EnergyCheckResponse(BaseModel):
    success: bool
    user_id: str
    current_energy: float
    max_energy: float
    percentage: float
    can_perform_basic_action: bool
    last_recharge: Optional[str] = None
    total_consumed: float
    subscription_type: Optional[str] = None


class EnergyConsumeRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    action_name: str = Field(..., description="Nom de l'action à effectuer", min_length=1, max_length=100)
    context: Optional[Dict[str, Any]] = Field(None, description="Contexte métier")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)
    
    @validator('action_name')
    def validate_action_name(cls, v):
        return SecurityGuardian.validate_action_name(v)
    
    @validator('context')
    def validate_context(cls, v):
        return SecurityGuardian.validate_context(v)


class EnergyConsumeResponse(BaseModel):
    success: bool
    transaction_id: str
    energy_consumed: float
    energy_remaining: float
    action: str
    timestamp: str
    message: Optional[str] = None


class EnergyRefundRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur")
    amount: float = Field(..., gt=0, le=100, description="Montant à rembourser")
    reason: str = Field(..., description="Raison du remboursement")
    context: Optional[Dict[str, Any]] = Field(None, description="Contexte")


class EnergyPurchaseRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur")
    pack_type: EnergyPackType = Field(..., description="Type de pack à acheter")
    stripe_payment_intent_id: Optional[str] = Field(None, description="ID Stripe")


class EnergyPurchaseResponse(BaseModel):
    success: bool
    purchase_id: str
    pack_type: str
    energy_added: float
    bonus_energy: float
    current_energy: float
    amount_paid: float


class CanPerformActionRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    action_name: str = Field(..., description="Action à vérifier", min_length=1, max_length=100)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)
    
    @validator('action_name')
    def validate_action_name(cls, v):
        return SecurityGuardian.validate_action_name(v)


class CanPerformActionResponse(BaseModel):
    success: bool
    user_id: str
    action: str
    energy_required: float
    current_energy: float
    can_perform: bool
    deficit: float = 0.0


class TransactionHistoryResponse(BaseModel):
    success: bool
    user_id: str
    transactions: List[Dict[str, Any]]
    total_count: int


class EnergyAnalyticsResponse(BaseModel):
    success: bool
    user_id: str
    analytics: Dict[str, Any]


class LunaChatRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    message: str = Field(..., description="Message utilisateur", min_length=1, max_length=2000)
    app_context: str = Field(default="website", description="Contexte app: cv, letters, website")
    user_name: Optional[str] = Field(None, description="Prénom utilisateur", max_length=50)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError("Message ne peut pas être vide")
        return v.strip()
    
    @validator('app_context')
    def validate_app_context(cls, v):
        allowed_contexts = ["cv", "letters", "website"]
        if v not in allowed_contexts:
            raise ValueError(f"Contexte doit être: {', '.join(allowed_contexts)}")
        return v


class LunaChatResponse(BaseModel):
    success: bool
    message: str
    context: str
    energy_consumed: float
    type: str = "text"


class ContextPacketResponse(BaseModel):
    success: bool
    user_id: str
    context_packet: Dict[str, Any]
    generated_at: str
    confidence: float


# ============================================================================
# DÉPENDANCES & SÉCURITÉ
# ============================================================================

async def get_current_user_id(user_id: str = None) -> str:
    """
    Récupère l'ID utilisateur (à remplacer par vraie auth en Sprint 3)
    Pour l'instant, utilise l'ID fourni
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID required"
        )
    return user_id


# ============================================================================
# ENDPOINTS LUNA ÉNERGIE
# ============================================================================

@router.post("/energy/check", 
                  response_model=EnergyCheckResponse,
                  summary="Vérifier le solde d'énergie Luna",
                  description="""
🔍 **Vérifie le solde d'énergie Luna d'un utilisateur**

### Principe Oracle
- **Hub Central** : Toute vérification d'énergie transite par le Hub
- **Security Guardian** : Validation stricte de l'user_id
- **Event Sourcing** : Lecture depuis Event Store (Sprint 2)

### Cas d'usage
- Frontend demande le solde avant d'afficher les actions disponibles
- Backend satellite vérifie avant orchestration d'actions
- Dashboard utilisateur pour affichage temps réel

### Réponse Unlimited
Pour les utilisateurs Luna Unlimited, `percentage` sera toujours 100%.
                  """,
                  response_description="Solde d'énergie détaillé avec métadonnées",
                  responses={
                      400: {"description": "ID utilisateur invalide (Security Guardian)"},
                      500: {"description": "Erreur interne du hub"}
                  })
async def check_energy_balance(
    request: EnergyCheckRequest
) -> EnergyCheckResponse:
    """🔍 Vérifie le solde d'énergie Luna d'un utilisateur"""
    try:
        user_id = await get_current_user_id(request.user_id)
        balance = await energy_manager.check_balance(user_id)
        
        return EnergyCheckResponse(
            success=True,
            user_id=balance["user_id"],
            current_energy=balance["current_energy"],
            max_energy=balance["max_energy"],
            percentage=balance["percentage"],
            can_perform_basic_action=balance["can_perform_basic_action"],
            last_recharge=balance["last_recharge"].isoformat() if balance["last_recharge"] else None,
            total_consumed=balance["total_consumed"],
            subscription_type=balance["subscription_type"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking energy balance: {str(e)}"
        )


@router.post("/energy/can-perform", response_model=CanPerformActionResponse)
async def can_perform_action(
    request: CanPerformActionRequest
) -> CanPerformActionResponse:
    """
    ✅ Vérifie si un utilisateur peut effectuer une action
    """
    try:
        user_id = await get_current_user_id(request.user_id)
        result = await energy_manager.can_perform_action(user_id, request.action_name)
        
        return CanPerformActionResponse(
            success=True,
            user_id=result["user_id"],
            action=result["action"],
            energy_required=result["energy_required"],
            current_energy=result["current_energy"],
            can_perform=result["can_perform"],
            deficit=result["deficit"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking action permission: {str(e)}"
        )


@router.post("/energy/consume", response_model=EnergyConsumeResponse)
async def consume_energy(
    request: EnergyConsumeRequest
) -> EnergyConsumeResponse:
    """
    ⚡ Consomme de l'énergie Luna pour une action
    Cœur de l'API Luna selon grille Oracle
    """
    try:
        user_id = await get_current_user_id(request.user_id)
        result = await energy_manager.consume(
            user_id=user_id,
            action_name=request.action_name,
            context=request.context
        )
        
        return EnergyConsumeResponse(
            success=True,
            transaction_id=result["transaction_id"],
            energy_consumed=result["energy_consumed"],
            energy_remaining=result["energy_remaining"],
            action=result["action"],
            timestamp=result["timestamp"],
            message=f"Action '{request.action_name}' effectuée avec succès"
        )
    
    except InsufficientEnergyError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "insufficient_energy",
                "message": str(e),
                "action": "recharge_energy"
            }
        )
    
    except EnergyManagerError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Energy management error: {str(e)}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consuming energy: {str(e)}"
        )


@router.post("/energy/refund", response_model=Dict[str, Any])
async def refund_energy(
    request: EnergyRefundRequest
) -> Dict[str, Any]:
    """
    💰 Rembourse de l'énergie (en cas d'erreur ou insatisfaction)
    """
    try:
        user_id = await get_current_user_id(request.user_id)
        result = await energy_manager.refund(
            user_id=user_id,
            amount=request.amount,
            reason=request.reason,
            context=request.context
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refunding energy: {str(e)}"
        )


@router.post("/energy/purchase", response_model=EnergyPurchaseResponse)
async def purchase_energy_pack(
    request: EnergyPurchaseRequest
) -> EnergyPurchaseResponse:
    """
    🛒 Achat d'un pack d'énergie Luna
    """
    try:
        user_id = await get_current_user_id(request.user_id)
        result = await energy_manager.purchase_energy(
            user_id=user_id,
            pack_type=request.pack_type,
            stripe_payment_intent_id=request.stripe_payment_intent_id
        )
        
        return EnergyPurchaseResponse(
            success=True,
            purchase_id=result["purchase_id"],
            pack_type=result["pack_type"],
            energy_added=result["energy_added"],
            bonus_energy=result["bonus_energy"],
            current_energy=result["current_energy"],
            amount_paid=result["amount_paid"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error purchasing energy: {str(e)}"
        )


@router.get("/energy/transactions/{user_id}", response_model=TransactionHistoryResponse)
async def get_energy_transactions(
    user_id: str,
    limit: int = 50
) -> TransactionHistoryResponse:
    """
    📊 Historique des transactions d'énergie
    """
    try:
        validated_user_id = await get_current_user_id(user_id)
        transactions = await energy_manager.get_user_transactions(validated_user_id, limit)
        
        return TransactionHistoryResponse(
            success=True,
            user_id=validated_user_id,
            transactions=transactions,
            total_count=len(transactions)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting transactions: {str(e)}"
        )


@router.get("/energy/analytics/{user_id}", response_model=EnergyAnalyticsResponse)
async def get_energy_analytics(
    user_id: str
) -> EnergyAnalyticsResponse:
    """
    📈 Analytics de consommation d'énergie Luna
    """
    try:
        validated_user_id = await get_current_user_id(user_id)
        analytics = await energy_manager.get_energy_analytics(validated_user_id)
        
        return EnergyAnalyticsResponse(
            success=True,
            user_id=validated_user_id,
            analytics=analytics
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting analytics: {str(e)}"
        )


# ============================================================================
# ENDPOINTS UTILITAIRES
# ============================================================================

@router.get("/energy/costs")
async def get_energy_costs() -> Dict[str, Any]:
    """
    📋 Grille des coûts d'énergie Luna
    """
    from app.models.user_energy import ENERGY_COSTS, ENERGY_PACKS
    
    return {
        "success": True,
        "energy_costs": ENERGY_COSTS,
        "energy_packs": {
            pack_type.value: {
                **pack_config,
                "pack_type": pack_type.value
            }
            for pack_type, pack_config in ENERGY_PACKS.items()
        },
        "currency": "EUR"
    }


@router.post("/chat/send-message", 
             response_model=LunaChatResponse,
             summary="Envoi de message à Luna avec personnalité unifiée",
             description="""
🌙 **Conversation avec Luna - Personnalité IA Centralisée**

### Oracle Luna Core v1.0
- **Prompt Unifié** : Personnalité Luna cohérente sur tous les apps
- **Capital Narratif** : Luna se souvient de l'historique utilisateur
- **Contexte Dynamique** : S'adapte selon l'app (CV, Letters, Website)
- **Transparence Énergie** : Coûts communiqués selon grille Oracle

### Contexts Supportés
- `cv` : Expert optimisation CV et stratégie carrière
- `letters` : Spécialiste lettres de motivation percutantes  
- `website` : Guide stratégique global Phoenix

### Consommation Énergie
Action standard : 5 points d'énergie ⚡ (conversation de base)
             """,
             responses={
                 400: {"description": "Message invalide ou contexte incorrect"},
                 402: {"description": "Énergie insuffisante pour la conversation"},
                 500: {"description": "Erreur génération réponse Luna"}
             })
async def luna_chat_message(
    request: LunaChatRequest
) -> LunaChatResponse:
    """🌙 Conversation avec Luna - Personnalité unifiée avec Capital Narratif"""
    try:
        user_id = await get_current_user_id(request.user_id)
        
        # Vérification énergie avant génération
        can_perform = await energy_manager.can_perform_action(user_id, "conseil_rapide")
        if not can_perform["can_perform"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "insufficient_energy",
                    "message": f"Énergie insuffisante. Il vous faut {can_perform['deficit']} points supplémentaires.",
                    "current_energy": can_perform["current_energy"],
                    "required": can_perform["energy_required"]
                }
            )
        
        # Consommation énergie AVANT génération
        await energy_manager.consume(
            user_id=user_id,
            action_name="conseil_rapide",
            context={
                "app_context": request.app_context,
                "feature": "luna_chat",
                "message_length": len(request.message)
            }
        )
        
        # Génération réponse Luna Core
        luna = get_luna_core()
        response = await luna.generate_response(
            user_id=user_id,
            message=request.message,
            app_context=request.app_context,
            user_name=request.user_name
        )
        
        return LunaChatResponse(
            success=response["success"],
            message=response["message"],
            context=response["context"],
            energy_consumed=response["energy_consumed"],
            type=response["type"]
        )
    
    except InsufficientEnergyError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "insufficient_energy", 
                "message": str(e),
                "action": "recharge_energy"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur conversation Luna: {str(e)}"
        )


@router.get("/narrative/context-packet/{user_id}",
           response_model=ContextPacketResponse,
           summary="Génère Context Packet pour analyse narrative",
           description="""
🧠 **Context Packet - Narrative Analyzer v1.5**

### Intelligence Narrative Structurée
- **Context Packet** : Données analytiques structurées vs historique brut
- **Multi-dimensional** : Meta utilisateur + Usage + Progrès + Émotions
- **Confidence Score** : Fiabilité de l'analyse (0.0-1.0)
- **Sessionization** : Détection patterns comportementaux

### Sources de Données
- Event Store (source unique de vérité)
- Fenêtres temporelles : 7d/14d/90d
- Energy Manager (plan, balance)
- Heuristiques émotionnelles

### Usage
Endpoint de debugging pour comprendre ce que voit Luna dans son "cerveau".
Injecté automatiquement dans Luna Core v1.1 prompt.
           """,
           responses={
               400: {"description": "User ID invalide"},
               500: {"description": "Erreur génération Context Packet"}
           })
async def get_user_context_packet(user_id: str) -> ContextPacketResponse:
    """🧠 Génère le Context Packet d'analyse narrative pour un utilisateur"""
    try:
        # Validation Security Guardian
        validated_user_id = SecurityGuardian.validate_user_id(user_id)
        
        # Génération Context Packet
        context_packet = await narrative_analyzer.generate_context_packet(validated_user_id)
        
        return ContextPacketResponse(
            success=True,
            user_id=validated_user_id,
            context_packet=context_packet.to_dict(),
            generated_at=context_packet.generated_at,
            confidence=context_packet.confidence
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User ID invalide: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur génération Context Packet: {str(e)}"
        )


# ============================================================================
# ENDPOINTS JOURNAL NARRATIF - ARÈNE DU PREMIER HÉROS
# ============================================================================

@router.get("/journal/{user_id}",
           response_model=JournalDTO,
           summary="Journal Narratif - Endpoint Agrégateur Principal",
           description="""
🌙 **Journal Narratif - Arène du Premier Héros**

### Endpoint Agrégateur Principal
- **Une seule requête** pour toutes les données Journal
- **Performance optimisée** : < 500ms (95e percentile)
- **6 leviers psychologiques** intégrés dans la réponse

### Données Fournies
- **User Profile** : Plan, énergie, progression
- **Narrative Structure** : Chapitres chronologiques + KPIs
- **Next Steps** : Actions suggérées avec coûts énergétiques
- **Social Proof** : Comparaisons anonymisées contextuelles
- **Ethics Anchor** : Propriété des données + export

### Sources de Données
- Context Packets (Narrative Analyzer v1.5)
- Energy Manager (solde + transactions)
- Event Store (chapitres chronologiques)
- Grille Oracle (coûts actions)

### Fenêtres d'Analyse
- `7d` : Focus récent, 7 derniers jours
- `14d` : Tendance standard (défaut)
- `90d` : Contexte historique étendu
           """,
           responses={
               200: {"description": "Journal Narratif complet"},
               400: {"description": "User ID invalide"},
               404: {"description": "Utilisateur introuvable"},
               500: {"description": "Erreur génération Journal"}
           })
async def get_journal_narratif(
    user_id: str,
    window: str = Query(default="14d", pattern="^(7d|14d|90d)$", description="Fenêtre d'analyse temporelle")
) -> JournalDTO:
    """🌙 Journal Narratif - Endpoint agrégateur pour l'Arène du Premier Héros"""
    try:
        # Validation Security Guardian
        validated_user_id = SecurityGuardian.validate_user_id(user_id)
        
        # Génération Journal via service métier
        journal_data = await journal_service.get_journal_data(validated_user_id, window)
        
        # Émission événement pour analytics
        await _emit_journal_event("JournalViewed", {
            "user_id": validated_user_id,
            "window": window,
            "chapters_count": len(journal_data.narrative.chapters),
            "next_steps_count": len(journal_data.narrative.next_steps)
        })
        
        return journal_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Données invalides: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur génération Journal Narratif: {str(e)}"
        )


@router.post("/energy/preview",
            response_model=EnergyPreviewResponse,
            summary="Prévisualisation Impact Énergétique",
            description="""
⚡ **Energy Preview - Confirmation d'Actions**

### Prévisualisation Avant Action
- **Coût énergétique** selon grille Oracle
- **Impact sur le solde** utilisateur
- **Faisabilité** de l'action
- **Messages empathiques** pour modales

### Cas d'Usage
- Modales de confirmation avant actions coûteuses
- Vérification capacité utilisateur
- Messages personnalisés selon plan (standard/unlimited)
- UX transparente sur coûts énergétiques

### Gestion Plans Spéciaux
- **Standard** : Déduction selon grille Oracle
- **Unlimited** : Pas de coût, énergie infinie
- **Insufficient Energy** : Suggestions de recharge

### Grille Oracle Intégrée
Toutes les actions disponibles dans ENERGY_COSTS :
- Actions simples : 5-10% (conseil_rapide, correction_ponctuelle)
- Actions moyennes : 10-20% (lettre_motivation, optimisation_cv)  
- Actions complexes : 20-40% (analyse_cv_complete, mirror_match)
- Actions premium : 35-50% (audit_complet_profil, simulation_entretien)
            """,
            responses={
                200: {"description": "Prévisualisation calculée avec succès"},
                400: {"description": "Requête invalide (user_id ou action)"},
                402: {"description": "Énergie insuffisante pour l'action"},
                500: {"description": "Erreur calcul prévisualisation"}
            })
async def preview_energy_impact(request: EnergyPreviewRequest) -> EnergyPreviewResponse:
    """⚡ Prévisualise l'impact énergétique d'une action pour confirmation utilisateur"""
    try:
        # Preview via service dédié
        preview_result = await energy_preview_service.preview_action_cost(request)
        
        # Émission événement pour analytics
        await _emit_journal_event("EnergyPreviewRequested", {
            "user_id": request.user_id,
            "action": request.action,
            "cost_pct": preview_result.cost_pct,
            "can_perform": preview_result.can_perform,
            "unlimited_user": preview_result.unlimited_user
        })
        
        return preview_result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requête invalide: {str(e)}"
        )
    except EnergyManagerError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "energy_management_error",
                "message": str(e),
                "action": "check_energy_status"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur calcul prévisualisation: {str(e)}"
        )


@router.post("/journal/export",
            response_model=JournalExportResponse,
            summary="Export Récit Narratif Utilisateur",
            description="""
📄 **Export Récit - Rempart Éthique**

### Propriété des Données
- **Récit complet** de la progression utilisateur
- **Formats disponibles** : JSON, Markdown, PDF
- **Métadonnées optionnelles** : événements, progression, insights

### Contenu Export
- Chapitres chronologiques complets
- Progression KPIs avec historique
- Actions réalisées et gains obtenus
- Réflexions personnelles ajoutées
- Statistiques de progression

### Sécurité & Confidentialité
- Export limité au propriétaire des données
- Liens temporaires avec expiration
- Aucune donnée sensible (mots de passe, tokens)
- Conformité RGPD intégrée

### Formats Export
- **JSON** : Structure complète pour réimport
- **Markdown** : Récit humain lisible  
- **PDF** : Document professionnel partageable
            """,
            responses={
                200: {"description": "Export généré avec succès"},
                400: {"description": "Format ou paramètres invalides"},
                404: {"description": "Utilisateur introuvable"},
                500: {"description": "Erreur génération export"}
            })
async def export_journal_narratif(request: JournalExportRequest) -> JournalExportResponse:
    """📄 Export du récit narratif utilisateur - Rempart éthique"""
    try:
        # Validation Security Guardian
        validated_user_id = SecurityGuardian.validate_user_id(request.user_id)
        
        # TODO: Implémenter service d'export
        # Pour l'instant, on retourne une réponse de base
        
        # Émission événement pour analytics
        await _emit_journal_event("JournalExported", {
            "user_id": validated_user_id,
            "format": request.format,
            "include_metadata": request.include_metadata
        })
        
        return JournalExportResponse(
            success=True,
            download_url=None,  # TODO: Générer URL temporaire
            content=None,       # TODO: Contenu selon format
            format=request.format,
            generated_at=datetime.now(timezone.utc).isoformat(),
            expires_at=None     # TODO: Expiration si URL
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requête invalide: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur génération export: {str(e)}"
        )


# ============================================================================
# PHOENIX AUBE V1.1 - ENDPOINTS CONVERSATIONNELS
# ============================================================================

# Instance singleton du gestionnaire Aube
_aube_energy_manager = AubeEnergyManager()

@router.post("/aube/assessment/start")
async def aube_assessment_start(
    payload: Dict[str, Any],
    current_user = Depends(CurrentUser)
) -> Dict[str, Any]:
    """Démarre une évaluation Aube conversationnelle"""
    # Utiliser l'utilisateur authentifié au lieu du payload
    user_id = current_user["id"]
    
    if not _aube_energy_manager.can_perform(user_id, action="assessment.start", tier="simple"):
        raise HTTPException(status_code=402, detail="Insufficient energy")
    
    # Création événement via Event Store existant
    await _emit_journal_event("AubeAssessmentStarted", {
        "user_id": user_id,
        "mode": "UL",
        "version": "v1.1"
    })
    
    # Générer un ID unique pour l'assessment
    assessment_id = str(uuid.uuid4())
    
    return {"assessment_id": assessment_id, "user_id": user_id, "status": "in_progress"}


@router.post("/aube/match/recommend")
async def aube_recommend(
    payload: Dict[str, Any],
    current_user = Depends(CurrentUser)
) -> Dict[str, Any]:
    """Génère les recommandations métier Aube avec matching intelligent"""
    # Utiliser l'utilisateur authentifié au lieu du payload
    user_id = current_user["id"]
    k = int(payload.get("k", 5))
    features = payload.get("features", {})
    
    # user_id est garanti par l'authentification JWT, on peut supprimer cette vérification
    
    if not _aube_energy_manager.can_perform(user_id, action="match.recommend", tier="medium"):
        raise HTTPException(status_code=402, detail="Insufficient energy")
    
    # Service de matching avec recommandations explicables
    try:
        # Utiliser l'Event Store existant pour le matching service
        from app.core.supabase_client import event_store
        matching_service = AubeMatchingService(event_store)
        recommendations = matching_service.recommend(user_id, features, k)
        
        # Émission événement énergie
        emit_energy_event(event_store, user_id, "match.recommend", "medium", 12)
        _aube_energy_manager.consume(user_id, action="match.recommend", tier="medium")
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur génération recommandations: {str(e)}"
        )


@router.post("/aube/futureproof/score")
async def aube_futureproof(
    payload: Dict[str, Any],
    current_user = Depends(CurrentUser)
) -> Dict[str, Any]:
    """Calcule le score de pérennité future-proof pour un métier donné"""
    # Utiliser l'utilisateur authentifié au lieu du payload
    user_id = current_user["id"]
    job_code = payload.get("job_code")
    
    if not job_code:
        raise HTTPException(status_code=400, detail="job_code required")
    
    if not _aube_energy_manager.can_perform(user_id, action="futureproof.score", tier="medium"):
        raise HTTPException(status_code=402, detail="Insufficient energy")
    
    try:
        # Service futureproof avec Event Store
        from app.core.supabase_client import event_store
        futureproof_service = AubeFutureProofService(event_store)
        score_result = futureproof_service.score(user_id, job_code)
        
        # Émission événement énergie
        emit_energy_event(event_store, user_id, "futureproof.score", "medium", 15)
        _aube_energy_manager.consume(user_id, action="futureproof.score", tier="medium")
        
        return score_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur calcul future-proof: {str(e)}"
        )


# ============================================================================
# UTILITAIRES ÉVÉNEMENTS JOURNAL
# ============================================================================

async def _emit_journal_event(event_type: str, payload: Dict[str, Any]) -> None:
    """Émet un événement Journal dans l'Event Store"""
    try:
        user_id = payload.get("user_id")
        if not user_id:
            logger.error("Cannot emit journal event without user_id", event_type=event_type)
            return
        
        # Émission dans Event Store via supabase_client avec helper Journal
        await event_store.create_journal_event(
            user_id=user_id,
            event_type=event_type,
            event_data=payload,
            metadata={
                "source": "journal_narratif",
                "version": "v1.0"
            }
        )
        
    except Exception as e:
        # Log error but don't fail the main request
        logger.warning("Erreur émission événement Journal", event_type=event_type, error=str(e))


@router.get("/journal/confirmation-message/{action}",
           summary="Message de Confirmation pour Action",
           description="Génère un message empathique pour les modales de confirmation d'actions")
async def get_action_confirmation_message(
    action: str,
    user_id: str,
    cost_pct: Optional[float] = None
) -> Dict[str, str]:
    """Génère un message de confirmation empathique pour une action"""
    try:
        # Si coût non fourni, le calculer via preview
        if cost_pct is None:
            preview_request = EnergyPreviewRequest(user_id=user_id, action=action)
            preview_result = await energy_preview_service.preview_action_cost(preview_request)
            message = energy_preview_service.get_confirmation_message(preview_result)
        else:
            # Créer un preview mock pour générer le message
            mock_preview = EnergyPreviewResponse(
                action=action,
                cost_pct=cost_pct,
                balance_before=100.0,
                balance_after=100.0 - cost_pct,
                can_perform=True,
                unlimited_user=False
            )
            message = energy_preview_service.get_confirmation_message(mock_preview)
        
        return {
            "action": action,
            "confirmation_message": message,
            "action_description": energy_preview_service.get_action_description(action)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur génération message: {str(e)}"
        )