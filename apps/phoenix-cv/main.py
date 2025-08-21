"""
🎯 Phoenix CV - Clean Reset
Optimisation de CV - Interface Streamlit autonome
"""

import os
import asyncio
import streamlit as st
import httpx
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")
API_TOKEN = os.getenv("API_SECRET_TOKEN", "dev-token")

# Page config
st.set_page_config(
    page_title="Phoenix CV",
    page_icon="📄",
    layout="wide"
)

def main():
    st.title("📄 Phoenix CV")
    st.markdown("**Optimiseur de CV intelligent**")
    
    # Sidebar
    with st.sidebar:
        st.markdown("### 🔧 Configuration")
        st.code(f"Backend: {BACKEND_URL}")
        
        if st.button("🔍 Test Backend"):
            test_backend_connection()
    
    # Upload CV
    st.markdown("### 📤 Upload votre CV")
    uploaded_file = st.file_uploader(
        "Choisissez votre fichier CV",
        type=['pdf', 'docx', 'txt'],
        help="Formats supportés: PDF, DOCX, TXT"
    )
    
    if uploaded_file:
        st.success(f"✅ Fichier uploadé: {uploaded_file.name}")
        
        # Options d'optimisation
        st.markdown("### ⚙️ Options d'optimisation")
        
        col1, col2 = st.columns(2)
        
        with col1:
            job_target = st.text_input("🎯 Poste ciblé", placeholder="Ex: Data Scientist")
            industry = st.selectbox("🏭 Secteur", ["Tech", "Finance", "Santé", "Autre"])
        
        with col2:
            experience_level = st.selectbox("📈 Niveau", ["Junior", "Intermédiaire", "Senior"])
            optimization_type = st.selectbox("🔧 Type", ["ATS", "Humain", "Les deux"])
        
        if st.button("🚀 Optimiser le CV", type="primary"):
            optimize_cv(uploaded_file, job_target, industry, experience_level, optimization_type)

async def test_backend_connection():
    """Test la connexion au backend"""
    try:
        headers = {"Authorization": f"Bearer {API_TOKEN}"}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{BACKEND_URL}/health", headers=headers)
            
        if response.status_code == 200:
            st.success(f"✅ Backend connecté : {response.json()}")
        else:
            st.error(f"❌ Backend erreur {response.status_code}")
            
    except Exception as e:
        st.error(f"❌ Connexion échouée : {e}")

def optimize_cv(file, job_target, industry, experience_level, optimization_type):
    """Optimise le CV (placeholder)"""
    with st.spinner("🔄 Analyse et optimisation en cours..."):
        # TODO: Traitement du fichier + appel backend
        import time
        time.sleep(3)
        
        st.success("✅ CV optimisé !")
        
        # Résultats placeholder
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 📊 Score ATS")
            st.metric("Score", "85%", "+15%")
            st.progress(0.85)
        
        with col2:
            st.markdown("### 🎯 Mots-clés manquants")
            keywords = ["Python", "Machine Learning", "SQL", "Docker"]
            for kw in keywords:
                st.markdown(f"• **{kw}**")
        
        st.markdown("### 📄 CV Optimisé")
        st.info("🚧 Affichage du CV optimisé à implémenter")
        
        # Actions
        col1, col2, col3 = st.columns(3)
        with col1:
            st.download_button("💾 Télécharger", "CV optimisé...", "cv_optimise.pdf")
        with col2:
            if st.button("📧 Envoyer par email"):
                st.info("🚧 Email à implémenter")
        with col3:
            if st.button("🔄 Nouvelle optimisation"):
                st.rerun()

if __name__ == "__main__":
    main()
