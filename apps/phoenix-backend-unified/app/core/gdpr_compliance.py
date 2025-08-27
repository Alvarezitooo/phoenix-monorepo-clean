"""
🔐 GDPR Compliance Manager - Phoenix Luna Hub
Conformité RGPD avec anonymisation automatique et gestion des consentements
Oracle Directive: Privacy by Design & Security
"""

import hashlib
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Set, Union
from enum import Enum
from dataclasses import dataclass, asdict
import structlog

from .supabase_client import sb
from .events import create_event

logger = structlog.get_logger("gdpr_compliance")


class ConsentType(Enum):
    """Types de consentement GDPR"""
    ESSENTIAL = "essential"              # Consentement essentiel (technique)
    ANALYTICS = "analytics"              # Analytics et métriques
    MARKETING = "marketing"              # Marketing et communication
    PERSONALIZATION = "personalization" # Personnalisation d'expérience
    AI_PROCESSING = "ai_processing"      # Traitement IA (Luna, CV, etc.)


class DataCategory(Enum):
    """Catégories de données personnelles"""
    IDENTITY = "identity"          # Nom, email, etc.
    TECHNICAL = "technical"        # IP, user-agent, etc.
    BEHAVIORAL = "behavioral"      # Interactions, navigation
    ENERGY_DATA = "energy_data"    # Données énergétiques de l'utilisateur
    GENERATED_CONTENT = "generated_content"  # CV, lettres générés
    COMMUNICATION = "communication"  # Messages, chat avec Luna


class ProcessingPurpose(Enum):
    """Finalités de traitement des données"""
    SERVICE_PROVISION = "service_provision"      # Fourniture du service
    SECURITY = "security"                        # Sécurité et prévention fraude
    ANALYTICS = "analytics"                      # Analyses et métriques
    IMPROVEMENT = "improvement"                  # Amélioration du service
    COMMUNICATION = "communication"              # Communication avec l'utilisateur
    LEGAL_COMPLIANCE = "legal_compliance"        # Obligations légales


@dataclass
class DataProcessingRecord:
    """Enregistrement de traitement de données personnelles"""
    user_id: str
    data_category: DataCategory
    processing_purpose: ProcessingPurpose
    legal_basis: str  # Base légale du traitement
    data_fields: List[str]
    retention_period_days: int
    consent_required: bool
    automated_decision: bool
    third_party_sharing: bool
    created_at: datetime
    expires_at: Optional[datetime] = None


@dataclass 
class UserConsent:
    """Consentement utilisateur pour le traitement des données"""
    user_id: str
    consent_type: ConsentType
    consent_given: bool
    consent_timestamp: datetime
    consent_ip: Optional[str]
    consent_user_agent: Optional[str]
    withdrawal_timestamp: Optional[datetime] = None
    consent_version: str = "1.0"


class DataAnonymizer:
    """Anonymisation et pseudonymisation des données personnelles"""
    
    # Patterns d'identification de données sensibles
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    PHONE_PATTERN = re.compile(r'\b(?:\+33|0)[1-9](?:[0-9]{8})\b')
    IP_PATTERN = re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
    
    # Salt pour pseudonymisation (doit être configuré via env)
    PSEUDONYMIZATION_SALT = "phoenix-gdpr-salt-2025"
    
    @staticmethod
    def anonymize_email(email: str) -> str:
        """Anonymise une adresse email"""
        if not email or '@' not in email:
            return email
        
        local, domain = email.split('@', 1)
        if len(local) <= 2:
            return f"**@{domain}"
        
        return f"{local[0]}***{local[-1]}@{domain}"
    
    @staticmethod
    def pseudonymize_user_id(user_id: str) -> str:
        """Pseudonymise un user_id de manière cohérente"""
        return hashlib.sha256(f"{DataAnonymizer.PSEUDONYMIZATION_SALT}{user_id}".encode()).hexdigest()[:16]
    
    @staticmethod
    def anonymize_ip(ip: str) -> str:
        """Anonymise une adresse IP"""
        if not ip or ip == "unknown":
            return ip
        
        parts = ip.split('.')
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.xxx.xxx"
        
        # IPv6 - garder les 4 premiers groupes
        if ':' in ip:
            groups = ip.split(':')
            if len(groups) >= 4:
                return ':'.join(groups[:4]) + '::xxxx'
        
        return "xxx.xxx.xxx.xxx"
    
    @staticmethod
    def sanitize_user_agent(user_agent: str) -> str:
        """Sanitise un user-agent en gardant l'info technique essentielle"""
        if not user_agent:
            return user_agent
        
        # Remplacer les versions spécifiques par des génériques
        sanitized = re.sub(r'\d+\.\d+\.\d+', 'x.x.x', user_agent)
        
        # Limiter la longueur
        return sanitized[:200] if len(sanitized) > 200 else sanitized
    
    @staticmethod
    def anonymize_text_content(text: str) -> str:
        """Anonymise le contenu textuel en supprimant les données personnelles"""
        if not text:
            return text
        
        # Remplacer emails
        text = DataAnonymizer.EMAIL_PATTERN.sub('[EMAIL_REDACTED]', text)
        
        # Remplacer numéros de téléphone
        text = DataAnonymizer.PHONE_PATTERN.sub('[PHONE_REDACTED]', text)
        
        # Remplacer IPs
        text = DataAnonymizer.IP_PATTERN.sub('[IP_REDACTED]', text)
        
        return text


class GDPRComplianceManager:
    """
    🔐 Gestionnaire de compliance GDPR pour Phoenix Luna Hub
    
    Features:
    - Gestion des consentements utilisateurs
    - Anonymisation automatique des données
    - Journalisation des traitements
    - Purge automatique des données expirées
    - Export des données utilisateur (droit d'accès)
    - Suppression complète des données (droit à l'oubli)
    """
    
    def __init__(self):
        self.anonymizer = DataAnonymizer()
        self.processing_records: Dict[str, List[DataProcessingRecord]] = {}
    
    async def record_data_processing(
        self,
        user_id: str,
        data_category: DataCategory,
        processing_purpose: ProcessingPurpose,
        data_fields: List[str],
        legal_basis: str = "legitimate_interest",
        retention_days: int = 365,
        consent_required: bool = False,
        automated_decision: bool = False,
        third_party_sharing: bool = False
    ) -> bool:
        """Enregistre un traitement de données personnelles"""
        
        try:
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(days=retention_days) if retention_days > 0 else None
            
            record = DataProcessingRecord(
                user_id=user_id,
                data_category=data_category,
                processing_purpose=processing_purpose,
                legal_basis=legal_basis,
                data_fields=data_fields,
                retention_period_days=retention_days,
                consent_required=consent_required,
                automated_decision=automated_decision,
                third_party_sharing=third_party_sharing,
                created_at=now,
                expires_at=expires_at
            )
            
            # Enregistrer dans Supabase
            processing_data = {
                **asdict(record),
                "created_at": now.isoformat(),
                "expires_at": expires_at.isoformat() if expires_at else None,
                "data_category": data_category.value,
                "processing_purpose": processing_purpose.value
            }
            
            sb.table("gdpr_processing_records").insert(processing_data).execute()
            
            # Enregistrer l'événement pour audit
            await create_event({
                "type": "gdpr_processing_recorded",
                "ts": now.isoformat(),
                "actor_user_id": user_id,
                "payload": {
                    "data_category": data_category.value,
                    "processing_purpose": processing_purpose.value,
                    "legal_basis": legal_basis,
                    "consent_required": consent_required,
                    "retention_days": retention_days
                }
            })
            
            logger.info(
                "Traitement de données enregistré",
                user_id=user_id[:8],
                data_category=data_category.value,
                purpose=processing_purpose.value,
                legal_basis=legal_basis
            )
            
            return True
            
        except Exception as e:
            logger.error("Erreur enregistrement traitement GDPR", user_id=user_id[:8], error=str(e))
            return False
    
    async def get_user_consent(self, user_id: str, consent_type: ConsentType) -> Optional[UserConsent]:
        """Récupère le consentement actuel d'un utilisateur"""
        
        try:
            result = sb.table("user_consents").select("*").eq("user_id", user_id).eq("consent_type", consent_type.value).order("consent_timestamp", desc=True).limit(1).execute()
            
            if result.data:
                consent_data = result.data[0]
                return UserConsent(
                    user_id=consent_data["user_id"],
                    consent_type=ConsentType(consent_data["consent_type"]),
                    consent_given=consent_data["consent_given"],
                    consent_timestamp=datetime.fromisoformat(consent_data["consent_timestamp"]),
                    consent_ip=consent_data.get("consent_ip"),
                    consent_user_agent=consent_data.get("consent_user_agent"),
                    withdrawal_timestamp=datetime.fromisoformat(consent_data["withdrawal_timestamp"]) if consent_data.get("withdrawal_timestamp") else None,
                    consent_version=consent_data.get("consent_version", "1.0")
                )
            
            return None
            
        except Exception as e:
            logger.error("Erreur récupération consentement", user_id=user_id[:8], error=str(e))
            return None
    
    async def record_user_consent(
        self,
        user_id: str,
        consent_type: ConsentType,
        consent_given: bool,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Enregistre ou met à jour le consentement d'un utilisateur"""
        
        try:
            now = datetime.now(timezone.utc)
            
            consent = UserConsent(
                user_id=user_id,
                consent_type=consent_type,
                consent_given=consent_given,
                consent_timestamp=now,
                consent_ip=self.anonymizer.anonymize_ip(client_ip) if client_ip else None,
                consent_user_agent=self.anonymizer.sanitize_user_agent(user_agent) if user_agent else None
            )
            
            # Enregistrer dans Supabase
            consent_data = {
                **asdict(consent),
                "consent_timestamp": now.isoformat(),
                "consent_type": consent_type.value
            }
            
            sb.table("user_consents").insert(consent_data).execute()
            
            # Enregistrer l'événement
            await create_event({
                "type": "gdpr_consent_updated",
                "ts": now.isoformat(),
                "actor_user_id": user_id,
                "payload": {
                    "consent_type": consent_type.value,
                    "consent_given": consent_given,
                    "ip_anonymized": self.anonymizer.anonymize_ip(client_ip) if client_ip else None
                }
            })
            
            logger.info(
                "Consentement utilisateur enregistré",
                user_id=user_id[:8],
                consent_type=consent_type.value,
                given=consent_given
            )
            
            return True
            
        except Exception as e:
            logger.error("Erreur enregistrement consentement", user_id=user_id[:8], error=str(e))
            return False
    
    async def check_consent_required(self, user_id: str, data_category: DataCategory) -> bool:
        """Vérifie si un consentement est requis pour traiter une catégorie de données"""
        
        # Mapping des catégories vers les types de consentement
        consent_mapping = {
            DataCategory.BEHAVIORAL: ConsentType.ANALYTICS,
            DataCategory.GENERATED_CONTENT: ConsentType.AI_PROCESSING,
            DataCategory.COMMUNICATION: ConsentType.AI_PROCESSING
        }
        
        consent_type = consent_mapping.get(data_category)
        if not consent_type:
            return False  # Pas de consentement requis
        
        current_consent = await self.get_user_consent(user_id, consent_type)
        return not (current_consent and current_consent.consent_given and not current_consent.withdrawal_timestamp)
    
    async def anonymize_user_data_in_logs(self, user_id: str) -> int:
        """Anonymise les données d'un utilisateur dans les logs et événements"""
        
        try:
            anonymized_count = 0
            pseudonym = self.anonymizer.pseudonymize_user_id(user_id)
            
            # Anonymiser dans les événements
            events_result = sb.table("events").select("id", "payload").eq("actor_user_id", user_id).execute()
            
            if events_result.data:
                for event in events_result.data:
                    payload = event.get("payload", {})
                    
                    # Anonymiser les champs sensibles dans le payload
                    if "email" in payload:
                        payload["email"] = self.anonymizer.anonymize_email(payload["email"])
                    
                    if "ip" in payload:
                        payload["ip"] = self.anonymizer.anonymize_ip(payload["ip"])
                    
                    if "user_agent" in payload:
                        payload["user_agent"] = self.anonymizer.sanitize_user_agent(payload["user_agent"])
                    
                    # Remplacer user_id par pseudonyme
                    sb.table("events").update({
                        "actor_user_id": pseudonym,
                        "payload": payload
                    }).eq("id", event["id"]).execute()
                    
                    anonymized_count += 1
            
            logger.info(f"Données anonymisées pour {anonymized_count} événements", user_id=user_id[:8])
            return anonymized_count
            
        except Exception as e:
            logger.error("Erreur anonymisation données utilisateur", user_id=user_id[:8], error=str(e))
            return 0
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Exporte toutes les données d'un utilisateur (droit d'accès GDPR)"""
        
        try:
            export_data = {
                "user_id": user_id,
                "export_timestamp": datetime.now(timezone.utc).isoformat(),
                "data_categories": {}
            }
            
            # Données énergétiques
            energy_result = sb.table("user_energy").select("*").eq("user_id", user_id).execute()
            if energy_result.data:
                export_data["data_categories"]["energy"] = energy_result.data
            
            # Transactions énergétiques
            transactions_result = sb.table("energy_transactions").select("*").eq("user_id", user_id).execute()
            if transactions_result.data:
                export_data["data_categories"]["energy_transactions"] = transactions_result.data
            
            # Consentements
            consents_result = sb.table("user_consents").select("*").eq("user_id", user_id).execute()
            if consents_result.data:
                export_data["data_categories"]["consents"] = consents_result.data
            
            # Enregistrements de traitement
            processing_result = sb.table("gdpr_processing_records").select("*").eq("user_id", user_id).execute()
            if processing_result.data:
                export_data["data_categories"]["processing_records"] = processing_result.data
            
            # Événements (anonymisés)
            events_result = sb.table("events").select("*").eq("actor_user_id", user_id).limit(100).execute()
            if events_result.data:
                # Anonymiser les données sensibles avant export
                anonymized_events = []
                for event in events_result.data:
                    anonymized_event = {**event}
                    if "payload" in anonymized_event:
                        payload = anonymized_event["payload"]
                        if "email" in payload:
                            payload["email"] = self.anonymizer.anonymize_email(payload["email"])
                        if "ip" in payload:
                            payload["ip"] = self.anonymizer.anonymize_ip(payload["ip"])
                    anonymized_events.append(anonymized_event)
                
                export_data["data_categories"]["events"] = anonymized_events
            
            # Enregistrer l'export pour audit
            await create_event({
                "type": "gdpr_data_exported",
                "ts": datetime.now(timezone.utc).isoformat(),
                "actor_user_id": user_id,
                "payload": {
                    "categories_count": len(export_data["data_categories"]),
                    "total_records": sum(len(v) if isinstance(v, list) else 1 for v in export_data["data_categories"].values())
                }
            })
            
            return export_data
            
        except Exception as e:
            logger.error("Erreur export données utilisateur", user_id=user_id[:8], error=str(e))
            return {"error": str(e)}
    
    async def delete_user_data(self, user_id: str, keep_anonymized: bool = True) -> Dict[str, Any]:
        """Supprime toutes les données d'un utilisateur (droit à l'oubli GDPR)"""
        
        try:
            deletion_summary = {
                "user_id": user_id,
                "deletion_timestamp": datetime.now(timezone.utc).isoformat(),
                "deleted_tables": [],
                "anonymized_records": 0,
                "errors": []
            }
            
            # Tables à supprimer complètement
            tables_to_delete = [
                "user_energy",
                "energy_transactions", 
                "user_consents",
                "gdpr_processing_records",
                "rate_limits"
            ]
            
            for table in tables_to_delete:
                try:
                    result = sb.table(table).delete().eq("user_id", user_id).execute()
                    deletion_summary["deleted_tables"].append(table)
                except Exception as e:
                    deletion_summary["errors"].append(f"Erreur suppression {table}: {str(e)}")
            
            # Anonymiser les événements au lieu de les supprimer (pour l'audit)
            if keep_anonymized:
                anonymized_count = await self.anonymize_user_data_in_logs(user_id)
                deletion_summary["anonymized_records"] = anonymized_count
            else:
                try:
                    sb.table("events").delete().eq("actor_user_id", user_id).execute()
                    deletion_summary["deleted_tables"].append("events")
                except Exception as e:
                    deletion_summary["errors"].append(f"Erreur suppression events: {str(e)}")
            
            # Enregistrer l'événement de suppression (avec pseudonyme si anonymisation)
            final_user_id = self.anonymizer.pseudonymize_user_id(user_id) if keep_anonymized else None
            await create_event({
                "type": "gdpr_data_deleted",
                "ts": datetime.now(timezone.utc).isoformat(),
                "actor_user_id": final_user_id,
                "payload": {
                    "original_user_anonymized": True,
                    "deletion_summary": deletion_summary,
                    "keep_anonymized": keep_anonymized
                }
            })
            
            logger.warning(
                "Suppression données utilisateur GDPR",
                user_id=user_id[:8],
                deleted_tables=len(deletion_summary["deleted_tables"]),
                errors=len(deletion_summary["errors"])
            )
            
            return deletion_summary
            
        except Exception as e:
            logger.error("Erreur suppression données utilisateur", user_id=user_id[:8], error=str(e))
            return {"error": str(e)}
    
    async def cleanup_expired_data(self) -> Dict[str, Any]:
        """Nettoie automatiquement les données expirées selon les politiques de rétention"""
        
        try:
            now = datetime.now(timezone.utc)
            cleanup_summary = {
                "cleanup_timestamp": now.isoformat(),
                "expired_processing_records": 0,
                "old_events_anonymized": 0,
                "errors": []
            }
            
            # Supprimer les enregistrements de traitement expirés
            try:
                expired_records = sb.table("gdpr_processing_records").delete().lt("expires_at", now.isoformat()).execute()
                cleanup_summary["expired_processing_records"] = len(expired_records.data) if expired_records.data else 0
            except Exception as e:
                cleanup_summary["errors"].append(f"Erreur nettoyage processing records: {str(e)}")
            
            # Anonymiser les anciens événements (>1 an)
            try:
                one_year_ago = now - timedelta(days=365)
                old_events_result = sb.table("events").select("id", "actor_user_id", "payload").lt("ts", one_year_ago.isoformat()).execute()
                
                if old_events_result.data:
                    for event in old_events_result.data:
                        if event.get("actor_user_id"):
                            pseudonym = self.anonymizer.pseudonymize_user_id(event["actor_user_id"])
                            payload = event.get("payload", {})
                            
                            # Anonymiser le payload
                            for key, value in payload.items():
                                if isinstance(value, str):
                                    if "@" in value:
                                        payload[key] = self.anonymizer.anonymize_email(value)
                                    elif "." in value and len(value.split(".")) == 4:
                                        payload[key] = self.anonymizer.anonymize_ip(value)
                            
                            sb.table("events").update({
                                "actor_user_id": pseudonym,
                                "payload": payload
                            }).eq("id", event["id"]).execute()
                            
                            cleanup_summary["old_events_anonymized"] += 1
            except Exception as e:
                cleanup_summary["errors"].append(f"Erreur anonymisation anciens événements: {str(e)}")
            
            # Enregistrer le nettoyage
            await create_event({
                "type": "gdpr_cleanup_executed",
                "ts": now.isoformat(),
                "actor_user_id": None,
                "payload": cleanup_summary
            })
            
            logger.info(
                "Nettoyage automatique GDPR terminé",
                expired_records=cleanup_summary["expired_processing_records"],
                anonymized_events=cleanup_summary["old_events_anonymized"],
                errors=len(cleanup_summary["errors"])
            )
            
            return cleanup_summary
            
        except Exception as e:
            logger.error("Erreur nettoyage automatique GDPR", error=str(e))
            return {"error": str(e)}


# Instance globale
gdpr_manager = GDPRComplianceManager()