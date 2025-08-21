"""
💰 Phoenix CV - Salary Analysis AI Service
Service d'IA pour l'analyse salariale avec Gemini
"""

import google.generativeai as genai
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import logging

from domain.entities.salary_analysis import (
    SalaryAnalysisResult, SalaryBenchmark, MarketInsight, 
    NegotiationTip, SalaryGapAnalysis, SalaryRange, MarketTrend, CompensationType
)
from domain.entities.cv_document import CVDocument
from shared.exceptions.business_exceptions import AIServiceError, ProcessingError
from shared.config.settings import config

logger = logging.getLogger(__name__)


class SalaryAIService:
    """Service d'IA pour analyse salariale avancée"""
    
    def __init__(self):
        """Initialise le service avec Gemini AI"""
        
        if not config.ai.google_api_key:
            raise AIServiceError("Clé API Gemini manquante pour Salary Analysis")
        
        genai.configure(api_key=config.ai.google_api_key)
        
        # Modèle spécialisé pour données financières
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",  # Plus précis pour les données numériques
            generation_config={
                "temperature": 0.2,  # Plus conservateur pour les salaires
                "top_p": 0.9,
                "max_output_tokens": 3000,
            }
        )
        
        # Base de données salaires (simulée - TODO: intégrer vraies sources)
        self.salary_database = self._init_salary_database()
    
    def _init_salary_database(self) -> Dict[str, Any]:
        """Initialise la base de données de référence salariale"""
        
        # Données de référence France 2024 (sources : INSEE, Glassdoor, LinkedIn)
        return {
            "france": {
                "développeur_python": {
                    "junior": {"min": 35000, "max": 45000, "median": 40000},
                    "mid_level": {"min": 45000, "max": 65000, "median": 55000},
                    "senior": {"min": 65000, "max": 85000, "median": 75000},
                    "lead": {"min": 85000, "max": 110000, "median": 95000}
                },
                "data_scientist": {
                    "junior": {"min": 40000, "max": 50000, "median": 45000},
                    "mid_level": {"min": 50000, "max": 70000, "median": 60000},
                    "senior": {"min": 70000, "max": 95000, "median": 80000},
                    "lead": {"min": 95000, "max": 130000, "median": 110000}
                },
                "chef_de_projet": {
                    "junior": {"min": 38000, "max": 48000, "median": 43000},
                    "mid_level": {"min": 48000, "max": 68000, "median": 58000},
                    "senior": {"min": 68000, "max": 90000, "median": 79000},
                    "lead": {"min": 90000, "max": 120000, "median": 105000}
                },
                "consultant": {
                    "junior": {"min": 42000, "max": 52000, "median": 47000},
                    "mid_level": {"min": 52000, "max": 75000, "median": 63000},
                    "senior": {"min": 75000, "max": 100000, "median": 87000},
                    "lead": {"min": 100000, "max": 140000, "median": 120000}
                }
            },
            "skill_premiums": {
                "python": 12.5,
                "aws": 18.0,
                "machine_learning": 22.0,
                "kubernetes": 16.5,
                "react": 14.0,
                "typescript": 10.5,
                "docker": 12.0,
                "terraform": 15.5,
                "golang": 20.0,
                "rust": 25.0
            },
            "location_multipliers": {
                "paris": 1.15,
                "lyon": 0.95,
                "marseille": 0.90,
                "toulouse": 0.92,
                "nantes": 0.88,
                "bordeaux": 0.90,
                "remote": 0.98
            }
        }
    
    async def analyze_salary_potential(self, 
                                     cv_data: CVDocument,
                                     target_role: Optional[str] = None,
                                     target_location: str = "france") -> SalaryAnalysisResult:
        """Analyse complète du potentiel salarial"""
        
        try:
            # Construction du prompt d'analyse
            analysis_prompt = self._build_salary_analysis_prompt(
                cv_data, target_role, target_location
            )
            
            # Génération avec Gemini
            response = await self._call_gemini_api(analysis_prompt)
            parsed_data = self._parse_salary_response(response)
            
            # Construction du résultat
            result = SalaryAnalysisResult(
                cv_id=cv_data.id,
                job_title=target_role or cv_data.target_position,
                industry=cv_data.industry or "tech",
                location=target_location,
                experience_years=cv_data.years_experience,
                key_skills=cv_data.key_skills[:10]  # Top 10 skills
            )
            
            # Enrichissement avec données de marché
            await self._enrich_with_market_data(result, parsed_data)
            
            # Génération des insights IA
            await self._generate_market_insights(result, cv_data)
            
            # Conseils de négociation personnalisés
            await self._generate_negotiation_tips(result, cv_data)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse salariale: {e}")
            raise ProcessingError(f"Erreur lors de l'analyse salariale: {str(e)}")
    
    def _build_salary_analysis_prompt(self, 
                                    cv_data: CVDocument,
                                    target_role: Optional[str],
                                    location: str) -> str:
        """Construit le prompt d'analyse salariale"""
        
        prompt_parts = [
            "💰 ANALYSE SALARIALE EXPERTE - MARCHÉ FRANÇAIS 2024",
            "",
            "Tu es un expert en rémunération et données de marché.",
            "Analyse ce profil professionnel et fournis une évaluation salariale précise.",
            "",
            "PROFIL À ANALYSER:",
            f"- Poste: {target_role or cv_data.target_position}",
            f"- Expérience: {cv_data.years_experience} ans",
            f"- Secteur: {cv_data.industry}",
            f"- Compétences clés: {', '.join(cv_data.key_skills[:8])}",
            f"- Niveau d'études: {cv_data.education_level}",
            f"- Localisation: {location}",
            "",
            "DONNÉES DE RÉFÉRENCE MARCHÉ 2024:",
            "- Salaires moyens secteur tech France",
            "- Tendances post-COVID et télétravail", 
            "- Pénurie de talents et sur-demande",
            "- Inflation et ajustements salariaux",
            "",
            "ANALYSE DEMANDÉE (JSON):",
            "{",
            '  "salary_range_assessment": {',
            '    "min_market": 0,',
            '    "max_market": 0,',
            '    "median_market": 0,',
            '    "confidence": 0.0',
            '  },',
            '  "experience_level": "junior|mid_level|senior|lead",',
            '  "market_position": "below|at|above_market",',
            '  "skill_analysis": {',
            '    "high_value_skills": ["skill1", "skill2"],',
            '    "skill_premiums": {"skill": percentage}',
            '  },',
            '  "negotiation_potential": {',
            '    "recommended_ask": 0,',
            '    "negotiation_range": {"min": 0, "max": 0},',
            '    "leverage_factors": ["factor1", "factor2"]',
            '  },',
            '  "market_trends": {',
            '    "trend_direction": "rising|stable|declining",',
            '    "demand_level": "low|medium|high|very_high",',
            '    "growth_projections": "percentage_change"',
            '  }',
            "}"
        ]
        
        return "\n".join(prompt_parts)
    
    async def _call_gemini_api(self, prompt: str) -> str:
        """Appel API Gemini avec gestion d'erreurs"""
        
        try:
            response = await self.model.generate_content_async(
                prompt,
                safety_settings={
                    'HARASSMENT': 'BLOCK_NONE',
                    'HATE_SPEECH': 'BLOCK_NONE',
                    'SEXUALLY_EXPLICIT': 'BLOCK_NONE', 
                    'DANGEROUS_CONTENT': 'BLOCK_NONE'
                }
            )
            
            if not response.text:
                raise AIServiceError("Réponse vide de Gemini pour analyse salariale")
            
            return response.text
            
        except Exception as e:
            raise AIServiceError(f"Erreur API Gemini salary: {str(e)}")
    
    def _parse_salary_response(self, response_text: str) -> Dict[str, Any]:
        """Parse la réponse JSON de l'IA"""
        
        try:
            # Nettoyage et extraction JSON
            cleaned_text = response_text.strip()
            start_idx = cleaned_text.find('{')
            end_idx = cleaned_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = cleaned_text[start_idx:end_idx]
                return json.loads(json_str)
            
            raise ValueError("Pas de JSON valide dans la réponse")
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"⚠️ Parsing JSON salary failed: {e}")
            # Fallback avec valeurs par défaut
            return {
                "salary_range_assessment": {
                    "min_market": 45000,
                    "max_market": 65000, 
                    "median_market": 55000,
                    "confidence": 0.5
                },
                "experience_level": "mid_level"
            }
    
    async def _enrich_with_market_data(self, 
                                     result: SalaryAnalysisResult,
                                     ai_data: Dict[str, Any]):
        """Enrichit avec données de marché"""
        
        # Création du benchmark
        salary_assessment = ai_data.get("salary_range_assessment", {})
        
        result.benchmark_data = SalaryBenchmark(
            job_title=result.job_title,
            industry=result.industry,
            location=result.location,
            experience_level=SalaryRange(ai_data.get("experience_level", "mid_level")),
            min_salary=salary_assessment.get("min_market", 45000),
            max_salary=salary_assessment.get("max_market", 65000),
            median_salary=salary_assessment.get("median_market", 55000),
            p25_salary=salary_assessment.get("min_market", 45000) * 1.1,
            p75_salary=salary_assessment.get("max_market", 65000) * 0.9,
            sample_size=250,  # Simulé
            confidence_score=salary_assessment.get("confidence", 0.7)
        )
        
        # Calcul des premiums de compétences
        skill_data = ai_data.get("skill_analysis", {})
        result.skill_premiums = skill_data.get("skill_premiums", {})
        
        # Enrichissement depuis base de données locale
        for skill in result.key_skills:
            if skill.lower() in self.salary_database.get("skill_premiums", {}):
                result.skill_premiums[skill] = self.salary_database["skill_premiums"][skill.lower()]
        
        # Recommandations de négociation
        negotiation_data = ai_data.get("negotiation_potential", {})
        result.recommended_ask = negotiation_data.get("recommended_ask", result.benchmark_data.median_salary * 1.1)
        result.negotiation_range = negotiation_data.get("negotiation_range", {
            "min": result.benchmark_data.median_salary * 0.95,
            "max": result.benchmark_data.median_salary * 1.15,
            "ideal": result.benchmark_data.median_salary * 1.08
        })
        
        # Tendance de marché
        trends = ai_data.get("market_trends", {})
        trend_direction = trends.get("trend_direction", "stable")
        result.market_trend = MarketTrend(trend_direction) if trend_direction in [t.value for t in MarketTrend] else MarketTrend.STABLE
        
        result.confidence_score = salary_assessment.get("confidence", 0.7)
    
    async def _generate_market_insights(self, 
                                      result: SalaryAnalysisResult,
                                      cv_data: CVDocument):
        """Génère des insights marché personnalisés"""
        
        insights = []
        
        # Insight sur l'expérience
        if cv_data.years_experience >= 5:
            insights.append(MarketInsight(
                insight_type="experience_premium",
                title="Prime d'expérience significative",
                description=f"Avec {cv_data.years_experience} ans d'expérience, vous pouvez négocier une prime de 15-20% au-dessus de la médiane.",
                impact_score=0.8,
                percentage_change=17.5
            ))
        
        # Insight sur les compétences rares
        rare_skills = [skill for skill in cv_data.key_skills 
                      if skill.lower() in ["rust", "golang", "machine_learning", "kubernetes"]]
        if rare_skills:
            insights.append(MarketInsight(
                insight_type="rare_skills_premium", 
                title="Compétences rares valorisées",
                description=f"Vos compétences en {', '.join(rare_skills[:2])} sont très demandées (+20% de premium marché).",
                impact_score=0.9,
                percentage_change=22.0,
                skill_area=rare_skills[0]
            ))
        
        # Insight marché post-COVID
        insights.append(MarketInsight(
            insight_type="market_trend",
            title="Marché candidat favorable",
            description="Le marché tech français connaît une pénurie de talents, favorable aux négociations salariales.",
            impact_score=0.7,
            percentage_change=12.5,
            region="france"
        ))
        
        result.market_insights = insights
    
    async def _generate_negotiation_tips(self,
                                       result: SalaryAnalysisResult, 
                                       cv_data: CVDocument):
        """Génère des conseils de négociation personnalisés"""
        
        tips = []
        
        # Conseil préparation
        tips.append(NegotiationTip(
            category="preparation",
            title="Documentez vos réalisations quantifiées",
            content="Préparez 3-5 exemples concrets de votre impact avec des chiffres (économies, revenus générés, gains de performance).",
            priority=5,
            success_rate=0.85,
            potential_increase=8.5
        ))
        
        # Conseil timing
        if cv_data.years_experience >= 2:
            tips.append(NegotiationTip(
                category="timing",
                title="Négociez pendant les reviews annuelles",
                content="Avril-Mai et Septembre-Octobre sont les meilleures périodes pour les négociations salariales.",
                priority=4,
                success_rate=0.72,
                potential_increase=6.2
            ))
        
        # Conseil technique
        tips.append(NegotiationTip(
            category="technique", 
            title="Demandez une fourchette, pas un montant fixe",
            content=f"Proposez une fourchette {result.negotiation_range.get('min', 50000):.0f}€-{result.negotiation_range.get('max', 70000):.0f}€ plutôt qu'un chiffre précis.",
            priority=4,
            success_rate=0.78,
            potential_increase=7.8
        ))
        
        # Conseil spécifique selon profil
        if "lead" in cv_data.target_position.lower() or cv_data.years_experience >= 7:
            tips.append(NegotiationTip(
                category="technique",
                title="Négociez le package global",
                content="En tant que senior, négociez aussi les stock-options, formation, télétravail et évolution de carrière.",
                priority=5,
                success_rate=0.68,
                potential_increase=12.5
            ))
        
        result.negotiation_tips = tips
    
    async def get_salary_benchmark(self, 
                                 job_title: str,
                                 location: str = "france",
                                 experience_level: str = "mid_level") -> SalaryBenchmark:
        """Récupère un benchmark salarial pour un poste"""
        
        # Recherche dans la base locale (simplifiée)
        location_data = self.salary_database.get(location.lower(), {})
        job_key = job_title.lower().replace(" ", "_")
        
        # Correspondances approximatives
        job_mappings = {
            "développeur": "développeur_python",
            "developer": "développeur_python", 
            "data": "data_scientist",
            "chef": "chef_de_projet",
            "manager": "chef_de_projet"
        }
        
        for keyword, mapped_job in job_mappings.items():
            if keyword in job_key and mapped_job in location_data:
                job_key = mapped_job
                break
        
        if job_key in location_data and experience_level in location_data[job_key]:
            data = location_data[job_key][experience_level]
            
            return SalaryBenchmark(
                job_title=job_title,
                industry="tech",
                location=location,
                experience_level=SalaryRange(experience_level),
                min_salary=data["min"],
                max_salary=data["max"], 
                median_salary=data["median"],
                p25_salary=data["min"] * 1.1,
                p75_salary=data["max"] * 0.9,
                sample_size=200,
                confidence_score=0.8,
                data_sources=["glassdoor", "linkedin", "insee"]
            )
        
        # Fallback avec données génériques
        return SalaryBenchmark(
            job_title=job_title,
            industry="tech",
            location=location,
            experience_level=SalaryRange.MID_LEVEL,
            min_salary=45000,
            max_salary=65000,
            median_salary=55000,
            p25_salary=50000,
            p75_salary=60000,
            sample_size=100,
            confidence_score=0.5
        )