"""
🔗 Phoenix CV - LinkedIn Integration Entities
Entités métier pour l'intégration LinkedIn et synchronisation profil
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class LinkedInConnectionStatus(Enum):
    """Statut de connexion LinkedIn"""
    DISCONNECTED = "disconnected"
    CONNECTED = "connected"
    EXPIRED = "expired"
    ERROR = "error"


class SyncStatus(Enum):
    """Statut de synchronisation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class ProfileSection(Enum):
    """Sections du profil LinkedIn"""
    BASIC_INFO = "basic_info"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    SKILLS = "skills"
    CERTIFICATIONS = "certifications"
    LANGUAGES = "languages"
    RECOMMENDATIONS = "recommendations"
    PROJECTS = "projects"


@dataclass
class LinkedInProfile:
    """Profil LinkedIn complet"""
    
    # Informations de base
    linkedin_id: str
    first_name: str
    last_name: str
    headline: str = ""
    summary: str = ""
    location: str = ""
    industry: str = ""
    
    # Photo et URLs
    profile_picture_url: Optional[str] = None
    public_profile_url: Optional[str] = None
    
    # Expériences professionnelles
    positions: List[Dict[str, Any]] = field(default_factory=list)
    
    # Formation
    educations: List[Dict[str, Any]] = field(default_factory=list)
    
    # Compétences et certifications
    skills: List[str] = field(default_factory=list)
    certifications: List[Dict[str, Any]] = field(default_factory=list)
    
    # Langues
    languages: List[Dict[str, str]] = field(default_factory=list)
    
    # Projets et publications
    projects: List[Dict[str, Any]] = field(default_factory=list)
    publications: List[Dict[str, Any]] = field(default_factory=list)
    
    # Métadonnées
    connections_count: int = 0
    followers_count: int = 0
    last_updated: datetime = field(default_factory=datetime.now)
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LinkedInConnection:
    """Connexion LinkedIn d'un utilisateur"""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    
    # Authentification OAuth
    access_token: str = ""
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    
    # Informations LinkedIn
    linkedin_user_id: str = ""
    profile_data: Optional[LinkedInProfile] = None
    
    # Statut de connexion
    status: LinkedInConnectionStatus = LinkedInConnectionStatus.DISCONNECTED
    connection_date: datetime = field(default_factory=datetime.now)
    last_sync: Optional[datetime] = None
    
    # Configuration de sync
    auto_sync_enabled: bool = True
    sync_frequency_hours: int = 24
    enabled_sections: List[ProfileSection] = field(default_factory=lambda: [
        ProfileSection.BASIC_INFO,
        ProfileSection.EXPERIENCE,
        ProfileSection.EDUCATION,
        ProfileSection.SKILLS
    ])
    
    # Métadonnées
    error_message: Optional[str] = None
    sync_count: int = 0
    
    @property
    def is_token_valid(self) -> bool:
        """Vérifie si le token est encore valide"""
        if not self.token_expires_at:
            return bool(self.access_token)
        return datetime.now() < self.token_expires_at
    
    @property
    def needs_sync(self) -> bool:
        """Vérifie si une synchronisation est nécessaire"""
        if not self.last_sync:
            return True
        
        hours_since_sync = (datetime.now() - self.last_sync).total_seconds() / 3600
        return hours_since_sync >= self.sync_frequency_hours


@dataclass
class ProfileSyncMapping:
    """Mapping entre profil LinkedIn et CV"""
    
    # Mapping des champs de base
    field_mappings: Dict[str, str] = field(default_factory=lambda: {
        "firstName": "first_name",
        "lastName": "last_name", 
        "headline": "professional_title",
        "summary": "professional_summary",
        "location": "location",
        "industry": "industry"
    })
    
    # Mapping des expériences
    experience_mapping: Dict[str, str] = field(default_factory=lambda: {
        "title": "position_title",
        "companyName": "company_name",
        "description": "description",
        "startDate": "start_date",
        "endDate": "end_date",
        "location": "location"
    })
    
    # Mapping des formations
    education_mapping: Dict[str, str] = field(default_factory=lambda: {
        "schoolName": "institution",
        "fieldOfStudy": "field_of_study",
        "degree": "degree_type",
        "startDate": "start_date",
        "endDate": "end_date"
    })
    
    # Sections à ignorer lors de la sync
    ignored_sections: List[str] = field(default_factory=lambda: [
        "recommendations", "honors", "volunteer"
    ])


@dataclass
class SyncOperation:
    """Opération de synchronisation"""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    connection_id: str = ""
    
    # Configuration de l'opération
    sync_direction: str = "linkedin_to_cv"  # linkedin_to_cv, cv_to_linkedin, bidirectional
    sections_to_sync: List[ProfileSection] = field(default_factory=list)
    
    # État de l'opération
    status: SyncStatus = SyncStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Résultats
    synced_sections: List[ProfileSection] = field(default_factory=list)
    failed_sections: List[ProfileSection] = field(default_factory=list)
    changes_made: Dict[str, Any] = field(default_factory=dict)
    
    # Erreurs et logs
    error_message: Optional[str] = None
    sync_logs: List[str] = field(default_factory=list)
    
    @property
    def success_rate(self) -> float:
        """Calcule le taux de succès de la synchronisation"""
        if not self.sections_to_sync:
            return 0.0
        
        total_sections = len(self.sections_to_sync)
        successful_sections = len(self.synced_sections)
        
        return (successful_sections / total_sections) * 100.0
    
    def add_log(self, message: str):
        """Ajoute un log à l'opération"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.sync_logs.append(f"[{timestamp}] {message}")


@dataclass
class LinkedInIntegrationResult:
    """
    🎯 Résultat d'intégration LinkedIn complète
    """
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    cv_id: Optional[str] = None
    
    # Connexion LinkedIn
    connection: LinkedInConnection = field(default_factory=LinkedInConnection)
    
    # Données synchronisées
    linkedin_profile: Optional[LinkedInProfile] = None
    sync_operations: List[SyncOperation] = field(default_factory=list)
    
    # Analyse de compatibilité
    profile_completeness: float = field(default=0.0)  # 0-100%
    cv_linkedin_match_score: float = field(default=0.0)  # 0-100%
    
    # Recommandations d'amélioration
    missing_sections: List[ProfileSection] = field(default_factory=list)
    improvement_suggestions: List[str] = field(default_factory=list)
    
    # Insights professionnels
    industry_insights: List[str] = field(default_factory=list)
    network_insights: List[str] = field(default_factory=list)
    skill_gaps: List[str] = field(default_factory=list)
    
    # Métadonnées
    last_analysis: datetime = field(default_factory=datetime.now)
    total_syncs: int = 0
    
    def calculate_profile_completeness(self) -> float:
        """Calcule le score de complétude du profil LinkedIn"""
        
        if not self.linkedin_profile:
            return 0.0
        
        profile = self.linkedin_profile
        score = 0.0
        
        # Informations de base (40 points)
        if profile.first_name and profile.last_name:
            score += 5
        if profile.headline:
            score += 10
        if profile.summary:
            score += 15
        if profile.location:
            score += 5
        if profile.profile_picture_url:
            score += 5
        
        # Expériences (30 points)
        if profile.positions:
            score += min(len(profile.positions) * 10, 30)
        
        # Formation (15 points)
        if profile.educations:
            score += min(len(profile.educations) * 7, 15)
        
        # Compétences (10 points)
        if profile.skills:
            score += min(len(profile.skills) * 2, 10)
        
        # Certifications et projets (5 points)
        if profile.certifications or profile.projects:
            score += 5
        
        self.profile_completeness = min(score, 100.0)
        return self.profile_completeness
    
    def generate_improvement_suggestions(self) -> List[str]:
        """Génère des suggestions d'amélioration du profil"""
        
        suggestions = []
        
        if not self.linkedin_profile:
            suggestions.append("Connectez votre profil LinkedIn pour obtenir des suggestions personnalisées")
            return suggestions
        
        profile = self.linkedin_profile
        
        # Suggestions de base
        if not profile.headline or len(profile.headline) < 50:
            suggestions.append("Améliorer votre titre professionnel (headline) - cible 50-120 caractères")
        
        if not profile.summary or len(profile.summary) < 200:
            suggestions.append("Développer votre résumé professionnel - minimum 200 caractères recommandés")
        
        if len(profile.positions) < 2:
            suggestions.append("Ajouter plus d'expériences professionnelles pour montrer votre progression")
        
        if len(profile.skills) < 10:
            suggestions.append("Enrichir vos compétences - cible 10-20 compétences clés")
        
        if not profile.certifications:
            suggestions.append("Ajouter des certifications professionnelles pour crédibiliser votre profil")
        
        if profile.connections_count < 100:
            suggestions.append("Développer votre réseau professionnel - cible 100+ connexions")
        
        # Suggestions avancées
        if profile.connections_count > 500 and not profile.projects:
            suggestions.append("Ajouter des projets pour mettre en valeur vos réalisations concrètes")
        
        if len(profile.languages) < 2:
            suggestions.append("Mentionner vos langues parlées pour des opportunités internationales")
        
        self.improvement_suggestions = suggestions
        return suggestions
    
    def generate_network_insights(self) -> List[str]:
        """Génère des insights sur le réseau professionnel"""
        
        insights = []
        
        if not self.linkedin_profile:
            return insights
        
        profile = self.linkedin_profile
        
        # Analyse du réseau
        if profile.connections_count > 1000:
            insights.append("🌟 Excellent réseau professionnel - Levier fort pour opportunités")
        elif profile.connections_count > 500:
            insights.append("👥 Bon réseau professionnel - Continue à développer")
        elif profile.connections_count > 100:
            insights.append("📈 Réseau en développement - Cible 500+ connexions qualifiées")
        else:
            insights.append("🎯 Priorité: Développer votre réseau LinkedIn pour plus d'opportunités")
        
        # Insights sectoriels
        if profile.industry:
            insights.append(f"🏢 Secteur {profile.industry}: Connectez-vous avec des professionnels clés")
        
        # Insights géographiques
        if profile.location:
            insights.append(f"📍 Position {profile.location}: Excellent pour le marché local")
        
        self.network_insights = insights
        return insights
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation complète pour API"""
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "cv_id": self.cv_id,
            "connection_status": self.connection.status.value,
            "linkedin_profile": {
                "linkedin_id": self.linkedin_profile.linkedin_id if self.linkedin_profile else None,
                "name": f"{self.linkedin_profile.first_name} {self.linkedin_profile.last_name}" if self.linkedin_profile else None,
                "headline": self.linkedin_profile.headline if self.linkedin_profile else None,
                "connections_count": self.linkedin_profile.connections_count if self.linkedin_profile else 0,
                "last_updated": self.linkedin_profile.last_updated.isoformat() if self.linkedin_profile else None
            },
            "analysis": {
                "profile_completeness": self.profile_completeness,
                "cv_linkedin_match_score": self.cv_linkedin_match_score,
                "total_syncs": self.total_syncs,
                "last_analysis": self.last_analysis.isoformat()
            },
            "recommendations": {
                "missing_sections": [section.value for section in self.missing_sections],
                "improvement_suggestions": self.improvement_suggestions,
                "skill_gaps": self.skill_gaps
            },
            "insights": {
                "industry_insights": self.industry_insights,
                "network_insights": self.network_insights
            },
            "sync_history": [
                {
                    "id": op.id,
                    "status": op.status.value,
                    "sections_synced": [section.value for section in op.synced_sections],
                    "success_rate": op.success_rate,
                    "completed_at": op.completed_at.isoformat() if op.completed_at else None
                }
                for op in self.sync_operations[-5:]  # 5 dernières syncs
            ]
        }