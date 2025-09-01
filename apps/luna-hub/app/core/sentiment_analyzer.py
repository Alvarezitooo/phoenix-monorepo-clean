"""
🌀 Sentiment Analyzer - Boucle Comportementale Luna
Analyse le sentiment et style utilisateur pour adaptation ton en temps réel
SPRINT 3: Empathie contextuelle intelligente
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import structlog
from app.core.redis_cache import redis_cache

logger = structlog.get_logger("sentiment_analyzer")


class UserSentiment:
    """Classe pour représenter le sentiment utilisateur analysé"""
    
    def __init__(
        self, 
        primary_sentiment: str,
        confidence: float,
        emotional_state: str,
        communication_style: str,
        energy_level: str,
        keywords_detected: List[str]
    ):
        self.primary_sentiment = primary_sentiment  # motivé, anxieux, factuel, curieux
        self.confidence = confidence  # 0.0-1.0
        self.emotional_state = emotional_state  # positive, negative, neutral, mixed
        self.communication_style = communication_style  # direct, poli, urgent, décontracté
        self.energy_level = energy_level  # high, medium, low
        self.keywords_detected = keywords_detected
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_sentiment": self.primary_sentiment,
            "confidence": self.confidence,
            "emotional_state": self.emotional_state,
            "communication_style": self.communication_style,
            "energy_level": self.energy_level,
            "keywords_detected": self.keywords_detected
        }


class SentimentAnalyzer:
    """
    🌀 Analyseur de Sentiment - Boucle Comportementale
    
    Détecte automatiquement:
    - Sentiment: motivé, anxieux, factuel, curieux
    - État émotionnel: positif, négatif, neutre
    - Style communication: direct, poli, urgent
    - Niveau énergie: high, medium, low
    """
    
    def __init__(self):
        """Initialize sentiment patterns"""
        self._load_sentiment_patterns()
    
    def _load_sentiment_patterns(self):
        """Charge les patterns de détection sentiment"""
        
        # 🔥 MOTIVÉ / ENTHOUSIASTE
        self.motivated_patterns = {
            "strong": [  # Signaux forts
                "let's go", "c'est parti", "go", "fonce", "on y va", "motivé",
                "j'ai hâte", "super", "génial", "parfait", "excellent", 
                "je veux absolument", "prêt", "déterminé", "ambitieux"
            ],
            "medium": [  # Signaux moyens
                "bien", "d'accord", "ok", "oui", "volontiers", "pourquoi pas",
                "intéressant", "ça me plaît", "bonne idée", "je suis partant"
            ]
        }
        
        # 😰 ANXIEUX / INCERTAIN
        self.anxious_patterns = {
            "strong": [
                "j'ai peur", "anxieux", "stressé", "inquiet", "nerveux", "angoissé",
                "je ne sais pas", "perdu", "compliqué", "difficile", "dur",
                "impossible", "je n'y arrive pas", "trop dur pour moi", "pas capable"
            ],
            "medium": [
                "pas sûr", "incertain", "doute", "hésitant", "peut-être", "si tu penses",
                "j'espère que", "pourvu que", "j'ai besoin d'aide", "accompagne-moi"
            ]
        }
        
        # 📊 FACTUEL / ANALYTIQUE  
        self.factual_patterns = {
            "strong": [
                "exactement", "précisément", "concrètement", "factuellement", "données",
                "statistiques", "mesure", "quantifie", "analyse", "détaille",
                "spécifiquement", "techniquement", "méthodologie"
            ],
            "medium": [
                "comment", "pourquoi", "quand", "combien", "quel", "quelle",
                "explique-moi", "détails", "procédure", "étapes", "méthode"
            ]
        }
        
        # 🤔 CURIEUX / EXPLORATOIRE
        self.curious_patterns = {
            "strong": [
                "découvrir", "explorer", "apprendre", "comprendre", "m'intéresse",
                "fascinant", "curieux", "surprise", "inattendu", "nouveau"
            ],
            "medium": [
                "et si", "imagine", "peut-on", "est-ce que", "que se passe-t-il",
                "raconte", "montre-moi", "parle-moi de", "qu'est-ce qui",
                "vraiment différente", "rend", "différent", "quelle est la différence"
            ]
        }
        
        # 🎭 STYLES COMMUNICATION
        self.communication_styles = {
            "direct": ["fais", "va", "donne", "montre", "dit", "rapidement", "direct"],
            "poli": ["s'il te plaît", "merci", "pourrais-tu", "serais-tu", "veuillez"],
            "urgent": ["vite", "rapidement", "urgent", "pressé", "maintenant", "immédiatement"],
            "décontracté": ["salut", "hey", "cool", "tranquille", "relax", "chill"]
        }
        
        # ⚡ NIVEAUX ÉNERGIE
        self.energy_patterns = {
            "high": ["!!", "!!!", "CAPS", "GO", "FONCE", "VITE", "MAINTENANT"],
            "medium": ["bien", "ok", "d'accord", "volontiers"],
            "low": ["...", "bon", "peut-être", "si tu veux", "fatigué", "épuisé"]
        }
    
    async def analyze_user_message(
        self, 
        message: str, 
        user_id: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> UserSentiment:
        """
        🌀 Analyse principale : détecte sentiment et style utilisateur
        
        Args:
            message: Message utilisateur à analyser
            user_id: ID utilisateur pour contexte
            conversation_history: Historique pour pattern temporel
            
        Returns:
            UserSentiment: Analyse complète du sentiment
        """
        
        # Preprocessing du message
        msg_lower = message.lower().strip()
        msg_original = message.strip()
        
        # Analyse multi-dimensionnelle
        primary_sentiment, confidence = self._detect_primary_sentiment(msg_lower)
        emotional_state = self._detect_emotional_state(msg_lower, msg_original)
        communication_style = self._detect_communication_style(msg_lower, msg_original)
        energy_level = self._detect_energy_level(msg_original)
        keywords_detected = self._extract_sentiment_keywords(msg_lower)
        
        # Ajustement selon contexte historique
        if conversation_history:
            primary_sentiment, confidence = self._adjust_with_history(
                primary_sentiment, confidence, conversation_history
            )
        
        # Construction résultat
        sentiment_result = UserSentiment(
            primary_sentiment=primary_sentiment,
            confidence=confidence,
            emotional_state=emotional_state,
            communication_style=communication_style,
            energy_level=energy_level,
            keywords_detected=keywords_detected
        )
        
        # Cache pour optimization (5 min TTL)
        await self._cache_sentiment_result(user_id, message, sentiment_result)
        
        logger.info(
            "Sentiment analyzed",
            user_id=user_id,
            sentiment=primary_sentiment,
            confidence=confidence,
            style=communication_style,
            energy=energy_level
        )
        
        return sentiment_result
    
    def _detect_primary_sentiment(self, message: str) -> tuple[str, float]:
        """Détecte le sentiment principal avec score de confiance"""
        
        scores = {
            "motivé": 0.0,
            "anxieux": 0.0, 
            "factuel": 0.0,
            "curieux": 0.0
        }
        
        # Score patterns motivé
        for pattern in self.motivated_patterns["strong"]:
            if pattern in message:
                scores["motivé"] += 2.0
        for pattern in self.motivated_patterns["medium"]:
            if pattern in message:
                scores["motivé"] += 1.0
        
        # Score patterns anxieux
        for pattern in self.anxious_patterns["strong"]:
            if pattern in message:
                scores["anxieux"] += 2.0
        for pattern in self.anxious_patterns["medium"]:
            if pattern in message:
                scores["anxieux"] += 1.0
        
        # Score patterns factuel
        for pattern in self.factual_patterns["strong"]:
            if pattern in message:
                scores["factuel"] += 2.0
        for pattern in self.factual_patterns["medium"]:
            if pattern in message:
                scores["factuel"] += 1.0
        
        # Score patterns curieux
        for pattern in self.curious_patterns["strong"]:
            if pattern in message:
                scores["curieux"] += 2.0
        for pattern in self.curious_patterns["medium"]:
            if pattern in message:
                scores["curieux"] += 1.0
        
        # Déterminer sentiment dominant
        max_sentiment = max(scores, key=scores.get)
        max_score = scores[max_sentiment]
        
        # Calcul confiance (normalisé 0-1)
        total_score = sum(scores.values())
        confidence = max_score / max(total_score, 1) if total_score > 0 else 0.3
        
        # Default si aucun pattern détecté
        if max_score == 0:
            return "neutre", 0.3
        
        return max_sentiment, min(confidence, 1.0)
    
    def _detect_emotional_state(self, msg_lower: str, msg_original: str) -> str:
        """Détecte l'état émotionnel global"""
        
        positive_indicators = ["super", "génial", "parfait", "excellent", "bien", "content"]
        negative_indicators = ["mauvais", "nul", "déçu", "frustré", "énervé", "marre"]
        
        positive_count = sum(1 for indicator in positive_indicators if indicator in msg_lower)
        negative_count = sum(1 for indicator in negative_indicators if indicator in msg_lower)
        
        # Indicateurs visuels
        if "!" in msg_original or "😊" in msg_original or "🚀" in msg_original:
            positive_count += 1
        if "..." in msg_original or "😞" in msg_original or "😤" in msg_original:
            negative_count += 1
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative" 
        else:
            return "neutral"
    
    def _detect_communication_style(self, msg_lower: str, msg_original: str) -> str:
        """Détecte le style de communication"""
        
        style_scores = {}
        
        for style, patterns in self.communication_styles.items():
            score = sum(1 for pattern in patterns if pattern in msg_lower)
            if score > 0:
                style_scores[style] = score
        
        # Indicateurs visuels
        if any(char.isupper() for char in msg_original):
            style_scores["direct"] = style_scores.get("direct", 0) + 1
        
        if not style_scores:
            return "neutre"
        
        return max(style_scores, key=style_scores.get)
    
    def _detect_energy_level(self, message: str) -> str:
        """Détecte le niveau d'énergie"""
        
        # Points d'exclamation
        exclamation_count = message.count('!')
        if exclamation_count >= 2:
            return "high"
        
        # CAPS LOCK
        caps_ratio = sum(1 for c in message if c.isupper()) / max(len(message), 1)
        if caps_ratio > 0.3:
            return "high"
        
        # Patterns énergie
        msg_lower = message.lower()
        for pattern in self.energy_patterns["high"]:
            if pattern.lower() in msg_lower:
                return "high"
        
        for pattern in self.energy_patterns["low"]:
            if pattern in msg_lower:
                return "low"
        
        return "medium"
    
    def _extract_sentiment_keywords(self, message: str) -> List[str]:
        """Extrait les mots-clés de sentiment détectés"""
        keywords = []
        
        all_patterns = (
            self.motivated_patterns["strong"] + self.motivated_patterns["medium"] +
            self.anxious_patterns["strong"] + self.anxious_patterns["medium"] +
            self.factual_patterns["strong"] + self.factual_patterns["medium"] +
            self.curious_patterns["strong"] + self.curious_patterns["medium"]
        )
        
        for pattern in all_patterns:
            if pattern in message:
                keywords.append(pattern)
        
        return keywords[:5]  # Top 5 keywords
    
    def _adjust_with_history(
        self, 
        sentiment: str, 
        confidence: float, 
        history: List[Dict]
    ) -> tuple[str, float]:
        """Ajuste le sentiment selon l'historique conversationnel"""
        
        if not history or len(history) < 2:
            return sentiment, confidence
        
        # Analyser la tendance sur les derniers messages
        recent_messages = [msg.get("message", "") for msg in history[-3:] if msg.get("role") == "user"]
        
        # Si pattern répétitif détecté, augmenter confiance
        if len(recent_messages) >= 2:
            consistent_sentiment_count = 0
            for msg in recent_messages:
                detected_sentiment, _ = self._detect_primary_sentiment(msg.lower())
                if detected_sentiment == sentiment:
                    consistent_sentiment_count += 1
            
            if consistent_sentiment_count >= 2:
                confidence = min(confidence + 0.2, 1.0)  # Boost confiance
        
        return sentiment, confidence
    
    async def _cache_sentiment_result(self, user_id: str, message: str, result: UserSentiment):
        """Cache le résultat pour optimization"""
        try:
            cache_key = f"sentiment:{user_id}:{hash(message)}"
            await redis_cache.set("sentiment", f"{user_id}:{hash(message)}", result.to_dict(), ttl=300)  # 5 min
        except Exception as e:
            logger.error("Error caching sentiment", user_id=user_id, error=str(e))


# Instance globale
sentiment_analyzer = SentimentAnalyzer()