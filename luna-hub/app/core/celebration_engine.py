"""
🎉 Celebration Engine - Système de célébrations Luna
Génère des célébrations personnalisées selon les victoires utilisateur
SPRINT 4: Gamification et encouragements intelligents
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import random
import structlog
from app.core.progress_tracker import ProgressMetricType, ProgressTrend

logger = structlog.get_logger("celebration_engine")


class CelebrationLevel(str, Enum):
    """Niveaux de célébration"""
    MEGA = "mega"      # 🎊 Victoire exceptionnelle 
    MAJOR = "major"    # 🎉 Grande victoire
    MINOR = "minor"    # ✨ Petite victoire
    MAINTAIN = "maintain"  # 👍 Maintien du niveau
    ENCOURAGE = "encourage"  # 💪 Encouragement


@dataclass
class Celebration:
    """Structure d'une célébration"""
    level: CelebrationLevel
    title: str
    message: str
    emoji_combo: str
    achievement_description: str
    next_challenge: Optional[str] = None
    energy_bonus: int = 0


class CelebrationEngine:
    """
    🎉 Moteur de célébrations intelligentes Luna
    
    Génère des célébrations contextuelles selon:
    - Type de métrique améliorée
    - Ampleur de l'amélioration  
    - Historique utilisateur
    - Sentiment détecté
    """
    
    def __init__(self):
        """Initialise les templates de célébrations"""
        self._load_celebration_templates()
    
    def _load_celebration_templates(self):
        """Charge les templates de célébrations par métrique"""
        
        self.celebration_templates = {
            ProgressMetricType.ATS_SCORE: {
                CelebrationLevel.MEGA: {
                    "titles": ["🚀 SCORE ATS EXPLOSIF !", "🏆 MAÎTRE DU MATCHING ATS !", "⚡ PERCÉE EXCEPTIONNELLE !"],
                    "messages": [
                        "Incroyable ! Ton score ATS a bondi de +{improvement:.0f} points ! Tu domines maintenant les algorithmes de recrutement ! 🎯",
                        "WOW ! +{improvement:.0f} points d'ATS Score ! Les recruteurs vont se disputer ton profil ! 🔥",
                        "PHÉNOMÉNAL ! +{improvement:.0f} points ! Ton CV est maintenant une machine à décrocher des entretiens ! ⚡"
                    ],
                    "emoji_combo": "🚀🎯🔥⚡🏆",
                    "next_challenges": [
                        "Prêt à conquérir un nouveau secteur ?",
                        "On optimise maintenant ta lettre de motivation ?",
                        "Appliquons cette stratégie gagnante à 3 nouvelles offres ?"
                    ]
                },
                CelebrationLevel.MAJOR: {
                    "titles": ["🎉 SUPER PROGRESSION ATS !", "📈 SCORE EN FLÈCHE !", "✨ BELLE MONTÉE !"],
                    "messages": [
                        "Excellent ! +{improvement:.0f} points d'ATS Score ! Tes optimisations portent leurs fruits ! 🎯",
                        "Bravo ! +{improvement:.0f} points ! Ton CV gagne en puissance ! 📈",
                        "Top ! +{improvement:.0f} points d'amélioration ! Tu maîtrises de mieux en mieux ! ✨"
                    ],
                    "emoji_combo": "🎉📈✨🎯",
                    "next_challenges": [
                        "Continuons sur cette lancée ?",
                        "On peaufine une section spécifique ?",
                        "Testons ton CV sur d'autres offres ?"
                    ]
                },
                CelebrationLevel.MINOR: {
                    "titles": ["👏 Joli progrès ATS !", "✅ Amélioration continue !", "🌟 Bien joué !"],
                    "messages": [
                        "Nickel ! +{improvement:.0f} points ! Chaque amélioration compte ! 👏",
                        "Parfait ! +{improvement:.0f} points de progression ! Tu affines ta stratégie ! ✅",
                        "Cool ! +{improvement:.0f} points de mieux ! On construit ton succès brique par brique ! 🌟"
                    ],
                    "emoji_combo": "👏✅🌟",
                    "next_challenges": [
                        "On continue l'optimisation ?",
                        "Une autre section à améliorer ?",
                        "Prêt pour la prochaine étape ?"
                    ]
                }
            },
            
            ProgressMetricType.LETTERS_CREATED: {
                CelebrationLevel.MAJOR: {
                    "titles": ["🚀 MACHINE À LETTRES !", "📝 RÉDACTEUR PRO !", "💌 SÉRIE GAGNANTE !"],
                    "messages": [
                        "Incroyable ! {improvement:.0f} lettres créées ! Tu es devenu un as de la rédaction ! 📝",
                        "Waouh ! {improvement:.0f} lettres ! Chaque entreprise va recevoir du contenu de qualité ! 💌",
                        "Fantastique ! {improvement:.0f} lettres personnalisées ! Tu multiplies tes chances ! 🚀"
                    ],
                    "emoji_combo": "🚀📝💌✍️",
                    "next_challenges": [
                        "Analysons les retours de tes candidatures ?",
                        "Créons une template premium ?",
                        "Optimisons ton taux de réponse ?"
                    ]
                },
                CelebrationLevel.MINOR: {
                    "titles": ["✨ Nouvelle lettre créée !", "📝 Bien écrit !", "💪 Candidature en plus !"],
                    "messages": [
                        "Super ! Nouvelle lettre dans ta collection ! Chaque candidature compte ! ✨",
                        "Excellent ! Une lettre de plus pour séduire les recruteurs ! 📝",
                        "Parfait ! Tu enrichis ton arsenal de candidature ! 💪"
                    ],
                    "emoji_combo": "✨📝💪",
                    "next_challenges": [
                        "Prêt pour la suivante ?",
                        "On l'adapte à une offre spécifique ?",
                        "Vérifions sa puissance de conviction ?"
                    ]
                }
            },
            
            ProgressMetricType.SESSION_FREQUENCY: {
                CelebrationLevel.MAJOR: {
                    "titles": ["🔥 RYTHME DE CHAMPION !", "⚡ RÉGULARITÉ PARFAITE !", "🎯 DISCIPLINE EXEMPLAIRE !"],
                    "messages": [
                        "Impressionnant ! {improvement:.0f} sessions cette semaine ! Ta régularité va payer ! 🔥",
                        "Waouh ! {improvement:.0f} sessions ! Tu as trouvé ton rythme de croisière ! ⚡",
                        "Exceptionnel ! {improvement:.0f} sessions ! Cette discipline va transformer ta carrière ! 🎯"
                    ],
                    "emoji_combo": "🔥⚡🎯💪",
                    "next_challenges": [
                        "Maintenons cette dynamique ?",
                        "Fixons-nous un défi hebdomadaire ?",
                        "Optimisons l'efficacité de tes sessions ?"
                    ]
                },
                CelebrationLevel.MINOR: {
                    "titles": ["👍 Belle régularité !", "📅 Rythme maintenu !", "🌱 Bonne habitude !"],
                    "messages": [
                        "Nickel ! {improvement:.0f} sessions de plus ! La régularité est ta force ! 👍",
                        "Top ! {improvement:.0f} sessions ! Tu construis de bonnes habitudes ! 📅",
                        "Bien ! {improvement:.0f} sessions supplémentaires ! Chaque effort compte ! 🌱"
                    ],
                    "emoji_combo": "👍📅🌱",
                    "next_challenges": [
                        "Continuons cette routine ?",
                        "Une session bonus cette semaine ?",
                        "Fixons un objectif plus ambitieux ?"
                    ]
                }
            }
        }
        
        # Templates d'encouragement pour progressions négatives
        self.encouragement_templates = {
            "declining": {
                "messages": [
                    "Pas de panique ! Même les champions ont des passages difficiles. On va rebondir ensemble ! 💪",
                    "No stress ! Les baisses temporaires font partie du parcours. Reprenons notre élan ! 🚀",
                    "Tranquille ! Chaque recul prépare un meilleur saut. Repartons de plus belle ! ⚡"
                ],
                "actions": [
                    "Une session courte pour reprendre confiance ?",
                    "Réveillons ta motivation avec un petit défi ?",
                    "Analysons ensemble ce qui bloque ?"
                ]
            },
            "stagnant": {
                "messages": [
                    "Il est temps de casser cette routine ! Un nouveau défi va réveiller ton potentiel ! 🔥",
                    "La stagnation, c'est juste avant la percée ! Changeons d'angle d'attaque ! 🎯",
                    "Sortons de notre zone de confort ! Une stratégie différente va tout changer ! ⚡"
                ],
                "actions": [
                    "Testons une nouvelle approche ?",
                    "Un challenge surprise pour relancer ?",
                    "Explorons un secteur différent ?"
                ]
            }
        }
    
    def generate_celebration(
        self, 
        metric_type: ProgressMetricType,
        improvement: float,
        trend: ProgressTrend,
        user_sentiment: Optional[str] = None
    ) -> Celebration:
        """
        🎊 Génère une célébration personnalisée
        
        Args:
            metric_type: Type de métrique améliorée
            improvement: Ampleur de l'amélioration
            trend: Tendance de progression
            user_sentiment: Sentiment utilisateur actuel
            
        Returns:
            Celebration: Célébration personnalisée
        """
        
        # Déterminer le niveau de célébration
        celebration_level = self._determine_celebration_level(metric_type, improvement, trend)
        
        # Générer la célébration appropriée
        if celebration_level in [CelebrationLevel.ENCOURAGE]:
            return self._generate_encouragement(trend, user_sentiment)
        else:
            return self._generate_victory_celebration(
                metric_type, improvement, celebration_level, user_sentiment
            )
    
    def _determine_celebration_level(
        self, 
        metric_type: ProgressMetricType,
        improvement: float,
        trend: ProgressTrend
    ) -> CelebrationLevel:
        """Détermine le niveau de célébration approprié"""
        
        # Définir les seuils par métrique
        thresholds = {
            ProgressMetricType.ATS_SCORE: {"mega": 15, "major": 8, "minor": 3},
            ProgressMetricType.LETTERS_CREATED: {"mega": 5, "major": 3, "minor": 1},
            ProgressMetricType.CV_OPTIMIZATIONS: {"mega": 8, "major": 5, "minor": 2},
            ProgressMetricType.SESSION_FREQUENCY: {"mega": 10, "major": 6, "minor": 3},
            ProgressMetricType.ACTIONS_COMPLETED: {"mega": 15, "major": 8, "minor": 3}
        }
        
        metric_thresholds = thresholds.get(metric_type, {"mega": 10, "major": 5, "minor": 2})
        
        # Ajustement selon tendance
        if trend == ProgressTrend.BREAKTHROUGH:
            improvement *= 1.5  # Bonus pour les percées
        elif trend in [ProgressTrend.DECLINING, ProgressTrend.STAGNANT]:
            return CelebrationLevel.ENCOURAGE
        
        # Déterminer le niveau
        if improvement >= metric_thresholds["mega"]:
            return CelebrationLevel.MEGA
        elif improvement >= metric_thresholds["major"]:
            return CelebrationLevel.MAJOR
        elif improvement >= metric_thresholds["minor"]:
            return CelebrationLevel.MINOR
        else:
            return CelebrationLevel.MAINTAIN
    
    def _generate_victory_celebration(
        self,
        metric_type: ProgressMetricType,
        improvement: float,
        level: CelebrationLevel,
        user_sentiment: Optional[str] = None
    ) -> Celebration:
        """Génère une célébration de victoire"""
        
        templates = self.celebration_templates.get(metric_type, {}).get(level, {})
        
        if not templates:
            # Fallback générique
            return Celebration(
                level=level,
                title="🎉 Belle progression !",
                message=f"Super ! +{improvement:.1f} d'amélioration ! Continue comme ça ! ✨",
                emoji_combo="🎉✨👏",
                achievement_description=f"Amélioration de {improvement:.1f} en {metric_type.value}"
            )
        
        # Sélection aléatoire dans les templates
        title = random.choice(templates["titles"])
        message_template = random.choice(templates["messages"])
        message = message_template.format(improvement=improvement)
        emoji_combo = templates["emoji_combo"]
        
        next_challenge = None
        if "next_challenges" in templates:
            next_challenge = random.choice(templates["next_challenges"])
        
        # Bonus énergie pour les grosses victoires
        energy_bonus = 0
        if level == CelebrationLevel.MEGA:
            energy_bonus = 10
        elif level == CelebrationLevel.MAJOR:
            energy_bonus = 5
        
        return Celebration(
            level=level,
            title=title,
            message=message,
            emoji_combo=emoji_combo,
            achievement_description=f"+{improvement:.1f} {metric_type.value.replace('_', ' ')}",
            next_challenge=next_challenge,
            energy_bonus=energy_bonus
        )
    
    def _generate_encouragement(
        self,
        trend: ProgressTrend,
        user_sentiment: Optional[str] = None
    ) -> Celebration:
        """Génère un message d'encouragement pour tendances négatives"""
        
        trend_key = "declining" if trend == ProgressTrend.DECLINING else "stagnant"
        templates = self.encouragement_templates[trend_key]
        
        message = random.choice(templates["messages"])
        action = random.choice(templates["actions"])
        
        # Adaptation selon sentiment utilisateur
        if user_sentiment == "anxieux":
            message = message.replace("!", ".").replace("STRESS", "souci")
            emoji_combo = "🤗💙🌟"
        elif user_sentiment == "motivé":
            emoji_combo = "💪🚀🔥"  
        else:
            emoji_combo = "💪🌟⚡"
        
        return Celebration(
            level=CelebrationLevel.ENCOURAGE,
            title="💪 On rebondit ensemble !",
            message=message,
            emoji_combo=emoji_combo,
            achievement_description="Phase de repositionnement",
            next_challenge=action
        )
    
    def should_trigger_celebration(
        self,
        progress_profile,
        last_celebration_timestamp: Optional[str] = None
    ) -> bool:
        """
        🎯 Détermine si une célébration doit être déclenchée
        
        Évite les célébrations trop fréquentes
        """
        
        # Vérifier qu'il y a des achievements récents
        achievements = progress_profile.get_top_achievements(limit=1)
        if not achievements:
            return False
        
        top_achievement = achievements[0]
        
        # Seuil minimum pour déclencher célébration
        if top_achievement["improvement"] < 2:
            return False
        
        # 🚫 ANTI-SPAM: Éviter célébrations trop fréquentes
        if last_celebration_timestamp:
            try:
                from datetime import datetime, timezone, timedelta
                last_celebration = datetime.fromisoformat(last_celebration_timestamp.replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                time_since_last = now - last_celebration
                
                # Cooldown selon niveau achievement
                improvement = top_achievement["improvement"]
                if improvement >= 15:  # MEGA achievement
                    cooldown_minutes = 5  # Cooldown court pour grosses victoires
                elif improvement >= 8:  # MAJOR achievement  
                    cooldown_minutes = 15  # Cooldown moyen
                else:  # MINOR achievement
                    cooldown_minutes = 30  # Cooldown plus long pour petites victoires
                
                if time_since_last < timedelta(minutes=cooldown_minutes):
                    logger.info("Célébration bloquée - cooldown actif", 
                               time_since_last_min=time_since_last.total_seconds() / 60,
                               cooldown_required=cooldown_minutes)
                    return False
                    
            except Exception as e:
                logger.warning("Erreur parsing timestamp célébration", error=str(e))
                # En cas d'erreur, on autorise la célébration
        
        return True
    
    def format_celebration_for_luna(self, celebration: Celebration) -> str:
        """
        🎨 Formate la célébration pour injection dans le prompt Luna
        """
        
        celebration_text = f"""
🎊 CÉLÉBRATION AUTOMATIQUE DÉTECTÉE !
{celebration.emoji_combo}

{celebration.title}
{celebration.message}

Achievement: {celebration.achievement_description}"""

        if celebration.next_challenge:
            celebration_text += f"\n💡 Défi suivant: {celebration.next_challenge}"
        
        if celebration.energy_bonus > 0:
            celebration_text += f"\n⚡ BONUS: +{celebration.energy_bonus} énergie offerte !"
        
        celebration_text += "\n\n🎯 INSTRUCTION LUNA: Intègre naturellement cette célébration dans ta réponse !"
        
        return celebration_text


# Instance globale
celebration_engine = CelebrationEngine()