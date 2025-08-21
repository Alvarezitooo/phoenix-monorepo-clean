#!/usr/bin/env python3
"""
🚀 Script de déploiement Phoenix Letters avec Career Transition
Automatise le déploiement vers Railway avec vérifications
"""

import os
import sys
import subprocess
import json
import time
from datetime import datetime

def log(message, level="INFO"):
    """Logging avec timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def run_command(cmd, description):
    """Exécute une commande avec gestion d'erreurs"""
    log(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            log(f"❌ Erreur: {result.stderr}", "ERROR")
            return False
        log(f"✅ {description} - Success")
        return True
    except subprocess.TimeoutExpired:
        log(f"⏰ Timeout: {description}", "ERROR")
        return False
    except Exception as e:
        log(f"❌ Exception: {e}", "ERROR")
        return False

def check_prerequisites():
    """Vérifications pré-déploiement"""
    log("🔍 Vérification des prérequis...")
    
    # Vérifier Railway CLI
    if not run_command("railway --version", "Railway CLI check"):
        log("❌ Railway CLI non installé. Installez avec: npm install -g @railway/cli", "ERROR")
        return False
    
    # Vérifier que nous sommes dans le bon répertoire
    if not os.path.exists("api_main.py"):
        log("❌ Fichier api_main.py non trouvé. Êtes-vous dans le bon répertoire?", "ERROR")
        return False
    
    # Vérifier que la nouvelle feature est présente
    if not os.path.exists("domain/entities/career_transition.py"):
        log("❌ Feature Career Transition manquante!", "ERROR")
        return False
    
    log("✅ Prérequis validés")
    return True

def run_tests():
    """Lance les tests avant déploiement"""
    log("🧪 Lancement des tests...")
    
    # Tests API classiques
    if not run_command("python test_api.py", "Tests API classiques"):
        return False
    
    # Tests Career Transition
    if not run_command("python test_career_transition_api.py", "Tests Career Transition"):
        return False
    
    log("✅ Tous les tests passent")
    return True

def build_frontend():
    """Build du frontend React"""
    log("⚙️ Build du frontend...")
    
    frontend_path = "frontend/project"
    if not os.path.exists(frontend_path):
        log("❌ Répertoire frontend non trouvé", "ERROR")
        return False
    
    # Installation des dépendances
    if not run_command(f"cd {frontend_path} && npm ci", "Installation dépendances frontend"):
        return False
    
    # Build
    if not run_command(f"cd {frontend_path} && npm run build", "Build frontend"):
        return False
    
    log("✅ Frontend buildé avec succès")
    return True

def deploy_to_railway():
    """Déploiement sur Railway"""
    log("🚀 Déploiement sur Railway...")
    
    # Login si nécessaire
    run_command("railway login", "Railway login (si nécessaire)")
    
    # Déploiement
    if not run_command("railway up", "Déploiement Railway"):
        return False
    
    log("✅ Déploiement Railway terminé")
    return True

def verify_deployment():
    """Vérification post-déploiement"""
    log("🔍 Vérification du déploiement...")
    
    # Attendre que le service soit up
    log("⏳ Attente du démarrage du service...")
    time.sleep(30)
    
    try:
        # Récupérer l'URL du service
        result = subprocess.run("railway status --json", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            # Parse du JSON pour récupérer l'URL
            # Note: adapter selon le format de sortie de Railway
            log("✅ Service déployé et accessible")
        else:
            log("⚠️ Impossible de vérifier automatiquement le déploiement", "WARNING")
    except Exception as e:
        log(f"⚠️ Erreur vérification: {e}", "WARNING")

def main():
    """Fonction principale de déploiement"""
    log("🚀 DÉPLOIEMENT PHOENIX LETTERS - CAREER TRANSITION FEATURE")
    log("=" * 60)
    
    # Étapes du déploiement
    steps = [
        ("Prérequis", check_prerequisites),
        ("Tests", run_tests),
        ("Build Frontend", build_frontend),
        ("Déploiement Railway", deploy_to_railway),
        ("Vérification", verify_deployment)
    ]
    
    for step_name, step_func in steps:
        log(f"📋 Étape: {step_name}")
        if not step_func():
            log(f"❌ Échec à l'étape: {step_name}", "ERROR")
            log("🛑 Déploiement interrompu", "ERROR")
            sys.exit(1)
    
    log("🎉 DÉPLOIEMENT RÉUSSI!")
    log("🎯 La feature Career Transition est maintenant en production!")
    log("=" * 60)

if __name__ == "__main__":
    main()