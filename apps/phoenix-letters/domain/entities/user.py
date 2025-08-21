"""
Entité métier - User Domain  
Clean Architecture - Gestion des utilisateurs et abonnements
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from enum import Enum
import uuid


class UserTier(Enum):
    """Niveaux d'abonnement utilisateur"""
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"  # Pour l'évolution future


class UserStatus(Enum):
    """Statuts utilisateur"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"


@dataclass
class UsageStats:
    """Value Object - Statistiques d'usage mensuel"""
    letters_generated_this_month: int = 0
    letters_downloaded_this_month: int = 0
    ai_requests_this_month: int = 0
    career_analysis_this_month: int = 0  # 🎯 GAME CHANGER
    last_activity: Optional[datetime] = None
    
    def reset_monthly_stats(self) -> None:
        """Réinitialise les stats mensuelles"""
        self.letters_generated_this_month = 0
        self.letters_downloaded_this_month = 0
        self.ai_requests_this_month = 0
        self.career_analysis_this_month = 0
    
    def increment_letters_generated(self) -> None:
        """Incrémente le compteur de lettres générées"""
        self.letters_generated_this_month += 1
        self.last_activity = datetime.now()
    
    def increment_downloads(self) -> None:
        """Incrémente le compteur de téléchargements"""
        self.letters_downloaded_this_month += 1
        self.last_activity = datetime.now()
    
    def increment_ai_requests(self) -> None:
        """Incrémente le compteur de requêtes IA"""
        self.ai_requests_this_month += 1
        self.last_activity = datetime.now()
    
    def increment_career_analysis(self) -> None:
        """Incrémente le compteur d'analyses de carrière"""
        self.career_analysis_this_month += 1
        self.last_activity = datetime.now()


@dataclass
class SubscriptionInfo:
    """Value Object - Informations d'abonnement"""
    tier: UserTier = UserTier.FREE
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    auto_renew: bool = True
    
    @property
    def is_active(self) -> bool:
        """Vérifie si l'abonnement est actif"""
        if self.tier == UserTier.FREE:
            return True
        return bool(
            self.expires_at and 
            self.expires_at > datetime.now()
        )
    
    @property
    def days_remaining(self) -> Optional[int]:
        """Jours restants sur l'abonnement"""
        if self.tier == UserTier.FREE or not self.expires_at:
            return None
        return max(0, (self.expires_at - datetime.now()).days)
    
    @property
    def is_trial(self) -> bool:
        """Vérifie si c'est un essai gratuit"""
        return bool(
            self.tier == UserTier.PREMIUM and
            not self.stripe_subscription_id and
            self.expires_at
        )


@dataclass  
class UserPreferences:
    """Value Object - Préférences utilisateur"""
    default_tone: str = "professionnel"
    default_experience_level: str = "intermédiaire"
    language: str = "fr"
    email_notifications: bool = True
    
    # Préférences UI
    theme: str = "light"
    show_tips: bool = True
    auto_save: bool = True
    
    def update_preference(self, key: str, value: Any) -> None:
        """Met à jour une préférence de manière sécurisée"""
        if hasattr(self, key):
            setattr(self, key, value)
        else:
            raise ValueError(f"Préférence inconnue: {key}")


@dataclass
class User:
    """
    Entité métier principale - Utilisateur Phoenix Letters
    Aggregate Root du domaine User
    """
    
    # Identifiants
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    
    # Profile info
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    # État compte
    status: UserStatus = UserStatus.ACTIVE
    email_verified: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    
    # Business logic
    subscription: SubscriptionInfo = field(default_factory=SubscriptionInfo)
    usage_stats: UsageStats = field(default_factory=UsageStats)
    preferences: UserPreferences = field(default_factory=UserPreferences)
    
    # Sécurité
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if self.email and "@" not in self.email:
            raise ValueError("Email invalide")
    
    @property
    def full_name(self) -> str:
        """Nom complet de l'utilisateur"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        return self.email.split("@")[0] if self.email else "Utilisateur"
    
    @property
    def is_premium(self) -> bool:
        """Vérifie si l'utilisateur est Premium actif"""
        return (
            self.subscription.tier in [UserTier.PREMIUM, UserTier.ENTERPRISE] and
            self.subscription.is_active
        )
    
    @property
    def letters_remaining_this_month(self) -> Optional[int]:
        """Lettres restantes ce mois (None = illimité)"""
        if self.is_premium:
            return None  # Illimité
        
        from shared.config.settings import config
        max_letters = config.app.free_letters_per_month
        used = self.usage_stats.letters_generated_this_month
        return max(0, max_letters - used)
    
    @property
    def can_generate_letter(self) -> bool:
        """Vérifie si l'utilisateur peut générer une lettre"""
        if self.status != UserStatus.ACTIVE:
            return False
        
        if self.is_premium:
            return True
            
        remaining = self.letters_remaining_this_month
        return remaining is None or remaining > 0
    
    @property
    def current_month_analysis_count(self) -> int:
        """Nombre d'analyses de carrière ce mois"""
        return self.usage_stats.career_analysis_this_month
    
    def can_analyze_career_transition(self) -> bool:
        """Vérifie si l'utilisateur peut faire une analyse de transition"""
        if self.status != UserStatus.ACTIVE:
            return False
        
        # Quotas par tier
        if self.is_premium:
            return self.current_month_analysis_count < 20  # 20/mois pour Premium
        else:
            return self.current_month_analysis_count < 2   # 2/mois pour Free
    
    def get_analysis_quota(self) -> int:
        """Retourne le quota d'analyses mensuelles"""
        return 20 if self.is_premium else 2
    
    def record_career_analysis(self) -> None:
        """Enregistre une nouvelle analyse de carrière"""
        self.usage_stats.increment_career_analysis()
        self.updated_at = datetime.now()
    
    @property
    def is_account_locked(self) -> bool:
        """Vérifie si le compte est verrouillé"""
        return bool(
            self.locked_until and 
            self.locked_until > datetime.now()
        )
    
    def update_profile(self, first_name: Optional[str] = None, last_name: Optional[str] = None) -> None:
        """Met à jour le profil utilisateur"""
        if first_name is not None:
            self.first_name = first_name.strip() if first_name else None
        if last_name is not None:
            self.last_name = last_name.strip() if last_name else None
        self.updated_at = datetime.now()
    
    def record_login(self) -> None:
        """Enregistre une connexion réussie"""
        self.last_login = datetime.now()
        self.failed_login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.now()
    
    def record_failed_login(self) -> None:
        """Enregistre une tentative de connexion échouée"""
        self.failed_login_attempts += 1
        
        # Verrouillage après 5 tentatives (configurable)
        if self.failed_login_attempts >= 5:
            from datetime import timedelta
            self.locked_until = datetime.now() + timedelta(hours=1)
        
        self.updated_at = datetime.now()
    
    def upgrade_to_premium(self, stripe_customer_id: str, stripe_subscription_id: str, expires_at: datetime) -> None:
        """Upgrade vers Premium"""
        self.subscription.tier = UserTier.PREMIUM
        self.subscription.stripe_customer_id = stripe_customer_id
        self.subscription.stripe_subscription_id = stripe_subscription_id
        self.subscription.started_at = datetime.now()
        self.subscription.expires_at = expires_at
        self.subscription.auto_renew = True
        self.updated_at = datetime.now()
    
    def downgrade_to_free(self) -> None:
        """Downgrade vers Free (fin d'abonnement)"""
        self.subscription.tier = UserTier.FREE
        self.subscription.expires_at = None
        self.subscription.stripe_subscription_id = None
        # On garde le customer_id pour faciliter les re-upgrades
        self.updated_at = datetime.now()
    
    def record_letter_generation(self) -> None:
        """Enregistre la génération d'une lettre"""
        if not self.can_generate_letter:
            raise ValueError("Quota de lettres dépassé")
        
        self.usage_stats.increment_letters_generated()
        self.updated_at = datetime.now()
    
    def record_letter_download(self) -> None:
        """Enregistre un téléchargement"""
        self.usage_stats.increment_downloads()
        self.updated_at = datetime.now()
    
    def reset_monthly_usage(self) -> None:
        """Réinitialise les statistiques mensuelles"""
        self.usage_stats.reset_monthly_stats()
        self.updated_at = datetime.now()
    
    def get_account_summary(self) -> Dict[str, Any]:
        """Résumé du compte utilisateur"""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "tier": self.subscription.tier.value,
            "is_premium": self.is_premium,
            "subscription_active": self.subscription.is_active,
            "days_remaining": self.subscription.days_remaining,
            "letters_remaining": self.letters_remaining_this_month,
            "can_generate": self.can_generate_letter,
            "account_locked": self.is_account_locked,
            "usage_this_month": {
                "letters_generated": self.usage_stats.letters_generated_this_month,
                "letters_downloaded": self.usage_stats.letters_downloaded_this_month,
            },
            "last_activity": self.usage_stats.last_activity.isoformat() if self.usage_stats.last_activity else None,
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour persistance"""
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "status": self.status.value,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "subscription": {
                "tier": self.subscription.tier.value,
                "started_at": self.subscription.started_at.isoformat() if self.subscription.started_at else None,
                "expires_at": self.subscription.expires_at.isoformat() if self.subscription.expires_at else None,
                "stripe_customer_id": self.subscription.stripe_customer_id,
                "stripe_subscription_id": self.subscription.stripe_subscription_id,
                "auto_renew": self.subscription.auto_renew,
            },
            "usage_stats": {
                "letters_generated_this_month": self.usage_stats.letters_generated_this_month,
                "letters_downloaded_this_month": self.usage_stats.letters_downloaded_this_month,
                "ai_requests_this_month": self.usage_stats.ai_requests_this_month,
                "last_activity": self.usage_stats.last_activity.isoformat() if self.usage_stats.last_activity else None,
            },
            "preferences": {
                "default_tone": self.preferences.default_tone,
                "default_experience_level": self.preferences.default_experience_level,
                "language": self.preferences.language,
                "email_notifications": self.preferences.email_notifications,
                "theme": self.preferences.theme,
                "show_tips": self.preferences.show_tips,
                "auto_save": self.preferences.auto_save,
            },
            "security": {
                "failed_login_attempts": self.failed_login_attempts,
                "locked_until": self.locked_until.isoformat() if self.locked_until else None,
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        """Désérialisation depuis persistance"""
        user = cls(
            id=data.get("id", str(uuid.uuid4())),
            email=data.get("email", ""),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            status=UserStatus(data.get("status", "active")),
            email_verified=data.get("email_verified", False),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat())),
            last_login=datetime.fromisoformat(data["last_login"]) if data.get("last_login") else None,
            failed_login_attempts=data.get("security", {}).get("failed_login_attempts", 0),
            locked_until=datetime.fromisoformat(data.get("security", {}).get("locked_until")) if data.get("security", {}).get("locked_until") else None,
        )
        
        # Subscription
        if sub_data := data.get("subscription"):
            user.subscription = SubscriptionInfo(
                tier=UserTier(sub_data.get("tier", "free")),
                started_at=datetime.fromisoformat(sub_data["started_at"]) if sub_data.get("started_at") else None,
                expires_at=datetime.fromisoformat(sub_data["expires_at"]) if sub_data.get("expires_at") else None,
                stripe_customer_id=sub_data.get("stripe_customer_id"),
                stripe_subscription_id=sub_data.get("stripe_subscription_id"),
                auto_renew=sub_data.get("auto_renew", True),
            )
        
        # Usage stats
        if usage_data := data.get("usage_stats"):
            user.usage_stats = UsageStats(
                letters_generated_this_month=usage_data.get("letters_generated_this_month", 0),
                letters_downloaded_this_month=usage_data.get("letters_downloaded_this_month", 0),
                ai_requests_this_month=usage_data.get("ai_requests_this_month", 0),
                last_activity=datetime.fromisoformat(usage_data["last_activity"]) if usage_data.get("last_activity") else None,
            )
        
        # Preferences
        if pref_data := data.get("preferences"):
            user.preferences = UserPreferences(
                default_tone=pref_data.get("default_tone", "professionnel"),
                default_experience_level=pref_data.get("default_experience_level", "intermédiaire"),
                language=pref_data.get("language", "fr"),
                email_notifications=pref_data.get("email_notifications", True),
                theme=pref_data.get("theme", "light"),
                show_tips=pref_data.get("show_tips", True),
                auto_save=pref_data.get("auto_save", True),
            )
        
        return user