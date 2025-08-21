"""
Service métier - Skill Mapping Domain
Clean Architecture - Analyse intelligente des compétences transversales
"""

from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime
import re

from domain.entities.career_transition import (
    CareerTransition,
    TransferableSkill,
    SkillGap,
    NarrativeBridge,
    IndustryTransition,
    SkillConfidenceLevel,
    SkillCategory
)
from infrastructure.ai.ai_interface import IAIService, GenerationRequest, AnalysisRequest
from shared.exceptions.business_exceptions import ValidationError, BusinessRuleError

logger = logging.getLogger(__name__)


class SkillMappingService:
    """
    Service métier pour l'analyse des compétences transversales
    Domain Service - Logique métier complexe pour le skill mapping
    """
    
    def __init__(self, ai_service: IAIService):
        self.ai_service = ai_service
        
        # Base de données des correspondances métiers → compétences
        self.role_skills_database = self._initialize_role_skills_database()
        self.industry_transitions = self._initialize_industry_transitions()
    
    async def analyze_career_transition(
        self,
        user_id: str,
        previous_role: str,
        target_role: str,
        previous_industry: Optional[str] = None,
        target_industry: Optional[str] = None
    ) -> CareerTransition:
        """
        Analyse complète d'une transition de carrière
        
        Business Rules:
        - Identifier les compétences transversales
        - Évaluer les lacunes de compétences
        - Générer des ponts narratifs
        - Calculer un score de faisabilité
        
        Args:
            user_id: ID de l'utilisateur
            previous_role: Rôle/métier précédent
            target_role: Rôle/métier cible
            previous_industry: Secteur précédent (optionnel)
            target_industry: Secteur cible (optionnel)
            
        Returns:
            CareerTransition: Analyse complète de la transition
        """
        logger.info(f"🔄 Analyse transition: {previous_role} → {target_role}")
        
        # Validation
        if not previous_role.strip() or not target_role.strip():
            raise ValidationError("Rôles précédent et cible obligatoires")
        
        # Création de l'entité
        transition = CareerTransition(
            user_id=user_id,
            previous_role=previous_role.strip(),
            target_role=target_role.strip(),
            previous_industry=previous_industry,
            target_industry=target_industry
        )
        
        try:
            # 1. Analyse des compétences transversales
            transferable_skills = await self._analyze_transferable_skills(
                previous_role, target_role, previous_industry, target_industry
            )
            for skill in transferable_skills:
                transition.add_transferable_skill(skill)
            
            # 2. Identification des lacunes de compétences
            skill_gaps = await self._identify_skill_gaps(
                previous_role, target_role, transferable_skills
            )
            for gap in skill_gaps:
                transition.add_skill_gap(gap)
            
            # 3. Génération de ponts narratifs
            narrative_bridges = await self._generate_narrative_bridges(
                previous_role, target_role, transferable_skills
            )
            for bridge in narrative_bridges:
                transition.add_narrative_bridge(bridge)
            
            # 4. Analyse de transition sectorielle
            if previous_industry and target_industry:
                industry_transition = await self._analyze_industry_transition(
                    previous_industry, target_industry
                )
                transition.industry_transition = industry_transition
            
            # 5. Calcul des scores finaux
            transition.calculate_transition_score()
            transition.update_difficulty_assessment()
            
            logger.info(f"✅ Transition analysée - Score: {transition.overall_transition_score}")
            return transition
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse transition: {e}")
            raise BusinessRuleError(f"Erreur lors de l'analyse de transition: {e}")
    
    async def _analyze_transferable_skills(
        self,
        previous_role: str,
        target_role: str,
        previous_industry: Optional[str],
        target_industry: Optional[str]
    ) -> List[TransferableSkill]:
        """Analyse IA des compétences transversales"""
        
        # Prompt IA spécialisé
        prompt = self._build_skill_analysis_prompt(
            previous_role, target_role, previous_industry, target_industry
        )
        
        try:
            # Appel IA pour analyse
            analysis_request = AnalysisRequest(
                content=prompt,
                analysis_type="skill_mapping",
                context={
                    "previous_role": previous_role,
                    "target_role": target_role,
                    "previous_industry": previous_industry,
                    "target_industry": target_industry
                }
            )
            
            ai_response = await self.ai_service.analyze_content(analysis_request)
            
            # Parse la réponse IA en compétences structurées
            skills = self._parse_transferable_skills_response(
                ai_response.details, previous_role, target_role
            )
            
            # Enrichissement avec base de données locale
            enriched_skills = self._enrich_with_local_knowledge(skills, previous_role, target_role)
            
            return enriched_skills
            
        except Exception as e:
            logger.warning(f"⚠️ IA indisponible, utilisation base locale: {e}")
            # Fallback vers base de données locale
            return self._fallback_skill_analysis(previous_role, target_role)
    
    async def _identify_skill_gaps(
        self,
        previous_role: str,
        target_role: str,
        existing_skills: List[TransferableSkill]
    ) -> List[SkillGap]:
        """Identifie les lacunes de compétences"""
        
        # Compétences requises pour le rôle cible
        target_skills = self._get_required_skills_for_role(target_role)
        
        # Compétences déjà possédées
        existing_skill_names = {skill.skill_name.lower() for skill in existing_skills}
        
        gaps = []
        for required_skill in target_skills:
            if required_skill["name"].lower() not in existing_skill_names:
                gap = SkillGap(
                    skill_name=required_skill["name"],
                    category=SkillCategory(required_skill["category"]),
                    importance_level=required_skill["importance"],
                    learning_difficulty=required_skill.get("difficulty", "medium"),
                    time_to_acquire=required_skill.get("time_to_learn", "months"),
                    learning_resources=required_skill.get("resources", []),
                    certification_suggestions=required_skill.get("certifications", [])
                )
                gaps.append(gap)
        
        return gaps[:10]  # Limiter à 10 lacunes principales
    
    async def _generate_narrative_bridges(
        self,
        previous_role: str,
        target_role: str,
        skills: List[TransferableSkill]
    ) -> List[NarrativeBridge]:
        """Génère des ponts narratifs intelligents"""
        
        bridges = []
        
        # Top compétences pour les ponts narratifs
        top_skills = [s for s in skills if s.confidence_score > 0.7][:5]
        
        for skill in top_skills:
            # Génération de pont narratif par compétence
            bridge_prompt = f"""
            Créez un pont narratif pour connecter:
            - Rôle précédent: {previous_role}
            - Rôle cible: {target_role}  
            - Compétence: {skill.skill_name}
            
            Format: "En tant que {previous_role}, j'ai [situation concrète] qui démontre ma capacité à [compétence transversale], directement applicable en tant que {target_role} pour [application cible]."
            """
            
            try:
                if self.ai_service.is_available():
                    analysis_request = AnalysisRequest(
                        content=bridge_prompt,
                        analysis_type="narrative_bridge"
                    )
                    ai_response = await self.ai_service.analyze_content(analysis_request)
                    narrative_text = ai_response.details.get("narrative", "")
                else:
                    narrative_text = self._generate_fallback_bridge(previous_role, target_role, skill)
                
                if narrative_text:
                    bridge = NarrativeBridge(
                        bridge_type="skill_application",
                        narrative_text=narrative_text,
                        strength_score=skill.confidence_score,
                        previous_situation=f"En tant que {previous_role}",
                        transferable_lesson=skill.relevance_explanation,
                        target_application=f"Applicable en tant que {target_role}"
                    )
                    bridges.append(bridge)
                    
            except Exception as e:
                logger.warning(f"Erreur génération pont narratif: {e}")
                continue
        
        return bridges[:5]  # Top 5 bridges
    
    async def _analyze_industry_transition(
        self,
        from_industry: str,
        to_industry: str
    ) -> IndustryTransition:
        """Analyse la transition sectorielle"""
        
        # Données de base sur les transitions sectorielles
        transition_data = self.industry_transitions.get(
            f"{from_industry.lower()}_{to_industry.lower()}",
            {
                "difficulty": "moderate",
                "success_rate": 0.65,
                "common_pathways": ["Formation complémentaire", "Stage de transition", "Réseau professionnel"],
                "challenges": ["Codes sectoriels différents", "Références techniques spécifiques"],
                "strategies": ["Mise en avant des compétences transversales", "Formation ciblée", "Networking sectoriel"]
            }
        )
        
        return IndustryTransition(
            from_industry=from_industry,
            to_industry=to_industry,
            transition_difficulty=transition_data["difficulty"],
            common_pathways=transition_data["common_pathways"],
            success_rate=transition_data.get("success_rate"),
            key_challenges=transition_data.get("challenges", []),
            recommended_strategies=transition_data.get("strategies", [])
        )
    
    def _build_skill_analysis_prompt(
        self,
        previous_role: str,
        target_role: str,
        previous_industry: Optional[str],
        target_industry: Optional[str]
    ) -> str:
        """Construit le prompt IA pour l'analyse des compétences"""
        
        industry_context = ""
        if previous_industry and target_industry:
            industry_context = f"""
            Secteur précédent: {previous_industry}
            Secteur cible: {target_industry}
            """
        
        return f"""Analysez les compétences transversales pour cette transition de carrière:

Rôle précédent: {previous_role}
Rôle cible: {target_role}
{industry_context}

Pour chaque compétence transversale identifiée, fournissez:
1. Nom de la compétence
2. Catégorie (technical, management, communication, analytical, creative, interpersonal, project, strategic)
3. Niveau de confiance (high/medium/low)
4. Score de confiance (0.0-1.0)
5. Explication de la pertinence
6. Contexte dans le rôle précédent
7. Application dans le rôle cible
8. Demande du marché (0.0-1.0)

Concentrez-vous sur les compétences les plus pertinentes et transférables.
Retournez un JSON structuré avec ces informations."""
    
    def _parse_transferable_skills_response(
        self,
        ai_response: Dict[str, Any],
        previous_role: str,
        target_role: str
    ) -> List[TransferableSkill]:
        """Parse la réponse IA en objets TransferableSkill"""
        
        skills = []
        
        # Tentative de parsing JSON
        try:
            if isinstance(ai_response, dict) and "skills" in ai_response:
                skills_data = ai_response["skills"]
            elif isinstance(ai_response, list):
                skills_data = ai_response
            else:
                # Fallback
                return self._fallback_skill_analysis(previous_role, target_role)
            
            for skill_data in skills_data[:10]:  # Limiter à 10 skills
                try:
                    skill = TransferableSkill(
                        skill_name=skill_data.get("name", "Compétence"),
                        confidence_level=SkillConfidenceLevel(skill_data.get("confidence_level", "medium")),
                        category=SkillCategory(skill_data.get("category", "interpersonal")),
                        description=skill_data.get("description", ""),
                        relevance_explanation=skill_data.get("relevance", ""),
                        previous_context=skill_data.get("previous_context", f"En tant que {previous_role}"),
                        target_context=skill_data.get("target_context", f"En tant que {target_role}"),
                        confidence_score=float(skill_data.get("confidence_score", 0.7)),
                        market_demand=float(skill_data.get("market_demand", 0.8))
                    )
                    skills.append(skill)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erreur parsing skill: {e}")
                    continue
                    
        except Exception as e:
            logger.warning(f"Erreur parsing réponse IA: {e}")
            return self._fallback_skill_analysis(previous_role, target_role)
        
        return skills
    
    def _fallback_skill_analysis(self, previous_role: str, target_role: str) -> List[TransferableSkill]:
        """Analyse de secours basée sur les patterns de rôles"""
        
        # Compétences universelles
        universal_skills = [
            {
                "name": "Communication",
                "category": SkillCategory.COMMUNICATION,
                "confidence": SkillConfidenceLevel.HIGH,
                "score": 0.85,
                "description": "Capacité à communiquer efficacement avec différents interlocuteurs"
            },
            {
                "name": "Résolution de problèmes",
                "category": SkillCategory.ANALYTICAL,
                "confidence": SkillConfidenceLevel.HIGH,
                "score": 0.80,
                "description": "Approche analytique pour résoudre des problèmes complexes"
            },
            {
                "name": "Gestion du temps",
                "category": SkillCategory.PROJECT,
                "confidence": SkillConfidenceLevel.MEDIUM,
                "score": 0.75,
                "description": "Organisation et priorisation des tâches"
            },
        ]
        
        skills = []
        for skill_data in universal_skills:
            skill = TransferableSkill(
                skill_name=skill_data["name"],
                confidence_level=skill_data["confidence"],
                category=skill_data["category"],
                description=skill_data["description"],
                relevance_explanation=f"Compétence essentielle transférable de {previous_role} vers {target_role}",
                previous_context=f"Développée en tant que {previous_role}",
                target_context=f"Applicable en tant que {target_role}",
                confidence_score=skill_data["score"],
                market_demand=0.8
            )
            skills.append(skill)
        
        return skills
    
    def _enrich_with_local_knowledge(
        self,
        ai_skills: List[TransferableSkill],
        previous_role: str,
        target_role: str
    ) -> List[TransferableSkill]:
        """Enrichit les compétences IA avec la connaissance locale"""
        
        # Ajustements basés sur les patterns connus
        role_adjustments = self._get_role_specific_adjustments(previous_role, target_role)
        
        for skill in ai_skills:
            # Ajustement du score de confiance
            if skill.skill_name.lower() in role_adjustments:
                adjustment = role_adjustments[skill.skill_name.lower()]
                skill.confidence_score = min(1.0, skill.confidence_score * adjustment["multiplier"])
                skill.market_demand = adjustment.get("market_demand", skill.market_demand)
        
        return ai_skills
    
    def _generate_fallback_bridge(self, previous_role: str, target_role: str, skill: TransferableSkill) -> str:
        """Génère un pont narratif de secours"""
        return f"Mon expérience en tant que {previous_role} m'a permis de développer des compétences en {skill.skill_name}, directement applicables en tant que {target_role} pour {skill.target_context}."
    
    def _initialize_role_skills_database(self) -> Dict[str, List[Dict]]:
        """Initialise la base de données des compétences par rôle"""
        # Base de données simplifiée - à enrichir
        return {
            "chef de projet": [
                {"name": "Gestion d'équipe", "category": "management", "importance": "critical"},
                {"name": "Planification", "category": "project", "importance": "critical"},
                {"name": "Communication", "category": "communication", "importance": "important"},
            ],
            "product manager": [
                {"name": "Analyse de marché", "category": "analytical", "importance": "critical"},
                {"name": "Roadmap produit", "category": "strategic", "importance": "critical"},
                {"name": "Gestion stakeholders", "category": "interpersonal", "importance": "important"},
            ],
            # À enrichir avec plus de rôles...
        }
    
    def _initialize_industry_transitions(self) -> Dict[str, Dict]:
        """Initialise les données de transitions sectorielles"""
        return {
            "construction_tech": {
                "difficulty": "moderate",
                "success_rate": 0.72,
                "common_pathways": ["Formation tech", "Projets digitaux construction", "Transition graduelle"],
                "challenges": ["Codes techniques différents", "Méthodes agiles vs traditionnelles"],
                "strategies": ["Valoriser gestion de projet", "Apprendre méthodes agiles", "Réseau tech"]
            },
            # À enrichir...
        }
    
    def _get_required_skills_for_role(self, role: str) -> List[Dict]:
        """Récupère les compétences requises pour un rôle"""
        return self.role_skills_database.get(role.lower(), [
            {"name": "Adaptabilité", "category": "interpersonal", "importance": "important"},
            {"name": "Apprentissage continu", "category": "analytical", "importance": "important"},
        ])
    
    def _get_role_specific_adjustments(self, previous_role: str, target_role: str) -> Dict[str, Dict]:
        """Ajustements spécifiques aux transitions de rôles"""
        return {
            "communication": {"multiplier": 1.1, "market_demand": 0.9},
            "gestion d'équipe": {"multiplier": 1.2, "market_demand": 0.85},
            "résolution de problèmes": {"multiplier": 1.0, "market_demand": 0.8},
        }