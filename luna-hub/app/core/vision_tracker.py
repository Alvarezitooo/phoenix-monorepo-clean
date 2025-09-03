"""
🎯 Vision Tracker - Boucle Narrative Luna
Système de vision long terme et storytelling motivationnel
SPRINT 5: Connexion objectifs et narrative personnelle
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import structlog
from app.core.supabase_client import event_store
from app.core.redis_cache import redis_cache

logger = structlog.get_logger("vision_tracker")


class CareerPhase(str, Enum):
    """Phases de carrière"""
    DISCOVERY = "discovery"        # 🔍 Découverte (junior, changement)
    GROWTH = "growth"             # 📈 Croissance (montée compétences)
    ACCELERATION = "acceleration" # 🚀 Accélération (leadership, senior)
    TRANSITION = "transition"     # 🔄 Transition (reconversion, pivot)
    MASTERY = "mastery"          # 👑 Maîtrise (expert, mentor)


class VisionCategory(str, Enum):
    """Catégories d'objectifs de vision"""
    CAREER_GOAL = "career_goal"           # Poste/rôle visé
    SKILL_MASTERY = "skill_mastery"       # Compétences à maîtriser  
    INDUSTRY_CHANGE = "industry_change"    # Changement secteur
    LEADERSHIP_ROLE = "leadership_role"    # Évolution management
    ENTREPRENEURSHIP = "entrepreneurship"  # Création entreprise
    WORK_LIFE_BALANCE = "work_life_balance" # Équilibre vie pro/perso
    FINANCIAL_GOAL = "financial_goal"     # Objectifs salariaux
    IMPACT_MISSION = "impact_mission"     # Mission à impact


class VisionStatus(str, Enum):
    """Statut de progression vers la vision"""
    DEFINING = "defining"         # 🤔 En définition
    PLANNING = "planning"        # 📋 Planification
    EXECUTING = "executing"      # 🔨 Exécution
    PROGRESSING = "progressing"  # 📈 Progression visible
    BREAKTHROUGH = "breakthrough" # 🚀 Percée majeure
    ACHIEVED = "achieved"        # ✅ Objectif atteint
    PIVOTING = "pivoting"        # 🔄 Réajustement nécessaire


@dataclass
class VisionGoal:
    """Objectif de vision long terme"""
    goal_id: str
    category: VisionCategory
    title: str
    description: str
    target_timeline: str  # "6 mois", "2 ans", etc.
    status: VisionStatus
    progress_percentage: float = 0.0
    key_milestones: List[Dict[str, Any]] = None
    why_statement: str = ""  # Motivation profonde
    success_metrics: List[str] = None
    obstacles_identified: List[str] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.key_milestones is None:
            self.key_milestones = []
        if self.success_metrics is None:
            self.success_metrics = []
        if self.obstacles_identified is None:
            self.obstacles_identified = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)


@dataclass
class CareerNarrative:
    """Narrative de carrière personnalisée"""
    user_id: str
    career_phase: CareerPhase
    origin_story: str  # D'où vient l'utilisateur
    current_chapter: str  # Où il en est maintenant  
    vision_statement: str  # Où il va
    transformation_theme: str  # Le fil rouge de son évolution
    core_strengths: List[str]
    growth_areas: List[str]
    career_pivots: List[Dict[str, Any]]  # Changements majeurs
    success_pattern: str  # Pattern de réussite identifié
    next_story_arc: str  # Prochaine phase narrative
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.core_strengths is None:
            self.core_strengths = []
        if self.growth_areas is None:
            self.growth_areas = []
        if self.career_pivots is None:
            self.career_pivots = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)


@dataclass
class UserVisionProfile:
    """Profil de vision complète utilisateur"""
    user_id: str
    career_narrative: CareerNarrative
    active_goals: List[VisionGoal]
    vision_momentum: float  # 0-100, élan vers objectifs
    story_coherence_score: float  # Cohérence narrative
    last_vision_update: Optional[datetime] = None
    motivational_triggers: List[str] = None  # Ce qui le motive
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.motivational_triggers is None:
            self.motivational_triggers = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
    
    def get_primary_goal(self) -> Optional[VisionGoal]:
        """Récupère l'objectif principal en cours"""
        if not self.active_goals:
            return None
        
        # Prioriser par statut et progress
        priority_order = [
            VisionStatus.BREAKTHROUGH,
            VisionStatus.PROGRESSING, 
            VisionStatus.EXECUTING,
            VisionStatus.PLANNING,
            VisionStatus.DEFINING
        ]
        
        for status in priority_order:
            for goal in self.active_goals:
                if goal.status == status:
                    return goal
        
        return self.active_goals[0]  # Fallback
    
    def get_story_connection(self, current_action: str) -> str:
        """Connecte une action actuelle à la narrative long terme"""
        primary_goal = self.get_primary_goal()
        if not primary_goal:
            return f"Chaque action construit ton histoire professionnelle ! {current_action} te fait avancer."
        
        # Templates de connexion narrative
        connection_templates = {
            VisionCategory.CAREER_GOAL: f"Chaque {current_action} te rapproche de ton objectif : {primary_goal.title} !",
            VisionCategory.SKILL_MASTERY: f"Cette {current_action} développe tes compétences pour devenir {primary_goal.title} !",
            VisionCategory.INDUSTRY_CHANGE: f"Ta {current_action} construit ton profil pour ta transition vers {primary_goal.title} !",
            VisionCategory.LEADERSHIP_ROLE: f"Cette {current_action} forge ta crédibilité de futur {primary_goal.title} !"
        }
        
        return connection_templates.get(
            primary_goal.category, 
            f"Cette {current_action} écrit la suite de ton histoire vers {primary_goal.title} !"
        )


class VisionTracker:
    """
    🎯 Système de vision long terme et narrative motivationnelle
    
    Responsabilités:
    - Analyser les objectifs long terme depuis interactions  
    - Construire la narrative de carrière personnalisée
    - Connecter actions quotidiennes à la vision
    - Générer storytelling motivationnel
    """
    
    def __init__(self):
        """Initialise le tracker avec les templates narratifs"""
        self._setup_narrative_templates()
    
    def _setup_narrative_templates(self):
        """Configuration des templates narratifs par phase"""
        
        self.phase_narratives = {
            CareerPhase.DISCOVERY: {
                "current_chapter_templates": [
                    "Tu explores tes possibilités et découvres tes vraies passions",
                    "Tu construis tes bases et identifies ce qui te fait vibrer",
                    "Tu expérimentes pour trouver ta voie authentique"
                ],
                "transformation_themes": [
                    "De la découverte à l'expertise",
                    "Révéler ton potentiel unique",
                    "Construire ton identité professionnelle"
                ],
                "motivational_angles": [
                    "Chaque expérience révèle qui tu es vraiment",
                    "Tu es en train de créer les bases de ton succès",
                    "Cette phase forge ton expertise future"
                ]
            },
            
            CareerPhase.GROWTH: {
                "current_chapter_templates": [
                    "Tu développes ton expertise et gagnes en confiance",
                    "Tu montes en compétences et élargis ton impact",
                    "Tu passes de débutant à contributeur reconnu"
                ],
                "transformation_themes": [
                    "L'ascension vers l'expertise",
                    "De contributeur à leader d'opinion", 
                    "Construire ton influence professionnelle"
                ],
                "motivational_angles": [
                    "Chaque compétence acquise multiplie tes opportunités",
                    "Tu es en train de devenir incontournable",
                    "Ton expertise se reconnaît et s'affirme"
                ]
            },
            
            CareerPhase.ACCELERATION: {
                "current_chapter_templates": [
                    "Tu prends des responsabilités et influences ton environnement",
                    "Tu passes de exécutant à décideur stratégique",
                    "Tu guides les autres et shapes l'avenir"
                ],
                "transformation_themes": [
                    "L'émergence du leadership",
                    "De manager à visionnaire",
                    "Créer l'impact à grande échelle"
                ],
                "motivational_angles": [
                    "Tes décisions influencent l'avenir de l'équipe",
                    "Tu es devenu la référence dans ton domaine",
                    "Ton leadership inspire les autres à grandir"
                ]
            },
            
            CareerPhase.TRANSITION: {
                "current_chapter_templates": [
                    "Tu réinventes ta carrière avec courage et vision",
                    "Tu transformes ton expérience en nouvel avantage",
                    "Tu écris un nouveau chapitre de ton histoire"
                ],
                "transformation_themes": [
                    "La réinvention courageuse",
                    "Transformer l'expérience en opportunité",
                    "Créer sa nouvelle identité professionnelle"
                ],
                "motivational_angles": [
                    "Ton passé devient ta force différenciante",
                    "Tu prouves que tout est possible avec de la détermination",
                    "Cette transition révèle ton vrai potentiel"
                ]
            }
        }
        
        # Templates de connexion action → vision
        self.action_vision_connectors = {
            "cv_optimization": "optimiser ton CV",
            "letter_writing": "rédiger une lettre percutante", 
            "skill_assessment": "évaluer tes compétences",
            "job_search": "rechercher des opportunités",
            "interview_prep": "préparer un entretien",
            "network_building": "développer ton réseau"
        }
    
    async def get_user_vision_profile(self, user_id: str) -> UserVisionProfile:
        """
        🎯 Génère le profil de vision complet utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            UserVisionProfile: Profil avec narrative et objectifs
        """
        try:
            # 1. Vérifier cache Redis
            cached_profile = await self._get_cached_vision(user_id)
            if cached_profile:
                return cached_profile
            
            # 2. Analyser les événements pour détecter la narrative
            career_narrative = await self._analyze_career_narrative(user_id)
            
            # 3. Extraire les objectifs de vision depuis les interactions
            active_goals = await self._extract_vision_goals(user_id)
            
            # 4. Calculer momentum et cohérence
            vision_momentum = self._calculate_vision_momentum(active_goals)
            story_coherence = self._calculate_story_coherence(career_narrative, active_goals)
            
            # 5. Identifier triggers motivationnels
            motivational_triggers = await self._identify_motivational_triggers(user_id)
            
            # 6. Construire le profil
            profile = UserVisionProfile(
                user_id=user_id,
                career_narrative=career_narrative,
                active_goals=active_goals,
                vision_momentum=vision_momentum,
                story_coherence_score=story_coherence,
                motivational_triggers=motivational_triggers,
                last_vision_update=datetime.now(timezone.utc)
            )
            
            # 7. Cache pour 1 heure
            await self._cache_vision_profile(user_id, profile)
            
            logger.info("Vision profile generated",
                       user_id=user_id,
                       career_phase=career_narrative.career_phase.value,
                       active_goals_count=len(active_goals),
                       vision_momentum=vision_momentum,
                       story_coherence=story_coherence)
            
            return profile
            
        except Exception as e:
            logger.error("Error generating vision profile", user_id=user_id, error=str(e))
            # Retourner profil minimal
            return self._create_default_vision_profile(user_id)
    
    async def _analyze_career_narrative(self, user_id: str) -> CareerNarrative:
        """Analyse les événements pour construire la narrative de carrière"""
        try:
            # Récupérer historique sur 6 mois pour vision long terme
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=180)
            
            events = await event_store.get_user_events(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date
            )
            
            # Analyser les patterns pour déduire la phase de carrière
            career_phase = self._deduce_career_phase(events)
            
            # Construire les éléments narratifs
            phase_templates = self.phase_narratives.get(career_phase, self.phase_narratives[CareerPhase.GROWTH])
            
            return CareerNarrative(
                user_id=user_id,
                career_phase=career_phase,
                origin_story=self._extract_origin_story(events),
                current_chapter=self._select_random_template(phase_templates["current_chapter_templates"]),
                vision_statement=self._extract_vision_statement(events),
                transformation_theme=self._select_random_template(phase_templates["transformation_themes"]),
                core_strengths=self._identify_core_strengths(events),
                growth_areas=self._identify_growth_areas(events),
                career_pivots=self._extract_career_pivots(events),  # ✅ AJOUT MANQUANT
                success_pattern=self._identify_success_pattern(events),
                next_story_arc=self._predict_next_story_arc(career_phase)
            )
            
        except Exception as e:
            logger.error("Error analyzing career narrative", user_id=user_id, error=str(e))
            return self._create_default_career_narrative(user_id)
    
    def _deduce_career_phase(self, events: List[Dict]) -> CareerPhase:
        """Déduit la phase de carrière depuis les événements"""
        if not events:
            return CareerPhase.DISCOVERY
        
        # Analyser les types d'actions pour déduire le niveau
        action_patterns = {
            "basics_learning": 0,  # CV de base, premiers pas
            "skill_building": 0,   # Optimisations, formations
            "strategic_actions": 0, # Leadership, mentoring
            "transition_signals": 0 # Reconversion, pivot
        }
        
        for event in events:
            event_type = event.get("event_type", "")
            payload = event.get("payload", {})
            
            # Pattern recognition basique
            if any(keyword in event_type for keyword in ["first", "intro", "basic"]):
                action_patterns["basics_learning"] += 1
            elif any(keyword in event_type for keyword in ["optimization", "skill", "training"]):
                action_patterns["skill_building"] += 1
            elif any(keyword in event_type for keyword in ["leadership", "strategy", "advanced"]):
                action_patterns["strategic_actions"] += 1
            elif any(keyword in event_type for keyword in ["career_change", "transition", "pivot"]):
                action_patterns["transition_signals"] += 1
        
        # Logique de déduction
        total_actions = sum(action_patterns.values())
        if total_actions == 0:
            return CareerPhase.DISCOVERY
        
        if action_patterns["transition_signals"] > total_actions * 0.3:
            return CareerPhase.TRANSITION
        elif action_patterns["strategic_actions"] > total_actions * 0.4:
            return CareerPhase.ACCELERATION
        elif action_patterns["skill_building"] > total_actions * 0.5:
            return CareerPhase.GROWTH
        else:
            return CareerPhase.DISCOVERY
    
    async def _extract_vision_goals(self, user_id: str) -> List[VisionGoal]:
        """Extrait les objectifs de vision depuis les interactions utilisateur"""
        # Pour cette première version, on crée des objectifs par défaut
        # TODO: Implémenter extraction réelle depuis conversations Luna
        
        default_goals = [
            VisionGoal(
                goal_id=f"{user_id}_career_growth",
                category=VisionCategory.CAREER_GOAL,
                title="Décrocher un poste senior dans mon domaine",
                description="Évoluer vers un rôle avec plus de responsabilités",
                target_timeline="12-18 mois",
                status=VisionStatus.EXECUTING,
                progress_percentage=35.0,
                why_statement="Pour avoir plus d'impact et développer mon leadership",
                success_metrics=["Obtenir 3 entretiens/mois", "Négocier 20%+ de salaire", "Manager une équipe"]
            )
        ]
        
        return default_goals
    
    def _calculate_vision_momentum(self, goals: List[VisionGoal]) -> float:
        """Calcule l'élan vers les objectifs de vision"""
        if not goals:
            return 30.0  # Momentum faible par défaut
        
        # Score basé sur statut et progrès des objectifs
        total_momentum = 0
        for goal in goals:
            status_scores = {
                VisionStatus.BREAKTHROUGH: 95,
                VisionStatus.PROGRESSING: 80,
                VisionStatus.EXECUTING: 65,
                VisionStatus.PLANNING: 45,
                VisionStatus.DEFINING: 25,
                VisionStatus.PIVOTING: 35,
                VisionStatus.ACHIEVED: 100
            }
            
            base_score = status_scores.get(goal.status, 50)
            progress_bonus = goal.progress_percentage * 0.3
            total_momentum += base_score + progress_bonus
        
        return min(100, total_momentum / len(goals))
    
    def _calculate_story_coherence(self, narrative: CareerNarrative, goals: List[VisionGoal]) -> float:
        """Calcule la cohérence entre narrative et objectifs"""
        if not goals:
            return 70.0  # Cohérence moyenne par défaut
        
        # Score basé sur alignement phase de carrière / objectifs
        coherence_score = 75.0  # Base
        
        # Bonus si objectifs alignés avec phase
        for goal in goals:
            if narrative.career_phase == CareerPhase.GROWTH and goal.category == VisionCategory.SKILL_MASTERY:
                coherence_score += 10
            elif narrative.career_phase == CareerPhase.ACCELERATION and goal.category == VisionCategory.LEADERSHIP_ROLE:
                coherence_score += 10
            elif narrative.career_phase == CareerPhase.TRANSITION and goal.category == VisionCategory.INDUSTRY_CHANGE:
                coherence_score += 10
        
        return min(100, coherence_score)
    
    def _select_random_template(self, templates: List[str]) -> str:
        """Sélectionne un template aléatoire"""
        import random
        return random.choice(templates) if templates else "Tu construis ton avenir professionnel"
    
    def _extract_origin_story(self, events: List[Dict]) -> str:
        """Extrait l'histoire d'origine depuis les événements"""
        # Version simplifiée
        return "Professionnel ambitieux en quête d'évolution"
    
    def _extract_vision_statement(self, events: List[Dict]) -> str:
        """Extrait la déclaration de vision"""
        return "Devenir un expert reconnu dans mon domaine"
    
    def _identify_core_strengths(self, events: List[Dict]) -> List[str]:
        """Identifie les forces principales"""
        return ["Détermination", "Capacité d'apprentissage", "Vision stratégique"]
    
    def _identify_growth_areas(self, events: List[Dict]) -> List[str]:
        """Identifie les zones de développement"""  
        return ["Leadership", "Communication", "Networking"]
    
    def _extract_career_pivots(self, events: List[Dict]) -> List[Dict[str, Any]]:
        """✅ Extrait les moments pivots de carrière depuis les événements"""
        # Analyser events pour identifier changements majeurs
        pivots = []
        
        # Pour l'instant, retourner liste vide pour éviter l'erreur
        # TODO: Implémenter logique d'extraction des pivots réels
        return []
    
    def _identify_success_pattern(self, events: List[Dict]) -> str:
        """Identifie le pattern de réussite"""
        return "Progression par optimisations continues"
    
    def _predict_next_story_arc(self, phase: CareerPhase) -> str:
        """Prédit le prochain arc narratif"""
        next_arcs = {
            CareerPhase.DISCOVERY: "Spécialisation et montée en expertise",
            CareerPhase.GROWTH: "Prise de leadership et influence élargie", 
            CareerPhase.ACCELERATION: "Mentorat et création de valeur",
            CareerPhase.TRANSITION: "Maîtrise du nouveau domaine",
            CareerPhase.MASTERY: "Transmission et innovation"
        }
        return next_arcs.get(phase, "Évolution continue")
    
    async def _identify_motivational_triggers(self, user_id: str) -> List[str]:
        """Identifie ce qui motive vraiment l'utilisateur"""
        # Version simplifiée avec triggers universels
        return [
            "Impact et reconnaissance",
            "Développement personnel", 
            "Sécurité financière",
            "Équilibre vie pro/perso"
        ]
    
    def _create_default_vision_profile(self, user_id: str) -> UserVisionProfile:
        """Crée un profil de vision par défaut"""
        default_narrative = CareerNarrative(
            user_id=user_id,
            career_phase=CareerPhase.GROWTH,
            origin_story="Professionnel motivé par l'évolution",
            current_chapter="Tu développes ton expertise et gagnes en confiance",
            vision_statement="Devenir un expert reconnu dans ton domaine",
            transformation_theme="L'ascension vers l'expertise",
            core_strengths=["Motivation", "Persévérance"],
            growth_areas=["Leadership", "Networking"],
            career_pivots=[],  # ✅ AJOUT MANQUANT
            success_pattern="Amélioration continue",
            next_story_arc="Prise de responsabilités accrues"
        )
        
        return UserVisionProfile(
            user_id=user_id,
            career_narrative=default_narrative,
            active_goals=[],
            vision_momentum=50.0,
            story_coherence_score=75.0,
            motivational_triggers=["Impact", "Croissance", "Reconnaissance"]
        )
    
    def _create_default_career_narrative(self, user_id: str) -> CareerNarrative:
        """Crée une narrative par défaut"""
        return CareerNarrative(
            user_id=user_id,
            career_phase=CareerPhase.GROWTH,
            origin_story="Professionnel en évolution",
            current_chapter="Tu construis ton expertise",
            vision_statement="Atteindre tes objectifs de carrière",
            transformation_theme="Croissance professionnelle",
            core_strengths=["Détermination"],
            growth_areas=["Leadership"],
            career_pivots=[],  # ✅ AJOUT MANQUANT
            success_pattern="Progression constante",
            next_story_arc="Élargissement d'impact"
        )
    
    async def _get_cached_vision(self, user_id: str) -> Optional[UserVisionProfile]:
        """Récupère profil depuis cache"""
        try:
            cached_data = await redis_cache.get("vision", user_id)
            if cached_data:
                return self._dict_to_vision_profile(cached_data)
        except Exception as e:
            logger.warning("Vision cache retrieval failed", user_id=user_id, error=str(e))
        return None
    
    async def _cache_vision_profile(self, user_id: str, profile: UserVisionProfile):
        """Cache le profil de vision"""
        try:
            profile_dict = self._vision_profile_to_dict(profile)
            await redis_cache.set("vision", user_id, profile_dict, ttl=3600)  # 1 heure
        except Exception as e:
            logger.warning("Vision cache storage failed", user_id=user_id, error=str(e))
    
    def _vision_profile_to_dict(self, profile: UserVisionProfile) -> Dict:
        """Convertit profil en dict pour cache"""
        return {
            "user_id": profile.user_id,
            "career_narrative": asdict(profile.career_narrative),
            "active_goals": [asdict(goal) for goal in profile.active_goals],
            "vision_momentum": profile.vision_momentum,
            "story_coherence_score": profile.story_coherence_score,
            "motivational_triggers": profile.motivational_triggers,
            "last_vision_update": profile.last_vision_update.isoformat() if profile.last_vision_update else None,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None
        }
    
    def _dict_to_vision_profile(self, data: Dict) -> UserVisionProfile:
        """Reconstruit profil depuis dict cache"""
        # Reconstituer career_narrative
        narrative_data = data["career_narrative"]
        narrative_data["career_phase"] = CareerPhase(narrative_data["career_phase"])
        if narrative_data.get("created_at"):
            narrative_data["created_at"] = datetime.fromisoformat(narrative_data["created_at"])
        if narrative_data.get("updated_at"):
            narrative_data["updated_at"] = datetime.fromisoformat(narrative_data["updated_at"])
        career_narrative = CareerNarrative(**narrative_data)
        
        # Reconstituer active_goals
        active_goals = []
        for goal_data in data["active_goals"]:
            goal_data["category"] = VisionCategory(goal_data["category"])
            goal_data["status"] = VisionStatus(goal_data["status"])
            if goal_data.get("created_at"):
                goal_data["created_at"] = datetime.fromisoformat(goal_data["created_at"])
            if goal_data.get("updated_at"):
                goal_data["updated_at"] = datetime.fromisoformat(goal_data["updated_at"])
            active_goals.append(VisionGoal(**goal_data))
        
        return UserVisionProfile(
            user_id=data["user_id"],
            career_narrative=career_narrative,
            active_goals=active_goals,
            vision_momentum=data["vision_momentum"],
            story_coherence_score=data["story_coherence_score"],
            motivational_triggers=data["motivational_triggers"],
            last_vision_update=datetime.fromisoformat(data["last_vision_update"]) if data.get("last_vision_update") else None,
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None
        )


# Instance globale
vision_tracker = VisionTracker()