"""
🤖 Phoenix CV - Service IA Gemini pour CV
Service spécialisé dans l'analyse et optimisation de CV
"""

import json
import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import asdict
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from shared.config.settings import config
from shared.exceptions.business_exceptions import AIServiceError, ProcessingError

logger = logging.getLogger(__name__)


class CVGeminiService:
    """
    🤖 Service IA Gemini spécialisé pour Phoenix CV
    Analyse, optimisation et insights pour CV professionnels
    """
    
    def __init__(self):
        """Initialisation du service Gemini"""
        if not config.ai.google_api_key:
            raise AIServiceError("GOOGLE_API_KEY manquant")
        
        try:
            genai.configure(api_key=config.ai.google_api_key)
            
            # Configuration du modèle principal
            self.model = genai.GenerativeModel(
                model_name=config.ai.model_name,
                generation_config={
                    "temperature": config.ai.temperature,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": config.ai.max_tokens,
                }
            )
            
            # Modèle premium pour analyses complexes
            self.premium_model = genai.GenerativeModel(
                model_name=config.ai.mirror_match_model,
                generation_config={
                    "temperature": 0.2,  # Plus conservative pour analyses
                    "top_p": 0.9,
                    "max_output_tokens": 4096,
                }
            )
            
            # Configuration sécurité
            self.safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
            
            logger.info("✅ CVGeminiService initialisé avec succès")
            
        except Exception as e:
            logger.error(f"❌ Erreur initialisation CVGeminiService: {e}")
            raise AIServiceError(f"Échec initialisation Gemini: {e}")
    
    async def analyze_job_description(self, 
                                    job_text: str, 
                                    job_title: str = "",
                                    company_name: str = "",
                                    industry: str = "") -> Dict[str, Any]:
        """
        🎯 Analyse approfondie d'une offre d'emploi
        """
        
        prompt = f"""
        Tu es un expert en recrutement avec 15 ans d'expérience dans l'analyse d'offres d'emploi.
        Analyse cette offre de manière exhaustive et professionnelle.
        
        OFFRE D'EMPLOI:
        Titre: {job_title}
        Entreprise: {company_name}
        Secteur: {industry}
        Description: {job_text}
        
        ANALYSE REQUISE (réponds uniquement en JSON valide):
        
        1. COMPÉTENCES TECHNIQUES (technologies, outils, langages)
        2. COMPÉTENCES COMPORTEMENTALES (soft skills)  
        3. EXPÉRIENCE REQUISE (années, types de postes)
        4. FORMATION ET CERTIFICATIONS
        5. RESPONSABILITÉS CLÉS
        6. MOTS-CLÉS ATS CRITIQUES
        7. CULTURE D'ENTREPRISE (valeurs, environnement)
        8. INDICATEURS SALAIRE (si mentionnés)
        9. NIVEAU DE DIFFICULTÉ DU POSTE (1-10)
        10. OPPORTUNITÉS D'ÉVOLUTION
        
        {{
            "job_analysis": {{
                "technical_skills": [
                    {{
                        "skill": "Python",
                        "category": "programming_language",
                        "importance": "critical",
                        "context": "Développement d'APIs REST",
                        "experience_level": "intermediate"
                    }}
                ],
                "soft_skills": [
                    {{
                        "skill": "Communication",
                        "importance": "high",
                        "context": "Collaboration équipe produit",
                        "indicators": ["présenter", "communiquer", "collaborer"]
                    }}
                ],
                "experience_requirements": {{
                    "years_required": 3,
                    "years_preferred": 5,
                    "role_types": ["Développeur Full-Stack", "Software Engineer"],
                    "industry_experience": "fintech",
                    "team_size_experience": "équipe de 5-10 personnes"
                }},
                "education_requirements": [
                    {{
                        "level": "bachelor",
                        "field": "Computer Science",
                        "alternatives": ["Engineering", "Mathematics"],
                        "required": true
                    }}
                ],
                "certifications": [
                    {{
                        "name": "AWS Solutions Architect",
                        "importance": "preferred",
                        "alternatives": ["Azure", "GCP equivalent"]
                    }}
                ],
                "key_responsibilities": [
                    "Développer et maintenir des applications web performantes",
                    "Collaborer avec les équipes produit et design",
                    "Optimiser les performances et la sécurité"
                ],
                "ats_keywords": {{
                    "critical": ["Python", "React", "API", "PostgreSQL"],
                    "important": ["Git", "Docker", "CI/CD", "Agile"],
                    "secondary": ["Test unitaire", "Clean Code", "Monitoring"]
                }},
                "company_culture": {{
                    "values": ["Innovation", "Collaboration", "Excellence"],
                    "work_environment": "Hybride (2-3 jours télétravail)",
                    "team_dynamics": "Équipe jeune et dynamique",
                    "growth_mindset": true
                }},
                "salary_indicators": {{
                    "range_mentioned": true,
                    "min_salary": 45000,
                    "max_salary": 65000,
                    "currency": "EUR",
                    "benefits": ["Tickets restaurant", "Mutuelle", "13ème mois"]
                }},
                "difficulty_assessment": {{
                    "overall_difficulty": 6,
                    "technical_complexity": 7,
                    "responsibility_level": 5,
                    "experience_barrier": 6,
                    "explanation": "Poste technique exigeant une solide expérience en développement"
                }},
                "growth_opportunities": [
                    "Évolution vers Lead Developer",
                    "Spécialisation architecture cloud",
                    "Management d'équipe technique"
                ],
                "red_flags": [],
                "competitive_advantages": [
                    "Stack technique moderne",
                    "Environnement de travail flexible",
                    "Projets innovants"
                ]
            }}
        }}
        """
        
        try:
            response = await self._generate_content_with_retry(prompt, use_premium=True)
            return json.loads(response)
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Erreur parsing JSON analyse job: {e}")
            return self._fallback_job_analysis(job_text, job_title, company_name)
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse job description: {e}")
            raise AIServiceError(f"Erreur analyse offre: {e}")
    
    async def analyze_cv_optimization(self, 
                                    cv_content: Dict[str, Any],
                                    target_job: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        🔥 Analyse d'optimisation CV avec recommandations IA
        """
        
        # Préparation du contexte CV
        cv_summary = self._prepare_cv_context(cv_content)
        job_context = self._prepare_job_context(target_job) if target_job else "Optimisation générale"
        
        prompt = f"""
        Tu es un expert en optimisation de CV et conseiller carrière senior.
        Analyse ce CV et fournis des recommandations d'optimisation détaillées.
        
        PROFIL CV:
        {cv_summary}
        
        POSTE CIBLE:
        {job_context}
        
        ANALYSE COMPLÈTE (JSON uniquement):
        
        {{
            "cv_optimization": {{
                "overall_assessment": {{
                    "current_score": 75,
                    "potential_score": 90,
                    "improvement_areas": ["Quantification des résultats", "Mots-clés ATS"],
                    "strengths": ["Expérience solide", "Progression de carrière claire"]
                }},
                "section_analysis": {{
                    "summary": {{
                        "score": 7,
                        "issues": ["Trop générique", "Manque de quantification"],
                        "suggestions": ["Ajouter métriques spécifiques", "Personnaliser selon le poste"]
                    }},
                    "experience": {{
                        "score": 8,
                        "issues": ["Certaines réalisations non quantifiées"],
                        "suggestions": ["Ajouter pourcentages et chiffres", "Utiliser verbes d'action impactants"]
                    }},
                    "skills": {{
                        "score": 6,
                        "issues": ["Mélange compétences techniques et soft skills"],
                        "suggestions": ["Séparer par catégories", "Prioriser selon le poste"]
                    }}
                }},
                "keyword_optimization": {{
                    "missing_keywords": ["Python", "Agile", "CI/CD"],
                    "keyword_density": 0.15,
                    "optimal_density": 0.25,
                    "strategic_placements": [
                        {{"keyword": "Python", "sections": ["skills", "experience"], "priority": "high"}},
                        {{"keyword": "Leadership", "sections": ["summary", "experience"], "priority": "medium"}}
                    ]
                }},
                "ats_compliance": {{
                    "score": 85,
                    "format_issues": ["Tableaux complexes dans expérience"],
                    "structure_recommendations": ["Utiliser bullet points simples", "Éviter colonnes multiples"],
                    "readability_score": 8.5
                }},
                "content_improvements": [
                    {{
                        "section": "summary",
                        "current": "Développeur expérimenté avec plusieurs années d'expérience",
                        "improved": "Développeur Full-Stack avec 5 ans d'expérience, spécialisé en Python/React. Augmentation de 40% des performances d'applications web pour 3 entreprises SaaS.",
                        "impact": "high",
                        "reasoning": "Spécificité, quantification et valeur ajoutée claire"
                    }}
                ],
                "achievement_enhancement": [
                    {{
                        "original": "Développé une application web",
                        "enhanced": "Conçu et développé une application web React/Python servant 10K+ utilisateurs quotidiens, réduisant le temps de traitement de 60%",
                        "techniques": ["Quantification", "Impact métier", "Spécification technique"]
                    }}
                ],
                "competitive_positioning": {{
                    "unique_selling_points": ["Leadership technique", "Innovation produit"],
                    "market_differentiation": ["Expertise full-stack rare", "Track record growth"],
                    "value_proposition": "Développeur senior capable de transformer les besoins business en solutions techniques performantes"
                }},
                "next_steps": [
                    {{
                        "action": "Quantifier toutes les réalisations principales",
                        "priority": "critical",
                        "estimated_time": "2 heures",
                        "impact": "Augmentation score ATS de 15-20 points"
                    }},
                    {{
                        "action": "Optimiser mots-clés pour le poste cible",
                        "priority": "high", 
                        "estimated_time": "1 heure",
                        "impact": "Amélioration correspondance de 25%"
                    }}
                ]
            }}
        }}
        """
        
        try:
            response = await self._generate_content_with_retry(prompt, use_premium=True)
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"❌ Erreur optimisation CV: {e}")
            raise AIServiceError(f"Erreur optimisation: {e}")
    
    async def analyze_skill_transferability(self, 
                                          current_skills: List[str],
                                          target_role: str,
                                          target_industry: str = "") -> Dict[str, Any]:
        """
        🎯 Analyse de transférabilité des compétences (comme Career Transition)
        """
        
        prompt = f"""
        Tu es un expert en transition professionnelle et analyse de compétences.
        Analyse la transférabilité de ces compétences vers le rôle cible.
        
        COMPÉTENCES ACTUELLES: {current_skills}
        RÔLE CIBLE: {target_role}
        INDUSTRIE CIBLE: {target_industry}
        
        Analyse JSON uniquement:
        
        {{
            "skill_transferability": {{
                "direct_matches": [
                    {{
                        "skill": "Python",
                        "transferability": "direct",
                        "confidence": 0.95,
                        "context_adaptation": "Directement applicable au développement backend",
                        "market_value": "high"
                    }}
                ],
                "adaptable_skills": [
                    {{
                        "skill": "Gestion de projet",
                        "transferability": "adaptable", 
                        "confidence": 0.8,
                        "adaptation_needed": "Apprentissage outils spécifiques à l'industrie",
                        "transfer_path": "Project management → Product management"
                    }}
                ],
                "skill_gaps": [
                    {{
                        "missing_skill": "Machine Learning",
                        "importance": "critical",
                        "learning_difficulty": "medium",
                        "time_to_acquire": "3-6 mois",
                        "learning_resources": ["Coursera ML Course", "Kaggle competitions"]
                    }}
                ],
                "competitive_advantages": [
                    "Combinaison unique technique + business",
                    "Expérience multi-industrie rare dans le domaine"
                ],
                "transition_strategy": {{
                    "immediate_actions": ["Mettre en avant compétences Python", "Créer portfolio ML"],
                    "short_term": ["Formation intensive ML", "Projets personnels data science"],
                    "long_term": ["Certification advanced ML", "Contribution open source"]
                }},
                "success_probability": 0.78,
                "transition_timeline": "6-12 mois"
            }}
        }}
        """
        
        try:
            response = await self._generate_content_with_retry(prompt)
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse transférabilité: {e}")
            raise AIServiceError(f"Erreur transférabilité: {e}")
    
    async def generate_ats_suggestions(self, 
                                     cv_content: Dict[str, Any],
                                     target_ats_system: str = "generic") -> Dict[str, Any]:
        """
        📊 Génération de suggestions ATS spécialisées
        """
        
        cv_text = self._extract_cv_text(cv_content)
        
        prompt = f"""
        Tu es un spécialiste des systèmes ATS (Applicant Tracking Systems).
        Analyse ce CV pour compatibilité ATS et fournis des suggestions d'optimisation.
        
        CV CONTENU:
        {cv_text[:2000]}...
        
        SYSTÈME ATS CIBLE: {target_ats_system}
        
        Analyse ATS complète (JSON):
        
        {{
            "ats_analysis": {{
                "compatibility_score": 75,
                "format_compliance": {{
                    "score": 80,
                    "issues": ["Tableaux complexes", "Mise en forme excessive"],
                    "fixes": ["Remplacer tableaux par listes", "Simplifier formatage"]
                }},
                "keyword_optimization": {{
                    "density": 0.18,
                    "optimal_range": [0.2, 0.3],
                    "missing_keywords": ["Agile", "Scrum", "REST API"],
                    "keyword_stuffing_risk": "low"
                }},
                "structure_analysis": {{
                    "sections_detected": ["Contact", "Résumé", "Expérience", "Formation"],
                    "missing_sections": ["Compétences", "Certifications"],
                    "section_order_optimal": true
                }},
                "readability": {{
                    "score": 8.2,
                    "bullet_points_usage": "good",
                    "sentence_length": "optimal",
                    "jargon_level": "appropriate"
                }},
                "critical_fixes": [
                    {{
                        "issue": "Coordonnées dans header non lisible par ATS",
                        "solution": "Déplacer coordonnées dans section texte standard",
                        "impact": "high",
                        "difficulty": "easy"
                    }}
                ],
                "optimization_suggestions": [
                    {{
                        "category": "keywords",
                        "suggestion": "Ajouter 'Python développement' dans résumé professionnel",
                        "expected_impact": "+5 points compatibilité",
                        "implementation": "Remplacer 'Programmeur Python' par 'Développeur Python expérimenté'"
                    }}
                ],
                "ats_specific_tips": {{
                    "workday": ["Éviter caractères spéciaux", "Format chronologique strict"],
                    "greenhouse": ["Optimiser pour mots-clés exacts", "Structure claire"],
                    "generic": ["Maximum compatibilité formats", "Lisibilité humaine prioritaire"]
                }},
                "score_breakdown": {{
                    "format": 80,
                    "keywords": 70,
                    "structure": 85,
                    "content": 75,
                    "readability": 82
                }}
            }}
        }}
        """
        
        try:
            response = await self._generate_content_with_retry(prompt)
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"❌ Erreur suggestions ATS: {e}")
            raise AIServiceError(f"Erreur ATS: {e}")
    
    async def _generate_content_with_retry(self, 
                                         prompt: str, 
                                         use_premium: bool = False,
                                         max_retries: int = 3) -> str:
        """Génération avec retry et gestion d'erreurs"""
        
        model = self.premium_model if use_premium else self.model
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        model.generate_content,
                        prompt,
                        safety_settings=self.safety_settings
                    ),
                    timeout=config.ai.timeout_seconds
                )
                
                if response.text:
                    return response.text.strip()
                else:
                    raise AIServiceError("Réponse vide de Gemini")
                    
            except asyncio.TimeoutError:
                last_error = f"Timeout après {config.ai.timeout_seconds}s"
                logger.warning(f"⏰ Timeout Gemini (tentative {attempt + 1})")
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"⚠️ Erreur Gemini (tentative {attempt + 1}): {e}")
                
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Backoff exponentiel
        
        raise AIServiceError(f"Échec après {max_retries} tentatives: {last_error}")
    
    def _prepare_cv_context(self, cv_content: Dict[str, Any]) -> str:
        """Prépare le contexte CV pour les prompts"""
        
        context_parts = []
        
        if cv_content.get("professional_title"):
            context_parts.append(f"Titre: {cv_content['professional_title']}")
        
        if cv_content.get("summary"):
            context_parts.append(f"Résumé: {cv_content['summary']}")
        
        if cv_content.get("experiences"):
            exp_summary = []
            for exp in cv_content["experiences"][:3]:  # Top 3 expériences
                exp_text = f"{exp.get('position', '')} chez {exp.get('company', '')}"
                if exp.get("achievements"):
                    exp_text += f" - {'; '.join(exp['achievements'][:2])}"
                exp_summary.append(exp_text)
            context_parts.append(f"Expériences clés: {' | '.join(exp_summary)}")
        
        if cv_content.get("skills"):
            skills_text = ", ".join([s.get("name", "") for s in cv_content["skills"][:10]])
            context_parts.append(f"Compétences: {skills_text}")
        
        return "\n".join(context_parts)
    
    def _prepare_job_context(self, job_data: Dict[str, Any]) -> str:
        """Prépare le contexte job pour les prompts"""
        
        if not job_data:
            return "Aucun poste cible spécifique"
        
        context_parts = []
        
        if job_data.get("job_title"):
            context_parts.append(f"Poste: {job_data['job_title']}")
        
        if job_data.get("company_name"):
            context_parts.append(f"Entreprise: {job_data['company_name']}")
        
        if job_data.get("key_requirements"):
            reqs = ", ".join(job_data["key_requirements"][:5])
            context_parts.append(f"Exigences clés: {reqs}")
        
        return "\n".join(context_parts) if context_parts else "Informations limitées sur le poste"
    
    def _extract_cv_text(self, cv_content: Dict[str, Any]) -> str:
        """Extrait le texte complet du CV"""
        
        text_parts = []
        
        # Résumé professionnel
        if cv_content.get("summary"):
            text_parts.append(cv_content["summary"])
        
        # Expériences
        if cv_content.get("experiences"):
            for exp in cv_content["experiences"]:
                exp_text = f"{exp.get('position', '')} {exp.get('company', '')} {exp.get('description', '')}"
                if exp.get("achievements"):
                    exp_text += " " + " ".join(exp["achievements"])
                text_parts.append(exp_text)
        
        # Formation
        if cv_content.get("education"):
            for edu in cv_content["education"]:
                edu_text = f"{edu.get('degree', '')} {edu.get('institution', '')} {edu.get('field_of_study', '')}"
                text_parts.append(edu_text)
        
        # Compétences
        if cv_content.get("skills"):
            skills_text = " ".join([s.get("name", "") for s in cv_content["skills"]])
            text_parts.append(skills_text)
        
        return "\n".join(text_parts)
    
    def _fallback_job_analysis(self, job_text: str, job_title: str, company_name: str) -> Dict[str, Any]:
        """Analyse basique en cas d'échec IA"""
        
        return {
            "job_analysis": {
                "technical_skills": [],
                "soft_skills": [],
                "experience_requirements": {
                    "years_required": 2,
                    "role_types": [job_title] if job_title else []
                },
                "education_requirements": [],
                "key_responsibilities": [],
                "ats_keywords": {"critical": [], "important": [], "secondary": []},
                "company_culture": {"values": [], "work_environment": "", "team_dynamics": ""},
                "salary_indicators": {"range_mentioned": False},
                "difficulty_assessment": {"overall_difficulty": 5},
                "growth_opportunities": []
            }
        }
    
    def is_available(self) -> bool:
        """Vérifie si le service est disponible"""
        return bool(config.ai.google_api_key)
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check du service"""
        
        try:
            test_response = await self._generate_content_with_retry(
                "Réponds simplement 'OK' pour confirmer que tu fonctionnes.",
                max_retries=1
            )
            
            return {
                "status": "healthy" if "OK" in test_response else "degraded",
                "model": config.ai.model_name,
                "premium_model": config.ai.mirror_match_model,
                "response_sample": test_response[:50]
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "model": config.ai.model_name
            }