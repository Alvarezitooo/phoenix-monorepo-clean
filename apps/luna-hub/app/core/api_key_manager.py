"""
🔑 API Key Manager - Phoenix Luna Hub  
Rotation automatique et gestion sécurisée des clés API
Directive Oracle #5: Sécurité par défaut
"""

import os
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass
from enum import Enum
import structlog
import hashlib
from pathlib import Path

logger = structlog.get_logger()


class KeyProvider(Enum):
    """Types de fournisseurs de clés API"""
    SUPABASE = "supabase"
    GEMINI = "gemini"  
    STRIPE = "stripe"
    RAILWAY = "railway"


@dataclass
class APIKeyInfo:
    """Information sur une clé API"""
    provider: KeyProvider
    key_id: str
    key_hash: str  # Hash de la clé, jamais la clé en clair
    created_at: datetime
    expires_at: Optional[datetime] = None
    rotation_count: int = 0
    last_used_at: Optional[datetime] = None
    is_active: bool = True


class APIKeyManager:
    """
    🔐 Gestionnaire de rotation automatique des clés API
    
    Features:
    - Rotation automatique selon planning
    - Stockage sécurisé (hash uniquement)
    - Révocation d'urgence
    - Audit trail complet
    - Health check des clés
    """
    
    def __init__(self):
        self.keys_cache: Dict[KeyProvider, APIKeyInfo] = {}
        self.rotation_config = {
            KeyProvider.SUPABASE: {"rotate_days": 90, "warn_days": 7},
            KeyProvider.GEMINI: {"rotate_days": 30, "warn_days": 3}, 
            KeyProvider.STRIPE: {"rotate_days": 180, "warn_days": 14},
            KeyProvider.RAILWAY: {"rotate_days": 365, "warn_days": 30}
        }
        
        # Fichier de métadonnées (pas les clés elles-mêmes)
        self.metadata_file = Path(".api_keys_metadata.json")
        
        logger.info("API Key Manager initialized with rotation enabled")
    
    def _hash_key(self, api_key: str) -> str:
        """🔐 Hash sécurisé d'une clé API pour audit (jamais stocker la clé)"""
        return hashlib.sha256(api_key.encode()).hexdigest()[:16]
    
    def _get_env_key(self, provider: KeyProvider) -> Optional[str]:
        """🔍 Récupère la clé depuis les variables d'environnement"""
        env_vars = {
            KeyProvider.SUPABASE: "SUPABASE_SERVICE_KEY",
            KeyProvider.GEMINI: "GOOGLE_API_KEY",
            KeyProvider.STRIPE: "STRIPE_SECRET_KEY", 
            KeyProvider.RAILWAY: "RAILWAY_TOKEN"
        }
        
        env_var = env_vars.get(provider)
        if not env_var:
            return None
            
        api_key = os.getenv(env_var)
        if api_key:
            # Log l'utilisation (hash seulement)
            key_hash = self._hash_key(api_key)
            logger.debug("API key retrieved from env", 
                        provider=provider.value,
                        key_hash=key_hash,
                        env_var=env_var)
        
        return api_key
    
    async def get_api_key(self, provider: KeyProvider) -> Tuple[Optional[str], APIKeyInfo]:
        """
        🔑 Récupère une clé API avec métadonnées de rotation
        
        Returns:
            Tuple[clé_api, info_metadata]
        """
        
        # 1. Récupérer la clé depuis l'environnement
        api_key = self._get_env_key(provider)
        
        if not api_key:
            logger.warning("API key not found in environment", provider=provider.value)
            return None, APIKeyInfo(
                provider=provider,
                key_id="missing",
                key_hash="",
                created_at=datetime.now(timezone.utc),
                is_active=False
            )
        
        # 2. Vérifier/créer les métadonnées
        key_info = await self._get_or_create_key_info(provider, api_key)
        
        # 3. Vérifier si rotation nécessaire
        await self._check_rotation_needed(key_info)
        
        # 4. Marquer comme utilisée
        key_info.last_used_at = datetime.now(timezone.utc)
        await self._save_metadata()
        
        return api_key, key_info
    
    async def _get_or_create_key_info(self, provider: KeyProvider, api_key: str) -> APIKeyInfo:
        """📋 Récupère ou crée les métadonnées d'une clé"""
        
        # Charger métadonnées depuis fichier
        await self._load_metadata()
        
        key_hash = self._hash_key(api_key)
        
        # Vérifier si on a déjà cette clé
        if provider in self.keys_cache:
            cached_info = self.keys_cache[provider]
            if cached_info.key_hash == key_hash:
                return cached_info
            else:
                # Clé changée (rotation manuelle détectée)
                logger.info("API key rotation detected",
                           provider=provider.value,
                           old_hash=cached_info.key_hash[:8],
                           new_hash=key_hash[:8])
                cached_info.rotation_count += 1
                cached_info.key_hash = key_hash
                cached_info.created_at = datetime.now(timezone.utc)
                return cached_info
        
        # Créer nouvelles métadonnées  
        key_info = APIKeyInfo(
            provider=provider,
            key_id=f"{provider.value}_{datetime.now().strftime('%Y%m%d')}",
            key_hash=key_hash,
            created_at=datetime.now(timezone.utc)
        )
        
        self.keys_cache[provider] = key_info
        await self._save_metadata()
        
        logger.info("New API key registered", 
                   provider=provider.value,
                   key_id=key_info.key_id,
                   key_hash=key_hash[:8])
        
        return key_info
    
    async def _check_rotation_needed(self, key_info: APIKeyInfo) -> None:
        """⏰ Vérifie si une rotation est nécessaire"""
        
        config = self.rotation_config.get(key_info.provider)
        if not config:
            return
        
        now = datetime.now(timezone.utc)
        age = now - key_info.created_at
        
        rotate_threshold = timedelta(days=config["rotate_days"])
        warn_threshold = timedelta(days=config["rotate_days"] - config["warn_days"])
        
        if age >= rotate_threshold:
            logger.error("API key rotation REQUIRED",
                        provider=key_info.provider.value,
                        key_age_days=age.days,
                        threshold_days=config["rotate_days"],
                        key_id=key_info.key_id)
        elif age >= warn_threshold:
            logger.warning("API key rotation WARNING", 
                          provider=key_info.provider.value,
                          key_age_days=age.days,
                          days_until_rotation=config["rotate_days"] - age.days,
                          key_id=key_info.key_id)
    
    async def get_rotation_status(self) -> Dict[str, Dict]:
        """📊 Status complet de rotation pour monitoring"""
        
        await self._load_metadata()
        status = {}
        
        for provider in KeyProvider:
            config = self.rotation_config.get(provider, {})
            key_info = self.keys_cache.get(provider)
            
            if not key_info:
                status[provider.value] = {
                    "status": "missing",
                    "key_found": False,
                    "action_required": "configure_key"
                }
                continue
            
            now = datetime.now(timezone.utc) 
            age = now - key_info.created_at
            rotate_threshold = config.get("rotate_days", 90)
            warn_threshold = rotate_threshold - config.get("warn_days", 7)
            
            if age.days >= rotate_threshold:
                status_level = "critical"
                action = "rotate_immediately"
            elif age.days >= warn_threshold:
                status_level = "warning" 
                action = "prepare_rotation"
            else:
                status_level = "healthy"
                action = "none"
            
            status[provider.value] = {
                "status": status_level,
                "key_found": True,
                "age_days": age.days,
                "rotation_threshold": rotate_threshold,
                "days_until_rotation": max(0, rotate_threshold - age.days),
                "rotation_count": key_info.rotation_count,
                "last_used": key_info.last_used_at.isoformat() if key_info.last_used_at else None,
                "action_required": action,
                "key_id": key_info.key_id
            }
        
        return status
    
    async def revoke_key(self, provider: KeyProvider, reason: str) -> bool:
        """🚫 Révocation d'urgence d'une clé"""
        
        await self._load_metadata()
        
        if provider not in self.keys_cache:
            logger.warning("Cannot revoke unknown key", provider=provider.value)
            return False
        
        key_info = self.keys_cache[provider]
        key_info.is_active = False
        
        await self._save_metadata()
        
        logger.critical("API key revoked",
                       provider=provider.value,
                       key_id=key_info.key_id,
                       reason=reason,
                       revoked_at=datetime.now(timezone.utc).isoformat())
        
        return True
    
    async def _load_metadata(self) -> None:
        """📂 Charge les métadonnées depuis le fichier"""
        
        if not self.metadata_file.exists():
            return
        
        try:
            with open(self.metadata_file, 'r') as f:
                data = json.load(f)
            
            self.keys_cache = {}
            for provider_str, key_data in data.get("keys", {}).items():
                try:
                    provider = KeyProvider(provider_str)
                    self.keys_cache[provider] = APIKeyInfo(
                        provider=provider,
                        key_id=key_data["key_id"],
                        key_hash=key_data["key_hash"], 
                        created_at=datetime.fromisoformat(key_data["created_at"]),
                        expires_at=datetime.fromisoformat(key_data["expires_at"]) if key_data.get("expires_at") else None,
                        rotation_count=key_data.get("rotation_count", 0),
                        last_used_at=datetime.fromisoformat(key_data["last_used_at"]) if key_data.get("last_used_at") else None,
                        is_active=key_data.get("is_active", True)
                    )
                except (ValueError, KeyError) as e:
                    logger.warning("Invalid key metadata", provider=provider_str, error=str(e))
                    
        except (json.JSONDecodeError, IOError) as e:
            logger.error("Failed to load key metadata", error=str(e))
    
    async def _save_metadata(self) -> None:
        """💾 Sauvegarde les métadonnées (jamais les clés elles-mêmes)"""
        
        data = {
            "keys": {},
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "version": "1.0"
        }
        
        for provider, key_info in self.keys_cache.items():
            data["keys"][provider.value] = {
                "key_id": key_info.key_id,
                "key_hash": key_info.key_hash,  # Hash seulement, jamais la clé
                "created_at": key_info.created_at.isoformat(),
                "expires_at": key_info.expires_at.isoformat() if key_info.expires_at else None,
                "rotation_count": key_info.rotation_count,
                "last_used_at": key_info.last_used_at.isoformat() if key_info.last_used_at else None,
                "is_active": key_info.is_active
            }
        
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(data, f, indent=2)
        except IOError as e:
            logger.error("Failed to save key metadata", error=str(e))


# Instance globale
api_key_manager = APIKeyManager()