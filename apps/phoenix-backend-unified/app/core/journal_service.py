"""
🌙 Phoenix Journal Narratif - Service Métier
Orchestrateur principal pour l'Arène du Premier Héros
Adapte le Narrative Analyzer existant au format JournalDTO
"""

import os
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
import json
import structlog
import statistics

from app.core.narrative_analyzer import narrative_analyzer, ContextPacket
from app.core.energy_manager import energy_manager
from app.core.supabase_client import event_store
from app.models.user_energy import ENERGY_COSTS
from app.models.journal_dto import (
    JournalDTO, JournalUser, JournalEnergy, JournalNarrative, 
    JournalKPIs, JournalKpiAts, JournalKpiLetters, JournalChapter, 
    JournalNextStep, JournalSocialProof, JournalEthics
)

logger = structlog.get_logger("journal_service")


class JournalService:
    """
    🌙 Service Journal Narratif - Transformation du Context Packet en JournalDTO
    
    Responsabilités:
    1. Orchestrer Narrative Analyzer existant
    2. Transformer Context Packet → JournalDTO format
    3. Calculer next_steps selon progression utilisateur
    4. Générer social proof contextualisé
    5. Assurer cohérence avec grille Oracle énergétique
    """
    
    def __init__(self):
        """Initialise le service Journal"""
        pass
    
    async def get_journal_data(self, user_id: str, window: str = "14d") -> JournalDTO:
        """
        Génère le JournalDTO complet pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            window: Fenêtre d'analyse (7d, 14d, 90d)
            
        Returns:
            JournalDTO: Données complètes pour le Journal Narratif
        """
        logger.info("Génération Journal Narratif", user_id=user_id, window=window)
        
        try:
            # 1. Récupération Context Packet existant (Narrative Analyzer v1.5)
            context_packet = await narrative_analyzer.generate_context_packet(user_id)
            
            # 2. Récupération état énergétique
            energy_balance = await energy_manager.check_balance(user_id)
            
            # 3. Transformation en JournalDTO
            journal_dto = await self._build_journal_dto(
                user_id=user_id,
                context_packet=context_packet,
                energy_balance=energy_balance,
                window=window
            )
            
            logger.info(
                "Journal Narratif généré",
                user_id=user_id,
                chapters_count=len(journal_dto.narrative.chapters),
                confidence=context_packet.confidence
            )
            
            return journal_dto
            
        except Exception as e:
            logger.error("Erreur génération Journal Narratif", user_id=user_id, error=str(e))
            # Fallback avec données minimales
            return await self._create_fallback_journal(user_id)
    
    async def _build_journal_dto(
        self,
        user_id: str,
        context_packet: ContextPacket,
        energy_balance: Dict[str, Any],
        window: str
    ) -> JournalDTO:
        """Construit le JournalDTO à partir du Context Packet et des données énergie"""
        
        # 1. User Profile
        journal_user = JournalUser(
            id=user_id,
            first_name=context_packet.user.first_name if hasattr(context_packet.user, 'first_name') else "Utilisateur",
            plan="unlimited" if context_packet.user.plan == "unlimited" else "standard"
        )
        
        # 2. Energy State
        journal_energy = JournalEnergy(
            balance_pct=round(energy_balance.get("percentage", 0), 1),
            last_purchase=energy_balance.get("last_recharge").isoformat() if energy_balance.get("last_recharge") else None
        )
        
        # 3. Narrative Structure
        journal_narrative = await self._build_narrative_from_context(context_packet, window)
        
        # 4. Social Proof (généré contextuellement)
        social_proof = self._generate_social_proof(context_packet, journal_narrative)
        
        # 5. Ethics (rempart éthique)
        ethics = JournalEthics()
        
        return JournalDTO(
            user=journal_user,
            energy=journal_energy,
            narrative=journal_narrative,
            social_proof=social_proof,
            ethics=ethics
        )
    
    async def _build_narrative_from_context(self, context_packet: ContextPacket, window: str) -> JournalNarrative:
        """Transforme le Context Packet en structure narrative Journal"""
        
        # 1. Chapitres depuis events récents
        chapters = await self._build_chapters_from_events(context_packet.user.id, window)
        
        # 2. KPIs de progression
        kpis = self._build_kpis_from_context(context_packet)
        
        # 3. Next Steps basés sur la progression
        next_steps = self._calculate_next_steps(context_packet, kpis)
        
        # 4. Last Doubt depuis Context Packet
        last_doubt = context_packet.last_emotion_or_doubt
        
        return JournalNarrative(
            chapters=chapters,
            kpis=kpis,
            last_doubt=last_doubt,
            next_steps=next_steps
        )
    
    async def _build_chapters_from_events(self, user_id: str, window: str) -> List[JournalChapter]:
        """Construit la timeline des chapitres depuis l'Event Store"""
        
        try:
            # Récupération des événements récents via Event Store
            days = int(window.replace('d', ''))
            events = await event_store.get_user_events(user_id, limit=50)
            
            # Filtrage temporel
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(days=days)
            
            chapters = []
            for event in events:
                try:
                    event_time = datetime.fromisoformat(event.get("created_at", "").replace('Z', '+00:00'))
                    if event_time < cutoff:
                        continue
                    
                    # Transformation événement → chapitre
                    chapter = self._event_to_chapter(event)
                    if chapter:
                        chapters.append(chapter)
                        
                except (ValueError, TypeError):
                    continue
            
            # Tri chronologique inverse (plus récent en premier)
            chapters.sort(key=lambda x: x.ts, reverse=True)
            
            # Limite à 12 chapitres maximum pour l'affichage
            return chapters[:12]
            
        except Exception as e:
            logger.error("Erreur construction chapitres", user_id=user_id, error=str(e))
            return []
    
    def _event_to_chapter(self, event: Dict[str, Any]) -> Optional[JournalChapter]:
        """Transforme un événement Event Store en chapitre narratif"""
        
        event_type = event.get("type", "")
        payload = event.get("payload", {})
        created_at = event.get("created_at", "")
        
        # Mapping événements vers chapitres narratifs
        chapter_mappings = {
            "cv_generated": {
                "type": "cv",
                "title": "CV optimisé",
                "gains": lambda p: [f"ATS {p.get('ats_score', 'N/A')}", f"+{p.get('improvements_count', 0)} améliorations"]
            },
            "cv_optimized": {
                "type": "cv", 
                "title": "CV analysé et optimisé",
                "gains": lambda p: [f"Score {p.get('score', 'N/A')}/100", "Optimisations appliquées"]
            },
            "letter_generated": {
                "type": "letter",
                "title": "Lettre de motivation créée", 
                "gains": lambda p: [f"Pour {p.get('company_name', 'entreprise')}", f"{p.get('word_count', 0)} mots"]
            },
            "mirror_match_analysis": {
                "type": "analysis",
                "title": "Analyse Mirror Match",
                "gains": lambda p: [f"Compatibilité {p.get('match_score', 0)}%", "Recommandations générées"]
            },
            "energy_purchased": {
                "type": "energy",
                "title": "Énergie Luna rechargée",
                "gains": lambda p: [f"Pack {p.get('pack_type', 'unknown')}", f"+{p.get('energy_amount', 0)}% énergie"]
            },
            "milestone_reached": {
                "type": "milestone",
                "title": "Palier atteint !",
                "gains": lambda p: [f"{p.get('kpi', 'Objectif')} → {p.get('value', 0)}", "🎉 Progression validée"]
            }
        }
        
        # Recherche du mapping correspondant
        mapping = None
        for key, config in chapter_mappings.items():
            if key in event_type.lower():
                mapping = config
                break
        
        if not mapping:
            # Événement non mappé, on ignore
            return None
        
        try:
            gains = mapping["gains"](payload) if callable(mapping["gains"]) else []
            
            return JournalChapter(
                id=event.get("id", f"event_{created_at}"),
                type=mapping["type"],
                title=mapping["title"],
                gain=gains,
                ts=created_at
            )
            
        except Exception:
            return None
    
    def _build_kpis_from_context(self, context_packet: ContextPacket) -> JournalKPIs:
        """Construit les KPIs depuis le Context Packet"""
        
        kpis = JournalKPIs()
        
        # KPI ATS moyen
        if context_packet.progress.ats_mean is not None:
            ats_delta = context_packet.progress.ats_delta_pct_14d or 0
            trend = "up" if ats_delta > 5 else ("down" if ats_delta < -5 else "flat")
            
            kpis.ats_mean = JournalKpiAts(
                value=round(context_packet.progress.ats_mean, 1),
                target=85.0,  # Objectif standard
                trend=trend,
                delta_pct_14d=round(ats_delta, 1)
            )
        
        # KPI Lettres
        if context_packet.progress.letters_count_total > 0:
            kpis.letters_count = JournalKpiLetters(
                value=context_packet.progress.letters_count_total
            )
        
        return kpis
    
    def _calculate_next_steps(self, context_packet: ContextPacket, kpis: JournalKPIs) -> List[JournalNextStep]:
        """Calcule les prochaines étapes selon la progression utilisateur"""
        
        next_steps = []
        
        # Logique contextuelle basée sur l'état de progression
        
        # 1. Si ATS score faible → recommander optimisation CV
        if kpis.ats_mean and kpis.ats_mean.value < 80:
            next_steps.append(JournalNextStep(
                action="optimisation_cv",
                cost_pct=ENERGY_COSTS["optimisation_cv"],
                expected_gain="ATS +5 à +15 points"
            ))
        
        # 2. Si pas de Mirror Match récent → recommander analyse
        if context_packet.usage.apps_last_7d and "cv" in context_packet.usage.apps_last_7d:
            next_steps.append(JournalNextStep(
                action="mirror_match", 
                cost_pct=ENERGY_COSTS["mirror_match"],
                expected_gain="Compatibilité offre +20%"
            ))
        
        # 3. Si secteur tech identifié → recommander LinkedIn
        if context_packet.progress.letters_target == "secteur_tech":
            next_steps.append(JournalNextStep(
                action="conseil_rapide",
                cost_pct=ENERGY_COSTS["conseil_rapide"], 
                expected_gain="Stratégie LinkedIn tech"
            ))
        
        # 4. Si utilisateur actif → actions avancées
        if context_packet.usage.session_count_7d > 3:
            next_steps.append(JournalNextStep(
                action="analyse_cv_complete",
                cost_pct=ENERGY_COSTS["analyse_cv_complete"],
                expected_gain="Analyse approfondie + plan d'action"
            ))
        
        # 5. Default : conseil rapide si pas d'autres suggestions
        if not next_steps:
            next_steps.append(JournalNextStep(
                action="conseil_rapide",
                cost_pct=ENERGY_COSTS["conseil_rapide"],
                expected_gain="Conseil personnalisé Luna"
            ))
        
        # Limite à 3 suggestions maximum
        return next_steps[:3]
    
    def _generate_social_proof(self, context_packet: ContextPacket, narrative: JournalNarrative) -> Optional[JournalSocialProof]:
        """Génère des preuves sociales contextualisées (anonymisées)"""
        
        # Preuves sociales basées sur le contexte utilisateur
        social_scenarios = [
            {
                "condition": lambda: context_packet.progress.letters_target == "secteur_tech",
                "proof": JournalSocialProof(
                    peers_percentage_recommended_step=0.87,
                    recommended_label="LinkedIn Power Moves"
                )
            },
            {
                "condition": lambda: narrative.kpis.ats_mean and narrative.kpis.ats_mean.value < 75,
                "proof": JournalSocialProof(
                    peers_percentage_recommended_step=0.92, 
                    recommended_label="Optimisation CV approfondie"
                )
            },
            {
                "condition": lambda: context_packet.usage.session_count_7d > 4,
                "proof": JournalSocialProof(
                    peers_percentage_recommended_step=0.78,
                    recommended_label="Mirror Match avec offres ciblées"
                )
            },
            {
                "condition": lambda: context_packet.user.age_days < 7,
                "proof": JournalSocialProof(
                    peers_percentage_recommended_step=0.95,
                    recommended_label="Bilan compétences initial"
                )
            }
        ]
        
        # Sélection du premier scénario qui match
        for scenario in social_scenarios:
            try:
                if scenario["condition"]():
                    return scenario["proof"]
            except:
                continue
        
        # Fallback générique
        return JournalSocialProof(
            peers_percentage_recommended_step=0.84,
            recommended_label="Optimisation progressive du profil"
        )
    
    async def _create_fallback_journal(self, user_id: str) -> JournalDTO:
        """Crée un Journal minimal en cas d'erreur"""
        
        logger.warning("Création Journal fallback", user_id=user_id)
        
        return JournalDTO(
            user=JournalUser(
                id=user_id,
                first_name="Utilisateur",
                plan="standard"
            ),
            energy=JournalEnergy(
                balance_pct=100.0,
                last_purchase=None
            ),
            narrative=JournalNarrative(
                chapters=[],
                kpis=JournalKPIs(),
                last_doubt=None,
                next_steps=[
                    JournalNextStep(
                        action="conseil_rapide",
                        cost_pct=5.0,
                        expected_gain="Première étape avec Luna"
                    )
                ]
            ),
            social_proof=JournalSocialProof(
                peers_percentage_recommended_step=0.9,
                recommended_label="Découverte de l'écosystème Phoenix"
            ),
            ethics=JournalEthics()
        )


# Instance globale du service
journal_service = JournalService()