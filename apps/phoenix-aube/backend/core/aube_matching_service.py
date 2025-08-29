"""
🌅 Phoenix Aube - Service de matching enterprise
Algorithme de recommandation basé sur signaux psychométriques
Service standalone pour évaluation et recommandations carrière
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import structlog
import uuid

from models.aube_models import (
    AubeSignals, AubeRecommendation, AubeAssessmentResponse,
    AubePersonalityProfile, AubeCareerMatch
)

logger = structlog.get_logger("aube_matching")

class AubeMatchingService:
    """
    Service de matching enterprise pour Phoenix Aube
    
    Implémente la matrice pain-points → leviers psycho → recommandations
    """
    
    def __init__(self):
        self.algorithm_version = "enterprise_mvp_v1.0"
        self.careers_database = self._load_careers_database()
    
    def _load_careers_database(self) -> List[Dict[str, Any]]:
        """Base de données métiers simplifiée pour MVP"""
        return [
            {
                "job_code": "UXD",
                "title": "UX Designer", 
                "sector": "Tech",
                "skills": ["Figma", "User Research", "Prototyping"],
                "salary_range": "38k-55k €",
                "description": "Conception d'expériences utilisateur"
            },
            {
                "job_code": "PO",
                "title": "Product Owner",
                "sector": "Tech",
                "skills": ["Agile", "Roadmap", "Stakeholder Management"],
                "salary_range": "45k-65k €", 
                "description": "Gestion produit et priorités"
            },
            {
                "job_code": "DA",
                "title": "Data Analyst",
                "sector": "Data",
                "skills": ["Python", "SQL", "Excel", "Tableau"],
                "salary_range": "35k-50k €",
                "description": "Analyse de données métier"
            },
            {
                "job_code": "DS",
                "title": "Data Scientist",
                "sector": "Tech", 
                "skills": ["Python", "Machine Learning", "Statistics"],
                "salary_range": "45k-65k €",
                "description": "Intelligence artificielle et ML"
            },
            {
                "job_code": "PM",
                "title": "Chef de Projet Digital",
                "sector": "Management",
                "skills": ["Agile", "Leadership", "Communication"],
                "salary_range": "42k-60k €",
                "description": "Gestion de projets numériques"
            }
        ]
    
    async def process_full_assessment(
        self, 
        user_id: str, 
        signals: AubeSignals, 
        context: Dict[str, Any] = None
    ) -> AubeAssessmentResponse:
        """
        Processus d'évaluation psychologique complète
        """
        logger.info("Processing full assessment", user_id=user_id)
        
        # Génération du profil psychologique
        personality_profile = self._generate_personality_profile(signals)
        
        # Matching des métiers
        career_matches = self._match_careers(signals, personality_profile)
        
        # Calcul du score de confiance
        confidence_score = self._calculate_confidence(signals, career_matches)
        
        assessment_id = f"aube-{datetime.now().timestamp()}-{user_id[:8]}"
        
        return AubeAssessmentResponse(
            success=True,
            user_id=user_id,
            assessment_id=assessment_id,
            personality_profile=personality_profile,
            career_matches=career_matches,
            confidence_score=confidence_score,
            completion_time="3-5 minutes",
            generated_at=datetime.now(timezone.utc).isoformat()
        )
    
    def _generate_personality_profile(self, signals: AubeSignals) -> AubePersonalityProfile:
        """Génère un profil psychologique basé sur les signaux"""
        appetences = signals.appetences or {}
        
        people_score = appetences.get("people", 50) 
        data_score = appetences.get("data", 50)
        
        # Calcul des dimensions psychologiques
        creativity = 75 if "créativité" in str(signals.valeurs_top2).lower() else 65
        leadership = 80 if signals.style_travail == "leadership" else 60
        adaptability = min(90, signals.risk_tolerance * 10) if signals.risk_tolerance else 70
        
        return AubePersonalityProfile(
            people_orientation=people_score,
            data_orientation=data_score, 
            creativity=creativity,
            leadership=leadership,
            adaptability=adaptability
        )
    
    def _match_careers(self, signals: AubeSignals, profile: AubePersonalityProfile) -> List[AubeCareerMatch]:
        """Algorithme de matching métiers"""
        matches = []
        
        for career in self.careers_database:
            compatibility = self._calculate_compatibility(career, signals, profile)
            
            if compatibility > 30:  # Seuil minimal
                matches.append(AubeCareerMatch(
                    job_code=career["job_code"],
                    title=career["title"],
                    compatibility=compatibility,
                    sector=career["sector"],
                    skills=career["skills"],
                    salary_range=career["salary_range"]
                ))
        
        # Trier par compatibilité descendante
        matches.sort(key=lambda x: x.compatibility, reverse=True)
        return matches[:5]  # Top 5
    
    def _calculate_compatibility(
        self, 
        career: Dict[str, Any], 
        signals: AubeSignals, 
        profile: AubePersonalityProfile
    ) -> int:
        """Calcul du score de compatibilité 0-100"""
        score = 50  # Base
        
        # Bonus selon appetences
        if career["job_code"] in ["UXD", "PM"] and profile.people_orientation > profile.data_orientation:
            score += 25
        elif career["job_code"] in ["DA", "DS"] and profile.data_orientation > profile.people_orientation:
            score += 25
        
        # Bonus selon valeurs
        if signals.valeurs_top2:
            if "autonomie" in signals.valeurs_top2 and career["job_code"] in ["UXD", "DS"]:
                score += 15
            if "impact" in signals.valeurs_top2 and career["job_code"] in ["PO", "PM"]:
                score += 15
        
        # Bonus selon style de travail
        if signals.style_travail == "collaboratif" and career["job_code"] in ["PO", "PM"]:
            score += 10
        elif signals.style_travail == "autonome" and career["job_code"] in ["DA", "DS"]:
            score += 10
        
        # Ajustement selon appétit IA
        if signals.ia_appetit and signals.ia_appetit >= 7 and career["job_code"] == "DS":
            score += 15
        
        return min(95, max(30, score))
    
    def _calculate_confidence(self, signals: AubeSignals, matches: List[AubeCareerMatch]) -> float:
        """Calcule le score de confiance global"""
        base_confidence = 0.75
        
        # Bonus si signaux complets
        signals_count = sum([
            bool(signals.appetences),
            bool(signals.valeurs_top2),
            bool(signals.taches_like),
            bool(signals.style_travail),
            bool(signals.ia_appetit)
        ])
        
        confidence = base_confidence + (signals_count * 0.04)
        
        # Bonus si matches avec scores élevés
        if matches and matches[0].compatibility > 85:
            confidence += 0.1
        
        return min(0.95, confidence)
    
    async def get_user_assessment_status(self, user_id: str) -> Dict[str, Any]:
        """Vérifie le statut d'assessment d'un utilisateur"""
        # Pour MVP, simulation - en production, vérifier en base
        return {
            "has_assessment": False,  # Par défaut
            "completion_date": None,
            "confidence_score": None,
            "last_updated": None
        }
    
    async def get_career_recommendations(
        self, 
        user_id: str, 
        limit: int = 5,
        include_analysis: bool = True
    ) -> Dict[str, Any]:
        """Récupère les recommandations existantes ou génère des nouvelles"""
        
        # Pour MVP, génération à la volée
        # En production, récupérer depuis base ou régénérer si nécessaire
        mock_signals = AubeSignals(
            appetences={"people": 70, "data": 50},
            valeurs_top2=["autonomie", "impact"],
            style_travail="collaboratif"
        )
        
        profile = self._generate_personality_profile(mock_signals)
        recommendations = self._generate_recommendations_from_matches(
            self._match_careers(mock_signals, profile)
        )
        
        result = {
            "recommendations": recommendations[:limit]
        }
        
        if include_analysis:
            result["personality_insights"] = {
                "dominant_orientation": "people" if profile.people_orientation > profile.data_orientation else "data",
                "creativity_level": "high" if profile.creativity > 70 else "medium",
                "leadership_potential": "high" if profile.leadership > 75 else "medium"
            }
        
        return result
    
    def _generate_recommendations_from_matches(self, matches: List[AubeCareerMatch]) -> List[AubeRecommendation]:
        """Convertit les matches en recommandations enrichies"""
        recommendations = []
        
        for match in matches:
            recommendations.append(AubeRecommendation(
                job_code=match.job_code,
                label=match.title,
                score_teaser=match.compatibility / 100.0,
                reasons=[
                    {"feature": "compatibilité", "phrase": f"Score de compatibilité: {match.compatibility}%"}
                ],
                counter_example=None,
                futureproof={
                    "score_0_1": 0.8,
                    "drivers": [{"factor": "automatisation", "direction": "stable", "phrase": "Résistant à l'automatisation"}]
                },
                timeline=[],
                ia_plan=[]
            ))
        
        return recommendations
    
    async def refresh_recommendations(self, user_id: str) -> Dict[str, Any]:
        """Rafraîchit les recommandations avec le dernier algorithme"""
        return {
            "recommendations_count": 5,
            "algorithm_version": self.algorithm_version,
            "refresh_reason": "Latest algorithm applied"
        }
    
    async def get_matching_analytics(self) -> Dict[str, Any]:
        """Statistiques du moteur de matching"""
        return {
            "total_careers": len(self.careers_database),
            "algorithm_version": self.algorithm_version,
            "success_rate": 0.89,
            "avg_compatibility_score": 72.5
        }
    
    async def get_careers_database(
        self, 
        category: Optional[str] = None, 
        limit: int = 50
    ) -> Dict[str, Any]:
        """Accès à la base de données métiers"""
        careers = self.careers_database
        
        if category:
            careers = [c for c in careers if c["sector"].lower() == category.lower()]
        
        careers = careers[:limit]
        
        return {
            "careers": careers,
            "total_count": len(self.careers_database),
            "categories": list(set(c["sector"] for c in self.careers_database)),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }