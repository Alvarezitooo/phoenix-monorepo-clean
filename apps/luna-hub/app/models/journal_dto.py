"""
🌙 Phoenix Journal Narratif - Data Transfer Objects
Modèles Pydantic pour l'Arène du Premier Héros
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime


class JournalUser(BaseModel):
    """Profil utilisateur pour le Journal"""
    id: str = Field(..., description="ID utilisateur")
    first_name: str = Field(..., description="Prénom utilisateur")
    plan: Literal["standard", "unlimited"] = Field(..., description="Plan utilisateur")


class JournalEnergy(BaseModel):
    """État énergétique utilisateur"""
    balance_pct: float = Field(..., ge=0, le=100, description="Énergie actuelle (0-100%)")
    last_purchase: Optional[str] = Field(None, description="Dernière recharge ISO8601")


class JournalKpiAts(BaseModel):
    """Métriques ATS pour progression narrative"""
    value: float = Field(..., ge=0, le=100, description="Score ATS moyen actuel")
    target: float = Field(..., ge=0, le=100, description="Score ATS cible")
    trend: Literal["up", "down", "flat"] = Field(..., description="Tendance progression")
    delta_pct_14d: float = Field(..., description="Évolution % sur 14 jours")


class JournalKpiLetters(BaseModel):
    """Métriques lettres de motivation"""
    value: int = Field(..., ge=0, description="Nombre de lettres générées")


class JournalKPIs(BaseModel):
    """Ensemble des KPIs narratifs"""
    ats_mean: Optional[JournalKpiAts] = None
    letters_count: Optional[JournalKpiLetters] = None


class JournalChapter(BaseModel):
    """Chapitre individuel du récit utilisateur"""
    id: str = Field(..., description="ID unique du chapitre")
    type: Literal["cv", "letter", "analysis", "milestone", "energy", "other"] = Field(
        ..., description="Type de chapitre"
    )
    title: str = Field(..., description="Titre du chapitre")
    gain: List[str] = Field(default_factory=list, description="Gains obtenus")
    ts: str = Field(..., description="Timestamp ISO8601")


class JournalNextStep(BaseModel):
    """Action suggérée pour progression"""
    action: str = Field(..., description="Nom de l'action selon grille Oracle")
    cost_pct: float = Field(..., ge=0, le=100, description="Coût en % d'énergie")
    expected_gain: str = Field(..., description="Bénéfice attendu lisible")


class JournalNarrative(BaseModel):
    """Structure narrative complète"""
    chapters: List[JournalChapter] = Field(default_factory=list, description="Chapitres chronologiques")
    kpis: JournalKPIs = Field(..., description="Indicateurs de progression")
    last_doubt: Optional[str] = Field(None, description="Dernier doute exprimé")
    next_steps: List[JournalNextStep] = Field(default_factory=list, description="Prochaines étapes suggérées")


class JournalSocialProof(BaseModel):
    """Comparaisons anonymisées pour levier appartenance"""
    peers_percentage_recommended_step: float = Field(
        default=0.0, ge=0, le=1, description="% d'utilisateurs similaires ayant fait X"
    )
    recommended_label: Optional[str] = Field(None, description="Action recommandée libellé")


class JournalEthics(BaseModel):
    """Rempart éthique - propriété des données"""
    ownership: bool = Field(default=True, description="Propriété des données utilisateur")
    export_available: bool = Field(default=True, description="Export du récit disponible")


class JournalDTO(BaseModel):
    """DTO principal du Journal Narratif - Réponse endpoint agrégateur"""
    user: JournalUser = Field(..., description="Profil utilisateur")
    energy: JournalEnergy = Field(..., description="État énergétique")
    narrative: JournalNarrative = Field(..., description="Structure narrative")
    social_proof: Optional[JournalSocialProof] = Field(None, description="Comparaisons sociales")
    ethics: JournalEthics = Field(default_factory=JournalEthics, description="Éthique et propriété")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ============================================================================
# MODELS POUR ENERGY PREVIEW
# ============================================================================

class EnergyPreviewRequest(BaseModel):
    """Requête de prévisualisation d'énergie"""
    user_id: str = Field(..., description="ID utilisateur", min_length=1, max_length=50)
    action: str = Field(..., description="Action à prévisualiser", min_length=1, max_length=100)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        from app.core.security_guardian import SecurityGuardian
        return SecurityGuardian.validate_user_id(v)
    
    @validator('action')
    def validate_action(cls, v):
        from app.models.user_energy import ENERGY_COSTS
        if v not in ENERGY_COSTS:
            raise ValueError(f"Action inconnue. Actions disponibles: {list(ENERGY_COSTS.keys())}")
        return v


class EnergyPreviewResponse(BaseModel):
    """Réponse de prévisualisation d'énergie"""
    action: str = Field(..., description="Action prévisualisée")
    cost_pct: float = Field(..., ge=0, le=100, description="Coût en % d'énergie")
    balance_before: float = Field(..., ge=0, le=100, description="Énergie avant action")
    balance_after: float = Field(..., ge=0, le=100, description="Énergie après action")
    can_perform: bool = Field(..., description="Action réalisable avec énergie actuelle")
    unlimited_user: bool = Field(default=False, description="Utilisateur avec énergie illimitée")


# ============================================================================
# MODELS POUR EXPORT RÉCIT
# ============================================================================

class JournalExportRequest(BaseModel):
    """Requête d'export du récit narratif"""
    user_id: str = Field(..., description="ID utilisateur")
    format: Literal["json", "markdown", "pdf"] = Field(default="json", description="Format d'export")
    include_metadata: bool = Field(default=True, description="Inclure métadonnées techniques")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        from app.core.security_guardian import SecurityGuardian
        return SecurityGuardian.validate_user_id(v)


class JournalExportResponse(BaseModel):
    """Réponse d'export du récit"""
    success: bool = Field(..., description="Export réussi")
    download_url: Optional[str] = Field(None, description="URL de téléchargement")
    content: Optional[str] = Field(None, description="Contenu direct si petit")
    format: str = Field(..., description="Format généré")
    generated_at: str = Field(..., description="Date de génération ISO8601")
    expires_at: Optional[str] = Field(None, description="Expiration du lien si applicable")


# ============================================================================
# MODELS POUR EVENT TRACKING
# ============================================================================

class JournalEventBase(BaseModel):
    """Base pour événements Journal"""
    user_id: str
    timestamp: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class SessionZeroViewedEvent(JournalEventBase):
    """Événement : Utilisateur voit Session Zéro"""
    event_type: Literal["SessionZeroViewed"] = "SessionZeroViewed"


class MissionSelectedEvent(JournalEventBase):
    """Événement : Utilisateur sélectionne mission du jour"""
    event_type: Literal["MissionSelected"] = "MissionSelected"
    mission: str


class JournalViewedEvent(JournalEventBase):
    """Événement : Utilisateur consulte son Journal"""
    event_type: Literal["JournalViewed"] = "JournalViewed"
    chapters_count: int = 0


class NextActionPreviewedEvent(JournalEventBase):
    """Événement : Utilisateur prévisualise une action"""
    event_type: Literal["NextActionPreviewed"] = "NextActionPreviewed"
    action: str
    cost_pct: float


class ActionConfirmedEvent(JournalEventBase):
    """Événement : Utilisateur confirme une action"""
    event_type: Literal["ActionConfirmed"] = "ActionConfirmed"
    action: str
    cost_pct: float


class ActionCancelledEvent(JournalEventBase):
    """Événement : Utilisateur annule une action"""
    event_type: Literal["ActionCancelled"] = "ActionCancelled"
    action: str
    reason: Optional[str] = None


class ChapterOpenedEvent(JournalEventBase):
    """Événement : Utilisateur consulte détail d'un chapitre"""
    event_type: Literal["ChapterOpened"] = "ChapterOpened"
    chapter_id: str
    chapter_type: str


class ReflectionAddedEvent(JournalEventBase):
    """Événement : Utilisateur ajoute une réflexion"""
    event_type: Literal["ReflectionAdded"] = "ReflectionAdded"
    chapter_id: str
    reflection_text: str
    sentiment: Optional[str] = None


class MilestoneReachedEvent(JournalEventBase):
    """Événement : Utilisateur atteint un palier"""
    event_type: Literal["MilestoneReached"] = "MilestoneReached"
    kpi: str
    value: float
    target: float


class Plan7DaysStartedEvent(JournalEventBase):
    """Événement : Utilisateur démarre plan 7 jours"""
    event_type: Literal["Plan7DaysStarted"] = "Plan7DaysStarted"
    plan_id: str
    objectives: List[str] = Field(default_factory=list)


# Union type pour tous les événements Journal
JournalEvent = (
    SessionZeroViewedEvent | MissionSelectedEvent | JournalViewedEvent |
    NextActionPreviewedEvent | ActionConfirmedEvent | ActionCancelledEvent |
    ChapterOpenedEvent | ReflectionAddedEvent | MilestoneReachedEvent |
    Plan7DaysStartedEvent
)