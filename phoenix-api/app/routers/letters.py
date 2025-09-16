from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.clients.hub_client import get_hub_client, HubClient
from app.clients.gemini_client import get_gemini_client, GeminiClient
from app.dependencies import get_current_user_id

router = APIRouter()

# --- Pydantic Models for Letters API ---

class GenerateLetterRequest(BaseModel):
    company_name: str
    position_title: str
    job_description: Optional[str] = None
    experience_level: str = "intermédiaire"
    desired_tone: str = "professionnel"

class AnalyzeCareerTransitionRequest(BaseModel):
    previous_role: str
    target_role: str
    previous_industry: Optional[str] = None
    target_industry: Optional[str] = None

# --- API Endpoints ---

@router.get("/", summary="Letters Module status")
async def letters_status():
    return {
        "module": "Letters",
        "status": "active",
        "features": ["generate", "analyze-transition", "tone-adaptation"], 
        "version": "2.0.0"
    }

@router.post("/generate", summary="Generate a cover letter")
async def generate_letter(
    request: GenerateLetterRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the cover letter generation feature.
    """
    if not await hub.can_perform(user_id=user_id, action="LETTERS_GENERATE"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"""Generate a cover letter for {request.company_name} for the {request.position_title} position. 
    Job description: {request.job_description or 'N/A'}. 
    Experience level: {request.experience_level}. Tone: {request.desired_tone}."""
    
    letter_content = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="LETTERS_GENERATED",
        event_data={
            "company": request.company_name,
            "position": request.position_title,
            "experience_level": request.experience_level,
            "tone": request.desired_tone
        }
    )

    return {
        "message": "Letter generated successfully",
        "content": letter_content
    }

@router.post("/analyze-transition", summary="Analyze career transition skills")
async def analyze_career_transition(
    request: AnalyzeCareerTransitionRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the career transition analysis feature.
    """
    if not await hub.can_perform(user_id=user_id, action="LETTERS_ANALYZE_TRANSITION"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"""Analyze the transition from {request.previous_role} ({request.previous_industry or 'any'} industry) 
    to {request.target_role} ({request.target_industry or 'any'} industry). 
    Provide transferable skills, skill gaps, and a transition roadmap."""
    
    analysis_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="CAREER_TRANSITION_ANALYZED",
        event_data={
            "previous_role": request.previous_role,
            "target_role": request.target_role,
            "previous_industry": request.previous_industry,
            "target_industry": request.target_industry
        }
    )

    return {
        "message": "Career transition analysis complete",
        "analysis": analysis_result
    }