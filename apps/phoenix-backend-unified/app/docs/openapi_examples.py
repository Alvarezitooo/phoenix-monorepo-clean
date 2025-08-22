"""
📚 OpenAPI Examples pour Documentation Luna Hub
Exemples conformes aux Directives Oracle
"""

from typing import Dict, Any

# ============================================================================
# EXEMPLES POUR ENERGY MANAGEMENT
# ============================================================================

ENERGY_CHECK_EXAMPLES = {
    "utilisateur_standard": {
        "summary": "Utilisateur standard avec 75% d'énergie",
        "description": "Exemple typique d'un utilisateur Free avec énergie normale",
        "value": {
            "user_id": "user_123456"
        }
    },
    "utilisateur_unlimited": {
        "summary": "Utilisateur Luna Unlimited",
        "description": "Utilisateur avec abonnement illimité",
        "value": {
            "user_id": "premium_user_789"
        }
    }
}

ENERGY_CHECK_RESPONSE_EXAMPLES = {
    "standard_user": {
        "summary": "Réponse utilisateur standard",
        "value": {
            "success": True,
            "user_id": "user_123456",
            "current_energy": 75.0,
            "max_energy": 100.0,
            "percentage": 75.0,
            "can_perform_basic_action": True,
            "last_recharge": "2024-08-22T10:30:00Z",
            "total_consumed": 25.0,
            "subscription_type": "free"
        }
    },
    "unlimited_user": {
        "summary": "Réponse utilisateur Unlimited",
        "value": {
            "success": True,
            "user_id": "premium_user_789",
            "current_energy": 100.0,
            "max_energy": "infinity",
            "percentage": 100.0,
            "can_perform_basic_action": True,
            "last_recharge": None,
            "total_consumed": 0.0,
            "subscription_type": "unlimited"
        }
    }
}

CAN_PERFORM_EXAMPLES = {
    "action_simple": {
        "summary": "Action simple - Conseil rapide",
        "description": "Vérification pour une action basique (5% énergie)",
        "value": {
            "user_id": "user_123456",
            "action_name": "conseil_rapide"
        }
    },
    "action_complexe": {
        "summary": "Action complexe - Mirror Match",
        "description": "Vérification pour action avancée (30% énergie)",
        "value": {
            "user_id": "user_123456", 
            "action_name": "mirror_match"
        }
    }
}

CONSUME_EXAMPLES = {
    "lettre_motivation": {
        "summary": "Génération lettre de motivation",
        "description": "Consommation pour une lettre via Phoenix Letters",
        "value": {
            "user_id": "user_123456",
            "action_name": "lettre_motivation",
            "context": {
                "app_source": "letters",
                "offer_type": "CDI",
                "industry": "tech",
                "company": "startup"
            }
        }
    },
    "analyse_cv": {
        "summary": "Analyse CV complète",
        "description": "Consommation pour analyse CV via Phoenix CV",
        "value": {
            "user_id": "user_123456",
            "action_name": "analyse_cv_complete",
            "context": {
                "app_source": "cv",
                "cv_sections": ["experience", "skills", "education"],
                "target_role": "développeur senior"
            }
        }
    }
}

CONSUME_RESPONSE_EXAMPLES = {
    "success_standard": {
        "summary": "Consommation réussie - Utilisateur standard",
        "value": {
            "success": True,
            "transaction_id": "luna_1a2b3c4d_1692702000",
            "energy_consumed": 15.0,
            "energy_remaining": 60.0,
            "action": "lettre_motivation",
            "subscription_type": "free",
            "timestamp": "2024-08-22T12:00:00Z"
        }
    },
    "success_unlimited": {
        "summary": "Action réussie - Utilisateur Unlimited",
        "description": "Aucun décompte d'énergie mais événement enregistré",
        "value": {
            "success": True,
            "transaction_id": "luna_5e6f7g8h_1692702060", 
            "energy_consumed": 0.0,
            "energy_remaining": 100.0,
            "action": "mirror_match",
            "subscription_type": "unlimited",
            "timestamp": "2024-08-22T12:01:00Z"
        }
    }
}

PURCHASE_EXAMPLES = {
    "cafe_luna": {
        "summary": "Achat Café Luna",
        "description": "Pack d'entrée pour utilisateurs occasionnels",
        "value": {
            "user_id": "user_123456",
            "pack_type": "cafe_luna",
            "stripe_payment_intent_id": "pi_1234567890abcdef"
        }
    },
    "luna_unlimited": {
        "summary": "Abonnement Luna Unlimited",
        "description": "Passage à l'abonnement illimité mensuel",
        "value": {
            "user_id": "user_123456",
            "pack_type": "luna_unlimited",
            "stripe_payment_intent_id": "pi_premium_abcdef123456"
        }
    }
}

# ============================================================================
# ERREURS COMMUNES
# ============================================================================

ERROR_EXAMPLES = {
    "insufficient_energy": {
        "summary": "Énergie insuffisante", 
        "description": "L'utilisateur n'a pas assez d'énergie pour l'action",
        "value": {
            "detail": {
                "error": "insufficient_energy",
                "message": "Énergie insuffisante. Requis: 30%, Disponible: 15%",
                "action": "recharge_energy"
            }
        }
    },
    "invalid_user_id": {
        "summary": "ID utilisateur invalide",
        "description": "Security Guardian a détecté un format d'ID non conforme",
        "value": {
            "detail": "Invalid user ID format"
        }
    },
    "malicious_input": {
        "summary": "Input malveillant détecté",
        "description": "Security Guardian a bloqué un contenu suspect",
        "value": {
            "detail": "Potentially malicious content detected"
        }
    }
}

# ============================================================================
# SCHÉMAS POUR LA GRILLE ORACLE
# ============================================================================

ENERGY_COSTS_EXAMPLE = {
    "success": True,
    "energy_costs": {
        "conseil_rapide": 5,
        "correction_ponctuelle": 5,
        "format_lettre": 8,
        "lettre_motivation": 15,
        "optimisation_cv": 12,
        "analyse_offre": 10,
        "analyse_cv_complete": 25,
        "mirror_match": 30,
        "strategie_candidature": 35,
        "audit_complet_profil": 45,
        "plan_reconversion": 50,
        "simulation_entretien": 40
    },
    "energy_packs": {
        "cafe_luna": {
            "price_euro": 2.99,
            "energy_amount": 100.0,
            "bonus_first_purchase": 10.0,
            "name": "Café Luna",
            "pack_type": "cafe_luna"
        },
        "luna_unlimited": {
            "price_euro": 29.99,
            "energy_amount": "infinity",
            "bonus_first_purchase": 0.0,
            "name": "Luna Unlimited",
            "pack_type": "luna_unlimited"
        }
    },
    "currency": "EUR"
}