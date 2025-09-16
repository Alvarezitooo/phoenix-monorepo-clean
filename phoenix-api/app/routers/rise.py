from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.clients.hub_client import get_hub_client, HubClient
from app.clients.gemini_client import get_gemini_client, GeminiClient
from app.dependencies import get_current_user_id

router = APIRouter()

# --- Rise Models for Interview Simulations ---

class InterviewSimulationRequest(BaseModel):
    position_title: str
    company_name: str
    interview_type: str = "behavioral"  # behavioral, technical, case_study
    experience_level: str = "intermediate"
    preparation_areas: Optional[List[str]] = []

class MockInterviewRequest(BaseModel):
    scenario: str
    user_response: str
    session_id: Optional[str] = None

# --- API Endpoints ---

@router.get("/", summary="Rise Module status")
async def rise_status():
    return {
        "module": "Rise", 
        "status": "active",
        "features": ["interview-simulation", "mock-interview", "storytelling-coach"],
        "version": "2.0.0"
    }

@router.post("/interview-simulation", summary="Start an interview simulation session")
async def start_interview_simulation(
    request: InterviewSimulationRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Lance une simulation d'entretien personnalisée
    
    Coût énergétique: 20 unités
    """
    try:
        # Validation des entrées
        if not request.position_title.strip() or not request.company_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le titre du poste et le nom de l'entreprise sont requis"
            )
        
        # Préparer le contexte pour Luna Hub
        simulation_context = {
            "position": request.position_title,
            "company": request.company_name,
            "type": request.interview_type,
            "level": request.experience_level,
            "areas": request.preparation_areas,
            "user_id": user_id
        }
        
        # Appeler Luna Hub pour générer la simulation via AI chat
        simulation_response = await hub.ai_chat_interaction(
            user_id=user_id,
            specialist="rise",
            message=f"Generate interview simulation for {context['position']} position with {context['company']} company",
            context=simulation_context
        )
        
        return {
            "session_id": simulation_response.get("session_id"),
            "scenario": simulation_response.get("scenario"),
            "questions": simulation_response.get("questions", []),
            "tips": simulation_response.get("tips", []),
            "estimated_duration": "15-20 minutes"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de simulation: {str(e)}"
        )

@router.post("/mock-interview", summary="Continue mock interview conversation")
async def mock_interview_response(
    request: MockInterviewRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Traite une réponse dans une simulation d'entretien
    
    Coût énergétique: 5 unités par interaction
    """
    try:
        # Analyser la réponse avec Luna via AI chat
        analysis = await hub.ai_chat_interaction(
            user_id=user_id,
            specialist="rise",
            message=f"Analyze this interview response: {request.user_response}",
            context={
                "scenario": request.scenario,
                "session_id": request.session_id,
                "analysis_type": "interview_response"
            }
        )
        
        return {
            "feedback": analysis.get("feedback"),
            "score": analysis.get("score", 0),
            "improvements": analysis.get("improvements", []),
            "next_question": analysis.get("next_question"),
            "session_complete": analysis.get("session_complete", False)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse: {str(e)}"
        )