from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.clients.hub_client import get_hub_client, HubClient
from app.clients.gemini_client import get_gemini_client, GeminiClient
from app.dependencies import get_current_user_id

router = APIRouter()

# --- Pydantic Models for CV API ---

class MirrorMatchRequest(BaseModel):
    cv_id: str
    job_description: str

class CVOptimizationRequest(BaseModel):
    cv_id: str
    target_job_title: Optional[str] = None

# --- API Endpoints ---

@router.post("/mirror-match", summary="Run Mirror Match analysis for a CV and job description")
async def mirror_match(
    request: MirrorMatchRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the Mirror Match feature.
    """
    # 1. Check energy with the Hub
    if not await hub.can_perform(user_id=user_id, action="CV_MIRROR_MATCH"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    # 2. Build prompt and call Gemini
    prompt = f"""Analyze the compatibility between the CV (id: {request.cv_id}) and the job description: '{request.job_description}'. 
    Provide a compatibility score, strengths, weaknesses, and suggestions."""
    
    analysis_result = await gemini.generate_content(prompt)

    # 3. Track event in Narrative Capital
    await hub.track_event(
        user_id=user_id,
        event_type="CV_MIRROR_MATCH_COMPLETED",
        event_data={"cv_id": request.cv_id, "job_description_preview": request.job_description[:100]}
    )

    return {
        "message": "Mirror Match analysis complete",
        "analysis": analysis_result
    }

@router.post("/optimize", summary="Optimize a CV for a target job")
async def optimize_cv(
    request: CVOptimizationRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the CV Optimization feature.
    """
    if not await hub.can_perform(user_id=user_id, action="CV_OPTIMIZE"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"Optimize CV (id: {request.cv_id}) for the target job: '{request.target_job_title or 'general improvement'}'. Provide actionable suggestions."
    
    optimization_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="CV_OPTIMIZATION_COMPLETED",
        event_data={"cv_id": request.cv_id, "target_job": request.target_job_title}
    )

    return {
        "message": "CV Optimization complete",
        "suggestions": optimization_result
    }