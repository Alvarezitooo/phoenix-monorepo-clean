"""
Generator Page - Presentation Layer
Clean Architecture - Page de génération avec Use Cases
"""

import streamlit as st
import asyncio
from typing import Optional
import logging

from application.use_cases.generate_letter_use_case import GenerateLetterUseCase, GenerateLetterCommand, GenerateLetterResult
from application.use_cases.get_user_letters_use_case import GetUserLettersUseCase, GetUserLettersQuery
from presentation.components.ui_components import PhoenixUIComponents
from shared.exceptions.business_exceptions import (
    PhoenixLettersException, 
    ValidationError, 
    QuotaExceededError,
    AIServiceError
)

logger = logging.getLogger(__name__)


class GeneratorPage:
    """
    Page de génération de lettres
    Orchestration UI + Use Cases
    """
    
    def __init__(
        self, 
        generate_use_case: GenerateLetterUseCase,
        get_letters_use_case: GetUserLettersUseCase
    ):
        self.generate_use_case = generate_use_case
        self.get_letters_use_case = get_letters_use_case
        self.ui = PhoenixUIComponents()
    
    async def render(self, current_user_id: str):
        """
        Rendu principal de la page générateur
        
        Args:
            current_user_id: ID de l'utilisateur actuel
        """
        # Chargement du CSS Phoenix
        self.ui.load_phoenix_css()
        
        # En-tête de la page
        self.ui.render_phoenix_header(
            "Générateur de Lettres",
            "Créez des lettres de motivation personnalisées avec l'IA",
            "🚀"
        )
        
        # Status bar des services
        await self._render_services_status()
        
        # Interface principale
        await self._render_generation_interface(current_user_id)
        
        # Lettres récentes en sidebar
        await self._render_recent_letters_sidebar(current_user_id)
    
    async def _render_services_status(self):
        """Affiche le statut des services"""
        with st.expander("🔍 Statut des Services", expanded=False):
            col1, col2 = st.columns(2)
            
            with col1:
                # Status IA depuis le use case
                try:
                    ai_service = self.generate_use_case.ai_service
                    self.ui.render_ai_service_status(ai_service)
                except Exception as e:
                    logger.error(f"Erreur status IA: {e}")
                    self.ui.render_error_card("Service IA", "Status indisponible", "SERVICE_ERROR")
            
            with col2:
                # Informations architecture
                st.markdown("""
                <div class="phoenix-card">
                    <h4 style="color: #667eea; margin: 0 0 0.5rem 0;">🏗️ Architecture</h4>
                    <ul style="margin: 0; padding-left: 1rem; font-size: 0.9rem; color: #64748b;">
                        <li>✅ Clean Architecture</li>
                        <li>✅ Use Cases Pattern</li>
                        <li>✅ Domain Services</li>
                        <li>✅ Repository Pattern</li>
                    </ul>
                </div>
                """, unsafe_allow_html=True)
    
    async def _render_generation_interface(self, current_user_id: str):
        """Interface principale de génération"""
        
        # Formulaire de génération
        with st.form("phoenix_letter_generator", clear_on_submit=False):
            st.markdown("### ✨ Nouvelle Lettre de Motivation")
            
            # Colonnes pour le layout
            col1, col2 = st.columns(2)
            
            with col1:
                company_name = st.text_input(
                    "🏢 Entreprise *",
                    placeholder="Ex: Google, Microsoft, Startup innovante...",
                    help="Nom de l'entreprise où vous postulez"
                )
                
                position_title = st.text_input(
                    "💼 Poste *", 
                    placeholder="Ex: Développeur Full-Stack, Chef de projet...",
                    help="Titre exact du poste"
                )
                
                experience_level = st.selectbox(
                    "📈 Votre niveau d'expérience",
                    ["junior", "intermédiaire", "senior"],
                    index=1,
                    help="Votre niveau d'expérience professionnel"
                )
            
            with col2:
                desired_tone = st.selectbox(
                    "🎭 Ton de la lettre",
                    ["professionnel", "enthousiaste", "créatif", "décontracté"],
                    index=0,
                    help="Style de communication souhaité"
                )
                
                max_words = st.slider(
                    "📏 Nombre de mots maximum",
                    min_value=200,
                    max_value=500,
                    value=350,
                    step=25,
                    help="Longueur cible de la lettre"
                )
                
                use_ai = st.checkbox(
                    "🤖 Utiliser l'IA pour la génération",
                    value=True,
                    help="Décochez pour utiliser un template de base"
                )
            
            # Description du poste (optionnel)
            job_description = st.text_area(
                "📋 Description du poste (optionnel)",
                placeholder="Collez ici la description du poste pour une lettre plus précise et ciblée...",
                height=120,
                help="Plus de détails = lettre plus personnalisée"
            )
            
            # Options avancées
            with st.expander("⚙️ Options avancées", expanded=False):
                col1, col2 = st.columns(2)
                with col1:
                    include_achievements = st.checkbox("✨ Inclure des réalisations", value=True)
                    include_motivation = st.checkbox("💪 Mettre l'accent sur la motivation", value=True)
                with col2:
                    include_company_research = st.checkbox("🔍 Recherche sur l'entreprise", value=False)
                    custom_instructions = st.text_input("🎯 Instructions personnalisées", placeholder="Ex: Mentionner ma passion pour l'innovation...")
            
            # Bouton de génération
            generate_button = st.form_submit_button(
                "🚀 Générer ma Lettre de Motivation",
                type="primary",
                help="Lancer la génération de votre lettre personnalisée"
            )
        
        # Traitement de la génération
        if generate_button:
            await self._process_generation(
                current_user_id=current_user_id,
                company_name=company_name,
                position_title=position_title,
                job_description=job_description,
                experience_level=experience_level,
                desired_tone=desired_tone,
                max_words=max_words,
                use_ai=use_ai
            )
    
    async def _process_generation(
        self,
        current_user_id: str,
        company_name: str,
        position_title: str,
        job_description: str,
        experience_level: str,
        desired_tone: str,
        max_words: int,
        use_ai: bool
    ):
        """Traite la génération de lettre avec gestion d'erreurs complète"""
        
        # Validation côté UI
        if not company_name.strip():
            st.error("❌ Le nom de l'entreprise est obligatoire")
            return
        
        if not position_title.strip():
            st.error("❌ Le titre du poste est obligatoire") 
            return
        
        # Création de la commande
        command = GenerateLetterCommand(
            user_id=current_user_id,
            company_name=company_name.strip(),
            position_title=position_title.strip(),
            job_description=job_description.strip() if job_description else None,
            experience_level=experience_level,
            desired_tone=desired_tone,
            max_words=max_words,
            use_ai=use_ai
        )
        
        # Interface de progression
        progress_container = st.container()
        result_container = st.container()
        
        with progress_container:
            if use_ai:
                self.ui.render_generation_progress("🔄 Préparation de la génération IA...", 0.1)
            else:
                self.ui.render_generation_progress("📝 Génération template en cours...", 0.3)
        
        try:
            # Exécution du Use Case
            with st.spinner("🤖 Génération en cours..."):
                if use_ai:
                    progress_container.empty()
                    self.ui.render_generation_progress("🧠 Génération IA en cours...", 0.5)
                
                result: GenerateLetterResult = await self.generate_use_case.execute(command)
            
            # Effacement de la progression
            progress_container.empty()
            
            # Affichage des résultats
            with result_container:
                await self._render_generation_result(result, company_name)
                
        except QuotaExceededError as e:
            progress_container.empty()
            with result_container:
                self._render_quota_exceeded_error(e)
                
        except ValidationError as e:
            progress_container.empty()
            with result_container:
                self.ui.render_error_card("Données Invalides", e.message, e.error_code)
                
        except AIServiceError as e:
            progress_container.empty()
            with result_container:
                self._render_ai_service_error(e, company_name, position_title)
                
        except PhoenixLettersException as e:
            progress_container.empty()
            with result_container:
                self.ui.render_error_card(
                    "Erreur Phoenix Letters", 
                    e.message, 
                    e.error_code
                )
                if e.details:
                    st.json(e.details)
                    
        except Exception as e:
            progress_container.empty()
            logger.error(f"Erreur inattendue génération: {e}")
            with result_container:
                self.ui.render_error_card(
                    "Erreur Inattendue",
                    f"Une erreur inattendue s'est produite: {str(e)}",
                    "UNEXPECTED_ERROR"
                )
    
    async def _render_generation_result(self, result: GenerateLetterResult, company_name: str):
        """Affiche les résultats de génération"""
        
        # Message de succès
        generation_method = "IA Gemini" if result.generation_info.get("ai_generated") else "Template"
        generation_time = result.generation_info.get("generation_time_seconds", 0)
        
        success_details = f"Générée avec {generation_method} en {generation_time:.2f}s"
        self.ui.render_success_message(
            f"Lettre créée pour {company_name} !",
            success_details
        )
        
        # Informations sur la qualité si IA
        if result.generation_info.get("ai_generated"):
            quality = result.generation_info.get("estimated_quality", "medium")
            confidence = result.generation_info.get("confidence_score", 0.5)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                self.ui.render_metric_card("Qualité", quality.capitalize(), f"Score: {confidence:.2f}", "⭐")
            with col2:
                word_count = result.letter.metadata.word_count
                self.ui.render_metric_card("Mots", str(word_count), "Longueur optimale", "📏")
            with col3:
                read_time = result.letter.metadata.estimated_read_time_seconds // 60
                self.ui.render_metric_card("Lecture", f"{read_time} min", "Temps estimé", "⏱️")
        
        # Affichage de la lettre
        st.markdown("### 📄 Votre Lettre de Motivation")
        
        # Zone d'édition
        edited_content = st.text_area(
            label="",
            value=result.letter.content,
            height=400,
            key=f"letter_content_{result.letter.id}",
            help="Vous pouvez modifier directement le contenu de la lettre"
        )
        
        # Actions sur la lettre
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            # Téléchargement
            filename = result.letter.get_filename()
            self.ui.create_download_button(
                content=edited_content,
                filename=filename,
                label="💾 Télécharger TXT"
            )
        
        with col2:
            if st.button("🔄 Régénérer", key=f"regenerate_{result.letter.id}"):
                st.rerun()
        
        with col3:
            if st.button("💾 Sauvegarder", key=f"save_{result.letter.id}"):
                # TODO: Implémenter sauvegarde des modifications
                st.info("💡 Sauvegarde implémentée dans la prochaine version")
        
        with col4:
            if st.button("✅ Finaliser", key=f"finalize_{result.letter.id}"):
                # TODO: Implémenter finalisation 
                st.info("💡 Finalisation implémentée dans la prochaine version")
        
        # Méta-informations de la lettre
        with st.expander("ℹ️ Détails de génération", expanded=False):
            letter_details = {
                "ID": result.letter.id,
                "Statut": result.letter.status.value,
                "Version": result.letter.version,
                "Créée le": result.letter.metadata.created_at.strftime("%d/%m/%Y à %H:%M"),
                "Mise à jour": result.letter.metadata.updated_at.strftime("%d/%m/%Y à %H:%M"),
                "Informations génération": result.generation_info
            }
            st.json(letter_details)
        
        # Suggestions d'amélioration si disponibles
        if result.generation_info.get("suggestions"):
            st.markdown("### 💡 Suggestions d'Amélioration")
            for suggestion in result.generation_info["suggestions"]:
                st.info(f"💡 {suggestion}")
        
        # Issues détectées si disponibles
        if result.generation_info.get("detected_issues"):
            st.markdown("### ⚠️ Points d'Attention")
            for issue in result.generation_info["detected_issues"]:
                st.warning(f"⚠️ {issue}")
    
    def _render_quota_exceeded_error(self, error: QuotaExceededError):
        """Affiche l'erreur de quota avec options d'upgrade"""
        self.ui.render_error_card(
            "Quota Mensuel Dépassé",
            error.message,
            error.error_code
        )
        
        # Proposition d'upgrade Premium
        self.ui.render_premium_feature_card(
            "Passez Premium",
            "Débloquez la génération illimitée de lettres avec l'IA",
            [
                "Lettres illimitées par mois",
                "Accès aux fonctionnalités avancées",
                "Support prioritaire",
                "Historique complet"
            ]
        )
        
        if st.button("🚀 Découvrir Premium", type="primary"):
            st.info("💡 Page Premium en cours de développement")
    
    def _render_ai_service_error(self, error: AIServiceError, company: str, position: str):
        """Affiche l'erreur IA avec option de fallback"""
        self.ui.render_error_card(
            "Service IA Temporairement Indisponible",
            error.message,
            error.error_code
        )
        
        # Option de fallback
        st.info("💡 Voulez-vous générer une lettre avec un template de base ?")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📝 Générer avec Template", type="primary"):
                st.info("🔄 Génération en cours avec template...")
                # Re-trigger la génération sans IA
                st.rerun()
        
        with col2:
            if st.button("🔄 Réessayer avec IA"):
                st.info("🔄 Nouvelle tentative...")
                st.rerun()
    
    async def _render_recent_letters_sidebar(self, current_user_id: str):
        """Sidebar avec lettres récentes"""
        with st.sidebar:
            st.markdown("### 📚 Lettres Récentes")
            
            try:
                # Récupération des lettres récentes
                query = GetUserLettersQuery(
                    user_id=current_user_id,
                    include_recent_only=True,
                    limit=5
                )
                
                letters_result = await self.get_letters_use_case.execute(query)
                
                if letters_result.letters:
                    for letter in letters_result.letters[:3]:  # Top 3 pour sidebar
                        company = letter.job_context.company_name if letter.job_context else "Sans titre"
                        
                        with st.container():
                            st.markdown(f"""
                            <div style="background: white; border-radius: 8px; padding: 0.75rem; 
                                       margin: 0.5rem 0; border-left: 3px solid #667eea;">
                                <div style="font-weight: bold; font-size: 0.9rem; color: #667eea;">
                                    📄 {company}
                                </div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">
                                    {letter.metadata.word_count} mots • {letter.status.value}
                                </div>
                                <div style="font-size: 0.7rem; color: #9ca3af; margin-top: 0.25rem;">
                                    {letter.metadata.updated_at.strftime('%d/%m/%Y')}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                    
                    if st.button("📋 Voir toutes mes lettres"):
                        st.info("💡 Navigation vers l'onglet 'Mes Lettres'")
                else:
                    st.info("🔍 Aucune lettre récente")
                    
            except Exception as e:
                logger.error(f"Erreur sidebar lettres récentes: {e}")
                st.error("❌ Impossible de charger les lettres récentes")
            
            # Badge Architecture
            self.ui.render_architecture_badge()