#!/usr/bin/env python3
"""
🔥 Phoenix Letters - Clean Architecture Launcher
Script de lancement optimisé pour l'architecture Clean
"""

import sys
import os
import subprocess
from pathlib import Path

def setup_environment():
    """Configure l'environnement pour Phoenix Letters"""
    print("🔧 Configuration de l'environnement Phoenix...")
    
    # Vérification Python
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ requis")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} détecté")
    
    # Vérification des dépendances
    try:
        import streamlit
        import google.generativeai
        print("✅ Dépendances principales installées")
    except ImportError as e:
        print(f"❌ Dépendance manquante: {e}")
        print("💡 Installez avec: pip install -r requirements.txt")
        sys.exit(1)
    
    # Vérification configuration
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️ Fichier .env manquant")
        print("💡 Copiez .env.example vers .env et configurez vos clés API")
        
        # Création automatique d'un .env basique
        with open(".env", "w") as f:
            f.write("# Phoenix Letters Configuration\n")
            f.write("GOOGLE_API_KEY=your-google-api-key-here\n")
            f.write("ENVIRONMENT=development\n")
            f.write("DEBUG=true\n")
        print("📝 Fichier .env créé avec template de base")
    
    print("✅ Environment setup complet")

def test_architecture():
    """Teste l'architecture Clean avant lancement"""
    print("🏗️ Test de l'architecture Clean...")
    
    test_script = '''
import sys
sys.path.append(".")

try:
    # Test des couches
    from shared.config.settings import config
    from domain.entities.letter import Letter
    from domain.services.letter_service import LetterService
    from infrastructure.ai.gemini_service import GeminiService
    from application.use_cases.generate_letter_use_case import GenerateLetterUseCase
    from presentation.components.ui_components import PhoenixUIComponents
    
    print("✅ Toutes les couches Clean Architecture opérationnelles")
    
    # Test configuration
    config_summary = config.get_summary()
    print(f"✅ Config: {config_summary['app_name']} v{config_summary['version']}")
    
except Exception as e:
    print(f"❌ Erreur architecture: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
'''
    
    try:
        result = subprocess.run([sys.executable, "-c", test_script], 
                               capture_output=True, text=True, check=True)
        print(result.stdout.strip())
        print("✅ Architecture Clean validée")
    except subprocess.CalledProcessError as e:
        print(f"❌ Test architecture échoué: {e.stderr}")
        return False
    
    return True

def launch_streamlit():
    """Lance l'application Streamlit avec configuration optimisée"""
    print("🚀 Lancement de Phoenix Letters Clean Architecture...")
    
    # Configuration Streamlit optimisée
    streamlit_config = {
        "--server.port": "8501",
        "--server.address": "localhost", 
        "--server.headless": "false",
        "--browser.gatherUsageStats": "false",
        "--theme.base": "light",
        "--theme.primaryColor": "#667eea",
        "--theme.backgroundColor": "#ffffff",
        "--theme.secondaryBackgroundColor": "#f0f2f6"
    }
    
    # Construction commande
    cmd = ["streamlit", "run", "main_clean.py"]
    for key, value in streamlit_config.items():
        cmd.extend([key, value])
    
    print(f"📡 URL: http://localhost:8501")
    print("🔥 Phoenix Letters Clean Architecture prêt !")
    print("=" * 50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Arrêt de Phoenix Letters")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lancement Streamlit: {e}")

def show_banner():
    """Affiche la bannière Phoenix"""
    banner = """
    🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    
    ██████╗ ██╗  ██╗ ██████╗ ███████╗███╗   ██╗██╗██╗  ██╗
    ██╔══██╗██║  ██║██╔═══██╗██╔════╝████╗  ██║██║╚██╗██╔╝
    ██████╔╝███████║██║   ██║█████╗  ██╔██╗ ██║██║ ╚███╔╝ 
    ██╔═══╝ ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║██║ ██╔██╗ 
    ██║     ██║  ██║╚██████╔╝███████╗██║ ╚████║██║██╔╝ ██╗
    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝
    
                    LETTERS - CLEAN ARCHITECTURE
                    Générateur IA de Lettres de Motivation
    
    🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    """
    print(banner)

def show_architecture_info():
    """Affiche les informations d'architecture"""
    info = """
    🏗️  CLEAN ARCHITECTURE LAYERS:
    ├── 🎨 Presentation Layer    (UI Components, Pages)
    ├── 🚀 Application Layer     (Use Cases, Handlers) 
    ├── 🧠 Domain Layer          (Entities, Services)
    ├── 🔧 Infrastructure Layer  (AI, Database, External)
    └── 📊 Shared Layer          (Config, Utils, Exceptions)
    
    ✨ FEATURES:
    • Dependency Injection ✅
    • Repository Pattern ✅  
    • Use Cases Pattern ✅
    • Domain Services ✅
    • Typed Configuration ✅
    • Clean Error Handling ✅
    • Mock Repositories pour Demo ✅
    • Phoenix UI Design System ✅
    """
    print(info)

def main():
    """Point d'entrée principal"""
    show_banner()
    show_architecture_info()
    
    print("🎯 Étapes de lancement:")
    
    # 1. Setup environnement  
    setup_environment()
    
    # 2. Test architecture
    if not test_architecture():
        print("❌ Tests architecture échoués - arrêt")
        sys.exit(1)
    
    # 3. Lancement Streamlit
    launch_streamlit()

if __name__ == "__main__":
    main()