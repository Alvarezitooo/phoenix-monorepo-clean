"""
Phoenix Letters - Service Autonome
Générateur de lettres de motivation avec IA Gemini
ZERO shared dependencies - 100% autonome
"""

import os
import logging
import streamlit as st
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

# Load configuration
load_dotenv()

# Configuration autonome
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Page config
st.set_page_config(
    page_title="Phoenix Letters",
    page_icon="📝", 
    layout="wide"
)


class LetterGenerator:
    """Générateur de lettres 100% autonome"""
    
    def __init__(self):
        self.model = None
        if GOOGLE_API_KEY:
            try:
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("✅ Gemini client initialisé")
            except Exception as e:
                logger.error(f"❌ Erreur Gemini: {e}")
    
    def is_available(self):
        return self.model is not None
    
    def generate_letter(self, company: str, position: str, description: str = "", 
                       experience: str = "Intermédiaire", tone: str = "Professionnel"):
        """Génération autonome avec Gemini"""
        
        if not self.is_available():
            return self._fallback_letter(company, position, experience)
        
        prompt = f"""
Génère une lettre de motivation professionnelle pour:

- Entreprise: {company}
- Poste: {position}
- Description du poste: {description}
- Niveau d'expérience: {experience}
- Ton souhaité: {tone}

Instructions:
- Lettre complète avec objet, introduction, développement, conclusion
- Ton {tone.lower()} mais professionnel
- Mentionne des compétences pertinentes pour le poste
- Maximum 300 mots
- Format prêt à envoyer

Retourne uniquement la lettre, sans commentaires.
        """
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                logger.info(f"✅ Lettre générée pour {company}")
                return response.text.strip()
            else:
                return self._fallback_letter(company, position, experience)
        except Exception as e:
            logger.error(f"❌ Erreur génération: {e}")
            return self._fallback_letter(company, position, experience)
    
    def _fallback_letter(self, company: str, position: str, experience: str):
        """Lettre de secours autonome"""
        return f"""Objet : Candidature pour le poste de {position}

Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de {position} au sein de {company}.

Fort(e) d'une expérience {experience.lower()}, je suis convaincu(e) que mes compétences et ma motivation s'alignent parfaitement avec les exigences de ce poste.

Mon parcours professionnel m'a permis de développer une expertise solide que je souhaiterais mettre au service de votre équipe. Je suis particulièrement intéressé(e) par les défis que présente ce rôle et par l'opportunité de contribuer au succès de {company}.

Je serais ravi(e) de vous rencontrer pour discuter de ma candidature et de la façon dont je peux apporter une valeur ajoutée à votre organisation.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre nom]

---
Générée par Phoenix Letters - Service Autonome"""


# Instance globale
generator = LetterGenerator()


def main():
    """Interface principale autonome"""
    
    # Header
    st.title("📝 Phoenix Letters")
    st.markdown("**Générateur autonome de lettres de motivation avec IA**")
    
    # Status IA dans sidebar
    with st.sidebar:
        st.markdown("### 🤖 Status IA")
        if generator.is_available():
            st.success("✅ Gemini: Opérationnel")
        else:
            st.error("❌ Gemini: Indisponible")
            st.info("💡 Configurez GOOGLE_API_KEY dans .env")
        
        st.markdown("---")
        st.markdown("### ℹ️ Service")
        st.info("🚀 Version 100% autonome")
        st.info("❌ Zéro shared dependencies")
    
    # Interface génération
    st.markdown("### ✨ Nouvelle lettre de motivation")
    
    with st.form("letter_form"):
        # Champs principaux
        col1, col2 = st.columns(2)
        
        with col1:
            company = st.text_input(
                "🏢 Entreprise *", 
                placeholder="Ex: Google, Microsoft, Startup X..."
            )
            position = st.text_input(
                "💼 Poste *", 
                placeholder="Ex: Développeur, Chef de projet..."
            )
        
        with col2:
            experience = st.selectbox(
                "📈 Expérience",
                ["Junior (0-2 ans)", "Intermédiaire (2-5 ans)", "Senior (5+ ans)"]
            )
            tone = st.selectbox(
                "🎭 Ton de la lettre",
                ["Professionnel", "Enthousiaste", "Créatif", "Décontracté"]
            )
        
        # Description optionnelle
        description = st.text_area(
            "📋 Description du poste (optionnel)",
            placeholder="Collez ici la description du poste pour une lettre plus précise...",
            height=100
        )
        
        # Génération
        generate = st.form_submit_button(
            "🚀 Générer ma lettre",
            type="primary"
        )
    
    # Process génération
    if generate:
        if not company or not position:
            st.error("❌ Veuillez renseigner au moins l'entreprise et le poste")
            return
        
        with st.spinner("🤖 Génération en cours..."):
            letter = generator.generate_letter(
                company=company,
                position=position, 
                description=description,
                experience=experience.split(" ")[0],  # Extraire "Junior", "Intermédiaire", etc.
                tone=tone
            )
        
        # Affichage résultat
        if generator.is_available():
            st.success("✅ Lettre générée par IA Gemini !")
        else:
            st.warning("⚠️ Lettre générée en mode secours (IA indisponible)")
        
        # Zone lettre avec actions
        st.markdown("### 📄 Votre lettre de motivation")
        
        st.text_area(
            label="",
            value=letter,
            height=400,
            key="generated_letter"
        )
        
        # Actions
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Nom fichier intelligent
            filename = f"lettre_{company.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.txt"
            st.download_button(
                label="💾 Télécharger",
                data=letter,
                file_name=filename,
                mime="text/plain"
            )
        
        with col2:
            if st.button("🔄 Régénérer"):
                st.rerun()
        
        with col3:
            if st.button("✏️ Modifier"):
                st.info("💡 Vous pouvez éditer directement dans la zone de texte ci-dessus")
        
        # Stats simples
        word_count = len(letter.split())
        st.caption(f"📊 {word_count} mots • Générée le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")


if __name__ == "__main__":
    main()