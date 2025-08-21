"""
Phoenix Letters - Main Application (Clean Architecture)
Point d'entrée principal avec architecture Clean complète
"""

import streamlit as st
import logging
import asyncio
from datetime import datetime
from typing import Optional

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuration Streamlit
st.set_page_config(
    page_title="Phoenix Letters - Clean Architecture",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Imports Clean Architecture
from shared.config.settings import config
from shared.exceptions.business_exceptions import PhoenixLettersException, ValidationError, QuotaExceededError
from application.use_cases.generate_letter_use_case import GenerateLetterUseCase, GenerateLetterCommand
from application.use_cases.get_user_letters_use_case import GetUserLettersUseCase, GetUserLettersQuery
from domain.services.letter_service import LetterService
from infrastructure.ai.gemini_service import GeminiService
from presentation.components.ui_components import PhoenixUIComponents
from presentation.pages.generator_page import GeneratorPage


class PhoenixLettersApp:
    """
    Application principale Phoenix Letters
    Clean Architecture - Composition Root & Dependency Injection
    """
    
    def __init__(self):
        self.config = config
        self._services_initialized = False
        self._setup_session_state()
    
    def _setup_session_state(self) -> None:
        """Initialise l'état de session Streamlit"""
        if "app_initialized" not in st.session_state:
            st.session_state.app_initialized = True
            st.session_state.current_user_id = "demo-user"  # Pour demo, sera remplacé par auth
            st.session_state.errors = []
            st.session_state.success_messages = []
    
    async def initialize_services(self) -> bool:
        """
        Initialise tous les services avec injection de dépendances
        Pattern: Composition Root
        
        Returns:
            bool: True si succès, False sinon
        """
        if self._services_initialized:
            return True
        
        try:
            logger.info("🚀 Initialisation des services Phoenix Letters...")
            
            # 1. Configuration et validation
            config_errors = self.config.validate()
            if config_errors:
                logger.warning(f"⚠️ Erreurs configuration: {config_errors}")
                st.session_state.errors.extend(config_errors)
            
            # 2. Infrastructure Layer - Services externes
            self.ai_service = self._create_ai_service()
            
            # 3. Infrastructure Layer - Repositories (Mock pour demo)
            self.letter_repository = self._create_letter_repository()
            self.user_repository = self._create_user_repository()
            
            # 4. Domain Layer - Services métier
            self.letter_service = LetterService(self.letter_repository)
            
            # 5. Application Layer - Use Cases
            self.generate_letter_use_case = GenerateLetterUseCase(
                letter_service=self.letter_service,
                user_repository=self.user_repository,
                ai_service=self.ai_service
            )
            
            self.get_user_letters_use_case = GetUserLettersUseCase(
                letter_service=self.letter_service,
                user_repository=self.user_repository
            )
            
            # 6. Presentation Layer - UI Components
            self.ui_components = PhoenixUIComponents()
            self.generator_page = GeneratorPage(
                generate_use_case=self.generate_letter_use_case,
                get_letters_use_case=self.get_user_letters_use_case
            )
            
            self._services_initialized = True
            logger.info("✅ Services initialisés avec succès")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur initialisation services: {e}")
            st.session_state.errors.append(f"Erreur initialisation: {e}")
            return False
    
    def _create_ai_service(self) -> GeminiService:
        """Factory pour le service IA"""
        return GeminiService(
            api_key=self.config.ai.google_api_key,
            model_name=self.config.ai.model_name
        )
    
    def _create_letter_repository(self):
        """Factory pour le repository lettres (Mock pour demo)"""
        from infrastructure.database.mock_letter_repository import MockLetterRepository
        return MockLetterRepository()
    
    def _create_user_repository(self):
        """Factory pour le repository utilisateurs (Mock pour demo)"""
        from infrastructure.database.mock_user_repository import MockUserRepository
        return MockUserRepository()
    
    def render_header(self) -> None:
        """Affiche l'en-tête de l'application"""
        st.markdown("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 2rem; border-radius: 10px; margin-bottom: 2rem; color: white;">
            <h1 style="margin: 0; font-size: 2.5rem;">🔥 Phoenix Letters</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.2rem; opacity: 0.9;">
                Clean Architecture Edition - Générateur IA de lettres de motivation
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    def render_sidebar(self) -> None:
        """Affiche la sidebar avec informations système"""
        with st.sidebar:
            st.markdown("### 🔧 Statut Système")
            
            # Configuration
            config_summary = self.config.get_summary()
            if config_summary["is_valid"]:
                st.success("✅ Configuration OK")
            else:
                st.error("❌ Erreurs configuration")
                for error in config_summary["errors"]:
                    st.error(f"• {error}")
            
            # Services IA
            if self._services_initialized and self.ai_service:
                if self.ai_service.is_available():
                    st.success(f"✅ IA: {self.ai_service.model_name}")
                else:
                    st.error("❌ IA indisponible")
            
            st.markdown("---")
            
            # Métriques de développement
            st.markdown("### 📊 Métriques Dev")
            st.info(f"Version: {config_summary['version']}")
            st.info(f"Env: {config_summary['environment']}")
            st.info(f"User: {st.session_state.current_user_id}")
            
            # Architecture info
            st.markdown("### 🏗️ Architecture")
            st.text("✅ Clean Architecture")
            st.text("✅ Dependency Injection") 
            st.text("✅ Use Cases Pattern")
            st.text("✅ Repository Pattern")
            st.text("✅ Domain Services")
    
    def render_error_messages(self) -> None:
        """Affiche les messages d'erreur"""
        if st.session_state.errors:
            for error in st.session_state.errors:
                st.error(f"❌ {error}")
            
            if st.button("🗑️ Effacer les erreurs"):
                st.session_state.errors = []
                st.rerun()
    
    def render_success_messages(self) -> None:
        """Affiche les messages de succès"""
        if st.session_state.success_messages:
            for message in st.session_state.success_messages:
                st.success(f"✅ {message}")
            
            # Auto-clear après 3 secondes (simulation)
            if len(st.session_state.success_messages) > 0:
                st.session_state.success_messages = []
    
    async def run_async(self) -> None:
        """Logique principale asynchrone"""
        # Initialisation des services
        services_ok = await self.initialize_services()
        
        if not services_ok:
            st.error("❌ Impossible d'initialiser l'application")
            return
        
        # Interface principale
        self.render_header()
        self.render_sidebar()
        self.render_error_messages()
        self.render_success_messages()
        
        # Navigation par onglets
        tab1, tab2, tab3 = st.tabs([
            "🚀 **Générateur**",
            "📚 **Mes Lettres**", 
            "⚙️ **Diagnostic**"
        ])
        
        with tab1:
            try:
                await self.generator_page.render(st.session_state.current_user_id)
            except PhoenixLettersException as e:
                st.error(f"❌ {e.message}")
                if e.details:
                    st.json(e.details)
            except Exception as e:
                logger.error(f"Erreur generator page: {e}")
                st.error(f"❌ Erreur inattendue: {e}")
        
        with tab2:
            await self.render_user_letters_tab()
        
        with tab3:
            await self.render_diagnostic_tab()
    
    async def render_user_letters_tab(self) -> None:
        """Onglet des lettres utilisateur"""
        st.markdown("### 📚 Mes Lettres de Motivation")
        
        try:
            # Récupération des lettres
            query = GetUserLettersQuery(
                user_id=st.session_state.current_user_id,
                include_stats=True,
                limit=20
            )
            
            result = await self.get_user_letters_use_case.execute(query)
            
            # Affichage des statistiques
            if result.statistics:
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Total Lettres", result.statistics.get("total", 0))
                with col2:
                    st.metric("Ce mois", result.statistics.get("this_month", 0))
                with col3:
                    st.metric("Finalisées", result.statistics.get("finalized", 0))
                with col4:
                    trend = result.statistics.get("productivity_trend", "stable")
                    st.metric("Tendance", trend)
            
            # Liste des lettres
            if result.letters:
                st.markdown("#### Lettres récentes")
                for letter in result.letters[:10]:  # Limiter à 10 pour la démo
                    with st.expander(f"📄 {letter.job_context.company_name if letter.job_context else 'Sans titre'} - {letter.status.value}"):
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.text(letter.content[:300] + "..." if len(letter.content) > 300 else letter.content)
                        with col2:
                            st.markdown(f"**Mots:** {letter.metadata.word_count}")
                            st.markdown(f"**Créée:** {letter.metadata.created_at.strftime('%d/%m/%Y')}")
                            if st.button(f"📥 Télécharger", key=f"download_{letter.id}"):
                                st.download_button(
                                    label="💾 Fichier TXT",
                                    data=letter.content,
                                    file_name=letter.get_filename(),
                                    mime="text/plain"
                                )
            else:
                st.info("🔍 Aucune lettre trouvée. Créez votre première lettre dans l'onglet Générateur !")
                
        except Exception as e:
            logger.error(f"Erreur onglet lettres: {e}")
            st.error(f"❌ Impossible de charger les lettres: {e}")
    
    async def render_diagnostic_tab(self) -> None:
        """Onglet diagnostic système"""
        st.markdown("### 🔍 Diagnostic Système")
        
        # Health checks
        with st.spinner("Vérification des services..."):
            
            # Service IA
            st.markdown("#### 🤖 Service IA")
            if self.ai_service.is_available():
                health = await self.ai_service.health_check()
                if health["status"] == "healthy":
                    st.success(f"✅ {self.ai_service.model_name} - {health['response_time_ms']}ms")
                else:
                    st.warning(f"⚠️ {health['status']}: {health.get('error', 'Unknown')}")
            else:
                st.error("❌ Service IA non disponible")
            
            # Configuration détaillée
            st.markdown("#### ⚙️ Configuration")
            config_summary = self.config.get_summary()
            st.json(config_summary)
            
            # Métriques de session
            st.markdown("#### 📊 Session Streamlit")
            session_info = {
                "session_id": st.runtime.scriptrunner.get_script_run_ctx().session_id if hasattr(st.runtime, 'scriptrunner') else "N/A",
                "timestamp": datetime.now().isoformat(),
                "errors_count": len(st.session_state.errors),
                "services_initialized": self._services_initialized,
            }
            st.json(session_info)


def main():
    """Point d'entrée principal avec gestion async"""
    try:
        app = PhoenixLettersApp()
        
        # Wrapper async pour Streamlit
        if "async_loop" not in st.session_state:
            st.session_state.async_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(st.session_state.async_loop)
        
        # Exécution asynchrone
        loop = st.session_state.async_loop
        loop.run_until_complete(app.run_async())
        
    except Exception as e:
        logger.error(f"❌ Erreur fatale application: {e}")
        st.error(f"❌ Erreur critique: {e}")
        st.markdown("### 🔧 Support")
        st.info("Si le problème persiste, contactez le support technique.")


if __name__ == "__main__":
    main()