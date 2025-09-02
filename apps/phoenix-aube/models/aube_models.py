"""
🌙 Phoenix Aube - Modèles de données enterprise
Signals psychométriques, sessions, recommandations
Code récupéré depuis Luna Hub - Niveau entreprise
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class AubeSignals(BaseModel):
    """
    Phoenix Aube v1 - Signals collection (éphémères, éthiques)
    
    Collecte progressive des signaux utilisateur pour matching psychométrique.
    Respect RGPD : données éphémères, export possible, transparence.
    """
    appetences: Optional[Dict[str, int]] = Field(
        default_factory=dict, 
        description="people vs data preferences (0-10)"
    )
    valeurs_top2: Optional[List[str]] = Field(
        default_factory=list, 
        description="Top 2 values selected by user"
    )
    taches_like: Optional[List[str]] = Field(
        default_factory=list, 
        description="Preferred tasks/activities"
    )
    taches_avoid: Optional[List[str]] = Field(
        default_factory=list, 
        description="Tasks to avoid"
    )
    style_travail: Optional[str] = Field(
        default="", 
        description="Work style preference (collaboratif, autonome, etc.)"
    )
    ia_appetit: Optional[int] = Field(
        default=5, 
        description="AI appetite/comfort level 1-10"
    )
    skills_bridge: Optional[List[str]] = Field(
        default_factory=list, 
        description="Transferable skills identified"
    )
    contraintes: Optional[List[str]] = Field(
        default_factory=list, 
        description="Life/career constraints"
    )
    risk_tolerance: Optional[int] = Field(
        default=5, 
        description="Risk tolerance for career change 1-10"
    )
    secteur_pref: Optional[str] = Field(
        default="", 
        description="Preferred sector/industry"
    )

class AubeSessionStart(BaseModel):
    """
    Démarrage session assessment Aube
    
    MVP Flow: Ultra-Light (≤60s) → Court (3-4min) → Profond (7-8min)
    """
    level: str = Field(
        default="ultra_light", 
        description="Assessment depth: ultra_light | court | profond"
    )
    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="User context (source, motivation, etc.)"
    )

class AubeSessionUpdate(BaseModel):
    """
    Mise à jour session avec signaux collectés
    
    Flow progressif : appetences → valeurs → taches → style → IA
    """
    session_id: str = Field(..., description="Session unique identifier")
    signals: AubeSignals = Field(..., description="Collected user signals")
    completed_step: str = Field(..., description="Step identifier just completed")

class AubeRecommendation(BaseModel):
    """
    Structure recommandation métier enterprise
    
    Matrice pain-points → leviers psycho → fonctionnalités :
    - Raisons lisibles (transparence)
    - Future-proof scoring (sécurité face IA)
    - Timeline prédictions (anticipation)
    - Plan IA-skills (adaptation)
    """
    job_code: str = Field(..., description="Job code identifier (UXD, PO, DA, etc.)")
    label: str = Field(..., description="Human-readable job title")
    score_teaser: float = Field(..., description="Recommendation confidence score (0-1)")
    
    reasons: List[Dict[str, str]] = Field(
        ..., 
        description="Reasons for recommendation (feature + phrase)"
    )
    counter_example: Optional[Dict[str, str]] = Field(
        default=None, 
        description="Risk/alternative example (risk + phrase)"
    )
    
    # Future-proof analysis (Gardien du Futur)
    futureproof: Dict[str, Any] = Field(
        ..., 
        description="Future-proof analysis (score_0_1 + drivers)"
    )
    timeline: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, 
        description="Sector evolution timeline (year + change + confidence)"
    )
    ia_plan: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, 
        description="IA skills development plan (skill + micro_action + effort)"
    )

class AubeAssessmentResult(BaseModel):
    """
    Résultat complet assessment Aube
    
    Output enterprise : recommandations + journal + handover
    """
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="User identifier")
    
    recommendations: List[AubeRecommendation] = Field(
        ..., 
        description="Job recommendations (Top 3 MVP, Top 5 V1.1)"
    )
    
    # Journal Narratif integration
    journal_chapters: List[Dict[str, str]] = Field(
        ..., 
        description="Auto-generated journal chapters"
    )
    
    # Handover (Main Tendue)
    handover: Dict[str, Any] = Field(
        ..., 
        description="Next steps integration (CV/Letters/Rise)"
    )
    
    # Meta information
    meta: Dict[str, Any] = Field(
        ..., 
        description="Algorithm version, disclaimers, export info"
    )

class AubeAssessmentRequest(BaseModel):
    """
    Requête d'évaluation psychologique complète
    """
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    signals: AubeSignals = Field(..., description="Signaux collectés")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexte utilisateur")

class AubePersonalityProfile(BaseModel):
    """
    Profil psychologique généré
    """
    people_orientation: int = Field(..., description="Orientation people (0-100)")
    data_orientation: int = Field(..., description="Orientation data (0-100)")
    creativity: int = Field(..., description="Niveau créativité (0-100)")
    leadership: int = Field(..., description="Leadership (0-100)")
    adaptability: int = Field(..., description="Adaptabilité (0-100)")

class AubeCareerMatch(BaseModel):
    """
    Match métier avec score
    """
    job_code: str = Field(..., description="Code métier")
    title: str = Field(..., description="Titre du métier")
    compatibility: int = Field(..., description="Score compatibilité (0-100)")
    sector: str = Field(..., description="Secteur")
    skills: List[str] = Field(..., description="Compétences requises")
    salary_range: Optional[str] = Field(None, description="Fourchette salaire")

class AubeAssessmentResponse(BaseModel):
    """
    Réponse complète de l'assessment
    """
    success: bool
    user_id: str
    assessment_id: str
    personality_profile: AubePersonalityProfile
    career_matches: List[AubeCareerMatch]
    confidence_score: float
    completion_time: str
    generated_at: str

class AubeExportData(BaseModel):
    """
    Structure export GDPR-compliant
    
    Ancre Éthique : transparence totale + contrôle utilisateur
    """
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="User identifier") 
    export_timestamp: datetime = Field(..., description="Export generation time")
    
    disclaimer: str = Field(..., description="GDPR disclaimer")
    algorithm_version: str = Field(..., description="Algorithm version used")
    
    # Données utilisateur
    signals: Dict[str, Any] = Field(..., description="Collected signals (anonymized)")
    recommendations: List[AubeRecommendation] = Field(..., description="Generated recommendations")
    
    # Explications transparentes
    explanations: Dict[str, str] = Field(..., description="Methodology explanations")