"""
💬 Luna Conversation Endpoints - Interface Sidebar
Phoenix Production - Intégration avec LunaConversationalSidebar existante

Endpoints pour connecter la nouvelle architecture Luna distribuée 
avec la sidebar conversationnelle frontend existante.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request, Header
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

# Imports architecture Luna
from ..services.luna_central_orchestrator import luna_orchestrator

# Imports infrastructure existante
from ..api.auth_endpoints import get_current_user_dependency
from ..core.security_guardian import ensure_request_is_clean
from ..core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
from ..core.events import create_event
from ..core.logging_config import logger
from ..core.jwt_manager import get_bearer_token

router = APIRouter(prefix="/luna/conversation", tags=["Luna Conversation"])

class LunaConversationRequest(BaseModel):
    """Request model pour conversation Luna"""
    message: str = Field(..., description="Message utilisateur", max_length=2000)
    session_id: Optional[str] = Field(default=None, description="ID session conversationnelle")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexte frontend")
    force_specialist: Optional[str] = Field(default=None, description="Forcer un spécialiste (luna-aube, etc.)")
    current_module: Optional[str] = Field(default=None, description="Module actuel frontend")

class LunaConversationResponse(BaseModel):
    """Response model pour conversation Luna"""
    success: bool
    session_id: str
    luna_response: str
    specialist: str
    energy_consumed: int
    conversation_metadata: Dict[str, Any]

@router.post("/send-message", response_model=Dict[str, Any])
async def send_luna_message(
    conversation_request: LunaConversationRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    💬 Endpoint principal pour conversation Luna
    
    Compatible avec la sidebar existante LunaConversationalSidebar.tsx.
    Route intelligemment vers les spécialistes selon l'intention.
    """
    try:
        # Rate limiting
        client_ip = request.client.host if request.client else "unknown"
        rate_result, rate_context = await rate_limiter.check_rate_limit(
            identifier=current_user["id"],
            scope=RateLimitScope.CONVERSATION,
            user_agent=request.headers.get("user-agent", ""),
            additional_context={"endpoint": "luna_conversation"}
        )
        
        if rate_result != RateLimitResult.ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many conversation requests"
            )
        
        # Extraire token pour délégation
        central_token = get_bearer_token(authorization) if authorization else None
        if not central_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization token required for Luna conversation"
            )
        
        # Construire contexte utilisateur enrichi
        user_context = {
            "user_id": current_user["id"],
            "name": current_user.get("name", current_user.get("email", "")),
            "email": current_user["email"],
            "luna_energy": current_user.get("luna_energy", 100),
            "luna_context": {
                "current_module": conversation_request.current_module or "default",
                "current_specialist": conversation_request.force_specialist,
                "conversation_count": conversation_request.context.get("conversation_count", 0),
                "frontend_context": conversation_request.context
            }
        }
        
        # Gestion session conversationnelle
        session_id = conversation_request.session_id or str(uuid.uuid4())
        
        # Déléguer à l'orchestrateur Luna Central
        orchestrator_response = await luna_orchestrator.handle_user_message(
            user_message=conversation_request.message,
            user_context=user_context,
            central_token=central_token,
            session_id=session_id
        )
        
        # Formater réponse pour compatibilité sidebar
        if orchestrator_response.get("success", False):
            # Format compatible avec LunaConversationalSidebar
            response_data = {
                "success": True,
                "message": orchestrator_response["luna_response"],
                "context": orchestrator_response.get("updated_context", {}),
                "energy_consumed": orchestrator_response.get("energy_consumed", 0),
                "type": "conversation",
                
                # Métadonnées Luna distribuée
                "session_id": session_id,
                "specialist": orchestrator_response.get("specialist", "luna-central"),
                "intent_confidence": orchestrator_response.get("intent_confidence", 0.0),
                "transition_occurred": orchestrator_response.get("transition_occurred", False),
                "transition_message": orchestrator_response.get("transition_message"),
                "validation": orchestrator_response.get("validation", {}),
                
                # Actions suggérées pour l'UI
                "suggested_actions": orchestrator_response.get("meta", {}).get("suggested_actions", []),
                "next_steps": orchestrator_response.get("meta", {}).get("next_steps", []),
                
                # Contexte mis à jour pour frontend
                "updated_luna_context": orchestrator_response.get("updated_context", {}).get("luna_context", {})
            }
            
            logger.info("Luna conversation successful",
                       user_id=current_user["id"],
                       session_id=session_id,
                       specialist=orchestrator_response.get("specialist"),
                       energy_consumed=orchestrator_response.get("energy_consumed", 0))
            
            return response_data
        else:
            # Erreur orchestrateur - fallback gracieux
            return {
                "success": False,
                "message": orchestrator_response.get("luna_response", "Désolée, j'ai eu un problème technique !"),
                "context": user_context.get("luna_context", {}),
                "energy_consumed": 0,
                "type": "error",
                "error": orchestrator_response.get("error", "unknown")
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Luna conversation endpoint error",
                    user_id=current_user.get("id", "unknown"),
                    error=str(e))
        
        # Réponse d'erreur compatible sidebar
        return {
            "success": False,
            "message": "🌙 Oups ! J'ai eu un petit souci technique. Peux-tu réessayer ?",
            "context": {},
            "energy_consumed": 0,
            "type": "error",
            "error": "internal_error"
        }

@router.get("/session/{session_id}/history")
async def get_conversation_history(
    session_id: str,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    📚 Récupération historique conversationnel Luna
    
    Pour maintenir continuité conversation à travers rechargements page.
    """
    try:
        # Simulation récupération historique (plus tard: vraie persistance)
        # Pour MVP: retourner historique mock ou depuis cache
        
        mock_history = {
            "session_id": session_id,
            "user_id": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "messages": [
                {
                    "id": "msg_1",
                    "type": "luna",
                    "content": f"🌙 Salut ! Je suis Luna, ton guide Phoenix personnalisé !",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "specialist": "luna-central"
                }
            ],
            "current_specialist": "luna-central",
            "total_energy_consumed": 0
        }
        
        return {
            "success": True,
            "history": mock_history,
            "session_active": True
        }
        
    except Exception as e:
        logger.error("Failed to get conversation history",
                    session_id=session_id,
                    user_id=current_user["id"],
                    error=str(e))
        
        return {
            "success": False,
            "error": "failed_to_get_history",
            "history": {"messages": []}
        }

@router.post("/specialist/{specialist_name}/direct")
async def direct_specialist_conversation(
    specialist_name: str,
    conversation_request: LunaConversationRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🎯 Conversation directe avec un spécialiste Luna
    
    Bypass orchestrateur pour cas spéciaux ou tests.
    """
    try:
        # Valider spécialiste
        valid_specialists = ["aube", "cv", "letters", "rise"]
        if specialist_name not in valid_specialists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid specialist. Must be one of: {', '.join(valid_specialists)}"
            )
        
        # Route vers l'orchestrateur Luna unifié
        user_context = {
            "user_id": current_user["id"],
            "name": current_user.get("name", current_user.get("email", "")),
            "email": current_user["email"],
            "luna_energy": current_user.get("luna_energy", 100),
            "luna_context": {
                "current_module": specialist_name,
                "conversation_count": conversation_request.context.get("conversation_count", 0),
                "frontend_context": conversation_request.context
            }
        }
        
        session_id = conversation_request.session_id or str(uuid.uuid4())

        # Extract token from authorization header
        central_token = authorization.replace("Bearer ", "") if authorization and authorization.startswith("Bearer ") else None

        # Déléguer à l'orchestrateur Luna Central
        orchestrator_response = await luna_orchestrator.handle_user_message(
            user_message=conversation_request.message,
            user_context=user_context,
            central_token=central_token,
            session_id=session_id
        )
        
        # Format pour compatibilité
        return {
            "success": orchestrator_response.get("success", True),
            "message": orchestrator_response.get("luna_response", "Désolée, j'ai eu un problème technique !"),
            "specialist": orchestrator_response.get("specialist", f"luna-{specialist_name}"),
            "session_id": session_id,
            "energy_consumed": orchestrator_response.get("energy_consumed", 0),
            "meta": {
                "direct_access": True,
                "flow_state": orchestrator_response.get("meta", {}),
                "suggested_responses": orchestrator_response.get("suggested_actions", [])
            }
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Direct specialist conversation error",
                    specialist=specialist_name,
                    user_id=current_user["id"],
                    error=str(e))
        
        return {
            "success": False,
            "message": "Erreur lors de la conversation directe avec le spécialiste.",
            "error": str(e)
        }

@router.get("/specialists/available")
async def get_available_specialists(
    current_user: dict = Depends(get_current_user_dependency())
):
    """
    📋 Liste des spécialistes Luna disponibles
    
    Pour interface frontend dynamique.
    """
    return {
        "specialists": [
            {
                "name": "aube",
                "display_name": "Luna Aube",
                "description": "Spécialiste découverte carrière et orientation",
                "emoji": "🌅",
                "status": "active",
                "capabilities": [
                    "Assessment carrière conversationnel",
                    "Recommandations métiers personnalisées",
                    "Identification compétences transférables"
                ]
            },
            {
                "name": "cv", 
                "display_name": "Luna CV",
                "description": "Expert optimisation CV et profil candidat",
                "emoji": "📄",
                "status": "coming_soon",
                "capabilities": [
                    "Analyse et optimisation CV",
                    "Adaptation ATS",
                    "Conseils présentation profil"
                ]
            },
            {
                "name": "letters",
                "display_name": "Luna Letters", 
                "description": "Spécialiste lettres de motivation percutantes",
                "emoji": "✉️",
                "status": "coming_soon",
                "capabilities": [
                    "Génération lettres personnalisées",
                    "Recherche entreprise",
                    "Adaptation tone et style"
                ]
            },
            {
                "name": "rise",
                "display_name": "Luna Rise",
                "description": "Coach préparation entretiens d'embauche", 
                "emoji": "🚀",
                "status": "coming_soon",
                "capabilities": [
                    "Simulations entretien",
                    "Techniques storytelling",
                    "Préparation questions récurrentes"
                ]
            }
        ],
        "total_specialists": 4,
        "active_specialists": 1
    }