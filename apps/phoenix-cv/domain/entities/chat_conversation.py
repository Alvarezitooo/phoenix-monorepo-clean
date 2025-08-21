"""
🤖 Phoenix CV - Chat AI Conversation Entity
Assistant IA personnel pour optimisation CV et conseils carrière
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class MessageType(Enum):
    """Type de message dans la conversation"""
    USER_QUESTION = "user_question"
    AI_RESPONSE = "ai_response"
    SYSTEM_INFO = "system_info"
    SUGGESTION = "suggestion"


class ConversationContext(Enum):
    """Contexte de la conversation"""
    CV_OPTIMIZATION = "cv_optimization"
    SALARY_ANALYSIS = "salary_analysis"
    JOB_SEARCH = "job_search"
    CAREER_ADVICE = "career_advice"
    SKILL_DEVELOPMENT = "skill_development"
    INTERVIEW_PREP = "interview_prep"
    GENERAL = "general"


class MessageIntent(Enum):
    """Intention détectée dans le message"""
    ASK_CV_ADVICE = "ask_cv_advice"
    REQUEST_SALARY_INFO = "request_salary_info"
    SEEK_JOB_RECOMMENDATIONS = "seek_job_recommendations"
    ASK_SKILLS_GAP = "ask_skills_gap"
    REQUEST_INTERVIEW_TIPS = "request_interview_tips"
    GENERAL_QUESTION = "general_question"
    FOLLOW_UP = "follow_up"


@dataclass
class ChatMessage:
    """Message individuel dans une conversation"""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    message_type: MessageType = MessageType.USER_QUESTION
    content: str = ""
    
    # Métadonnées IA
    intent: Optional[MessageIntent] = None
    confidence_score: float = field(default=0.0)  # 0-1
    entities_detected: List[str] = field(default_factory=list)
    
    # Contexte
    user_id: str = ""
    cv_id: Optional[str] = None
    related_data: Dict[str, Any] = field(default_factory=dict)
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    
    # Réponse IA (si c'est une réponse)
    sources: List[str] = field(default_factory=list)  # Sources des informations
    suggestions: List[str] = field(default_factory=list)  # Suggestions de suivi
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not self.content.strip():
            raise ValueError("Contenu du message obligatoire")


@dataclass
class ConversationMetrics:
    """Métriques d'une conversation"""
    
    total_messages: int = 0
    user_messages: int = 0
    ai_responses: int = 0
    
    # Qualité
    avg_response_time_ms: float = 0.0
    user_satisfaction_score: Optional[float] = None  # 1-5
    resolution_status: str = "ongoing"  # ongoing, resolved, escalated
    
    # Engagement
    conversation_length_minutes: float = 0.0
    topics_covered: List[str] = field(default_factory=list)
    actions_taken: List[str] = field(default_factory=list)  # cv_updated, analysis_requested, etc.


@dataclass
class ChatConversation:
    """
    🤖 Entité principale - Conversation avec l'assistant IA
    """
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    
    # Configuration
    context: ConversationContext = ConversationContext.GENERAL
    language: str = "fr"
    personality: str = "professional"  # professional, friendly, expert
    
    # Messages
    messages: List[ChatMessage] = field(default_factory=list)
    
    # État de la conversation
    is_active: bool = True
    last_activity: datetime = field(default_factory=datetime.now)
    created_at: datetime = field(default_factory=datetime.now)
    
    # Contexte utilisateur
    user_profile: Dict[str, Any] = field(default_factory=dict)
    current_cv_id: Optional[str] = None
    
    # Métriques
    metrics: ConversationMetrics = field(default_factory=ConversationMetrics)
    
    def add_user_message(self, content: str, cv_id: Optional[str] = None) -> ChatMessage:
        """Ajoute un message utilisateur"""
        
        message = ChatMessage(
            message_type=MessageType.USER_QUESTION,
            content=content,
            user_id=self.user_id,
            cv_id=cv_id or self.current_cv_id
        )
        
        self.messages.append(message)
        self.last_activity = datetime.now()
        self.metrics.total_messages += 1
        self.metrics.user_messages += 1
        
        return message
    
    def add_ai_response(self, 
                       content: str,
                       sources: List[str] = None,
                       suggestions: List[str] = None,
                       related_data: Dict[str, Any] = None) -> ChatMessage:
        """Ajoute une réponse IA"""
        
        message = ChatMessage(
            message_type=MessageType.AI_RESPONSE,
            content=content,
            user_id=self.user_id,
            cv_id=self.current_cv_id,
            sources=sources or [],
            suggestions=suggestions or [],
            related_data=related_data or {}
        )
        
        self.messages.append(message)
        self.last_activity = datetime.now()
        self.metrics.total_messages += 1
        self.metrics.ai_responses += 1
        
        return message
    
    def get_recent_messages(self, limit: int = 10) -> List[ChatMessage]:
        """Récupère les messages récents"""
        return self.messages[-limit:] if self.messages else []
    
    def get_conversation_context(self) -> str:
        """Génère le contexte de conversation pour l'IA"""
        
        recent_messages = self.get_recent_messages(5)
        
        context_parts = [
            f"Utilisateur ID: {self.user_id}",
            f"Contexte: {self.context.value}",
            f"Personnalité IA: {self.personality}",
        ]
        
        if self.current_cv_id:
            context_parts.append(f"CV actuel: {self.current_cv_id}")
        
        if self.user_profile:
            context_parts.append(f"Profil: {self.user_profile}")
        
        # Historique récent
        if recent_messages:
            context_parts.append("Historique récent:")
            for msg in recent_messages[-3:]:  # 3 derniers messages
                speaker = "👤 User" if msg.message_type == MessageType.USER_QUESTION else "🤖 AI"
                context_parts.append(f"{speaker}: {msg.content[:100]}...")
        
        return "\n".join(context_parts)
    
    def detect_context_change(self, new_message: str) -> ConversationContext:
        """Détecte si le contexte de conversation change"""
        
        message_lower = new_message.lower()
        
        # Mots-clés pour détection de contexte
        context_keywords = {
            ConversationContext.CV_OPTIMIZATION: ["cv", "résumé", "optimiser", "améliorer", "compétences"],
            ConversationContext.SALARY_ANALYSIS: ["salaire", "rémunération", "paye", "combien gagner"],
            ConversationContext.JOB_SEARCH: ["emploi", "poste", "candidature", "offre", "recherche"],
            ConversationContext.CAREER_ADVICE: ["carrière", "évolution", "conseil", "transition"],
            ConversationContext.SKILL_DEVELOPMENT: ["formation", "apprendre", "développer", "compétences"],
            ConversationContext.INTERVIEW_PREP: ["entretien", "interview", "questions", "préparation"]
        }
        
        # Score de correspondance par contexte
        context_scores = {}
        for context, keywords in context_keywords.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            if score > 0:
                context_scores[context] = score
        
        # Retourne le contexte avec le meilleur score, ou garde l'actuel
        if context_scores:
            best_context = max(context_scores.items(), key=lambda x: x[1])[0]
            return best_context
        
        return self.context
    
    def update_metrics(self):
        """Met à jour les métriques de conversation"""
        
        if self.messages:
            # Durée de conversation
            start_time = self.messages[0].created_at
            end_time = self.messages[-1].created_at
            self.metrics.conversation_length_minutes = (
                (end_time - start_time).total_seconds() / 60
            )
            
            # Topics couverts (basé sur les contextes détectés)
            topics = set()
            for msg in self.messages:
                if msg.message_type == MessageType.USER_QUESTION:
                    detected_context = self.detect_context_change(msg.content)
                    topics.add(detected_context.value)
            
            self.metrics.topics_covered = list(topics)
    
    def generate_conversation_summary(self) -> Dict[str, Any]:
        """Génère un résumé de la conversation"""
        
        self.update_metrics()
        
        return {
            "conversation_id": self.id,
            "user_id": self.user_id,
            "context": self.context.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "metrics": {
                "total_messages": self.metrics.total_messages,
                "user_messages": self.metrics.user_messages,
                "ai_responses": self.metrics.ai_responses,
                "conversation_length_minutes": round(self.metrics.conversation_length_minutes, 1),
                "topics_covered": self.metrics.topics_covered,
                "resolution_status": self.metrics.resolution_status
            },
            "recent_messages": [
                {
                    "type": msg.message_type.value,
                    "content": msg.content[:200] + "..." if len(msg.content) > 200 else msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in self.get_recent_messages(3)
            ]
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation complète pour API"""
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "context": self.context.value,
            "language": self.language,
            "personality": self.personality,
            "is_active": self.is_active,
            "current_cv_id": self.current_cv_id,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "messages": [
                {
                    "id": msg.id,
                    "type": msg.message_type.value,
                    "content": msg.content,
                    "intent": msg.intent.value if msg.intent else None,
                    "confidence_score": msg.confidence_score,
                    "entities_detected": msg.entities_detected,
                    "sources": msg.sources,
                    "suggestions": msg.suggestions,
                    "related_data": msg.related_data,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in self.messages
            ],
            "metrics": {
                "total_messages": self.metrics.total_messages,
                "user_messages": self.metrics.user_messages,
                "ai_responses": self.metrics.ai_responses,
                "avg_response_time_ms": self.metrics.avg_response_time_ms,
                "user_satisfaction_score": self.metrics.user_satisfaction_score,
                "resolution_status": self.metrics.resolution_status,
                "conversation_length_minutes": self.metrics.conversation_length_minutes,
                "topics_covered": self.metrics.topics_covered,
                "actions_taken": self.metrics.actions_taken
            },
            "user_profile": self.user_profile
        }