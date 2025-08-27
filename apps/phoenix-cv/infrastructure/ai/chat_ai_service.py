"""
🤖 Phoenix CV - Chat AI Service
Service d'IA conversationnelle pour assistance CV et carrière
"""

import google.generativeai as genai
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import requests

from domain.entities.chat_conversation import ChatConversation, ChatMessage, MessageType, ConversationContext
from domain.entities.cv_document import CVDocument
from shared.exceptions.business_exceptions import AIServiceError
from shared.config.settings import config


class ChatAIService:
    """Service d'IA conversationnelle pour Phoenix CV - Intégré avec Luna Core"""
    
    def __init__(self):
        """Initialise le service avec Luna Hub integration"""
        
        # Configuration du Hub pour Luna Core - fail-fast si absent
        if not config.app.luna_hub_url:
            raise AIServiceError("LUNA_HUB_URL manquant - configure la variable d'environnement pour le service CV")
        
        self.luna_hub_url = config.app.luna_hub_url
        self.use_luna_core = True  # Utiliser Luna Core par défaut
        
        # Fallback vers Gemini local si Luna Hub indisponible
        if not config.ai.google_api_key:
            raise AIServiceError("Clé API Gemini manquante")
        
        genai.configure(api_key=config.ai.google_api_key)
        
        # Modèle de fallback
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.8,
                "max_output_tokens": 2000,
            }
        )
        
        # Personnalités disponibles (fallback uniquement)
        self.personalities = {
            "professional": {
                "tone": "professionnel et expert",
                "style": "précis, structuré, avec exemples concrets",
                "expertise": "RH, recrutement, optimisation CV"
            },
            "friendly": {
                "tone": "bienveillant et encourageant", 
                "style": "chaleureux, accessible, motivant",
                "expertise": "coaching carrière, développement personnel"
            },
            "expert": {
                "tone": "technique et approfondi",
                "style": "analytique, détaillé, avec données marché",
                "expertise": "stratégie carrière, négociation, industrie"
            }
        }
    
    async def generate_ai_response(self, 
                                 conversation: ChatConversation,
                                 user_message: str,
                                 cv_data: Optional[CVDocument] = None,
                                 context_data: Dict[str, Any] = None) -> ChatMessage:
        """Génère une réponse IA pour la conversation avec Luna Core"""
        
        try:
            # Tentative d'utilisation de Luna Core Hub
            if self.use_luna_core:
                try:
                    luna_response = await self._call_luna_hub(
                        user_id=conversation.user_id,
                        message=user_message,
                        app_context="cv",
                        user_name=conversation.user_profile.get("name") if conversation.user_profile else None
                    )
                    
                    if luna_response["success"]:
                        # Création du message avec réponse Luna
                        ai_message = ChatMessage(
                            message_type=MessageType.AI_RESPONSE,
                            content=luna_response["message"],
                            user_id=conversation.user_id,
                            cv_id=conversation.current_cv_id,
                            sources=[],
                            suggestions=[],  # TODO: Luna pourrait retourner des suggestions
                            related_data={"luna_core": True, "energy_consumed": luna_response.get("energy_consumed", 5)}
                        )
                        return ai_message
                    
                except Exception as e:
                    # Log l'erreur mais continue avec fallback
                    print(f"⚠️ Luna Hub indisponible, fallback Gemini local: {e}")
            
            # Fallback vers Gemini local avec ancien système
            prompt = self._build_conversation_prompt(
                conversation, user_message, cv_data, context_data
            )
            
            # Génération avec Gemini
            response = await self._call_gemini_api(prompt)
            
            # Analyse de la réponse
            parsed_response = self._parse_ai_response(response)
            
            # Création du message de réponse
            ai_message = ChatMessage(
                message_type=MessageType.AI_RESPONSE,
                content=parsed_response["content"],
                user_id=conversation.user_id,
                cv_id=conversation.current_cv_id,
                sources=parsed_response.get("sources", []),
                suggestions=parsed_response.get("suggestions", []),
                related_data=parsed_response.get("related_data", {})
            )
            
            return ai_message
            
        except Exception as e:
            raise AIServiceError(f"Erreur génération réponse IA: {str(e)}")
    
    def _build_conversation_prompt(self,
                                 conversation: ChatConversation,
                                 user_message: str,
                                 cv_data: Optional[CVDocument] = None,
                                 context_data: Dict[str, Any] = None) -> str:
        """Construit le prompt complet pour l'IA"""
        
        # Personnalité sélectionnée
        personality = self.personalities.get(
            conversation.personality, 
            self.personalities["professional"]
        )
        
        # Contexte de base
        prompt_parts = [
            "🤖 ASSISTANT IA PHOENIX CV - EXPERT CARRIÈRE",
            "",
            f"PERSONNALITÉ: {personality['tone']}",
            f"STYLE: {personality['style']}", 
            f"EXPERTISE: {personality['expertise']}",
            "",
            f"CONTEXTE CONVERSATION: {conversation.context.value}",
            f"LANGUE: {conversation.language}",
            "",
            "RÈGLES:",
            "- Réponses max 500 mots, structurées et actionnables",
            "- Toujours proposer 2-3 suggestions de suivi",
            "- Citer les sources si données externes utilisées",
            "- Adapter le ton selon la personnalité",
            "- Focus sur l'aide pratique et personnalisée",
            "",
        ]
        
        # Profil utilisateur si disponible
        if conversation.user_profile:
            prompt_parts.extend([
                "PROFIL UTILISATEUR:",
                json.dumps(conversation.user_profile, indent=2),
                ""
            ])
        
        # Données CV si disponibles
        if cv_data:
            prompt_parts.extend([
                "CV ACTUEL:",
                f"- Poste ciblé: {cv_data.target_position}",
                f"- Expérience: {cv_data.years_experience} ans",
                f"- Compétences clés: {', '.join(cv_data.key_skills[:5])}",
                f"- Score ATS: {cv_data.ats_score}/100",
                ""
            ])
        
        # Contexte additionnel
        if context_data:
            prompt_parts.extend([
                "DONNÉES CONTEXTE:",
                json.dumps(context_data, indent=2),
                ""
            ])
        
        # Historique récent
        recent_messages = conversation.get_recent_messages(5)
        if recent_messages:
            prompt_parts.extend([
                "HISTORIQUE RÉCENT:",
            ])
            
            for msg in recent_messages[-3:]:
                speaker = "👤 UTILISATEUR" if msg.message_type == MessageType.USER_QUESTION else "🤖 ASSISTANT"
                prompt_parts.append(f"{speaker}: {msg.content[:150]}...")
            
            prompt_parts.append("")
        
        # Question actuelle
        prompt_parts.extend([
            "QUESTION UTILISATEUR:",
            user_message,
            "",
            "RÉPONSE ATTENDUE (JSON):",
            "{",
            '  "content": "réponse détaillée et personnalisée",',
            '  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],',
            '  "sources": ["source si applicable"],',
            '  "related_data": {"key": "données supplémentaires"}',
            "}"
        ])
        
        return "\n".join(prompt_parts)
    
    async def _call_luna_hub(self, user_id: str, message: str, app_context: str = "cv", user_name: str = None) -> Dict[str, Any]:
        """Appelle le Luna Hub pour utiliser Luna Core"""
        
        payload = {
            "user_id": user_id,
            "message": message,
            "app_context": app_context
        }
        
        if user_name:
            payload["user_name"] = user_name
        
        # Utilisation de requests synchrone dans un contexte async
        import asyncio
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.luna_hub_url}/luna/chat/send-message",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_detail = response.json().get("detail", "Unknown error")
                raise AIServiceError(f"Luna Hub error: {error_detail}")
    
    async def _call_gemini_api(self, prompt: str) -> str:
        """Appel API Gemini avec gestion d'erreurs"""
        
        try:
            response = await self.model.generate_content_async(
                prompt,
                safety_settings={
                    'HARASSMENT': 'BLOCK_NONE',
                    'HATE_SPEECH': 'BLOCK_NONE', 
                    'SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                    'DANGEROUS_CONTENT': 'BLOCK_NONE'
                }
            )
            
            if not response.text:
                raise AIServiceError("Réponse vide de Gemini")
            
            return response.text
            
        except Exception as e:
            raise AIServiceError(f"Erreur API Gemini: {str(e)}")
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse la réponse JSON de l'IA"""
        
        try:
            # Nettoyage du texte
            cleaned_text = response_text.strip()
            
            # Extraction JSON si présent
            start_idx = cleaned_text.find('{')
            end_idx = cleaned_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = cleaned_text[start_idx:end_idx]
                return json.loads(json_str)
            
            # Fallback si pas de JSON valide
            return {
                "content": cleaned_text,
                "suggestions": [],
                "sources": [],
                "related_data": {}
            }
            
        except json.JSONDecodeError:
            # Si parsing JSON échoue, retour texte brut
            return {
                "content": response_text,
                "suggestions": [],
                "sources": [],
                "related_data": {}
            }
    
    async def analyze_conversation_context(self, 
                                         conversation: ChatConversation,
                                         new_message: str) -> ConversationContext:
        """Analyse le contexte avec IA pour améliorer la détection"""
        
        try:
            prompt = f"""
            Analyse ce message et détermine le contexte principal:
            
            MESSAGE: {new_message}
            CONTEXTE ACTUEL: {conversation.context.value}
            
            CONTEXTES POSSIBLES:
            - cv_optimization: optimisation CV, amélioration, conseils format
            - salary_analysis: salaire, rémunération, négociation
            - job_search: recherche emploi, candidature, offres
            - career_advice: conseil carrière, évolution, transition  
            - skill_development: formation, compétences, apprentissage
            - interview_prep: entretien, préparation, questions
            - general: discussion générale
            
            Réponds uniquement avec le nom du contexte.
            """
            
            response = await self._call_gemini_api(prompt)
            context_name = response.strip().lower()
            
            # Validation et retour
            for context in ConversationContext:
                if context.value == context_name:
                    return context
            
            # Fallback sur détection basique
            return conversation.detect_context_change(new_message)
            
        except Exception:
            # En cas d'erreur, utilise la détection basique
            return conversation.detect_context_change(new_message)
    
    async def generate_conversation_suggestions(self, 
                                              conversation: ChatConversation,
                                              cv_data: Optional[CVDocument] = None) -> List[str]:
        """Génère des suggestions proactives basées sur le CV et contexte"""
        
        try:
            context_prompts = {
                ConversationContext.CV_OPTIMIZATION: [
                    "Comment améliorer mon score ATS ?",
                    "Quels mots-clés ajouter pour mon secteur ?",
                    "Comment restructurer mes expériences ?"
                ],
                ConversationContext.SALARY_ANALYSIS: [
                    "Quel salaire demander pour ce poste ?",
                    "Comment négocier une augmentation ?",
                    "Quels sont les salaires dans mon secteur ?"
                ],
                ConversationContext.JOB_SEARCH: [
                    "Où chercher des offres dans mon domaine ?",
                    "Comment optimiser ma recherche ?",
                    "Quelles entreprises cibler ?"
                ]
            }
            
            # Suggestions selon contexte
            base_suggestions = context_prompts.get(
                conversation.context, 
                ["Comment puis-je améliorer mon profil ?"]
            )
            
            # Personnalisation si CV disponible
            if cv_data and cv_data.ats_score < 70:
                base_suggestions.insert(0, "Mon CV passe-t-il les filtres ATS ?")
            
            return base_suggestions[:3]
            
        except Exception:
            return ["Comment puis-je vous aider aujourd'hui ?"]
    
    def get_personality_description(self, personality: str) -> Dict[str, str]:
        """Retourne la description d'une personnalité"""
        return self.personalities.get(personality, self.personalities["professional"])