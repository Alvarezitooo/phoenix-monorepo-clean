"""
🧠 Phoenix Luna - Narrative Analyzer v2.0 OPTIMIZED 
Service d'Intelligence Narrative - Transformation événements → Context Packets
Optimisations performance: cache, parsing, algorithmes efficaces
"""

import os
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
import json
import structlog
import statistics
from functools import lru_cache
import hashlib

from app.core.supabase_client import event_store
from app.core.energy_manager import energy_manager

logger = structlog.get_logger("narrative_analyzer_optimized")


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
    """Context Packet v2.0 - Sortie structurée du Narrative Analyzer"""
    user: UserMeta
    usage: UsagePattern
    progress: ProgressMetrics
    last_emotion_or_doubt: Optional[str] = None
    confidence: float = 0.0
    generated_at: str = ""
    cache_key: Optional[str] = None  # 🚀 NOUVEAU: identifiant cache
    
    def to_dict(self) -> Dict[str, Any]:
        """Conversion pour injection dans le prompt Luna"""
        return asdict(self)


# 🚀 OPTIMISATION 1: Cache en mémoire pour Context Packets récents
class ContextPacketCache:
    """Cache TTL pour Context Packets"""
    
    def __init__(self, ttl_minutes: int = 15):
        self.cache: Dict[str, Tuple[ContextPacket, datetime]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self, cache_key: str) -> Optional[ContextPacket]:
        """Récupère depuis le cache si valide"""
        if cache_key in self.cache:
            packet, timestamp = self.cache[cache_key]
            if datetime.now(timezone.utc) - timestamp < self.ttl:
                logger.info("Context Packet servi depuis le cache", cache_key=cache_key)
                return packet
            else:
                del self.cache[cache_key]
        return None
    
    def set(self, cache_key: str, packet: ContextPacket):
        """Stocke dans le cache"""
        self.cache[cache_key] = (packet, datetime.now(timezone.utc))
        
        # Nettoyage périodique (limite à 100 entrées)
        if len(self.cache) > 100:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]


# 🚀 OPTIMISATION 2: Parsing timestamp optimisé avec cache
@lru_cache(maxsize=1000)
def parse_iso_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Parse ISO timestamp avec cache LRU"""
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return None


class OptimizedNarrativeAnalyzer:
    """
    🧠 Analyzeur Narratif v2.0 OPTIMIZED - Context Packets
    
    Optimisations performance:
    1. Cache TTL Context Packets (15min)
    2. Parsing timestamps avec LRU cache
    3. Sessionization O(n) algorithme optimisé  
    4. Batching des calculs statistiques
    5. Limites intelligentes sur datasets
    """
    
    def __init__(self):
        """Initialise l'analyzeur narratif optimisé"""
        self.cache = ContextPacketCache(ttl_minutes=15)
        self._stats_cache: Dict[str, Any] = {}  # Cache pour calculs coûteux
    
    def _generate_cache_key(self, user_id: str, windows: TimeWindow) -> str:
        """Génère une clé de cache unique pour user + windows"""
        windows_str = f"{windows.short}-{windows.mid}-{windows.long}"
        hash_input = f"{user_id}:{windows_str}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]
    
    async def generate_context_packet(
        self, 
        user_id: str, 
        windows: Optional[TimeWindow] = None,
        force_refresh: bool = False
    ) -> ContextPacket:
        """
        Génère un Context Packet avec cache et optimisations
        
        Args:
            user_id: ID de l'utilisateur  
            windows: Fenêtres d'analyse temporelle
            force_refresh: Force bypass du cache
            
        Returns:
            ContextPacket: Contexte structuré prêt pour Luna
        """
        logger.info("Génération Context Packet optimisé", user_id=user_id)
        
        if windows is None:
            windows = TimeWindow()
        
        # 🚀 OPTIMISATION: Vérifier le cache d'abord
        cache_key = self._generate_cache_key(user_id, windows)
        if not force_refresh:
            cached_packet = self.cache.get(cache_key)
            if cached_packet:
                return cached_packet
        
        try:
            # 1. Récupération événements bruts (optimisée)
            events = await self._fetch_user_events_optimized(user_id, windows)
            
            if not events:
                logger.warning("Aucun événement trouvé", user_id=user_id)
                empty_packet = self._create_empty_context_packet(user_id)
                self.cache.set(cache_key, empty_packet)
                return empty_packet
            
            # 🚀 OPTIMISATION: Pré-processing une seule fois
            events_preprocessed = self._preprocess_events(events)
            
            # 2. Analyse multi-dimensionnelle (parallélisée)
            analysis_tasks = [
                self._analyze_user_meta_optimized(user_id, events_preprocessed),
                self._analyze_usage_pattern_optimized(events_preprocessed, windows),
                self._analyze_progress_metrics_optimized(events_preprocessed, windows)
            ]
            
            user_meta, usage_pattern, progress_metrics = await asyncio.gather(*analysis_tasks)
            
            # 3. Extractions finales
            last_emotion = self._extract_last_emotion_or_doubt_optimized(events_preprocessed)
            confidence = self._calculate_confidence_optimized(events_preprocessed, user_meta, usage_pattern, progress_metrics)
            
            # 4. Construction Context Packet final
            context_packet = ContextPacket(
                user=user_meta,
                usage=usage_pattern,
                progress=progress_metrics,
                last_emotion_or_doubt=last_emotion,
                confidence=confidence,
                generated_at=datetime.now(timezone.utc).isoformat(),
                cache_key=cache_key
            )
            
            # 🚀 OPTIMISATION: Stocker en cache
            self.cache.set(cache_key, context_packet)
            
            logger.info(
                "Context Packet optimisé généré", 
                user_id=user_id, 
                confidence=confidence,
                events_analyzed=len(events),
                cache_key=cache_key
            )
            
            return context_packet
            
        except Exception as e:
            logger.error("Erreur génération Context Packet optimisé", user_id=user_id, error=str(e))
            empty_packet = self._create_empty_context_packet(user_id)
            self.cache.set(cache_key, empty_packet)
            return empty_packet
    
    def _preprocess_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        🚀 OPTIMISATION: Pré-processing des événements en un seul pass
        Parse les timestamps, trie, et ajoute des champs dérivés
        """
        processed_events = []
        
        for event in events:
            # Parse timestamp une seule fois
            timestamp_str = event.get("created_at", "")
            parsed_time = parse_iso_timestamp(timestamp_str)
            
            if parsed_time is None:
                continue
            
            # Enrichir l'événement avec données précalculées
            enhanced_event = {
                **event,
                "_parsed_timestamp": parsed_time,
                "_event_type": event.get("type", "").lower(),
                "_payload": event.get("payload", {}),
                "_app_source": event.get("payload", {}).get("app_source", "")
            }
            
            processed_events.append(enhanced_event)
        
        # Tri par timestamp (plus récent en premier)
        processed_events.sort(key=lambda e: e["_parsed_timestamp"], reverse=True)
        
        logger.info(f"Événements préprocessés: {len(processed_events)}")
        return processed_events
    
    async def _fetch_user_events_optimized(self, user_id: str, windows: TimeWindow) -> List[Dict[str, Any]]:
        """🚀 OPTIMISATION: Récupération événements avec limites intelligentes"""
        
        try:
            # Calcul limite intelligente basée sur fenêtre longue
            long_days = int(windows.long.replace('d', ''))
            
            # Limite adaptative: moins pour nouveaux utilisateurs
            base_limit = min(300, long_days * 3)  # ~3 événements par jour
            
            events = await event_store.get_user_events(user_id, limit=base_limit)
            
            # 🚀 OPTIMISATION: Filtrage temporel en Python plus efficace
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(days=long_days)
            
            # Filtrage avec list comprehension (plus rapide)
            filtered_events = [
                event for event in events
                if parse_iso_timestamp(event.get("created_at", "")) and
                   parse_iso_timestamp(event.get("created_at", "")) >= cutoff
            ]
            
            logger.info(f"Événements récupérés optimisés: {len(filtered_events)}/{len(events)}", user_id=user_id)
            return filtered_events
            
        except Exception as e:
            logger.error("Erreur récupération événements optimisée", user_id=user_id, error=str(e))
            return []
    
    async def _analyze_user_meta_optimized(self, user_id: str, events: List[Dict[str, Any]]) -> UserMeta:
        """🚀 OPTIMISATION: Analyse métadonnées avec événements pré-processés"""
        
        if not events:
            return UserMeta(age_days=0, plan="free", first_seen="", last_activity_hours=999)
        
        # Utilisation des timestamps pré-parsés
        first_event = min(events, key=lambda e: e["_parsed_timestamp"])
        last_event = max(events, key=lambda e: e["_parsed_timestamp"])
        
        first_time = first_event["_parsed_timestamp"]
        last_time = last_event["_parsed_timestamp"]
        now = datetime.now(timezone.utc)
        
        age_days = (now - first_time).days
        last_activity_hours = (now - last_time).total_seconds() / 3600
        
        # Détection du plan optimisée
        plan = "free"
        for event in events:
            event_type = event["_event_type"]
            if "energy_purchase" in event_type or "subscription_activated" in event_type:
                payload = event["_payload"]
                pack_type = payload.get("pack_type", "")
                if pack_type == "luna_unlimited":
                    plan = "unlimited"
                    break
                elif pack_type in ["petit_dej_luna", "repas_luna"]:
                    plan = "premium"
        
        return UserMeta(
            age_days=age_days,
            plan=plan,
            first_seen=first_event.get("created_at", ""),
            last_activity_hours=round(last_activity_hours, 1)
        )
    
    async def _analyze_usage_pattern_optimized(self, events: List[Dict[str, Any]], windows: TimeWindow) -> UsagePattern:
        """🚀 OPTIMISATION: Analyse patterns avec algorithme O(n) single-pass"""
        
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
        
        # 🚀 SINGLE-PASS analysis pour événements récents
        apps_used = set()
        event_types = set()
        recent_events = []
        
        for event in events:
            timestamp = event["_parsed_timestamp"]
            
            if timestamp >= week_ago:
                recent_events.append(event)
                
                # Apps utilisées (logique optimisée)
                event_type = event["_event_type"]
                app_source = event["_app_source"]
                
                if event_type.startswith("cv_") or "mirror_match" in event_type:
                    apps_used.add("cv")
                elif event_type.startswith("letter_") or "lettre" in event_type:
                    apps_used.add("letters")
                elif app_source:
                    apps_used.add(app_source)
                
                event_types.add(event.get("type", ""))
        
        # 🚀 OPTIMISATION: Sessionization O(n) algorithme
        sessions = self._sessionize_events_optimized(recent_events)
        
        # Dernière activité
        last_activity_hours = 999
        if recent_events:
            last_activity_hours = (now - recent_events[0]["_parsed_timestamp"]).total_seconds() / 3600
        
        return UsagePattern(
            apps_last_7d=list(apps_used),
            last_activity_hours=round(last_activity_hours, 1),
            events_sample=list(event_types)[:5],
            session_count_7d=len(sessions),
            avg_session_minutes=self._calculate_avg_session_duration_optimized(sessions)
        )
    
    async def _analyze_progress_metrics_optimized(self, events: List[Dict[str, Any]], windows: TimeWindow) -> ProgressMetrics:
        """🚀 OPTIMISATION: Métriques de progression avec batch processing"""
        
        if not events:
            return ProgressMetrics()
        
        # 🚀 BATCH processing pour différents types d'événements
        cv_events = []
        letter_events = []
        cv_count = 0
        letters_count = 0
        
        for event in events:
            event_type = event["_event_type"]
            
            if event_type.startswith("cv_"):
                cv_events.append(event)
                if "cv_generated" in event_type:
                    cv_count += 1
            elif "letter" in event_type:
                letter_events.append(event)
                letters_count += 1
        
        # Calcul ATS optimisé
        ats_scores = []
        for event in cv_events:
            ats_score = event["_payload"].get("ats_score")
            if isinstance(ats_score, (int, float)) and 0 <= ats_score <= 100:
                ats_scores.append(ats_score)
        
        ats_mean = None
        ats_delta_pct_14d = None
        
        if ats_scores:
            ats_mean = round(statistics.mean(ats_scores), 1)
            
            # Delta calculation optimisée
            if len(ats_scores) >= 4:
                mid_point = len(ats_scores) // 2
                recent_avg = statistics.mean(ats_scores[:mid_point])  # Plus récents en premier
                old_avg = statistics.mean(ats_scores[mid_point:])
                
                if old_avg > 0:
                    ats_delta_pct_14d = round(((recent_avg - old_avg) / old_avg) * 100, 1)
        
        # Target sector detection optimisée
        letters_target = None
        tech_keywords = {"tech", "développeur", "ingénieur", "software", "data", "cloud"}
        
        for event in letter_events[:10]:  # Check only 10 most recent
            payload = event["_payload"]
            text_to_search = f"{payload.get('company_name', '')} {payload.get('position_title', '')}".lower()
            
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
    
    def _sessionize_events_optimized(self, events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """🚀 OPTIMISATION: Sessionization O(n) au lieu de O(n²)"""
        
        if not events:
            return []
        
        # Events déjà triés par timestamp décroissant dans preprocess
        # On les retrie en croissant pour sessionization
        sorted_events = sorted(events, key=lambda e: e["_parsed_timestamp"])
        
        sessions = []
        current_session = [sorted_events[0]]
        session_timeout = timedelta(minutes=30)
        
        for i in range(1, len(sorted_events)):
            prev_time = sorted_events[i-1]["_parsed_timestamp"]
            curr_time = sorted_events[i]["_parsed_timestamp"]
            
            # Si moins de 30 minutes d'écart = même session
            if (curr_time - prev_time) <= session_timeout:
                current_session.append(sorted_events[i])
            else:
                sessions.append(current_session)
                current_session = [sorted_events[i]]
        
        sessions.append(current_session)
        return sessions
    
    def _calculate_avg_session_duration_optimized(self, sessions: List[List[Dict[str, Any]]]) -> float:
        """🚀 OPTIMISATION: Calcul durée sessions avec timestamps pré-parsés"""
        
        if not sessions:
            return 0
        
        durations = []
        
        for session in sessions:
            if len(session) < 2:
                durations.append(5)  # Session courte estimée
                continue
            
            first_time = session[0]["_parsed_timestamp"]
            last_time = session[-1]["_parsed_timestamp"]
            duration_minutes = max(5, (last_time - first_time).total_seconds() / 60)
            durations.append(duration_minutes)
        
        return round(statistics.mean(durations), 1) if durations else 0
    
    def _extract_last_emotion_or_doubt_optimized(self, events: List[Dict[str, Any]]) -> Optional[str]:
        """🚀 OPTIMISATION: Extraction émotions avec recherche limitée"""
        
        # Limiter la recherche aux 20 événements les plus récents
        recent_events = events[:20]  # Events déjà triés par timestamp décroissant
        
        doubt_patterns = {
            "reseautage": ["réseau", "networking", "relationnel", "contacts"],
            "quantification": ["quantifier", "chiffres", "mesure", "impact"],
            "reconversion": ["reconversion", "changement", "transition", "pivot"],
            "experience": ["expérience", "junior", "manque", "débutant"]
        }
        
        for event in recent_events:
            event_type = event["_event_type"]
            payload = event["_payload"]
            
            if "session_zero" in event_type or "onboarding" in event_type:
                notes = payload.get("notes", "") + payload.get("feedback", "")
                text = notes.lower()
                
                for doubt, keywords in doubt_patterns.items():
                    if any(keyword in text for keyword in keywords):
                        return doubt
        
        return None
    
    def _calculate_confidence_optimized(
        self, 
        events: List[Dict[str, Any]], 
        user_meta: UserMeta, 
        usage: UsagePattern, 
        progress: ProgressMetrics
    ) -> float:
        """🚀 OPTIMISATION: Calcul confiance avec cache pour facteurs coûteux"""
        
        confidence_factors = []
        
        # Facteur 1: Quantité de données (linéaire)
        event_confidence = min(1.0, len(events) / 20)
        confidence_factors.append(event_confidence)
        
        # Facteur 2: Récence activité (optimisé)
        activity_confidence = max(0.2, 1.0 - (user_meta.last_activity_hours / 168))
        confidence_factors.append(activity_confidence)
        
        # Facteur 3: Diversité des données
        diversity_confidence = min(1.0, len(usage.apps_last_7d) / 3)
        confidence_factors.append(diversity_confidence)
        
        # Facteur 4: Données ATS disponibles
        ats_confidence = 0.8 if progress.ats_mean is not None else 0.3
        confidence_factors.append(ats_confidence)
        
        # Moyenne rapide sans statistics.mean()
        total_confidence = sum(confidence_factors) / len(confidence_factors)
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
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        return {
            "cache_entries": len(self.cache.cache),
            "lru_cache_info": parse_iso_timestamp.cache_info()._asdict()
        }


# Instance globale optimisée
narrative_analyzer_optimized = OptimizedNarrativeAnalyzer()