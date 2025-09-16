"""
🧠 Phoenix Luna - Advanced NLP Service v2.0
Intelligence Sémantique - Phase 1 Upgrade
Service d'analyse textuelle avancée pour enrichir le Capital Narratif
"""

import os
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import json
import structlog
from datetime import datetime

logger = structlog.get_logger("nlp_service")

@dataclass
class SentimentAnalysis:
    """Résultat d'analyse de sentiment"""
    polarity: float  # -1.0 (négatif) à 1.0 (positif)
    confidence: float  # 0.0 à 1.0
    dominant_emotion: str  # joy, fear, anger, sadness, surprise, neutral
    intensity: str  # low, medium, high

@dataclass
class TextInsights:
    """Insights extraits d'un texte"""
    keywords: List[str]
    themes: List[str]
    sentiment: SentimentAnalysis
    complexity_score: float  # 0.0 à 1.0
    readability_score: float  # 0.0 à 1.0
    career_indicators: List[str]  # Indicateurs carrière détectés

@dataclass
class SemanticSimilarity:
    """Similarité sémantique entre textes"""
    similarity_score: float  # 0.0 à 1.0
    common_themes: List[str]
    conceptual_overlap: float

class AdvancedNLPService:
    """
    Service NLP Avancé - Phase 1
    Intelligence sémantique pour enrichir le narratif utilisateur
    """
    
    def __init__(self):
        self.career_lexicon = self._load_career_lexicon()
        self.emotion_patterns = self._load_emotion_patterns()
        logger.info("🧠 Advanced NLP Service initialized - Phase 1 ready")
    
    def analyze_text(self, text: str, context: str = "general") -> TextInsights:
        """
        Analyse complète d'un texte avec insights narratifs
        """
        if not text or len(text.strip()) < 3:
            return self._empty_insights()
            
        try:
            # Nettoyage et préparation
            cleaned_text = self._clean_text(text)
            
            # Extraction des mots-clés intelligente
            keywords = self._extract_keywords(cleaned_text, context)
            
            # Détection des thèmes
            themes = self._detect_themes(cleaned_text, keywords)
            
            # Analyse de sentiment avancée
            sentiment = self._analyze_sentiment(cleaned_text)
            
            # Scores de complexité et lisibilité
            complexity_score = self._calculate_complexity(cleaned_text)
            readability_score = self._calculate_readability(cleaned_text)
            
            # Indicateurs carrière spécialisés
            career_indicators = self._extract_career_indicators(cleaned_text)
            
            insights = TextInsights(
                keywords=keywords,
                themes=themes,
                sentiment=sentiment,
                complexity_score=complexity_score,
                readability_score=readability_score,
                career_indicators=career_indicators
            )
            
            logger.info("Text analysis completed", 
                       keywords_count=len(keywords),
                       themes_count=len(themes),
                       sentiment_polarity=sentiment.polarity,
                       career_indicators_count=len(career_indicators))
            
            return insights
            
        except Exception as e:
            logger.error("Text analysis failed", error=str(e))
            return self._empty_insights()
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> SemanticSimilarity:
        """
        Calcul de similarité sémantique entre deux textes
        """
        try:
            # Analyse des deux textes
            insights1 = self.analyze_text(text1)
            insights2 = self.analyze_text(text2)
            
            # Similarité des mots-clés
            keyword_overlap = self._calculate_overlap(insights1.keywords, insights2.keywords)
            
            # Similarité des thèmes
            theme_overlap = self._calculate_overlap(insights1.themes, insights2.themes)
            
            # Score de similarité global
            similarity_score = (keyword_overlap * 0.6) + (theme_overlap * 0.4)
            
            # Thèmes communs
            common_themes = list(set(insights1.themes) & set(insights2.themes))
            
            # Overlap conceptuel
            conceptual_overlap = (keyword_overlap + theme_overlap) / 2
            
            return SemanticSimilarity(
                similarity_score=similarity_score,
                common_themes=common_themes,
                conceptual_overlap=conceptual_overlap
            )
            
        except Exception as e:
            logger.error("Semantic similarity calculation failed", error=str(e))
            return SemanticSimilarity(similarity_score=0.0, common_themes=[], conceptual_overlap=0.0)
    
    def extract_narrative_metadata(self, text: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extraction de métadonnées narratives pour enrichir le Capital Narratif
        """
        insights = self.analyze_text(text, "narrative")
        
        # Analyse du progression sentiment
        progression_indicators = self._detect_progression_indicators(text)
        
        # Détection des blocages ou challenges
        challenges = self._detect_challenges(text, insights.sentiment)
        
        # Niveau de motivation inféré
        motivation_level = self._infer_motivation_level(insights.sentiment, progression_indicators)
        
        # Recommandations personnalisées
        recommendations = self._generate_recommendations(insights, user_context)
        
        return {
            "narrative_enrichment": {
                "dominant_themes": insights.themes,
                "emotional_state": insights.sentiment.dominant_emotion,
                "motivation_level": motivation_level,
                "progression_indicators": progression_indicators,
                "challenges_detected": challenges,
                "career_focus_areas": insights.career_indicators,
                "text_complexity": insights.complexity_score,
                "communication_style": self._infer_communication_style(insights)
            },
            "personalization_hints": {
                "recommended_tone": self._recommend_tone(insights.sentiment),
                "suggested_next_actions": recommendations,
                "optimal_interaction_time": self._predict_optimal_time(insights),
                "preferred_content_type": self._infer_content_preference(insights)
            }
        }
    
    # === Méthodes privées === #
    
    def _clean_text(self, text: str) -> str:
        """Nettoyage intelligent du texte"""
        # Suppression des caractères parasites
        cleaned = re.sub(r'[^\w\s\-.,!?;:]', ' ', text)
        # Normalisation des espaces
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()
    
    def _extract_keywords(self, text: str, context: str) -> List[str]:
        """Extraction intelligente des mots-clés"""
        words = text.lower().split()
        
        # Filtrage des mots vides (stop words basiques)
        stop_words = {'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou', 'mais', 'si', 'pour', 'avec', 'sur', 'dans', 'par', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'ce', 'cette', 'ces', 'que', 'qui', 'dont', 'où', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'for', 'with', 'on', 'in', 'by'}
        
        # Mots significatifs (plus de 3 caractères, pas de stop words)
        meaningful_words = [w for w in words if len(w) > 3 and w not in stop_words]
        
        # Calcul de fréquence
        word_freq = {}
        for word in meaningful_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Top mots-clés (tri par fréquence)
        keywords = sorted(word_freq.keys(), key=lambda x: word_freq[x], reverse=True)[:10]
        
        return keywords
    
    def _detect_themes(self, text: str, keywords: List[str]) -> List[str]:
        """Détection des thèmes basée sur les mots-clés et patterns"""
        themes = []
        text_lower = text.lower()
        
        # Thèmes carrière
        career_patterns = {
            'reconversion': ['reconversion', 'changement', 'nouveau', 'transition'],
            'compétences': ['compétence', 'skill', 'savoir', 'expertise', 'maîtrise'],
            'entretien': ['entretien', 'interview', 'recrutement', 'candidature'],
            'cv': ['cv', 'curriculum', 'expérience', 'parcours'],
            'motivation': ['motivation', 'envie', 'passion', 'objectif', 'but'],
            'formation': ['formation', 'cours', 'apprentissage', 'étude'],
            'réseau': ['réseau', 'contact', 'relation', 'networking']
        }
        
        for theme, patterns in career_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                themes.append(theme)
        
        return themes[:5]  # Limite à 5 thèmes principaux
    
    def _analyze_sentiment(self, text: str) -> SentimentAnalysis:
        """Analyse de sentiment basique mais efficace"""
        # Lexique de sentiment basique
        positive_words = ['bon', 'bien', 'super', 'génial', 'excellent', 'parfait', 'formidable', 'satisfait', 'heureux', 'content', 'good', 'great', 'excellent', 'perfect', 'amazing', 'happy', 'satisfied']
        negative_words = ['mauvais', 'mal', 'nul', 'terrible', 'difficile', 'compliqué', 'frustrant', 'décevant', 'triste', 'énervé', 'bad', 'terrible', 'difficult', 'complicated', 'frustrating', 'disappointing', 'sad', 'angry']
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total_emotional = positive_count + negative_count
        
        if total_emotional == 0:
            polarity = 0.0
            confidence = 0.3
            emotion = "neutral"
        else:
            polarity = (positive_count - negative_count) / total_emotional
            confidence = min(total_emotional / len(words) * 10, 1.0)
            
            if polarity > 0.3:
                emotion = "joy"
            elif polarity < -0.3:
                emotion = "sadness"
            else:
                emotion = "neutral"
        
        # Intensité basée sur la confiance
        if confidence > 0.7:
            intensity = "high"
        elif confidence > 0.4:
            intensity = "medium"
        else:
            intensity = "low"
        
        return SentimentAnalysis(
            polarity=polarity,
            confidence=confidence,
            dominant_emotion=emotion,
            intensity=intensity
        )
    
    def _calculate_complexity(self, text: str) -> float:
        """Score de complexité du texte"""
        words = text.split()
        sentences = text.split('.')
        
        if not words or not sentences:
            return 0.0
        
        # Moyennes
        avg_word_length = sum(len(word) for word in words) / len(words)
        avg_sentence_length = len(words) / len(sentences)
        
        # Score normalisé (0-1)
        complexity = min((avg_word_length * avg_sentence_length) / 100, 1.0)
        return complexity
    
    def _calculate_readability(self, text: str) -> float:
        """Score de lisibilité (inverse de la complexité)"""
        complexity = self._calculate_complexity(text)
        return 1.0 - complexity
    
    def _extract_career_indicators(self, text: str) -> List[str]:
        """Extraction des indicateurs carrière spécialisés"""
        indicators = []
        text_lower = text.lower()
        
        # Patterns carrière avancés
        career_indicators = {
            'leadership': ['manager', 'diriger', 'équipe', 'leadership', 'responsabilité'],
            'technique': ['développeur', 'ingénieur', 'technique', 'code', 'programmation'],
            'communication': ['présentation', 'client', 'commercial', 'vente', 'négociation'],
            'créativité': ['créatif', 'design', 'artistique', 'innovation', 'idée'],
            'analyse': ['analyse', 'données', 'recherche', 'investigation', 'étude']
        }
        
        for indicator, patterns in career_indicators.items():
            if any(pattern in text_lower for pattern in patterns):
                indicators.append(indicator)
        
        return indicators
    
    def _calculate_overlap(self, list1: List[str], list2: List[str]) -> float:
        """Calcul du chevauchement entre deux listes"""
        if not list1 or not list2:
            return 0.0
        
        set1, set2 = set(list1), set(list2)
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        return intersection / union if union > 0 else 0.0
    
    def _detect_progression_indicators(self, text: str) -> List[str]:
        """Détection d'indicateurs de progression"""
        indicators = []
        text_lower = text.lower()
        
        progression_patterns = {
            'amélioration': ['mieux', 'progrès', 'amélioration', 'évolution'],
            'accomplissement': ['réussir', 'accomplir', 'atteindre', 'objectif'],
            'apprentissage': ['apprendre', 'découvrir', 'comprendre', 'maîtriser']
        }
        
        for indicator, patterns in progression_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                indicators.append(indicator)
        
        return indicators
    
    def _detect_challenges(self, text: str, sentiment: SentimentAnalysis) -> List[str]:
        """Détection des challenges/obstacles"""
        challenges = []
        text_lower = text.lower()
        
        challenge_patterns = ['difficile', 'problème', 'obstacle', 'bloquer', 'compliqué', 'confus']
        
        for pattern in challenge_patterns:
            if pattern in text_lower:
                challenges.append(pattern)
        
        # Ajout basé sur le sentiment négatif
        if sentiment.polarity < -0.2:
            challenges.append('sentiment_négatif_détecté')
        
        return challenges[:3]  # Limite à 3 challenges principaux
    
    def _infer_motivation_level(self, sentiment: SentimentAnalysis, progression: List[str]) -> str:
        """Inférence du niveau de motivation"""
        score = sentiment.polarity
        
        # Bonus pour progression
        if progression:
            score += 0.3
        
        if score > 0.4:
            return "high"
        elif score > -0.2:
            return "medium"
        else:
            return "low"
    
    def _generate_recommendations(self, insights: TextInsights, user_context: Dict[str, Any]) -> List[str]:
        """Génération de recommandations personnalisées"""
        recommendations = []
        
        # Basé sur le sentiment
        if insights.sentiment.polarity < 0:
            recommendations.append("Focus sur les aspects positifs et les réussites")
        
        # Basé sur les thèmes détectés
        if 'reconversion' in insights.themes:
            recommendations.append("Explorer des parcours de transition similaires")
        
        if 'compétences' in insights.themes:
            recommendations.append("Identifier les compétences transférables")
        
        # Recommandation par défaut
        if not recommendations:
            recommendations.append("Continuer l'exploration de votre projet professionnel")
        
        return recommendations[:3]
    
    def _infer_communication_style(self, insights: TextInsights) -> str:
        """Inférence du style de communication"""
        if insights.complexity_score > 0.6:
            return "detailed"
        elif insights.sentiment.intensity == "high":
            return "expressive"
        else:
            return "concise"
    
    def _recommend_tone(self, sentiment: SentimentAnalysis) -> str:
        """Recommandation de ton pour les interactions"""
        if sentiment.polarity > 0.3:
            return "enthusiastic"
        elif sentiment.polarity < -0.3:
            return "supportive"
        else:
            return "neutral"
    
    def _predict_optimal_time(self, insights: TextInsights) -> str:
        """Prédiction du moment optimal d'interaction"""
        # Logique basique - à enrichir avec de vraies données comportementales
        if insights.sentiment.intensity == "high":
            return "immediate"
        else:
            return "within_24h"
    
    def _infer_content_preference(self, insights: TextInsights) -> str:
        """Inférence du type de contenu préféré"""
        if 'technique' in insights.career_indicators:
            return "detailed_guides"
        elif insights.complexity_score < 0.3:
            return "visual_summaries"
        else:
            return "structured_advice"
    
    def _load_career_lexicon(self) -> Dict[str, List[str]]:
        """Chargement du lexique carrière (peut être externalisé)"""
        return {
            "métiers_tech": ["développeur", "ingénieur", "data", "cloud", "devops"],
            "métiers_business": ["marketing", "vente", "commercial", "management"],
            "métiers_créatifs": ["design", "graphique", "ux", "ui", "créatif"]
        }
    
    def _load_emotion_patterns(self) -> Dict[str, List[str]]:
        """Chargement des patterns émotionnels"""
        return {
            "stress": ["stressé", "anxieux", "inquiet", "nerveux"],
            "confiance": ["confiant", "sûr", "capable", "compétent"],
            "motivation": ["motivé", "enthousiaste", "passionné", "déterminé"]
        }
    
    def _empty_insights(self) -> TextInsights:
        """Retourne des insights vides en cas d'erreur"""
        return TextInsights(
            keywords=[],
            themes=[],
            sentiment=SentimentAnalysis(polarity=0.0, confidence=0.0, dominant_emotion="neutral", intensity="low"),
            complexity_score=0.0,
            readability_score=0.0,
            career_indicators=[]
        )

# Instance globale
nlp_service = AdvancedNLPService()