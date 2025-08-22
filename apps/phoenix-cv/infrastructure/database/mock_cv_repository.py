"""
🗄️ Phoenix CV - Mock CV Repository
Implémentation en mémoire pour développement et tests
"""

import uuid
import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from domain.entities.cv_document import CVDocument, ContactInfo, Experience, Education, Skill
from ...domain.entities.ats_optimization import ATSOptimization
from ...domain.entities.mirror_match import MirrorMatchAnalysis
from ...domain.repositories.cv_repository import CVRepositoryInterface

logger = logging.getLogger(__name__)


class MockCVRepository(CVRepositoryInterface):
    """
    🗄️ Repository Mock pour Phoenix CV
    Implémentation en mémoire avec données de démonstration
    """
    
    def __init__(self):
        """Initialisation avec données de démo"""
        
        # Stockage en mémoire
        self._cvs: Dict[str, CVDocument] = {}
        self._ats_optimizations: Dict[str, ATSOptimization] = {}
        self._mirror_matches: Dict[str, List[MirrorMatchAnalysis]] = defaultdict(list)
        
        # Indexation pour recherche
        self._user_cvs: Dict[str, List[str]] = defaultdict(list)
        
        # Initialisation des données de démo
        self._initialize_demo_data()
        
        logger.info("🗄️ MockCVRepository initialisé avec données de démo")
    
    async def create_cv(self, cv: CVDocument) -> str:
        """Crée un nouveau CV"""
        
        if not cv.id:
            cv.id = str(uuid.uuid4())
        
        cv.created_at = datetime.now()
        cv.updated_at = datetime.now()
        
        # Stockage
        self._cvs[cv.id] = cv
        self._user_cvs[cv.user_id].append(cv.id)
        
        logger.info(f"✅ CV créé: {cv.id} pour utilisateur {cv.user_id}")
        return cv.id
    
    async def get_cv_by_id(self, cv_id: str) -> Optional[CVDocument]:
        """Récupère un CV par son ID"""
        
        cv = self._cvs.get(cv_id)
        if cv:
            logger.debug(f"📄 CV récupéré: {cv_id}")
        else:
            logger.warning(f"❌ CV non trouvé: {cv_id}")
        
        return cv
    
    async def get_user_cvs(self, user_id: str, limit: int = 10, offset: int = 0) -> List[CVDocument]:
        """Récupère tous les CV d'un utilisateur"""
        
        user_cv_ids = self._user_cvs.get(user_id, [])
        
        # Pagination
        paginated_ids = user_cv_ids[offset:offset + limit]
        
        # Récupération des CV
        cvs = []
        for cv_id in paginated_ids:
            cv = self._cvs.get(cv_id)
            if cv:
                cvs.append(cv)
        
        # Tri par date de mise à jour (plus récent en premier)
        cvs.sort(key=lambda cv: cv.updated_at, reverse=True)
        
        logger.info(f"📋 {len(cvs)} CV récupérés pour utilisateur {user_id}")
        return cvs
    
    async def update_cv(self, cv: CVDocument) -> bool:
        """Met à jour un CV existant"""
        
        if cv.id not in self._cvs:
            logger.warning(f"❌ Tentative de mise à jour CV inexistant: {cv.id}")
            return False
        
        cv.updated_at = datetime.now()
        self._cvs[cv.id] = cv
        
        logger.info(f"✅ CV mis à jour: {cv.id}")
        return True
    
    async def delete_cv(self, cv_id: str) -> bool:
        """Supprime un CV"""
        
        cv = self._cvs.get(cv_id)
        if not cv:
            logger.warning(f"❌ Tentative de suppression CV inexistant: {cv_id}")
            return False
        
        # Suppression du stockage principal
        del self._cvs[cv_id]
        
        # Suppression de l'indexation utilisateur
        if cv.user_id in self._user_cvs:
            try:
                self._user_cvs[cv.user_id].remove(cv_id)
            except ValueError:
                pass
        
        # Suppression des analyses associées
        if cv_id in self._ats_optimizations:
            del self._ats_optimizations[cv_id]
        
        if cv_id in self._mirror_matches:
            del self._mirror_matches[cv_id]
        
        logger.info(f"🗑️ CV supprimé: {cv_id}")
        return True
    
    async def save_ats_optimization(self, optimization: ATSOptimization) -> str:
        """Sauvegarde une analyse ATS"""
        
        if not optimization.id:
            optimization.id = str(uuid.uuid4())
        
        optimization.analysis_date = datetime.now()
        self._ats_optimizations[optimization.cv_id] = optimization
        
        logger.info(f"💾 Optimisation ATS sauvegardée pour CV {optimization.cv_id}")
        return optimization.id
    
    async def get_ats_optimization(self, cv_id: str) -> Optional[ATSOptimization]:
        """Récupère la dernière optimisation ATS pour un CV"""
        
        optimization = self._ats_optimizations.get(cv_id)
        if optimization:
            logger.debug(f"📊 Optimisation ATS récupérée pour CV {cv_id}")
        
        return optimization
    
    async def save_mirror_match(self, analysis: MirrorMatchAnalysis) -> str:
        """Sauvegarde une analyse Mirror Match"""
        
        if not analysis.id:
            analysis.id = str(uuid.uuid4())
        
        analysis.created_at = datetime.now()
        
        # Ajout à l'historique (garder les 10 dernières)
        matches = self._mirror_matches[analysis.cv_id]
        matches.append(analysis)
        
        # Limitation à 10 analyses par CV
        if len(matches) > 10:
            matches.pop(0)
        
        logger.info(f"🎯 Analyse Mirror Match sauvegardée pour CV {analysis.cv_id}")
        return analysis.id
    
    async def get_mirror_matches(self, cv_id: str, limit: int = 5) -> List[MirrorMatchAnalysis]:
        """Récupère les analyses Mirror Match pour un CV"""
        
        matches = self._mirror_matches.get(cv_id, [])
        
        # Tri par date (plus récent en premier)
        sorted_matches = sorted(matches, key=lambda m: m.created_at, reverse=True)
        
        # Limitation
        limited_matches = sorted_matches[:limit]
        
        logger.debug(f"🎯 {len(limited_matches)} analyses Mirror Match récupérées pour CV {cv_id}")
        return limited_matches
    
    async def search_cvs(self, 
                        user_id: str,
                        filters: Dict[str, Any],
                        sort_by: str = "updated_at",
                        sort_order: str = "desc") -> List[CVDocument]:
        """Recherche de CV avec filtres"""
        
        # Récupération des CV de l'utilisateur
        user_cvs = await self.get_user_cvs(user_id, limit=100)
        
        # Application des filtres
        filtered_cvs = user_cvs
        
        if filters.get("status"):
            filtered_cvs = [cv for cv in filtered_cvs if cv.status.value == filters["status"]]
        
        if filters.get("template_id"):
            filtered_cvs = [cv for cv in filtered_cvs if cv.template_id == filters["template_id"]]
        
        if filters.get("industry"):
            filtered_cvs = [cv for cv in filtered_cvs 
                           if cv.target_industry and cv.target_industry.value == filters["industry"]]
        
        if filters.get("search_query"):
            query = filters["search_query"].lower()
            filtered_cvs = [
                cv for cv in filtered_cvs
                if (query in cv.full_name.lower() or 
                    query in cv.professional_title.lower() or
                    query in cv.summary.lower())
            ]
        
        # Tri
        reverse_order = sort_order.lower() == "desc"
        
        if sort_by == "updated_at":
            filtered_cvs.sort(key=lambda cv: cv.updated_at, reverse=reverse_order)
        elif sort_by == "created_at":
            filtered_cvs.sort(key=lambda cv: cv.created_at, reverse=reverse_order)
        elif sort_by == "name":
            filtered_cvs.sort(key=lambda cv: cv.full_name, reverse=reverse_order)
        
        logger.info(f"🔍 Recherche CV: {len(filtered_cvs)} résultats pour utilisateur {user_id}")
        return filtered_cvs
    
    async def get_cv_analytics(self, cv_id: str) -> Dict[str, Any]:
        """Récupère les analytics d'un CV"""
        
        cv = await self.get_cv_by_id(cv_id)
        if not cv:
            return {}
        
        # Récupération des analyses
        ats_optimization = await self.get_ats_optimization(cv_id)
        mirror_matches = await self.get_mirror_matches(cv_id, limit=10)
        
        # Calcul des métriques
        analytics = {
            "cv_id": cv_id,
            "creation_date": cv.created_at.isoformat(),
            "last_updated": cv.updated_at.isoformat(),
            "status": cv.status.value,
            "sections_count": {
                "experiences": len(cv.experiences),
                "education": len(cv.education),
                "skills": len(cv.skills),
                "additional": len(cv.additional_sections)
            },
            "optimization_metrics": {
                "ats_score": ats_optimization.compatibility_score.overall_score if ats_optimization else 0,
                "mirror_matches_count": len(mirror_matches),
                "avg_compatibility": sum(m.overall_compatibility for m in mirror_matches) / len(mirror_matches) if mirror_matches else 0,
                "best_match_score": max([m.overall_compatibility for m in mirror_matches], default=0)
            },
            "activity_timeline": [
                {
                    "date": cv.created_at.isoformat(),
                    "action": "CV créé",
                    "details": f"Template: {cv.template_id}"
                },
                {
                    "date": cv.updated_at.isoformat(),
                    "action": "Dernière modification",
                    "details": f"Statut: {cv.status.value}"
                }
            ]
        }
        
        # Ajout des événements d'analyse
        for match in mirror_matches[-3:]:  # 3 dernières analyses
            analytics["activity_timeline"].append({
                "date": match.created_at.isoformat(),
                "action": "Analyse Mirror Match",
                "details": f"Score: {match.overall_compatibility}%"
            })
        
        # Tri chronologique inverse
        analytics["activity_timeline"].sort(
            key=lambda x: x["date"], 
            reverse=True
        )
        
        logger.debug(f"📈 Analytics calculées pour CV {cv_id}")
        return analytics
    
    def _initialize_demo_data(self):
        """Initialise les données de démonstration"""
        
        # CV de démonstration 1 - Développeur Full-Stack
        demo_cv_1 = CVDocument(
            id="demo-cv-1",
            user_id="demo-user-1",
            full_name="Marie Dupont",
            professional_title="Développeuse Full-Stack Senior",
            summary="Développeuse Full-Stack avec 6 ans d'expérience en Python/React. Spécialisée dans le développement d'applications web performantes et l'architecture microservices. Passionnée par l'innovation et l'amélioration continue des processus de développement.",
            contact_info=ContactInfo(
                email="marie.dupont@email.com",
                phone="+33 6 12 34 56 78",
                linkedin="linkedin.com/in/marie-dupont-dev",
                github="github.com/marie-dupont"
            )
        )
        
        # Expériences
        demo_cv_1.add_experience(Experience(
            company="TechCorp SAS",
            position="Lead Developer Full-Stack",
            start_date="2022-03",
            description="Lead technique d'une équipe de 5 développeurs sur des projets SaaS B2B",
            achievements=[
                "Augmentation des performances applicatives de 40% via optimisation architecture",
                "Réduction du time-to-market de 30% grâce à l'implémentation CI/CD",
                "Formation et mentoring de 3 développeurs junior"
            ],
            technologies=["Python", "React", "PostgreSQL", "Docker", "AWS"]
        ))
        
        demo_cv_1.add_experience(Experience(
            company="StartupInnovante",
            position="Développeuse Full-Stack",
            start_date="2019-06",
            end_date="2022-02",
            description="Développement from scratch d'une plateforme e-commerce innovante",
            achievements=[
                "Développement complet d'une plateforme servant 50K+ utilisateurs",
                "Intégration de 15+ APIs tierces (paiement, logistique, CRM)",
                "Mise en place monitoring et alerting automatisé"
            ],
            technologies=["Django", "Vue.js", "Redis", "Celery", "Stripe API"]
        ))
        
        # Compétences
        demo_skills = [
            Skill("Python", "technical", "expert", 6, True, 9.0),
            Skill("React", "technical", "advanced", 4, True, 8.5),
            Skill("PostgreSQL", "technical", "advanced", 5, True, 8.0),
            Skill("AWS", "technical", "intermediate", 3, False, 7.5),
            Skill("Leadership", "soft", "advanced", 3, True, 8.0),
            Skill("Architecture système", "technical", "advanced", 4, True, 8.5)
        ]
        
        for skill in demo_skills:
            demo_cv_1.add_skill(skill)
        
        # Éducation
        demo_cv_1.education.append(Education(
            institution="École Supérieure d'Informatique",
            degree="Master",
            field_of_study="Informatique et Systèmes d'Information",
            graduation_year=2018
        ))
        
        # Sauvegarde
        self._cvs[demo_cv_1.id] = demo_cv_1
        self._user_cvs[demo_cv_1.user_id].append(demo_cv_1.id)
        
        # CV de démonstration 2 - Product Manager
        demo_cv_2 = CVDocument(
            id="demo-cv-2", 
            user_id="demo-user-2",
            full_name="Thomas Martin",
            professional_title="Senior Product Manager",
            summary="Product Manager expérimenté avec 8 ans d'expérience dans le développement de produits SaaS. Expert en stratégie produit, analyse de données et leadership d'équipes cross-fonctionnelles. Track record de lancements produits à succès générant +10M€ de revenus.",
            contact_info=ContactInfo(
                email="thomas.martin@email.com",
                phone="+33 6 98 76 54 32",
                linkedin="linkedin.com/in/thomas-martin-pm"
            )
        )
        
        demo_cv_2.add_experience(Experience(
            company="ScaleUp Tech",
            position="Senior Product Manager",
            start_date="2020-01",
            description="Responsable stratégie produit et roadmap pour suite SaaS B2B",
            achievements=[
                "Lancement de 3 features majeures augmentant l'ARR de 2.5M€",
                "Amélioration du NPS de 42 à 68 via optimisation UX",
                "Management d'équipe de 12 personnes (dev, design, marketing)"
            ],
            technologies=["Analytics", "A/B Testing", "SQL", "Figma", "Jira"]
        ))
        
        # Sauvegarde
        self._cvs[demo_cv_2.id] = demo_cv_2
        self._user_cvs[demo_cv_2.user_id].append(demo_cv_2.id)
        
        logger.info("🎭 Données de démonstration initialisées (2 CV)")
    
    def get_stats(self) -> Dict[str, Any]:
        """Statistiques du repository"""
        
        total_users = len(self._user_cvs)
        total_cvs = len(self._cvs)
        total_optimizations = len(self._ats_optimizations)
        total_matches = sum(len(matches) for matches in self._mirror_matches.values())
        
        return {
            "total_users": total_users,
            "total_cvs": total_cvs,
            "total_ats_optimizations": total_optimizations,
            "total_mirror_matches": total_matches,
            "avg_cvs_per_user": round(total_cvs / max(total_users, 1), 2),
            "demo_data": True
        }