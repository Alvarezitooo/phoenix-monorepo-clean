"""
📊 Metrics Collector - Phoenix Luna Hub
Collecteur de métriques temps réel avec percentiles p95/p99 et alerting
Oracle Directive: Observabilité & Performance
"""

import time
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
from collections import defaultdict, deque
from dataclasses import dataclass, field, asdict
import statistics
import structlog
from enum import Enum
import json

from .redis_cache import redis_cache
from .events import create_event

logger = structlog.get_logger("metrics")


class MetricType(Enum):
    """Types de métriques"""
    COUNTER = "counter"        # Compteurs (incrémentaux)
    GAUGE = "gauge"           # Jauges (valeur instantanée)  
    HISTOGRAM = "histogram"    # Histogrammes (distribution)
    TIMER = "timer"           # Timers (latence)


class AlertSeverity(Enum):
    """Niveaux de sévérité des alertes"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class MetricPoint:
    """Point de métrique individuel"""
    name: str
    value: float
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)
    metric_type: MetricType = MetricType.GAUGE


@dataclass
class PercentileStats:
    """Statistiques percentiles"""
    p50: float
    p95: float
    p99: float
    avg: float
    min: float
    max: float
    count: int


@dataclass
class Alert:
    """Alerte métrique"""
    name: str
    severity: AlertSeverity
    message: str
    value: float
    threshold: float
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """
    📊 Collecteur de métriques haute performance
    
    Features:
    - Collecte temps réel avec buffer en mémoire
    - Calculs percentiles p95/p99 optimisés
    - Système d'alertes configurable
    - Export Prometheus/Grafana
    - Métriques business et techniques
    - Persistance Redis pour agrégation
    """
    
    def __init__(self, buffer_size: int = 10000, flush_interval: int = 60):
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        
        # Buffers en mémoire pour performance
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.timers: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Cache des percentiles calculés
        self._percentile_cache: Dict[str, PercentileStats] = {}
        self._cache_expires: Dict[str, datetime] = {}
        
        # Alertes configurées
        self.alert_rules: Dict[str, Dict] = {}
        self.active_alerts: Dict[str, Alert] = {}
        
        # Tâche de flush périodique
        self._flush_task = None
        self._running = False
        
        # Configuration alertes par défaut
        self._setup_default_alerts()
    
    def _setup_default_alerts(self):
        """Configure les alertes par défaut pour Phoenix Luna Hub"""
        
        # Alertes performance API
        self.add_alert_rule(
            "api_latency_high",
            metric_pattern="api.request.duration",
            threshold=2000,  # 2 secondes
            severity=AlertSeverity.WARNING,
            condition="p95",
            message="Latence API élevée (p95 > 2s)"
        )
        
        self.add_alert_rule(
            "api_latency_critical", 
            metric_pattern="api.request.duration",
            threshold=5000,  # 5 secondes
            severity=AlertSeverity.CRITICAL,
            condition="p95",
            message="Latence API critique (p95 > 5s)"
        )
        
        # Alertes taux d'erreur
        self.add_alert_rule(
            "error_rate_high",
            metric_pattern="api.errors",
            threshold=5.0,  # 5% d'erreurs
            severity=AlertSeverity.WARNING,
            condition="rate_1m",
            message="Taux d'erreur élevé (>5%)"
        )
        
        # Alertes énergie
        self.add_alert_rule(
            "energy_processing_slow",
            metric_pattern="energy.operation.duration",
            threshold=1000,  # 1 seconde
            severity=AlertSeverity.WARNING,
            condition="p95",
            message="Opérations énergétiques lentes"
        )
        
        # Alertes Redis
        self.add_alert_rule(
            "redis_latency_high",
            metric_pattern="redis.operation.duration",
            threshold=100,  # 100ms
            severity=AlertSeverity.WARNING,
            condition="p95",
            message="Latence Redis élevée"
        )
        
        # Alertes rate limiting
        self.add_alert_rule(
            "rate_limit_threshold",
            metric_pattern="rate_limiting.blocked",
            threshold=10,  # 10 blocages/minute
            severity=AlertSeverity.WARNING,
            condition="rate_1m", 
            message="Trop de requêtes rate-limitées"
        )
    
    async def start(self):
        """Démarre la collecte de métriques"""
        if self._running:
            return
        
        self._running = True
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("Collecteur de métriques démarré", flush_interval=self.flush_interval)
    
    async def stop(self):
        """Arrête la collecte de métriques"""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        
        # Flush final
        await self._flush_to_redis()
        logger.info("Collecteur de métriques arrêté")
    
    def increment_counter(self, name: str, value: float = 1, labels: Optional[Dict[str, str]] = None):
        """Incrémente un compteur"""
        key = self._build_metric_key(name, labels)
        self.counters[key] += value
        
        # Vérifier les alertes (si loop disponible)
        try:
            asyncio.create_task(self._check_alert_conditions(name, value, labels))
        except RuntimeError:
            # Pas de loop async actif - ignorer la vérification d'alerte
            pass
    
    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Définit une valeur de jauge"""
        key = self._build_metric_key(name, labels)
        self.gauges[key] = value
        
        # Vérifier les alertes (si loop disponible)
        try:
            asyncio.create_task(self._check_alert_conditions(name, value, labels))
        except RuntimeError:
            # Pas de loop async actif - ignorer la vérification d'alerte
            pass
    
    def record_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Enregistre une valeur dans un histogramme"""
        key = self._build_metric_key(name, labels)
        self.histograms[key].append(value)
        
        # Vérifier les alertes sur les percentiles
        asyncio.create_task(self._check_alert_conditions(name, value, labels))
    
    def time_operation(self, name: str, labels: Optional[Dict[str, str]] = None):
        """Context manager pour mesurer la durée d'une opération"""
        return TimerContext(self, name, labels)
    
    def record_timer(self, name: str, duration_ms: float, labels: Optional[Dict[str, str]] = None):
        """Enregistre une durée en millisecondes"""
        key = self._build_metric_key(name, labels)
        self.timers[key].append(duration_ms)
        
        # Vérifier les alertes
        asyncio.create_task(self._check_alert_conditions(name, duration_ms, labels))
    
    def _build_metric_key(self, name: str, labels: Optional[Dict[str, str]]) -> str:
        """Construit une clé unique pour la métrique avec labels"""
        if not labels:
            return name
        
        # Trier les labels pour cohérence
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{labels}}"
    
    def get_percentiles(self, name: str, labels: Optional[Dict[str, str]] = None) -> Optional[PercentileStats]:
        """Calcule les percentiles pour une métrique"""
        key = self._build_metric_key(name, labels)
        
        # Vérifier le cache
        if key in self._percentile_cache:
            if self._cache_expires.get(key, datetime.min) > datetime.now(timezone.utc):
                return self._percentile_cache[key]
        
        # Calculer depuis les données
        values = None
        if key in self.histograms:
            values = list(self.histograms[key])
        elif key in self.timers:
            values = list(self.timers[key])
        
        if not values:
            return None
        
        # Calculer statistiques
        stats = PercentileStats(
            p50=statistics.quantiles(values, n=2)[0],
            p95=statistics.quantiles(values, n=20)[18],
            p99=statistics.quantiles(values, n=100)[98],
            avg=statistics.mean(values),
            min=min(values),
            max=max(values),
            count=len(values)
        )
        
        # Mettre en cache (valide 30s)
        self._percentile_cache[key] = stats
        self._cache_expires[key] = datetime.now(timezone.utc) + timedelta(seconds=30)
        
        return stats
    
    def add_alert_rule(
        self,
        rule_name: str,
        metric_pattern: str,
        threshold: float,
        severity: AlertSeverity,
        condition: str = "value",  # value, p95, p99, rate_1m
        message: str = ""
    ):
        """Ajoute une règle d'alerte"""
        
        self.alert_rules[rule_name] = {
            "metric_pattern": metric_pattern,
            "threshold": threshold,
            "severity": severity,
            "condition": condition,
            "message": message or f"{metric_pattern} {condition} > {threshold}"
        }
        
        logger.info("Règle d'alerte ajoutée", rule=rule_name, pattern=metric_pattern, threshold=threshold)
    
    async def _check_alert_conditions(self, metric_name: str, value: float, labels: Optional[Dict[str, str]]):
        """Vérifie les conditions d'alerte pour une métrique"""
        
        for rule_name, rule in self.alert_rules.items():
            if not self._metric_matches_pattern(metric_name, rule["metric_pattern"]):
                continue
            
            alert_value = await self._calculate_alert_value(metric_name, rule["condition"], value, labels)
            
            if alert_value > rule["threshold"]:
                await self._trigger_alert(rule_name, rule, alert_value, labels)
            else:
                # Résoudre l'alerte si elle était active
                if rule_name in self.active_alerts:
                    await self._resolve_alert(rule_name)
    
    def _metric_matches_pattern(self, metric_name: str, pattern: str) -> bool:
        """Vérifie si une métrique correspond au pattern"""
        # Pattern simple avec wildcards
        if "*" in pattern:
            parts = pattern.split("*")
            if len(parts) == 2:
                prefix, suffix = parts
                return metric_name.startswith(prefix) and metric_name.endswith(suffix)
        
        return metric_name == pattern
    
    async def _calculate_alert_value(
        self, 
        metric_name: str, 
        condition: str, 
        current_value: float, 
        labels: Optional[Dict[str, str]]
    ) -> float:
        """Calcule la valeur pour évaluation d'alerte"""
        
        if condition == "value":
            return current_value
        elif condition == "p95":
            stats = self.get_percentiles(metric_name, labels)
            return stats.p95 if stats else current_value
        elif condition == "p99":
            stats = self.get_percentiles(metric_name, labels)
            return stats.p99 if stats else current_value
        elif condition == "rate_1m":
            # Calculer le taux sur 1 minute (approximatif)
            key = self._build_metric_key(metric_name, labels)
            if key in self.counters:
                return self.counters[key] / 60.0  # Par seconde approximatif
            return current_value
        
        return current_value
    
    async def _trigger_alert(
        self, 
        rule_name: str, 
        rule: Dict, 
        alert_value: float, 
        labels: Optional[Dict[str, str]]
    ):
        """Déclenche une alerte"""
        
        now = datetime.now(timezone.utc)
        
        # Éviter spam d'alertes (même alerte dans les 5 dernières minutes)
        if rule_name in self.active_alerts:
            last_alert = self.active_alerts[rule_name]
            if now - last_alert.timestamp < timedelta(minutes=5):
                return
        
        alert = Alert(
            name=rule_name,
            severity=rule["severity"],
            message=rule["message"],
            value=alert_value,
            threshold=rule["threshold"],
            timestamp=now,
            labels=labels or {}
        )
        
        self.active_alerts[rule_name] = alert
        
        # Enregistrer l'alerte
        await create_event({
            "type": "metric_alert_triggered",
            "ts": now.isoformat(),
            "actor_user_id": None,
            "payload": {
                "alert_name": rule_name,
                "severity": rule["severity"].value,
                "metric_pattern": rule["metric_pattern"],
                "value": alert_value,
                "threshold": rule["threshold"],
                "message": rule["message"],
                "labels": labels or {}
            }
        })
        
        logger.warning(
            "Alerte métrique déclenchée",
            alert=rule_name,
            severity=rule["severity"].value,
            value=alert_value,
            threshold=rule["threshold"],
            message=rule["message"]
        )
    
    async def _resolve_alert(self, rule_name: str):
        """Résout une alerte active"""
        
        if rule_name not in self.active_alerts:
            return
        
        alert = self.active_alerts.pop(rule_name)
        
        await create_event({
            "type": "metric_alert_resolved",
            "ts": datetime.now(timezone.utc).isoformat(),
            "actor_user_id": None,
            "payload": {
                "alert_name": rule_name,
                "duration_seconds": int((datetime.now(timezone.utc) - alert.timestamp).total_seconds()),
                "resolved_value": 0  # Valeur actuelle non critique
            }
        })
        
        logger.info("Alerte métrique résolue", alert=rule_name)
    
    async def _periodic_flush(self):
        """Flush périodique vers Redis"""
        
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_to_redis()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Erreur flush métriques périodique", error=str(e))
    
    async def _flush_to_redis(self):
        """Flush les métriques vers Redis pour persistance"""
        
        try:
            if not redis_cache.redis_available:
                return
            
            now = datetime.now(timezone.utc)
            flush_data = {
                "timestamp": now.isoformat(),
                "counters": dict(self.counters),
                "gauges": dict(self.gauges),
                "histogram_stats": {},
                "timer_stats": {}
            }
            
            # Calculer stats pour histogrammes
            for key, values in self.histograms.items():
                if values:
                    stats = self.get_percentiles(key.split("{")[0])
                    if stats:
                        flush_data["histogram_stats"][key] = asdict(stats)
            
            # Calculer stats pour timers
            for key, values in self.timers.items():
                if values:
                    stats = self.get_percentiles(key.split("{")[0])
                    if stats:
                        flush_data["timer_stats"][key] = asdict(stats)
            
            # Stocker dans Redis avec TTL
            redis_key = f"phoenix:metrics:{int(now.timestamp() // 60)}"  # Par minute
            await redis_cache.redis_client.setex(
                redis_key,
                3600,  # TTL 1 heure
                json.dumps(flush_data)
            )
            
            # Reset counters (garder histograms pour window glissante)
            self.counters.clear()
            
            logger.debug("Métriques flushed vers Redis", key=redis_key)
            
        except Exception as e:
            logger.error("Erreur flush Redis métriques", error=str(e))
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Retourne un snapshot des métriques actuelles"""
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "active_alerts": {name: asdict(alert) for name, alert in self.active_alerts.items()},
            "histogram_count": sum(len(values) for values in self.histograms.values()),
            "timer_count": sum(len(values) for values in self.timers.values())
        }
    
    async def get_historical_metrics(self, minutes_back: int = 60) -> List[Dict[str, Any]]:
        """Récupère les métriques historiques depuis Redis"""
        
        if not redis_cache.redis_available:
            return []
        
        try:
            now = datetime.now(timezone.utc)
            historical_data = []
            
            for i in range(minutes_back):
                timestamp = int((now - timedelta(minutes=i)).timestamp() // 60)
                redis_key = f"phoenix:metrics:{timestamp}"
                
                data = await redis_cache.redis_client.get(redis_key)
                if data:
                    historical_data.append(json.loads(data))
            
            return historical_data
            
        except Exception as e:
            logger.error("Erreur récupération métriques historiques", error=str(e))
            return []


class TimerContext:
    """Context manager pour mesurer la durée d'opérations"""
    
    def __init__(self, collector: MetricsCollector, name: str, labels: Optional[Dict[str, str]] = None):
        self.collector = collector
        self.name = name
        self.labels = labels
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration_ms = (time.time() - self.start_time) * 1000
            self.collector.record_timer(self.name, duration_ms, self.labels)


# Instance globale
metrics_collector = MetricsCollector()


# Décorateurs utiles pour instrumentation automatique

def monitor_performance(metric_name: str = None, labels: Dict[str, str] = None):
    """Décorateur pour monitorer automatiquement les performances d'une fonction"""
    
    def decorator(func):
        nonlocal metric_name
        if not metric_name:
            metric_name = f"{func.__module__}.{func.__name__}.duration"
        
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                with metrics_collector.time_operation(metric_name, labels):
                    try:
                        result = await func(*args, **kwargs)
                        metrics_collector.increment_counter(f"{metric_name}.success", labels=labels)
                        return result
                    except Exception as e:
                        metrics_collector.increment_counter(f"{metric_name}.error", labels=labels)
                        raise
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                with metrics_collector.time_operation(metric_name, labels):
                    try:
                        result = func(*args, **kwargs)
                        metrics_collector.increment_counter(f"{metric_name}.success", labels=labels)
                        return result
                    except Exception as e:
                        metrics_collector.increment_counter(f"{metric_name}.error", labels=labels)
                        raise
            return sync_wrapper
    
    return decorator


def count_calls(metric_name: str = None, labels: Dict[str, str] = None):
    """Décorateur pour compter les appels de fonction"""
    
    def decorator(func):
        nonlocal metric_name
        if not metric_name:
            metric_name = f"{func.__module__}.{func.__name__}.calls"
        
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                metrics_collector.increment_counter(metric_name, labels=labels)
                return await func(*args, **kwargs)
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                metrics_collector.increment_counter(metric_name, labels=labels)
                return func(*args, **kwargs)
            return sync_wrapper
    
    return decorator