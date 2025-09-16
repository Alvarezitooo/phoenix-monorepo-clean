"""
🧠 Phoenix Luna - Narrative Analyzer v1.5
Service d'Intelligence Narrative - Transformation événements → Context Packets
Architecture Hub-Roi - Cerveau analytique de Luna
"""

import os
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
import json
import structlog
import statistics

from app.core.supabase_client import event_store
from app.core.energy_manager import energy_manager
from app.core.nlp_service import nlp_service

logger = structlog.get_logger("narrative_analyzer")


@dataclass
class TimeWindow:
    """Fenêtres temporelles pour l'analyse"""
    short: str = "7d"    # Focus récent
    mid: str = "14d"     # Tendance
    long: str = "90d"    # Contexte historique


@dataclass
class UserMeta:
    """Métadonnées utilisateur"""
    age_days: int
    plan: str
    first_seen: str
    last_activity_hours: float


@dataclass  
class UsagePattern:
    """Patterns d'usage utilisateur"""
    apps_last_7d: List[str]
    last_activity_hours: float
    events_sample: List[str]
    session_count_7d: int
    avg_session_minutes: float


@dataclass
class ProgressMetrics:
    """Métriques de progression"""
    ats_mean: Optional[float] = None
    ats_delta_pct_14d: Optional[float] = None
    cv_count_total: int = 0
    letters_count_total: int = 0
    letters_target: Optional[str] = None


@dataclass
class ContextPacket:
    """Context Packet v2.0 - Sortie structurée du Narrative Analyzer avec NLP"""
    user: UserMeta
    usage: UsagePattern
    progress: ProgressMetrics
    last_emotion_or_doubt: Optional[str] = None
    confidence: float = 0.0
    generated_at: str = ""
    nlp_insights: Optional[Dict[str, Any]] = None  # 🧠 Phase 1 NLP upgrade
    
    def to_dict(self) -> Dict[str, Any]:
        """Conversion pour injection dans le prompt Luna"""
        return asdict(self)


class NarrativeAnalyzer:
    """
    🧠 Analyzeur Narratif v1.5 - Context Packets
    
    Responsabilités:
    1. Lecture Event Store (source unique de vérité)
    2. Analyse temporelle multi-fenêtres
    3. Génération Context Packets structurés
    4. Préparation injection Prompt Luna
    """
    
    def __init__(self):
        """Initialise l'analyzeur narratif"""
        pass
    
    async def generate_context_packet(
        self, 
        user_id: str, 
        windows: Optional[TimeWindow] = None
    ) -> ContextPacket:
        """
        Génère un Context Packet complet pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur  
            windows: Fenêtres d'analyse temporelle
            
        Returns:
            ContextPacket: Contexte structuré prêt pour Luna
        """
        logger.info("Génération Context Packet", user_id=user_id)
        
        if windows is None:
            windows = TimeWindow()
        
        try:
            # 1. Récupération événements bruts (Event Store = source unique)
            events = await self._fetch_user_events(user_id, windows)
            
            if not events:
                logger.warning("Aucun événement trouvé", user_id=user_id)
                return self._create_empty_context_packet(user_id)
            
            # 2. Analyse multi-dimensionnelle
            user_meta = await self._analyze_user_meta(user_id, events)
            usage_pattern = self._analyze_usage_pattern(events, windows)  
            progress_metrics = self._analyze_progress_metrics(events, windows)
            last_emotion = self._extract_last_emotion_or_doubt(events)
            
            # 🧠 2.5. PHASE 1 NLP UPGRADE - Enrichissement sémantique
            nlp_enrichment = self._enrich_with_nlp_analysis(events, user_id)
            
            # 3. Calcul confiance globale
            confidence = self._calculate_confidence(events, user_meta, usage_pattern, progress_metrics)
            
            # 4. Construction Context Packet final
            context_packet = ContextPacket(
                user=user_meta,
                usage=usage_pattern,
                progress=progress_metrics,
                last_emotion_or_doubt=last_emotion,
                confidence=confidence,
                generated_at=datetime.now(timezone.utc).isoformat(),
                nlp_insights=nlp_enrichment.get("nlp_enrichment")  # 🧠 Phase 1 NLP data
            )
            
            logger.info(
                "Context Packet généré", 
                user_id=user_id, 
                confidence=confidence,
                events_analyzed=len(events)
            )
            
            return context_packet
            
        except Exception as e:
            logger.error("Erreur génération Context Packet", user_id=user_id, error=str(e))
            return self._create_empty_context_packet(user_id)
    
    async def _detect_user_plan_robust(self, user_id: str, events: List[Dict[str, Any]]) -> str:
        """
        🔥 Détection robuste du plan utilisateur
        Méthodes multiples pour éviter les faux "free"
        """
        
        # MÉTHODE 1: Vérification directe Energy Manager (plus fiable)
        try:
            from app.core.energy_manager import energy_manager
            is_unlimited = await energy_manager._is_unlimited_user(user_id)
            if is_unlimited:
                logger.info("Plan Unlimited détecté via Energy Manager", user_id=user_id)
                return "unlimited"
        except Exception as e:
            logger.warning("Energy Manager check failed", user_id=user_id, error=str(e))
        
        # MÉTHODE 2: Analyse événements (fallback)
        plan = "free"
        for event in events:
            event_type = event.get("type", "")
            event_data = event.get("event_data", {}) or event.get("payload", {})
            
            # Events subscription/purchase
            if event_type in ["energy_purchase", "subscription_activated", "EnergyActionPerformed"]:
                pack_type = event_data.get("pack_type") or event_data.get("subscription_type")
                if pack_type == "luna_unlimited":
                    plan = "unlimited"
                    break
                elif pack_type in ["petit_dej_luna", "repas_luna"]:
                    plan = "premium"
            
            # Events energy avec unlimited context
            if event_type == "EnergyActionPerformed":
                if event_data.get("unlimited") or event_data.get("energy_cost") == 0:
                    plan = "unlimited"
                    break
        
        # MÉTHODE 3: Heuristique sur usage (très conservatrice)
        if plan == "free" and len(events) > 50:  # User très actif = probablement premium
            actions_count = len([e for e in events if "action" in e.get("type", "").lower()])
            if actions_count > 20:  # Beaucoup d'actions = probablement pas free
                plan = "premium"  # Conservateur : premium plutôt qu'unlimited
        
        logger.info("Plan détecté", user_id=user_id, plan=plan, method="robust_detection")
        return plan

    async def _fetch_user_events(self, user_id: str, windows: TimeWindow) -> List[Dict[str, Any]]:
        """Récupère les événements utilisateur selon les fenêtres temporelles"""
        
        try:
            # Fenêtre longue pour contexte historique complet
            long_days = int(windows.long.replace('d', ''))
            limit = min(500, long_days * 5)  # ~5 événements par jour max
            
            events = await event_store.get_user_events(user_id, limit=limit)
            
            # Filtrage temporel
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(days=long_days)
            
            filtered_events = []
            for event in events:
                try:
                    event_time = datetime.fromisoformat(event.get("created_at", "").replace('Z', '+00:00'))
                    if event_time >= cutoff:
                        filtered_events.append(event)
                except (ValueError, TypeError):
                    continue
            
            logger.info(f"Événements récupérés: {len(filtered_events)}/{len(events)}", user_id=user_id)
            return filtered_events
            
        except Exception as e:
            logger.error("Erreur récupération événements", user_id=user_id, error=str(e))
            return []
    
    def _enrich_with_nlp_analysis(self, events: List[Dict[str, Any]], user_id: str) -> Dict[str, Any]:
        """
        🧠 PHASE 1 NLP UPGRADE - Enrichissement sémantique des événements
        Analyse avancée du contenu textuel pour enrichir le Capital Narratif
        """
        try:
            # Extraction de tout le contenu textuel des événements
            text_content = []
            for event in events:
                payload = event.get('payload', {})
                
                # Récupération de texte de différentes sources
                if isinstance(payload, dict):
                    # Texte explicite dans les formulaires
                    for key, value in payload.items():
                        if isinstance(value, str) and len(value) > 10:
                            text_content.append(value)
                    
                    # Contenu spécialisé par type d'événement
                    event_type = event.get('event_type', '')
                    if 'career_discovery' in event_type:
                        form_data = payload.get('form_data', {})
                        if isinstance(form_data, dict):
                            for field in ['currentJob', 'interests', 'experience']:
                                if form_data.get(field):
                                    text_content.append(str(form_data[field]))
            
            if not text_content:
                return {"nlp_enrichment": None, "text_analysis_status": "no_text_content"}
            
            # Combinaison de tout le texte pour analyse globale
            combined_text = " ".join(text_content)
            
            # Analyse NLP avancée
            text_insights = nlp_service.analyze_text(combined_text, context="career_narrative")
            
            # Génération des métadonnées narratives
            user_context = {"user_id": user_id, "recent_activity": len(events)}
            narrative_metadata = nlp_service.extract_narrative_metadata(combined_text, user_context)
            
            # Enrichissement spécialisé
            nlp_enrichment = {
                "semantic_analysis": {
                    "dominant_themes": text_insights.themes,
                    "career_indicators": text_insights.career_indicators,
                    "keywords": text_insights.keywords[:8],  # Top 8 keywords
                    "complexity_score": text_insights.complexity_score,
                    "readability_score": text_insights.readability_score
                },
                "emotional_analysis": {
                    "sentiment_polarity": text_insights.sentiment.polarity,
                    "dominant_emotion": text_insights.sentiment.dominant_emotion,
                    "confidence": text_insights.sentiment.confidence,
                    "intensity": text_insights.sentiment.intensity
                },
                "narrative_intelligence": narrative_metadata.get("narrative_enrichment", {}),
                "personalization_hints": narrative_metadata.get("personalization_hints", {}),
                "analysis_metadata": {
                    "text_chunks_analyzed": len(text_content),
                    "total_text_length": len(combined_text),
                    "analysis_timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
            
            logger.info("🧠 NLP enrichment completed", 
                       user_id=user_id,
                       themes_count=len(text_insights.themes),
                       sentiment=text_insights.sentiment.dominant_emotion,
                       career_indicators_count=len(text_insights.career_indicators))
            
            return {
                "nlp_enrichment": nlp_enrichment,
                "text_analysis_status": "success"
            }
            
        except Exception as e:
            logger.error("🧠 NLP enrichment failed", user_id=user_id, error=str(e))
            return {
                "nlp_enrichment": None,
                "text_analysis_status": "error",
                "error_details": str(e)
            }
    
    async def _analyze_user_meta(self, user_id: str, events: List[Dict[str, Any]]) -> UserMeta:
        """Analyse les métadonnées utilisateur"""
        
        if not events:
            return UserMeta(age_days=0, plan="free", first_seen="", last_activity_hours=999)
        
        # Premier et dernier événement
        first_event = min(events, key=lambda e: e.get("created_at", ""))
        last_event = max(events, key=lambda e: e.get("created_at", ""))
        
        try:
            first_time = datetime.fromisoformat(first_event.get("created_at", "").replace('Z', '+00:00'))
            last_time = datetime.fromisoformat(last_event.get("created_at", "").replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            
            age_days = (now - first_time).days
            last_activity_hours = (now - last_time).total_seconds() / 3600
            
        except (ValueError, TypeError):
            age_days = 0
            last_activity_hours = 999
        
        # 🔥 AMÉLIORATION: Détection plan Unlimited plus robuste
        plan = await self._detect_user_plan_robust(user_id, events)
        
        return UserMeta(
            age_days=age_days,
            plan=plan,
            first_seen=first_event.get("created_at", ""),
            last_activity_hours=round(last_activity_hours, 1)
        )
    
    def _analyze_usage_pattern(self, events: List[Dict[str, Any]], windows: TimeWindow) -> UsagePattern:
        """Analyse les patterns d'usage"""
        
        if not events:
            return UsagePattern(
                apps_last_7d=[],
                last_activity_hours=999,
                events_sample=[],
                session_count_7d=0,
                avg_session_minutes=0
            )
        
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        
        # Événements des 7 derniers jours
        recent_events = []
        for event in events:
            try:
                event_time = datetime.fromisoformat(event.get("created_at", "").replace('Z', '+00:00'))
                if event_time >= week_ago:
                    recent_events.append(event)
            except (ValueError, TypeError):
                continue
        
        # Apps utilisées
        apps_used = set()
        event_types = []
        
        for event in recent_events:
            # Détection app source depuis payload ou type
            payload = event.get("payload", {})
            app_source = payload.get("app_source", "")
            
            # Mapping event type vers app
            event_type = event.get("type", "")
            if event_type.startswith("cv_") or "mirror_match" in event_type:
                apps_used.add("cv")
            elif event_type.startswith("letter_") or "lettre" in event_type:
                apps_used.add("letters")
            elif app_source:
                apps_used.add(app_source)
            
            event_types.append(event_type)
        
        # Sessionization simple (événements groupés par proximité temporelle)
        sessions = self._sessionize_events(recent_events)
        
        # Dernière activité
        last_activity_hours = 999
        if recent_events:
            try:
                last_event_time = datetime.fromisoformat(recent_events[0].get("created_at", "").replace('Z', '+00:00'))
                last_activity_hours = (now - last_event_time).total_seconds() / 3600
            except (ValueError, TypeError):
                pass
        
        return UsagePattern(
            apps_last_7d=list(apps_used),
            last_activity_hours=round(last_activity_hours, 1),
            events_sample=list(set(event_types))[:5],  # Échantillon unique
            session_count_7d=len(sessions),
            avg_session_minutes=self._calculate_avg_session_duration(sessions)
        )
    
    def _analyze_progress_metrics(self, events: List[Dict[str, Any]], windows: TimeWindow) -> ProgressMetrics:
        """Analyse les métriques de progression"""
        
        if not events:
            return ProgressMetrics()
        
        # Événements CV pour ATS score
        cv_events = [e for e in events if e.get("type", "").startswith("cv_")]
        ats_scores = []
        
        for event in cv_events:
            payload = event.get("payload", {})
            ats_score = payload.get("ats_score")
            if isinstance(ats_score, (int, float)) and 0 <= ats_score <= 100:
                ats_scores.append(ats_score)
        
        # Calcul ATS moyen récent vs passé
        ats_mean = None
        ats_delta_pct_14d = None
        
        if ats_scores:
            ats_mean = round(statistics.mean(ats_scores), 1)
            
            # Delta 14 jours si suffisamment de données
            if len(ats_scores) >= 3:
                mid_point = len(ats_scores) // 2
                recent_scores = ats_scores[-mid_point:]
                old_scores = ats_scores[:mid_point]
                
                if old_scores:
                    recent_avg = statistics.mean(recent_scores)
                    old_avg = statistics.mean(old_scores)
                    ats_delta_pct_14d = round(((recent_avg - old_avg) / old_avg) * 100, 1)
        
        # Compteurs
        cv_count = len([e for e in events if "cv_generated" in e.get("type", "").lower()])
        letters_count = len([e for e in events if "letter" in e.get("type", "").lower()])
        
        # Target sector depuis lettres récentes
        letters_target = None
        letter_events = [e for e in events if "letter" in e.get("type", "").lower()]
        
        for event in reversed(letter_events):  # Plus récent en premier
            payload = event.get("payload", {})
            company = payload.get("company_name", "")
            position = payload.get("position_title", "")
            
            # Heuristique simple pour détecter secteur tech
            tech_keywords = ["tech", "développeur", "ingénieur", "software", "data", "cloud"]
            text_to_search = f"{company} {position}".lower()
            
            if any(keyword in text_to_search for keyword in tech_keywords):
                letters_target = "secteur_tech"
                break
        
        return ProgressMetrics(
            ats_mean=ats_mean,
            ats_delta_pct_14d=ats_delta_pct_14d,
            cv_count_total=cv_count,
            letters_count_total=letters_count,
            letters_target=letters_target
        )
    
    def _extract_last_emotion_or_doubt(self, events: List[Dict[str, Any]]) -> Optional[str]:
        """Extrait la dernière émotion ou doute exprimé"""
        
        # Chercher dans les événements de type "session_zero" ou "user_feedback"
        for event in reversed(events):  # Plus récent en premier
            event_type = event.get("type", "")
            payload = event.get("payload", {})
            
            if "session_zero" in event_type or "onboarding" in event_type:
                # Heuristiques pour détecter doutes communs
                notes = payload.get("notes", "") + payload.get("feedback", "")
                text = notes.lower()
                
                doubt_patterns = {
                    "reseautage": ["réseau", "networking", "relationnel", "contacts"],
                    "quantification": ["quantifier", "chiffres", "mesure", "impact"],
                    "reconversion": ["reconversion", "changement", "transition", "pivot"],
                    "experience": ["expérience", "junior", "manque", "débutant"]
                }
                
                for doubt, keywords in doubt_patterns.items():
                    if any(keyword in text for keyword in keywords):
                        return doubt
        
        return None
    
    def _sessionize_events(self, events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Groupe les événements en sessions (proximité temporelle)"""
        
        if not events:
            return []
        
        # Tri par timestamp
        sorted_events = sorted(events, key=lambda e: e.get("created_at", ""))
        
        sessions = []
        current_session = [sorted_events[0]]
        
        for i in range(1, len(sorted_events)):
            try:
                prev_time = datetime.fromisoformat(sorted_events[i-1].get("created_at", "").replace('Z', '+00:00'))
                curr_time = datetime.fromisoformat(sorted_events[i].get("created_at", "").replace('Z', '+00:00'))
                
                # Si moins de 30 minutes d'écart = même session
                if (curr_time - prev_time).total_seconds() <= 1800:  # 30 minutes
                    current_session.append(sorted_events[i])
                else:
                    sessions.append(current_session)
                    current_session = [sorted_events[i]]
                    
            except (ValueError, TypeError):
                current_session.append(sorted_events[i])
        
        sessions.append(current_session)
        return sessions
    
    def _calculate_avg_session_duration(self, sessions: List[List[Dict[str, Any]]]) -> float:
        """Calcule la durée moyenne des sessions en minutes"""
        
        if not sessions:
            return 0
        
        durations = []
        
        for session in sessions:
            if len(session) < 2:
                durations.append(5)  # Session courte estimée à 5 min
                continue
            
            try:
                first = datetime.fromisoformat(session[0].get("created_at", "").replace('Z', '+00:00'))
                last = datetime.fromisoformat(session[-1].get("created_at", "").replace('Z', '+00:00'))
                duration_minutes = max(5, (last - first).total_seconds() / 60)  # Minimum 5 min
                durations.append(duration_minutes)
            except (ValueError, TypeError):
                durations.append(5)
        
        return round(statistics.mean(durations), 1) if durations else 0
    
    def _calculate_confidence(
        self, 
        events: List[Dict[str, Any]], 
        user_meta: UserMeta, 
        usage: UsagePattern, 
        progress: ProgressMetrics
    ) -> float:
        """Calcule le score de confiance global de l'analyse"""
        
        confidence_factors = []
        
        # Facteur 1: Quantité de données
        event_confidence = min(1.0, len(events) / 20)  # Confiance max à 20+ événements
        confidence_factors.append(event_confidence)
        
        # Facteur 2: Récence activité
        activity_confidence = max(0.2, 1.0 - (user_meta.last_activity_hours / 168))  # Décroît sur 1 semaine
        confidence_factors.append(activity_confidence)
        
        # Facteur 3: Diversité des données
        diversity = len(usage.apps_last_7d) / 3  # Max confiance si 3+ apps utilisées
        diversity_confidence = min(1.0, diversity)
        confidence_factors.append(diversity_confidence)
        
        # Facteur 4: Données ATS disponibles
        ats_confidence = 0.8 if progress.ats_mean is not None else 0.3
        confidence_factors.append(ats_confidence)
        
        # Moyenne pondérée
        total_confidence = statistics.mean(confidence_factors)
        return round(total_confidence, 2)
    
    def _create_empty_context_packet(self, user_id: str) -> ContextPacket:
        """Crée un Context Packet vide pour les nouveaux utilisateurs"""
        
        return ContextPacket(
            user=UserMeta(age_days=0, plan="free", first_seen="", last_activity_hours=999),
            usage=UsagePattern(
                apps_last_7d=[],
                last_activity_hours=999,
                events_sample=[],
                session_count_7d=0,
                avg_session_minutes=0
            ),
            progress=ProgressMetrics(),
            last_emotion_or_doubt=None,
            confidence=0.1,
            generated_at=datetime.now(timezone.utc).isoformat()
        )


# Instance globale
narrative_analyzer = NarrativeAnalyzer()

# 🚀 OPTIMISATION HOOK: Import de la version optimisée
try:
    from app.core.narrative_analyzer_optimized import narrative_analyzer_optimized
    
    # Remplacer l'instance globale par la version optimisée
    narrative_analyzer = narrative_analyzer_optimized
    
    logger.info("🚀 Narrative Analyzer OPTIMIZED activé - Performance améliorée")
    
except ImportError:
    logger.warning("Version optimisée non disponible, utilisation de la version standard")