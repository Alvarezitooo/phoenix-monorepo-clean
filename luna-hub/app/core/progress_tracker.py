"""
📈 Progress Tracker - Boucle Progression Luna
Système de suivi des progrès utilisateur pour encouragements intelligents
SPRINT 4: Progression et célébrations automatisées
"""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import structlog
from app.core.supabase_client import event_store
from app.core.redis_cache import redis_cache

logger = structlog.get_logger("progress_tracker")


class ProgressMetricType(str, Enum):
    """Types de métriques de progression"""
    ATS_SCORE = "ats_score"
    CV_OPTIMIZATIONS = "cv_optimizations"  
    LETTERS_CREATED = "letters_created"
    ACTIONS_COMPLETED = "actions_completed"
    SESSION_FREQUENCY = "session_frequency"
    ENERGY_EFFICIENCY = "energy_efficiency"
    SKILL_MATCHES = "skill_matches"
    INTERVIEW_PREP = "interview_prep"


class ProgressTrend(str, Enum):
    """Tendances de progression"""
    RISING = "rising"          # 📈 En progression
    STABLE = "stable"          # ➡️ Stable
    DECLINING = "declining"    # 📉 En baisse
    STAGNANT = "stagnant"      # 😴 Stagnant
    BREAKTHROUGH = "breakthrough"  # 🚀 Percée


@dataclass
class ProgressMetric:
    """Métrique individuelle de progression"""
    metric_type: ProgressMetricType
    current_value: float
    previous_value: float
    delta_1d: float = 0.0
    delta_7d: float = 0.0  
    delta_30d: float = 0.0
    trend: ProgressTrend = ProgressTrend.STABLE
    confidence: float = 1.0
    last_updated: datetime = None
    
    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.now(timezone.utc)
    
    def calculate_trend(self) -> ProgressTrend:
        """Calcule la tendance basée sur les deltas"""
        if self.delta_7d > 20:  # Forte progression
            return ProgressTrend.BREAKTHROUGH
        elif self.delta_7d > 5:  # Progression normale
            return ProgressTrend.RISING
        elif self.delta_7d > -2:  # Stable
            return ProgressTrend.STABLE
        elif self.delta_7d > -10:  # Légère baisse
            return ProgressTrend.DECLINING
        else:  # Stagnant
            return ProgressTrend.STAGNANT
    
    def get_celebration_level(self) -> str:
        """Détermine le niveau de célébration nécessaire"""
        if self.trend == ProgressTrend.BREAKTHROUGH:
            return "major"  # 🎉 Célébration majeure
        elif self.trend == ProgressTrend.RISING:
            return "minor"  # ✅ Encouragement
        elif self.trend == ProgressTrend.STABLE:
            return "maintain"  # 👍 Maintenir
        else:
            return "motivate"  # 💪 Remotiver


@dataclass
class UserProgressProfile:
    """Profil de progression complète utilisateur"""
    user_id: str
    metrics: Dict[ProgressMetricType, ProgressMetric]
    overall_trend: ProgressTrend
    momentum_score: float  # 0-100, score général de momentum
    last_victory: Optional[Dict[str, Any]] = None
    next_milestone: Optional[Dict[str, Any]] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
    
    def get_top_achievements(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Récupère les top achievements récents"""
        achievements = []
        for metric_type, metric in self.metrics.items():
            if metric.trend in [ProgressTrend.BREAKTHROUGH, ProgressTrend.RISING]:
                achievements.append({
                    "type": metric_type.value,
                    "improvement": metric.delta_7d,
                    "trend": metric.trend.value,
                    "celebration_level": metric.get_celebration_level()
                })
        
        # Trier par amélioration descendante
        achievements.sort(key=lambda x: x["improvement"], reverse=True)
        return achievements[:limit]
    
    def get_encouragement_areas(self, limit: int = 2) -> List[Dict[str, Any]]:
        """Identifie les zones nécessitant encouragement"""
        areas = []
        for metric_type, metric in self.metrics.items():
            if metric.trend in [ProgressTrend.DECLINING, ProgressTrend.STAGNANT]:
                areas.append({
                    "type": metric_type.value,
                    "decline": abs(metric.delta_7d),
                    "trend": metric.trend.value,
                    "suggestion": self._get_improvement_suggestion(metric_type)
                })
        
        areas.sort(key=lambda x: x["decline"], reverse=True)
        return areas[:limit]
    
    def _get_improvement_suggestion(self, metric_type: ProgressMetricType) -> str:
        """Suggestions d'amélioration par métrique"""
        suggestions = {
            ProgressMetricType.ATS_SCORE: "Optimisons les mots-clés de ton CV",
            ProgressMetricType.LETTERS_CREATED: "Créons une lettre percutante pour tes candidatures",
            ProgressMetricType.SESSION_FREQUENCY: "Une session rapide pour maintenir ton élan ?",
            ProgressMetricType.CV_OPTIMIZATIONS: "Passons ton CV au niveau supérieur",
            ProgressMetricType.SKILL_MATCHES: "Analysons les compétences demandées par tes cibles"
        }
        return suggestions.get(metric_type, "Continue tes efforts, ça va payer !")


class ProgressTracker:
    """
    📈 Système de suivi de progression utilisateur
    
    Responsabilités:
    - Collecter les métriques de progression depuis les événements
    - Calculer les tendances et deltas temporels  
    - Générer encouragements et célébrations
    - Identifier les opportunités d'amélioration
    """
    
    def __init__(self):
        """Initialise le tracker avec les configurations métriques"""
        self._setup_metric_configs()
    
    def _setup_metric_configs(self):
        """Configuration des métriques et leurs sources"""
        self.metric_configs = {
            ProgressMetricType.ATS_SCORE: {
                "event_types": ["cv_ats_score", "cv_optimization_complete"],
                "value_field": "ats_score",
                "unit": "points",
                "celebration_thresholds": {"minor": 5, "major": 15}
            },
            ProgressMetricType.CV_OPTIMIZATIONS: {
                "event_types": ["cv_optimization_complete", "cv_section_improved"],
                "value_field": "optimizations_count", 
                "unit": "optimisations",
                "celebration_thresholds": {"minor": 2, "major": 5}
            },
            ProgressMetricType.LETTERS_CREATED: {
                "event_types": ["letter_created", "letter_generation_complete"],
                "value_field": "letters_count",
                "unit": "lettres", 
                "celebration_thresholds": {"minor": 1, "major": 3}
            },
            ProgressMetricType.ACTIONS_COMPLETED: {
                "event_types": ["user_action_complete"],
                "value_field": "actions_count",
                "unit": "actions",
                "celebration_thresholds": {"minor": 3, "major": 10}
            },
            ProgressMetricType.SESSION_FREQUENCY: {
                "event_types": ["user_session_start"],
                "value_field": "sessions_count",
                "unit": "sessions",
                "celebration_thresholds": {"minor": 3, "major": 7}
            }
        }
    
    async def get_user_progress_profile(self, user_id: str) -> UserProgressProfile:
        """
        🎯 Génère le profil de progression complet utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            UserProgressProfile: Profil avec toutes les métriques
        """
        try:
            # 1. Vérifier cache Redis first
            cached_profile = await self._get_cached_progress(user_id)
            if cached_profile:
                return cached_profile
            
            # 2. Collecter les métriques depuis les événements
            metrics = {}
            for metric_type in ProgressMetricType:
                try:
                    metric = await self._calculate_metric(user_id, metric_type)
                    if metric:
                        metrics[metric_type] = metric
                except Exception as e:
                    logger.warning("Error calculating metric", 
                                 user_id=user_id, metric=metric_type.value, error=str(e))
            
            # 3. Calculer tendance globale et momentum
            overall_trend = self._calculate_overall_trend(metrics)
            momentum_score = self._calculate_momentum_score(metrics)
            
            # 4. Identifier victoires et next milestone
            last_victory = self._identify_recent_victory(metrics)
            next_milestone = self._suggest_next_milestone(user_id, metrics)
            
            # 5. Construire le profil
            profile = UserProgressProfile(
                user_id=user_id,
                metrics=metrics,
                overall_trend=overall_trend,
                momentum_score=momentum_score,
                last_victory=last_victory,
                next_milestone=next_milestone
            )
            
            # 6. Cache pour 15 minutes
            await self._cache_progress_profile(user_id, profile)
            
            logger.info("Progress profile generated",
                       user_id=user_id,
                       metrics_count=len(metrics),
                       overall_trend=overall_trend.value,
                       momentum_score=momentum_score)
            
            return profile
            
        except Exception as e:
            logger.error("Error generating progress profile", user_id=user_id, error=str(e))
            # Retourner profil minimal en cas d'erreur
            return UserProgressProfile(
                user_id=user_id,
                metrics={},
                overall_trend=ProgressTrend.STABLE,
                momentum_score=50.0
            )
    
    async def _calculate_metric(self, user_id: str, metric_type: ProgressMetricType) -> Optional[ProgressMetric]:
        """Calcule une métrique spécifique depuis les événements"""
        try:
            config = self.metric_configs.get(metric_type)
            if not config:
                return None
            
            # Récupérer les événements des 30 derniers jours
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=30)
            
            events = await event_store.get_user_events(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                event_types=config["event_types"]
            )
            
            if not events:
                return None
            
            # Calculer les valeurs par période
            current_value = self._extract_current_value(events, config)
            values_1d = self._extract_period_value(events, config, days=1)
            values_7d = self._extract_period_value(events, config, days=7) 
            values_30d = self._extract_period_value(events, config, days=30)
            
            # Calculer les deltas
            delta_1d = current_value - values_1d
            delta_7d = current_value - values_7d
            delta_30d = current_value - values_30d
            
            # Créer la métrique
            metric = ProgressMetric(
                metric_type=metric_type,
                current_value=current_value,
                previous_value=values_7d,  # Référence 7 jours
                delta_1d=delta_1d,
                delta_7d=delta_7d,
                delta_30d=delta_30d
            )
            
            # Calculer la tendance
            metric.trend = metric.calculate_trend()
            
            return metric
            
        except Exception as e:
            logger.error("Error calculating metric", 
                        user_id=user_id, metric_type=metric_type.value, error=str(e))
            return None
    
    def _extract_current_value(self, events: List[Dict], config: Dict) -> float:
        """Extrait la valeur actuelle depuis les événements"""
        if not events:
            return 0.0
        
        # Pour certaines métriques, on compte les événements
        if config["value_field"] in ["optimizations_count", "letters_count", "actions_count", "sessions_count"]:
            return float(len(events))
        
        # Pour d'autres, on prend la valeur du champ spécifique  
        latest_event = sorted(events, key=lambda x: x.get("created_at", ""), reverse=True)[0]
        return float(latest_event.get("payload", {}).get(config["value_field"], 0))
    
    def _extract_period_value(self, events: List[Dict], config: Dict, days: int) -> float:
        """Extrait la valeur pour une période donnée"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        period_events = [
            event for event in events 
            if datetime.fromisoformat(event.get("created_at", "").replace("Z", "+00:00")) >= cutoff_date
        ]
        
        return self._extract_current_value(period_events, config)
    
    def _calculate_overall_trend(self, metrics: Dict[ProgressMetricType, ProgressMetric]) -> ProgressTrend:
        """Calcule la tendance globale basée sur toutes les métriques"""
        if not metrics:
            return ProgressTrend.STABLE
        
        trend_scores = {
            ProgressTrend.BREAKTHROUGH: 5,
            ProgressTrend.RISING: 3,
            ProgressTrend.STABLE: 0,
            ProgressTrend.DECLINING: -2,
            ProgressTrend.STAGNANT: -3
        }
        
        total_score = sum(trend_scores[metric.trend] for metric in metrics.values())
        avg_score = total_score / len(metrics)
        
        if avg_score >= 3:
            return ProgressTrend.BREAKTHROUGH
        elif avg_score >= 1:
            return ProgressTrend.RISING
        elif avg_score >= -1:
            return ProgressTrend.STABLE
        elif avg_score >= -2:
            return ProgressTrend.DECLINING
        else:
            return ProgressTrend.STAGNANT
    
    def _calculate_momentum_score(self, metrics: Dict[ProgressMetricType, ProgressMetric]) -> float:
        """Calcule le score de momentum global (0-100)"""
        if not metrics:
            return 50.0
        
        # Score basé sur les tendances et deltas
        total_score = 0
        for metric in metrics.values():
            base_score = {
                ProgressTrend.BREAKTHROUGH: 90,
                ProgressTrend.RISING: 75,
                ProgressTrend.STABLE: 50,
                ProgressTrend.DECLINING: 30,
                ProgressTrend.STAGNANT: 15
            }[metric.trend]
            
            # Bonus/malus selon delta 7j
            delta_bonus = min(max(metric.delta_7d * 2, -20), 20)
            total_score += base_score + delta_bonus
        
        return max(0, min(100, total_score / len(metrics)))
    
    def _identify_recent_victory(self, metrics: Dict[ProgressMetricType, ProgressMetric]) -> Optional[Dict[str, Any]]:
        """Identifie la victoire la plus récente et significative"""
        victories = []
        
        for metric_type, metric in metrics.items():
            if metric.trend in [ProgressTrend.BREAKTHROUGH, ProgressTrend.RISING]:
                config = self.metric_configs.get(metric_type, {})
                thresholds = config.get("celebration_thresholds", {"minor": 1, "major": 5})
                
                if metric.delta_7d >= thresholds["major"]:
                    victory_level = "major"
                elif metric.delta_7d >= thresholds["minor"]:
                    victory_level = "minor"
                else:
                    continue
                
                victories.append({
                    "metric_type": metric_type.value,
                    "improvement": metric.delta_7d,
                    "level": victory_level,
                    "unit": config.get("unit", "points"),
                    "timestamp": metric.last_updated
                })
        
        # Retourner la victoire la plus significative
        if victories:
            victories.sort(key=lambda x: (x["level"] == "major", x["improvement"]), reverse=True)
            return victories[0]
        
        return None
    
    def _suggest_next_milestone(self, user_id: str, metrics: Dict[ProgressMetricType, ProgressMetric]) -> Optional[Dict[str, Any]]:
        """Suggère le prochain milestone réalisable"""
        # Logic pour suggérer next milestone basé sur progression actuelle
        # TODO: Implémenter selon business logic Phoenix
        return {
            "type": "cv_optimization",
            "target": "Optimiser 3 sections de ton CV",
            "progress": "1/3",
            "estimated_energy": 25
        }
    
    async def _get_cached_progress(self, user_id: str) -> Optional[UserProgressProfile]:
        """Récupère profil depuis cache Redis"""
        try:
            cached_data = await redis_cache.get("progress", user_id)
            if cached_data:
                # Reconstruction depuis dict
                return self._dict_to_progress_profile(cached_data)
        except Exception as e:
            logger.warning("Cache retrieval failed", user_id=user_id, error=str(e))
        return None
    
    async def _cache_progress_profile(self, user_id: str, profile: UserProgressProfile):
        """Cache le profil de progression"""
        try:
            profile_dict = self._progress_profile_to_dict(profile)
            await redis_cache.set("progress", user_id, profile_dict, ttl=900)  # 15 min
        except Exception as e:
            logger.warning("Cache storage failed", user_id=user_id, error=str(e))
    
    def _progress_profile_to_dict(self, profile: UserProgressProfile) -> Dict:
        """Convertit profile en dict pour cache"""
        return {
            "user_id": profile.user_id,
            "metrics": {
                k.value: asdict(v) for k, v in profile.metrics.items()
            },
            "overall_trend": profile.overall_trend.value,
            "momentum_score": profile.momentum_score,
            "last_victory": profile.last_victory,
            "next_milestone": profile.next_milestone,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None
        }
    
    def _dict_to_progress_profile(self, data: Dict) -> UserProgressProfile:
        """Reconstruit profile depuis dict cache"""
        # Reconstituer les métriques
        metrics = {}
        for metric_type_str, metric_data in data.get("metrics", {}).items():
            metric_type = ProgressMetricType(metric_type_str)
            metric_data["metric_type"] = metric_type
            metric_data["trend"] = ProgressTrend(metric_data["trend"])
            if metric_data["last_updated"]:
                metric_data["last_updated"] = datetime.fromisoformat(metric_data["last_updated"])
            metrics[metric_type] = ProgressMetric(**metric_data)
        
        return UserProgressProfile(
            user_id=data["user_id"],
            metrics=metrics,
            overall_trend=ProgressTrend(data["overall_trend"]),
            momentum_score=data["momentum_score"],
            last_victory=data.get("last_victory"),
            next_milestone=data.get("next_milestone"),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None
        )


# Instance globale
progress_tracker = ProgressTracker()