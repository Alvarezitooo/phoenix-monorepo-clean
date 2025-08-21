"""
Entités métier - Letter Domain
Clean Architecture - Entities pures sans dépendances externes
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class LetterStatus(Enum):
    """Statuts possibles d'une lettre"""
    DRAFT = "draft"
    GENERATED = "generated"
    EDITED = "edited"
    FINALIZED = "finalized"


class LetterTone(Enum):
    """Tons disponibles pour la génération"""
    PROFESSIONAL = "professionnel"
    ENTHUSIASTIC = "enthousiaste" 
    CREATIVE = "créatif"
    CASUAL = "décontracté"


class ExperienceLevel(Enum):
    """Niveaux d'expérience"""
    JUNIOR = "junior"
    INTERMEDIATE = "intermédiaire"
    SENIOR = "senior"


@dataclass
class JobContext:
    """Value Object - Contexte du poste ciblé"""
    company_name: str
    position_title: str
    job_description: Optional[str] = None
    
    def __post_init__(self):
        if not self.company_name.strip():
            raise ValueError("Le nom de l'entreprise est obligatoire")
        if not self.position_title.strip():
            raise ValueError("Le titre du poste est obligatoire")
    
    @property
    def is_complete(self) -> bool:
        """Vérifie si le contexte job est complet"""
        return bool(
            self.company_name.strip() 
            and self.position_title.strip() 
            and self.job_description
        )


@dataclass
class LetterMetadata:
    """Value Object - Métadonnées de la lettre"""
    word_count: int = 0
    estimated_read_time_seconds: int = 0
    ai_generated: bool = False
    generation_model: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def update_word_count(self, content: str) -> None:
        """Met à jour le nombre de mots"""
        self.word_count = len(content.split()) if content else 0
        # 250 mots par minute de lecture
        self.estimated_read_time_seconds = int((self.word_count / 250) * 60)
        self.updated_at = datetime.now()


@dataclass
class Letter:
    """
    Entité métier principale - Lettre de motivation
    Aggregate Root du domaine Letter
    """
    
    # Identifiants
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    
    # Contenu
    content: str = ""
    job_context: Optional[JobContext] = None
    
    # Configuration génération
    experience_level: ExperienceLevel = ExperienceLevel.INTERMEDIATE
    desired_tone: LetterTone = LetterTone.PROFESSIONAL
    
    # État
    status: LetterStatus = LetterStatus.DRAFT
    metadata: LetterMetadata = field(default_factory=LetterMetadata)
    
    # Historique
    version: int = 1
    previous_versions: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if self.content:
            self.metadata.update_word_count(self.content)
    
    def update_content(self, new_content: str, ai_generated: bool = False, model: Optional[str] = None) -> None:
        """
        Met à jour le contenu de la lettre
        Domain logic - Rules business centralisées
        """
        if not new_content.strip():
            raise ValueError("Le contenu ne peut pas être vide")
        
        # Sauvegarde version précédente si changement significatif
        if self.content and len(self.content.split()) > 50:  # Plus de 50 mots
            self.previous_versions.append(self.content)
            self.version += 1
        
        self.content = new_content.strip()
        self.metadata.update_word_count(self.content)
        self.metadata.ai_generated = ai_generated
        if model:
            self.metadata.generation_model = model
        
        # Mise à jour du statut
        if ai_generated and self.status == LetterStatus.DRAFT:
            self.status = LetterStatus.GENERATED
        elif not ai_generated and self.status in [LetterStatus.GENERATED, LetterStatus.EDITED]:
            self.status = LetterStatus.EDITED
    
    def set_job_context(self, company: str, position: str, description: Optional[str] = None) -> None:
        """Définit le contexte du poste"""
        self.job_context = JobContext(
            company_name=company,
            position_title=position,
            job_description=description
        )
    
    def finalize(self) -> None:
        """Finalise la lettre (prête à envoyer)"""
        if not self.content.strip():
            raise ValueError("Impossible de finaliser une lettre vide")
        if not self.job_context:
            raise ValueError("Contexte du poste manquant")
        
        self.status = LetterStatus.FINALIZED
        self.metadata.updated_at = datetime.now()
    
    def can_be_edited(self) -> bool:
        """Vérifie si la lettre peut être modifiée"""
        return self.status != LetterStatus.FINALIZED
    
    def get_filename(self) -> str:
        """Génère un nom de fichier intelligent"""
        if self.job_context:
            company_clean = self.job_context.company_name.lower().replace(" ", "_")
            date_str = self.metadata.created_at.strftime("%Y%m%d")
            return f"lettre_{company_clean}_{date_str}.txt"
        return f"lettre_{self.metadata.created_at.strftime('%Y%m%d_%H%M%S')}.txt"
    
    def get_quality_indicators(self) -> Dict[str, Any]:
        """Indicateurs de qualité de base"""
        if not self.content:
            return {"word_count": 0, "has_company": False, "has_position": False}
        
        content_lower = self.content.lower()
        return {
            "word_count": self.metadata.word_count,
            "has_company": bool(
                self.job_context and 
                self.job_context.company_name.lower() in content_lower
            ),
            "has_position": bool(
                self.job_context and 
                self.job_context.position_title.lower() in content_lower
            ),
            "length_appropriate": 200 <= self.metadata.word_count <= 500,
            "estimated_read_time": self.metadata.estimated_read_time_seconds,
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour persistance"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "job_context": {
                "company_name": self.job_context.company_name,
                "position_title": self.job_context.position_title,
                "job_description": self.job_context.job_description,
            } if self.job_context else None,
            "experience_level": self.experience_level.value,
            "desired_tone": self.desired_tone.value,
            "status": self.status.value,
            "metadata": {
                "word_count": self.metadata.word_count,
                "estimated_read_time_seconds": self.metadata.estimated_read_time_seconds,
                "ai_generated": self.metadata.ai_generated,
                "generation_model": self.metadata.generation_model,
                "created_at": self.metadata.created_at.isoformat(),
                "updated_at": self.metadata.updated_at.isoformat(),
            },
            "version": self.version,
            "previous_versions": self.previous_versions,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Letter":
        """Désérialisation depuis persistance"""
        letter = cls(
            id=data.get("id", str(uuid.uuid4())),
            user_id=data.get("user_id"),
            content=data.get("content", ""),
            experience_level=ExperienceLevel(data.get("experience_level", "intermédiaire")),
            desired_tone=LetterTone(data.get("desired_tone", "professionnel")),
            status=LetterStatus(data.get("status", "draft")),
            version=data.get("version", 1),
            previous_versions=data.get("previous_versions", []),
        )
        
        # Job context
        if job_data := data.get("job_context"):
            letter.job_context = JobContext(
                company_name=job_data["company_name"],
                position_title=job_data["position_title"],
                job_description=job_data.get("job_description"),
            )
        
        # Metadata
        if meta_data := data.get("metadata"):
            letter.metadata = LetterMetadata(
                word_count=meta_data.get("word_count", 0),
                estimated_read_time_seconds=meta_data.get("estimated_read_time_seconds", 0),
                ai_generated=meta_data.get("ai_generated", False),
                generation_model=meta_data.get("generation_model"),
                created_at=datetime.fromisoformat(meta_data.get("created_at", datetime.now().isoformat())),
                updated_at=datetime.fromisoformat(meta_data.get("updated_at", datetime.now().isoformat())),
            )
        
        return letter