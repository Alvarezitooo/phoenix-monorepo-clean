"""
🎭 Luna Voice Consistency Validator
Phoenix Production - Enterprise Quality

Validation que chaque réponse respecte strictement l'ADN Luna.
Système de scoring et correction automatique.
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import re

@dataclass
class ValidationResult:
    """Résultat de validation d'une réponse Luna"""
    is_valid: bool
    score: float
    passed_checks: List[str]
    failed_checks: List[str]
    suggestions: List[str]
    corrected_response: Optional[str] = None

class ValidationSeverity(Enum):
    """Niveaux de sévérité pour la validation"""
    STRICT = 0.9      # Production - 90% des critères
    STANDARD = 0.7    # Développement - 70% des critères  
    PERMISSIVE = 0.5  # Tests - 50% des critères

class LunaVoiceValidator:
    """
    🎭 Validateur de cohérence vocale Luna
    
    S'assure que chaque réponse générée respecte l'ADN Luna défini
    dans luna_personality_engine.py
    """
    
    # 🎯 Critères de validation avec poids
    VALIDATION_CRITERIA = {
        "has_enthusiasm": {
            "weight": 0.2,
            "description": "Présence de mots enthousiastes",
            "keywords": ["super", "excellent", "parfait", "génial", "top", "bravo", "nickel"]
        },
        
        "has_luna_signature": {
            "weight": 0.15, 
            "description": "Présence emojis/expressions Luna",
            "patterns": ["🌙", "✨", "🚀", "💪", "🎯", "⚡", "Luna"]
        },
        
        "positive_vocabulary": {
            "weight": 0.2,
            "description": "Vocabulaire positif",
            "forbidden": ["compliqué", "difficile", "impossible", "problème", "échec", "nul"],
            "preferred": ["défi", "intéressant", "ambitieux", "apprentissage", "opportunité"]
        },
        
        "encouragement_present": {
            "weight": 0.15,
            "description": "Présence d'encouragement",
            "patterns": ["tu peux", "on y va", "ensemble", "je suis là", "tu gères", "on va y arriver"]
        },
        
        "user_reference": {
            "weight": 0.1,
            "description": "Référence personnalisée à l'utilisateur",
            "optional": True  # Pas toujours nécessaire
        },
        
        "appropriate_length": {
            "weight": 0.1,
            "description": "Longueur appropriée",
            "min_chars": 30,
            "max_chars": 800
        },
        
        "conversational_tone": {
            "weight": 0.1,
            "description": "Ton conversationnel",
            "indicators": ["?", "!", "on", "tu", "nous", "ensemble"]
        }
    }

    def __init__(self, severity: ValidationSeverity = ValidationSeverity.STANDARD):
        self.severity = severity
        self.threshold = severity.value

    def validate_response(self, response: str, user_context: Dict = None, specialist: str = None, context_type: str = None) -> ValidationResult:
        """
        🔍 Validation complète d'une réponse Luna
        
        Args:
            response: Réponse à valider
            user_context: Contexte utilisateur (optionnel)
            specialist: Spécialiste origine (optionnel)
            context_type: Type de contexte (optionnel)
            
        Returns:
            ValidationResult avec score et suggestions
        """
        if not response or not response.strip():
            return ValidationResult(
                is_valid=False,
                score=0.0,
                passed_checks=[],
                failed_checks=["empty_response"],
                suggestions=["La réponse ne peut pas être vide"]
            )

        # Exécuter tous les critères
        check_results = {}
        total_score = 0.0
        max_possible_score = 0.0

        for criterion_name, criterion_config in self.VALIDATION_CRITERIA.items():
            weight = criterion_config["weight"]
            max_possible_score += weight
            
            if criterion_config.get("optional", False) and not user_context:
                continue  # Skip les critères optionnels sans contexte
                
            check_result = self._check_criterion(response, criterion_name, criterion_config, user_context)
            check_results[criterion_name] = check_result
            
            if check_result["passed"]:
                total_score += weight

        # Calculer score final
        final_score = total_score / max_possible_score if max_possible_score > 0 else 0.0
        is_valid = final_score >= self.threshold

        # Séparer passed/failed
        passed_checks = [name for name, result in check_results.items() if result["passed"]]
        failed_checks = [name for name, result in check_results.items() if not result["passed"]]

        # Générer suggestions
        suggestions = self._generate_suggestions(failed_checks, check_results, response)

        # Générer correction automatique si nécessaire
        corrected_response = None
        if not is_valid and self.severity != ValidationSeverity.PERMISSIVE:
            corrected_response = self._auto_correct_response(response, failed_checks, user_context)

        return ValidationResult(
            is_valid=is_valid,
            score=final_score,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            suggestions=suggestions,
            corrected_response=corrected_response
        )

    def _check_criterion(self, response: str, criterion_name: str, config: Dict, user_context: Dict = None) -> Dict:
        """Vérification d'un critère spécifique"""
        response_lower = response.lower()
        
        if criterion_name == "has_enthusiasm":
            keywords = config["keywords"]
            found = [kw for kw in keywords if kw in response_lower]
            return {
                "passed": len(found) > 0,
                "details": f"Mots trouvés: {found}" if found else "Aucun mot enthousiaste trouvé",
                "found_items": found
            }
            
        elif criterion_name == "has_luna_signature":
            patterns = config["patterns"]
            found = [p for p in patterns if p.lower() in response_lower or p in response]
            return {
                "passed": len(found) > 0,
                "details": f"Signatures trouvées: {found}" if found else "Aucune signature Luna",
                "found_items": found
            }
            
        elif criterion_name == "positive_vocabulary":
            forbidden = config["forbidden"]
            found_negative = [word for word in forbidden if word in response_lower]
            return {
                "passed": len(found_negative) == 0,
                "details": f"Mots négatifs trouvés: {found_negative}" if found_negative else "Vocabulaire positif ✅",
                "found_negative": found_negative
            }
            
        elif criterion_name == "encouragement_present":
            patterns = config["patterns"]
            found = [p for p in patterns if p in response_lower]
            return {
                "passed": len(found) > 0,
                "details": f"Encouragements: {found}" if found else "Manque d'encouragement",
                "found_items": found
            }
            
        elif criterion_name == "user_reference":
            if not user_context:
                return {"passed": True, "details": "Pas de contexte utilisateur"}
            
            user_name = user_context.get("name") or ""
            if not user_name:
                return {"passed": True, "details": "Pas de nom utilisateur"}
            user_name = user_name.lower()
                
            has_reference = user_name in response_lower
            return {
                "passed": has_reference,
                "details": f"Référence à '{user_name}': {'✅' if has_reference else '❌'}"
            }
            
        elif criterion_name == "appropriate_length":
            length = len(response)
            min_chars = config["min_chars"]
            max_chars = config["max_chars"]
            is_appropriate = min_chars <= length <= max_chars
            return {
                "passed": is_appropriate,
                "details": f"Longueur: {length} chars (min: {min_chars}, max: {max_chars})",
                "actual_length": length
            }
            
        elif criterion_name == "conversational_tone":
            indicators = config["indicators"]
            found = [ind for ind in indicators if ind in response_lower]
            has_conversation_markers = len(found) >= 2  # Au moins 2 marqueurs
            return {
                "passed": has_conversation_markers,
                "details": f"Marqueurs conversationnels: {found}",
                "found_items": found
            }
            
        return {"passed": False, "details": "Critère non implémenté"}

    def _generate_suggestions(self, failed_checks: List[str], check_results: Dict, response: str) -> List[str]:
        """Génération de suggestions d'amélioration"""
        suggestions = []
        
        if "has_enthusiasm" in failed_checks:
            suggestions.append("➕ Ajouter des mots enthousiastes: 'super', 'excellent', 'parfait'")
            
        if "has_luna_signature" in failed_checks:
            suggestions.append("🌙 Ajouter l'emoji Luna ou mentionner 'Luna'")
            
        if "positive_vocabulary" in failed_checks:
            negative_words = check_results.get("positive_vocabulary", {}).get("found_negative", [])
            suggestions.append(f"🔄 Remplacer mots négatifs: {', '.join(negative_words)} par alternatives positives")
            
        if "encouragement_present" in failed_checks:
            suggestions.append("💪 Ajouter encouragement: 'tu peux', 'on y va', 'ensemble'")
            
        if "appropriate_length" in failed_checks:
            actual_length = check_results.get("appropriate_length", {}).get("actual_length", 0)
            if actual_length < 30:
                suggestions.append("📝 Étoffer la réponse (trop courte)")
            else:
                suggestions.append("✂️ Raccourcir la réponse (trop longue)")
                
        if "conversational_tone" in failed_checks:
            suggestions.append("💬 Rendre plus conversationnel: questions, exclamations, 'tu', 'on'")

        return suggestions

    def _auto_correct_response(self, response: str, failed_checks: List[str], user_context: Dict = None) -> str:
        """Correction automatique basique de la réponse"""
        corrected = response
        
        # Ajouter emoji Luna si manquant
        if "has_luna_signature" in failed_checks and "🌙" not in corrected:
            if "Luna" in corrected:
                corrected = corrected.replace("Luna", "Luna 🌙", 1)
            else:
                corrected = "🌙 " + corrected
                
        # Ajouter encouragement si manquant
        if "encouragement_present" in failed_checks:
            if not corrected.endswith("!"):
                corrected += " Tu vas y arriver ! 💪"
            else:
                corrected += " 💪"
                
        # Remplacer vocabulaire négatif
        if "positive_vocabulary" in failed_checks:
            replacements = {
                "compliqué": "intéressant",
                "difficile": "challengeant", 
                "impossible": "ambitieux",
                "problème": "défi"
            }
            for negative, positive in replacements.items():
                corrected = re.sub(rf'\b{negative}\b', positive, corrected, flags=re.IGNORECASE)

        # Ajouter enthousiasme si manquant
        if "has_enthusiasm" in failed_checks:
            if not any(word in corrected.lower() for word in ["super", "excellent", "parfait"]):
                corrected = "Super ! " + corrected
                
        return corrected

    def get_validation_report(self, validation_result: ValidationResult) -> str:
        """
        📊 Génère un rapport de validation détaillé
        """
        status = "✅ VALIDÉ" if validation_result.is_valid else "❌ ÉCHEC"
        score_pct = f"{validation_result.score:.1%}"
        
        report_lines = [
            f"🎭 VALIDATION LUNA VOICE",
            f"Status: {status} | Score: {score_pct}",
            f"Seuil: {self.threshold:.1%} | Critères passés: {len(validation_result.passed_checks)}/{len(validation_result.passed_checks) + len(validation_result.failed_checks)}",
            ""
        ]
        
        if validation_result.passed_checks:
            report_lines.append("✅ CRITÈRES RESPECTÉS:")
            for check in validation_result.passed_checks:
                report_lines.append(f"  • {check}")
            report_lines.append("")
            
        if validation_result.failed_checks:
            report_lines.append("❌ CRITÈRES ÉCHOUÉS:")
            for check in validation_result.failed_checks:
                report_lines.append(f"  • {check}")
            report_lines.append("")
            
        if validation_result.suggestions:
            report_lines.append("💡 SUGGESTIONS:")
            for suggestion in validation_result.suggestions:
                report_lines.append(f"  {suggestion}")
                
        return "\n".join(report_lines)

# Instance globale pour import direct
luna_voice_validator = LunaVoiceValidator()