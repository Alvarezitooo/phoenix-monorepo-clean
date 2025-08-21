"""
Service IA Gemini - Infrastructure Layer
Clean Architecture - Implémentation concrète pour Google Gemini
"""

import asyncio
import time
from typing import Dict, Any, Optional
import logging

import google.generativeai as genai

from infrastructure.ai.ai_interface import (
    IAIService, 
    GenerationRequest, 
    GenerationResponse,
    AnalysisRequest,
    AnalysisResponse,
    AIModel
)
from shared.exceptions.business_exceptions import AIServiceError, handle_ai_error
from shared.config.settings import config

logger = logging.getLogger(__name__)


class GeminiService(IAIService):
    """
    Service IA utilisant Google Gemini
    Implémentation concrète de l'interface IAIService
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or config.ai.google_api_key
        self.model_name = model_name
        self.model = None
        self._is_configured = False
        
        if self.api_key:
            self._configure_client()
    
    def _configure_client(self) -> None:
        """Configuration du client Gemini"""
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            self._is_configured = True
            logger.info(f"✅ Client Gemini configuré: {self.model_name}")
        except Exception as e:
            logger.error(f"❌ Erreur configuration Gemini: {e}")
            raise AIServiceError(f"Configuration Gemini échouée: {e}", self.model_name, is_temporary=False)
    
    async def generate_letter_content(self, request: GenerationRequest) -> GenerationResponse:
        """
        Génère une lettre de motivation avec Gemini
        
        Args:
            request: Paramètres de génération
            
        Returns:
            GenerationResponse: Lettre générée avec métadonnées
        """
        if not self.is_available():
            raise AIServiceError("Service Gemini non disponible", self.model_name, is_temporary=True)
        
        logger.info(f"Génération lettre Gemini pour {request.company_name}")
        
        start_time = time.time()
        
        try:
            # Construction du prompt
            prompt = self._build_letter_prompt(request)
            
            # Génération avec Gemini (synchrone → async wrapper)
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.model.generate_content(
                    prompt,
                    generation_config=self._get_generation_config(request)
                )
            )
            
            generation_time = time.time() - start_time
            
            if not response or not response.text:
                raise AIServiceError("Réponse vide de Gemini", self.model_name, is_temporary=True)
            
            # Analyse rapide de qualité
            quality_metrics = await self._analyze_response_quality(response.text, request)
            
            result = GenerationResponse(
                content=response.text.strip(),
                model_used=self.model_name,
                generation_time_seconds=generation_time,
                token_count=self._estimate_token_count(response.text),
                confidence_score=quality_metrics.get("confidence_score"),
                estimated_quality=quality_metrics.get("quality_level"),
                detected_issues=quality_metrics.get("issues", []),
                suggestions=quality_metrics.get("suggestions", [])
            )
            
            logger.info(f"✅ Lettre générée en {generation_time:.2f}s - Qualité: {result.estimated_quality}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur génération Gemini: {e}")
            raise handle_ai_error(e, self.model_name)
    
    async def analyze_content(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Analyse un contenu avec Gemini
        
        Args:
            request: Paramètres d'analyse
            
        Returns:
            AnalysisResponse: Résultats d'analyse
        """
        if not self.is_available():
            raise AIServiceError("Service Gemini non disponible", self.model_name, is_temporary=True)
        
        logger.info(f"Analyse contenu Gemini: {request.analysis_type}")
        
        start_time = time.time()
        
        try:
            prompt = self._build_analysis_prompt(request)
            
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            
            processing_time = time.time() - start_time
            
            if not response or not response.text:
                raise AIServiceError("Réponse d'analyse vide de Gemini", self.model_name, is_temporary=True)
            
            # Parse de la réponse structurée
            analysis_result = self._parse_analysis_response(response.text, request.analysis_type)
            
            result = AnalysisResponse(
                analysis_type=request.analysis_type,
                score=analysis_result.get("score", 0.5),
                details=analysis_result.get("details", {}),
                suggestions=analysis_result.get("suggestions", []),
                model_used=self.model_name,
                processing_time_seconds=processing_time
            )
            
            logger.info(f"✅ Analyse terminée en {processing_time:.2f}s - Score: {result.score}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse Gemini: {e}")
            raise handle_ai_error(e, self.model_name)
    
    async def improve_content(
        self, 
        original_content: str, 
        improvement_type: str,
        context: Optional[Dict[str, Any]] = None
    ) -> GenerationResponse:
        """
        Améliore un contenu avec Gemini
        
        Args:
            original_content: Contenu original
            improvement_type: Type d'amélioration
            context: Contexte additionnel
            
        Returns:
            GenerationResponse: Contenu amélioré
        """
        if not self.is_available():
            raise AIServiceError("Service Gemini non disponible", self.model_name, is_temporary=True)
        
        logger.info(f"Amélioration contenu Gemini: {improvement_type}")
        
        start_time = time.time()
        
        try:
            prompt = self._build_improvement_prompt(original_content, improvement_type, context)
            
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            
            generation_time = time.time() - start_time
            
            if not response or not response.text:
                raise AIServiceError("Réponse d'amélioration vide de Gemini", self.model_name, is_temporary=True)
            
            result = GenerationResponse(
                content=response.text.strip(),
                model_used=self.model_name,
                generation_time_seconds=generation_time,
                token_count=self._estimate_token_count(response.text),
                estimated_quality="improved"  # Assumé amélioré
            )
            
            logger.info(f"✅ Contenu amélioré en {generation_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur amélioration Gemini: {e}")
            raise handle_ai_error(e, self.model_name)
    
    async def validate_content_quality(self, content: str) -> Dict[str, Any]:
        """
        Validation rapide de qualité (sans IA, métrics de base)
        
        Args:
            content: Contenu à valider
            
        Returns:
            Dict: Métriques de qualité
        """
        if not content.strip():
            return {"quality_score": 0.0, "issues": ["Contenu vide"]}
        
        # Métriques de base (sans appel IA)
        words = content.split()
        sentences = content.split('.')
        
        word_count = len(words)
        avg_sentence_length = len(words) / max(len(sentences), 1)
        
        # Calcul de score simple
        quality_score = 0.5
        issues = []
        
        # Longueur appropriée
        if word_count < 150:
            quality_score -= 0.2
            issues.append("Lettre trop courte")
        elif word_count > 500:
            quality_score -= 0.1
            issues.append("Lettre trop longue")
        else:
            quality_score += 0.2
        
        # Phrases ni trop courtes ni trop longues
        if avg_sentence_length < 8:
            quality_score -= 0.1
            issues.append("Phrases trop courtes")
        elif avg_sentence_length > 25:
            quality_score -= 0.2
            issues.append("Phrases trop longues")
        else:
            quality_score += 0.1
        
        # Structure basique
        if content.count('\n\n') >= 2:
            quality_score += 0.1
        else:
            issues.append("Structure peu claire")
        
        # Formules de politesse
        if any(formula in content.lower() for formula in ['madame', 'monsieur', 'cordialement']):
            quality_score += 0.1
        else:
            issues.append("Formules de politesse manquantes")
        
        quality_score = max(0.0, min(1.0, quality_score))
        
        return {
            "quality_score": quality_score,
            "word_count": word_count,
            "avg_sentence_length": avg_sentence_length,
            "issues": issues,
            "estimated_read_time": int(word_count / 250 * 60),  # secondes
        }
    
    def is_available(self) -> bool:
        """Vérifie si Gemini est disponible"""
        return self._is_configured and self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Informations sur le modèle Gemini"""
        return {
            "provider": "Google",
            "model_name": self.model_name,
            "model_type": "generative_ai",
            "supports_streaming": False,
            "max_tokens": config.ai.max_tokens,
            "temperature": config.ai.temperature,
            "is_configured": self._is_configured,
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Vérification de santé Gemini"""
        if not self.is_available():
            return {
                "status": "unhealthy",
                "error": "Service non configuré",
                "timestamp": time.time()
            }
        
        try:
            # Test simple
            start_time = time.time()
            test_response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.model.generate_content("Test de santé. Répondez simplement 'OK'.")
            )
            response_time = time.time() - start_time
            
            if test_response and test_response.text:
                return {
                    "status": "healthy",
                    "response_time_ms": int(response_time * 1000),
                    "model": self.model_name,
                    "timestamp": time.time()
                }
            else:
                return {
                    "status": "degraded",
                    "error": "Réponse vide",
                    "timestamp": time.time()
                }
                
        except Exception as e:
            logger.error(f"❌ Health check Gemini échoué: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
    
    # Méthodes privées d'aide
    
    def _build_letter_prompt(self, request: GenerationRequest) -> str:
        """Construit le prompt de génération de lettre"""
        return f"""Génère une lettre de motivation professionnelle pour:

- Entreprise: {request.company_name}
- Poste: {request.position_title}
- Description du poste: {request.job_description or "Non spécifiée"}
- Niveau d'expérience: {request.experience_level.value}
- Ton souhaité: {request.desired_tone.value}

Instructions:
- Lettre complète avec objet, introduction, développement, conclusion
- Ton {request.desired_tone.value.lower()} mais professionnel
- Mentionne des compétences pertinentes pour le poste
- Maximum {request.max_words} mots
- Format prêt à envoyer
- En français

Retourne uniquement la lettre, sans commentaires."""

    def _build_analysis_prompt(self, request: AnalysisRequest) -> str:
        """Construit le prompt d'analyse"""
        prompts = {
            "quality": f"""Analyse la qualité de cette lettre de motivation:

{request.content}

Évalue sur ces critères:
- Clarté et structure (0-100)
- Impact et persuasion (0-100) 
- Personnalisation (0-100)
- Ton professionnel (0-100)

Retourne une réponse JSON avec:
- score: moyenne globale (0-1)
- details: scores détaillés
- suggestions: liste d'améliorations""",

            "ats_optimization": f"""Analyse cette lettre pour l'optimisation ATS:

{request.content}

Vérifie:
- Mots-clés pertinents
- Format compatible ATS
- Structure claire
- Densité de mots-clés appropriée

Format JSON attendu.""",

            "tone_analysis": f"""Analyse le ton de cette lettre:

{request.content}

Évalue:
- Niveau de professionnalisme
- Degré d'enthousiasme
- Approprié pour candidature

Format JSON attendu."""
        }
        
        return prompts.get(request.analysis_type, prompts["quality"])
    
    def _build_improvement_prompt(
        self, 
        content: str, 
        improvement_type: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Construit le prompt d'amélioration"""
        base_prompt = f"""Améliore cette lettre de motivation:

{content}

Type d'amélioration: {improvement_type}
"""
        
        improvements = {
            "clarity": "Rends la lettre plus claire et concise",
            "impact": "Renforce l'impact et la persuasion",
            "tone": "Améliore le ton professionnel",
            "personalization": "Personnalise davantage pour l'entreprise",
            "ats": "Optimise pour les systèmes ATS"
        }
        
        instruction = improvements.get(improvement_type, "Améliore globalement")
        
        return f"""{base_prompt}

Instruction: {instruction}

Retourne la lettre améliorée complète, sans commentaires."""
    
    def _get_generation_config(self, request: GenerationRequest) -> Dict[str, Any]:
        """Configuration de génération Gemini"""
        return {
            "temperature": config.ai.temperature,
            "max_output_tokens": config.ai.max_tokens,
        }
    
    def _estimate_token_count(self, text: str) -> int:
        """Estimation grossière du nombre de tokens"""
        # Approximation: ~4 caractères par token pour le français
        return len(text) // 4
    
    async def _analyze_response_quality(self, content: str, request: GenerationRequest) -> Dict[str, Any]:
        """Analyse rapide de la qualité de la réponse"""
        quality_metrics = await self.validate_content_quality(content)
        
        # Calcul niveau de qualité
        score = quality_metrics["quality_score"]
        
        if score >= 0.8:
            quality_level = "high"
        elif score >= 0.6:
            quality_level = "medium"
        else:
            quality_level = "low"
        
        # Vérifications spécifiques à la requête
        content_lower = content.lower()
        company_mentioned = request.company_name.lower() in content_lower
        position_mentioned = request.position_title.lower() in content_lower
        
        if not company_mentioned:
            quality_metrics["issues"].append("Entreprise pas mentionnée")
        if not position_mentioned:
            quality_metrics["issues"].append("Poste pas mentionné")
        
        return {
            "confidence_score": score,
            "quality_level": quality_level,
            "issues": quality_metrics["issues"],
            "suggestions": self._generate_suggestions(quality_metrics, request)
        }
    
    def _generate_suggestions(self, metrics: Dict[str, Any], request: GenerationRequest) -> list:
        """Génère des suggestions d'amélioration"""
        suggestions = []
        
        if metrics["word_count"] < 200:
            suggestions.append("Développez davantage vos arguments")
        elif metrics["word_count"] > 400:
            suggestions.append("Condensez votre message")
        
        if metrics["avg_sentence_length"] > 20:
            suggestions.append("Utilisez des phrases plus courtes")
        
        if "Structure peu claire" in metrics["issues"]:
            suggestions.append("Structurez en paragraphes distincts")
        
        return suggestions[:3]  # Limiter à 3 suggestions
    
    def _parse_analysis_response(self, response_text: str, analysis_type: str) -> Dict[str, Any]:
        """Parse la réponse d'analyse (format JSON attendu)"""
        try:
            import json
            # Tentative de parsing JSON
            if "{" in response_text and "}" in response_text:
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                json_str = response_text[start:end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback si parsing JSON échoue
        return {
            "score": 0.5,
            "details": {"raw_response": response_text},
            "suggestions": ["Analyse détaillée non disponible"]
        }