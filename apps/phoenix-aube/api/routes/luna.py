from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging

from core.ai.gemini_service import luna_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/luna", tags=["Luna AI"])

class LunaMirrorRequest(BaseModel):
    user_response: str
    persona: Optional[str] = "jeune_diplome"
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None

class LunaMirrorResponse(BaseModel):
    response: str

class LunaAnalysisRequest(BaseModel):
    user_signals: Dict[str, Any]
    persona: Optional[str] = "jeune_diplome"
    depth: Optional[str] = "ultra_light"
    user_id: Optional[str] = None

class CareerMatch(BaseModel):
    title: str
    compatibility_score: float
    luna_reasoning: str
    future_proof_score: float
    salary_range: str
    transition_difficulty: str

class LunaAnalysisResponse(BaseModel):
    luna_insights: str
    career_matches: List[CareerMatch]
    next_steps: List[str]
    luna_encouragement: str

@router.post("/mirror", response_model=LunaMirrorResponse)
async def get_luna_mirror(request: LunaMirrorRequest):
    """
    🌙 Génère un miroir empathique immédiat de Luna
    """
    try:
        luna_response = await luna_service.luna_mirror_response(
            user_response=request.user_response,
            persona=request.persona,
            context=request.context,
            user_id=request.user_id
        )
        
        return LunaMirrorResponse(response=luna_response)
        
    except Exception as e:
        logger.error(f"Erreur Luna mirror: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la génération du miroir Luna"
        )

@router.post("/analysis", response_model=LunaAnalysisResponse)
async def get_luna_analysis(request: LunaAnalysisRequest):
    """
    🌙 Analyse complète Luna avec recommandations métiers
    """
    try:
        analysis = await luna_service.luna_career_analysis(
            user_signals=request.user_signals,
            persona=request.persona,
            depth=request.depth,
            user_id=request.user_id
        )
        
        # Convert dict to Pydantic model
        career_matches = [
            CareerMatch(**match) for match in analysis.get("career_matches", [])
        ]
        
        return LunaAnalysisResponse(
            luna_insights=analysis.get("luna_insights", ""),
            career_matches=career_matches,
            next_steps=analysis.get("next_steps", []),
            luna_encouragement=analysis.get("luna_encouragement", "")
        )
        
    except Exception as e:
        logger.error(f"Erreur Luna analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'analyse Luna"
        )

@router.get("/health")
async def luna_health():
    """Health check pour Luna AI"""
    return {
        "status": "healthy",
        "service": "Luna AI",
        "gemini_configured": luna_service._is_configured
    }