"""
Interface IA - Infrastructure Layer
Clean Architecture - Contrat pour les services IA
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from domain.entities.letter import Letter, LetterTone, ExperienceLevel


class AIModel(Enum):
    """Modèles IA supportés"""
    GEMINI_1_5_FLASH = "gemini-1.5-flash"
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    GPT_4 = "gpt-4"
    CLAUDE_3 = "claude-3-sonnet"


@dataclass
class GenerationRequest:
    """Requête de génération de contenu"""
    company_name: str
    position_title: str
    job_description: Optional[str] = None
    experience_level: ExperienceLevel = ExperienceLevel.INTERMEDIATE
    desired_tone: LetterTone = LetterTone.PROFESSIONAL
    max_words: int = 350
    language: str = "fr"
    
    # Options avancées
    include_achievements: bool = True
    include_motivation: bool = True
    include_company_research: bool = False
    custom_instructions: Optional[str] = None


@dataclass
class GenerationResponse:
    """Réponse de génération de contenu"""
    content: str
    model_used: str
    generation_time_seconds: float
    token_count: Optional[int] = None
    confidence_score: Optional[float] = None
    
    # Métadonnées de qualité
    estimated_quality: Optional[str] = None  # "low", "medium", "high"
    detected_issues: List[str] = None
    suggestions: List[str] = None
    
    def __post_init__(self):
        if self.detected_issues is None:
            self.detected_issues = []
        if self.suggestions is None:
            self.suggestions = []


@dataclass
class AnalysisRequest:
    """Requête d'analyse de contenu"""
    content: str
    analysis_type: str  # "quality", "ats_optimization", "tone_analysis"
    context: Optional[Dict[str, Any]] = None


@dataclass
class AnalysisResponse:
    """Réponse d'analyse de contenu"""
    analysis_type: str
    score: float  # 0.0 - 1.0
    details: Dict[str, Any]
    suggestions: List[str]
    model_used: str
    processing_time_seconds: float


class IAIService(ABC):
    """
    Interface pour les services IA
    Abstraction pour différents providers (Gemini, OpenAI, etc.)
    """
    
    @abstractmethod
    async def generate_letter_content(self, request: GenerationRequest) -> GenerationResponse:
        """
        Génère le contenu d'une lettre de motivation
        
        Args:
            request: Paramètres de génération
            
        Returns:
            GenerationResponse: Contenu généré avec métadonnées
            
        Raises:
            AIServiceError: En cas d'erreur de génération
        """
        pass
    
    @abstractmethod
    async def analyze_content(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Analyse un contenu existant
        
        Args:
            request: Paramètres d'analyse
            
        Returns:
            AnalysisResponse: Résultats d'analyse
        """
        pass
    
    @abstractmethod
    async def improve_content(
        self, 
        original_content: str, 
        improvement_type: str,
        context: Optional[Dict[str, Any]] = None
    ) -> GenerationResponse:
        """
        Améliore un contenu existant
        
        Args:
            original_content: Contenu original
            improvement_type: Type d'amélioration ("clarity", "impact", "tone", etc.)
            context: Contexte additionnel
            
        Returns:
            GenerationResponse: Contenu amélioré
        """
        pass
    
    @abstractmethod
    async def validate_content_quality(self, content: str) -> Dict[str, Any]:
        """
        Validation rapide de la qualité d'un contenu
        
        Args:
            content: Contenu à valider
            
        Returns:
            Dict: Métriques de qualité de base
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Vérifie si le service IA est disponible
        
        Returns:
            bool: True si disponible, False sinon
        """
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Informations sur le modèle utilisé
        
        Returns:
            Dict: Informations du modèle (nom, version, capacités, etc.)
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Vérification de santé du service IA
        
        Returns:
            Dict: Statut de santé et métriques
        """
        pass


class IPromptTemplate(ABC):
    """
    Interface pour les templates de prompts
    Pattern Strategy pour différents types de prompts
    """
    
    @abstractmethod
    def build_generation_prompt(self, request: GenerationRequest) -> str:
        """
        Construit un prompt de génération
        
        Args:
            request: Paramètres de génération
            
        Returns:
            str: Prompt optimisé
        """
        pass
    
    @abstractmethod
    def build_analysis_prompt(self, request: AnalysisRequest) -> str:
        """
        Construit un prompt d'analyse
        
        Args:
            request: Paramètres d'analyse
            
        Returns:
            str: Prompt d'analyse
        """
        pass
    
    @abstractmethod
    def build_improvement_prompt(
        self, 
        content: str, 
        improvement_type: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Construit un prompt d'amélioration
        
        Args:
            content: Contenu original
            improvement_type: Type d'amélioration
            context: Contexte additionnel
            
        Returns:
            str: Prompt d'amélioration
        """
        pass


class IAIServiceFactory(ABC):
    """
    Factory pour créer les services IA
    Pattern Factory pour l'injection de dépendances
    """
    
    @abstractmethod
    def create_ai_service(self, model: AIModel, config: Dict[str, Any]) -> IAIService:
        """
        Crée un service IA
        
        Args:
            model: Modèle IA souhaité
            config: Configuration du service
            
        Returns:
            IAIService: Instance du service IA
        """
        pass
    
    @abstractmethod
    def create_prompt_template(self, template_type: str = "default") -> IPromptTemplate:
        """
        Crée un template de prompts
        
        Args:
            template_type: Type de template
            
        Returns:
            IPromptTemplate: Instance du template
        """
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[AIModel]:
        """
        Liste les modèles IA disponibles
        
        Returns:
            List[AIModel]: Modèles disponibles
        """
        pass