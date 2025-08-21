"""
🎯 Phoenix CV - Mirror Match Service
GAME CHANGER - Service IA pour correspondance CV-Offre avec Gemini
"""

import re
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import asdict

from ..entities.cv_document import CVDocument, Skill, Experience
from ..entities.mirror_match import (
    JobDescription, JobRequirement, RequirementType,
    MirrorMatchAnalysis, SkillMatch, SkillMatchLevel, ExperienceMatch,
    MatchType
)


class MirrorMatchService:
    """
    🔥 GAME CHANGER - Service de correspondance CV-Poste avec IA
    Utilise Gemini pour analyser et optimiser les correspondances
    """
    
    def __init__(self, ai_service):
        """
        Args:
            ai_service: Service IA Gemini configuré
        """
        self.ai_service = ai_service
        self.version = "1.0"
    
    async def analyze_job_description(self, job_text: str, job_title: str = "", company_name: str = "") -> JobDescription:
        """
        🤖 Analyse une offre d'emploi avec IA Gemini
        """
        
        prompt = f"""
        Tu es un expert en recrutement et analyse d'offres d'emploi. 
        Analyse cette offre d'emploi et extrais toutes les informations structurées.
        
        OFFRE D'EMPLOI:
        Titre: {job_title}
        Entreprise: {company_name}
        Description: {job_text}
        
        EXTRAIS ET STRUCTURE:
        1. EXIGENCES TECHNIQUES (compétences, technologies, outils)
        2. EXIGENCES SOFT SKILLS (communication, leadership, etc.)
        3. EXPÉRIENCE REQUISE (nombre d'années, types de rôles)
        4. FORMATION/CERTIFICATIONS requises
        5. RESPONSABILITÉS CLÉS
        6. MOTS-CLÉS IMPORTANTS pour ATS
        7. CULTURE ENTREPRISE (valeurs, environnement)
        8. NIVEAU DE DIFFICULTÉ du poste (1-10)
        
        Réponds UNIQUEMENT en JSON valide avec cette structure:
        {{
            "technical_requirements": [
                {{"keyword": "Python", "category": "skill", "is_mandatory": true, "weight": 0.9}},
                {{"keyword": "React", "category": "skill", "is_mandatory": false, "weight": 0.7}}
            ],
            "soft_requirements": [
                {{"keyword": "Communication", "category": "soft_skill", "is_mandatory": true, "weight": 0.8}}
            ],
            "experience_requirements": {{
                "years": 3,
                "roles": ["Développeur", "Software Engineer"],
                "industry_specific": false
            }},
            "education_requirements": [
                {{"level": "bachelor", "field": "Computer Science", "is_mandatory": true}}
            ],
            "key_responsibilities": [
                "Développer des applications web",
                "Collaborer avec l'équipe produit"
            ],
            "ats_keywords": ["Python", "React", "API", "Git"],
            "company_culture": ["Innovation", "Team work", "Remote-friendly"],
            "difficulty_score": 6,
            "salary_indicators": {{"min": 50000, "max": 70000, "currency": "EUR"}}
        }}
        """
        
        try:
            response = await self.ai_service.generate_content(prompt)
            
            # Parser la réponse JSON
            analysis_data = json.loads(response)
            
            # Créer l'objet JobDescription
            job_desc = JobDescription(
                job_title=job_title,
                company_name=company_name,
                raw_description=job_text,
                required_experience_years=analysis_data.get("experience_requirements", {}).get("years", 0),
                difficulty_score=analysis_data.get("difficulty_score", 5.0),
                key_responsibilities=analysis_data.get("key_responsibilities", []),
                company_culture_keywords=analysis_data.get("company_culture", [])
            )
            
            # Ajouter les exigences techniques
            for req in analysis_data.get("technical_requirements", []):
                job_desc.add_requirement(
                    keyword=req["keyword"],
                    category=req["category"],
                    req_type=RequirementType.MANDATORY if req.get("is_mandatory", False) else RequirementType.PREFERRED,
                    weight=req.get("weight", 1.0)
                )
            
            # Ajouter les soft skills
            for req in analysis_data.get("soft_requirements", []):
                job_desc.add_requirement(
                    keyword=req["keyword"],
                    category=req["category"],
                    req_type=RequirementType.MANDATORY if req.get("is_mandatory", False) else RequirementType.PREFERRED,
                    weight=req.get("weight", 1.0)
                )
            
            return job_desc
            
        except Exception as e:
            # Fallback: analyse basique sans IA
            return self._basic_job_analysis(job_text, job_title, company_name)
    
    async def perform_mirror_match(self, cv: CVDocument, job_desc: JobDescription) -> MirrorMatchAnalysis:
        """
        🎯 CŒUR DU SYSTÈME - Effectue l'analyse Mirror Match complète
        """
        
        analysis = MirrorMatchAnalysis(
            cv_id=cv.id,
            job_description_id=job_desc.id
        )
        
        # 1. Analyse des compétences avec IA
        analysis.skill_matches = await self._analyze_skill_matches(cv, job_desc)
        
        # 2. Analyse de l'expérience
        analysis.experience_match = self._analyze_experience_match(cv, job_desc)
        
        # 3. Analyse de la formation
        analysis.education_match_score = self._analyze_education_match(cv, job_desc)
        
        # 4. Analyse textuelle (mots-clés)
        analysis.keyword_density = self._calculate_keyword_density(cv, job_desc)
        analysis.phrase_matches = self._find_phrase_matches(cv, job_desc)
        
        # 5. Analyses avancées avec IA
        cultural_analysis = await self._analyze_cultural_fit(cv, job_desc)
        analysis.cultural_fit_score = cultural_analysis["score"]
        
        # 6. Génération des recommandations
        analysis.priority_improvements = await self._generate_improvements(cv, job_desc, analysis)
        analysis.keyword_suggestions = await self._suggest_keywords(cv, job_desc)
        
        # 7. Calcul du score global
        analysis.calculate_overall_compatibility()
        analysis.calculate_success_predictions()
        
        return analysis
    
    async def _analyze_skill_matches(self, cv: CVDocument, job_desc: JobDescription) -> List[SkillMatch]:
        """
        🤖 Analyse les correspondances de compétences avec IA
        """
        
        cv_skills = [skill.name for skill in cv.skills]
        job_requirements = [req.keyword for req in job_desc.requirements if req.category == "skill"]
        
        prompt = f"""
        Tu es un expert en correspondance de compétences professionnelles.
        Analyse la correspondance entre les compétences du CV et les exigences du poste.
        
        COMPÉTENCES CV: {cv_skills}
        EXIGENCES POSTE: {job_requirements}
        
        Pour chaque exigence du poste, détermine:
        1. S'il y a une correspondance dans le CV
        2. Le type de correspondance (exacte, proche, transférable, manquante)
        3. Le score de confiance (0-1)
        4. Une explication de la correspondance
        5. Une suggestion d'optimisation
        
        Réponds en JSON valide:
        {{
            "skill_matches": [
                {{
                    "cv_skill": "Python",
                    "job_requirement": "Python",
                    "match_level": "exact_match",
                    "confidence_score": 0.95,
                    "explanation": "Correspondance exacte - Python présent dans le CV",
                    "optimization_suggestion": "Mentionner les versions et frameworks utilisés"
                }}
            ]
        }}
        
        Types de correspondance: exact_match, close_match, transferable, missing
        """
        
        try:
            response = await self.ai_service.generate_content(prompt)
            analysis_data = json.loads(response)
            
            skill_matches = []
            for match_data in analysis_data.get("skill_matches", []):
                skill_match = SkillMatch(
                    cv_skill=match_data.get("cv_skill", ""),
                    job_requirement=match_data.get("job_requirement", ""),
                    match_level=SkillMatchLevel(match_data.get("match_level", "missing")),
                    confidence_score=match_data.get("confidence_score", 0.0),
                    explanation=match_data.get("explanation", ""),
                    optimization_suggestion=match_data.get("optimization_suggestion", "")
                )
                skill_matches.append(skill_match)
            
            return skill_matches
            
        except Exception as e:
            # Fallback: correspondance basique
            return self._basic_skill_matching(cv, job_desc)
    
    def _analyze_experience_match(self, cv: CVDocument, job_desc: JobDescription) -> ExperienceMatch:
        """
        Analyse la correspondance d'expérience
        """
        
        candidate_years = cv.calculate_experience_years()
        required_years = job_desc.required_experience_years
        
        # Vérifier la correspondance d'industrie
        industry_match = False
        if cv.target_industry and job_desc.industry:
            industry_match = cv.target_industry.value.lower() in job_desc.industry.lower()
        
        # Calculer la similarité des rôles
        role_similarity = self._calculate_role_similarity(cv, job_desc)
        
        return ExperienceMatch(
            required_years=required_years,
            candidate_years=int(candidate_years),
            industry_match=industry_match,
            role_similarity=role_similarity
        )
    
    def _analyze_education_match(self, cv: CVDocument, job_desc: JobDescription) -> float:
        """
        Analyse la correspondance de formation
        """
        
        if not cv.education:
            return 50.0  # Score moyen si pas d'éducation renseignée
        
        # Score basé sur le niveau d'éducation
        education_scores = {
            "phd": 100,
            "master": 90,
            "bachelor": 80,
            "associate": 70,
            "certificate": 60,
            "none": 50
        }
        
        highest_education = max(cv.education, key=lambda edu: education_scores.get(edu.degree.lower(), 50))
        return education_scores.get(highest_education.degree.lower(), 50)
    
    def _calculate_keyword_density(self, cv: CVDocument, job_desc: JobDescription) -> float:
        """
        Calcule la densité de mots-clés
        """
        
        # Créer le texte complet du CV
        cv_text = f"{cv.summary} {cv.professional_title}"
        for exp in cv.experiences:
            cv_text += f" {exp.description} {' '.join(exp.achievements)}"
        for skill in cv.skills:
            cv_text += f" {skill.name}"
        
        cv_text = cv_text.lower()
        
        # Extraire les mots-clés du job
        job_keywords = [req.keyword.lower() for req in job_desc.requirements]
        
        if not job_keywords:
            return 0.0
        
        # Compter les correspondances
        matches = sum(1 for keyword in job_keywords if keyword in cv_text)
        return matches / len(job_keywords)
    
    def _find_phrase_matches(self, cv: CVDocument, job_desc: JobDescription) -> List[str]:
        """
        Trouve les phrases similaires entre CV et offre
        """
        
        # Extraire les phrases clés du job
        job_phrases = []
        for responsibility in job_desc.key_responsibilities:
            # Extraire des phrases de 3-5 mots
            words = responsibility.split()
            for i in range(len(words) - 2):
                phrase = " ".join(words[i:i+3])
                job_phrases.append(phrase.lower())
        
        # Chercher dans le CV
        cv_text = f"{cv.summary} "
        for exp in cv.experiences:
            cv_text += f"{exp.description} {' '.join(exp.achievements)} "
        
        cv_text = cv_text.lower()
        
        matches = []
        for phrase in job_phrases:
            if phrase in cv_text and len(phrase) > 10:  # Phrases significatives seulement
                matches.append(phrase)
        
        return list(set(matches))[:5]  # Top 5 matches uniques
    
    async def _analyze_cultural_fit(self, cv: CVDocument, job_desc: JobDescription) -> Dict[str, Any]:
        """
        🤖 Analyse le fit culturel avec IA
        """
        
        prompt = f"""
        Analyse la compatibilité culturelle entre ce candidat et cette entreprise.
        
        PROFIL CANDIDAT:
        - Titre: {cv.professional_title}
        - Résumé: {cv.summary}
        - Expériences: {[f"{exp.company} - {exp.position}" for exp in cv.experiences[:3]]}
        
        CULTURE ENTREPRISE:
        - Secteur: {job_desc.industry}
        - Mots-clés culture: {job_desc.company_culture_keywords}
        - Responsabilités: {job_desc.key_responsibilities[:3]}
        
        Évalue le fit culturel sur 100 et explique pourquoi.
        
        Réponds en JSON:
        {{
            "score": 75,
            "explanation": "Bon fit car...",
            "alignment_points": ["Point 1", "Point 2"],
            "potential_concerns": ["Préoccupation 1"]
        }}
        """
        
        try:
            response = await self.ai_service.generate_content(prompt)
            return json.loads(response)
        except:
            return {"score": 70.0, "explanation": "Analyse par défaut", "alignment_points": [], "potential_concerns": []}
    
    async def _generate_improvements(self, cv: CVDocument, job_desc: JobDescription, analysis: MirrorMatchAnalysis) -> List[str]:
        """
        🤖 Génère des recommandations d'amélioration avec IA
        """
        
        missing_skills = analysis.get_missing_skills()
        weak_areas = []
        
        if analysis.experience_match and analysis.experience_match.experience_score < 70:
            weak_areas.append("expérience")
        if analysis.education_match_score < 70:
            weak_areas.append("formation")
        if analysis.keyword_density < 0.3:
            weak_areas.append("mots-clés")
        
        prompt = f"""
        Génère 5 recommandations prioritaires pour améliorer ce CV pour ce poste.
        
        SCORE ACTUEL: {analysis.overall_compatibility}/100
        COMPÉTENCES MANQUANTES: {missing_skills[:5]}
        DOMAINES FAIBLES: {weak_areas}
        
        Donne des recommandations CONCRÈTES et ACTIONNABLES.
        
        Réponds en JSON:
        {{
            "improvements": [
                "Ajouter Python dans la section compétences avec projets concrets",
                "Quantifier les résultats dans l'expérience chez X (ex: 'Augmenté les ventes de 25%')"
            ]
        }}
        """
        
        try:
            response = await self.ai_service.generate_content(prompt)
            data = json.loads(response)
            return data.get("improvements", [])
        except:
            return [
                "Optimiser les mots-clés selon l'offre d'emploi",
                "Quantifier davantage les réalisations",
                "Adapter le résumé au poste ciblé"
            ]
    
    async def _suggest_keywords(self, cv: CVDocument, job_desc: JobDescription) -> List[str]:
        """
        🤖 Suggère des mots-clés manquants
        """
        
        cv_keywords = set()
        cv_keywords.update([skill.name.lower() for skill in cv.skills])
        cv_keywords.update(cv.summary.lower().split())
        
        job_keywords = set()
        job_keywords.update([req.keyword.lower() for req in job_desc.requirements])
        
        missing_keywords = job_keywords - cv_keywords
        return list(missing_keywords)[:10]  # Top 10 suggestions
    
    def _basic_job_analysis(self, job_text: str, job_title: str, company_name: str) -> JobDescription:
        """
        Analyse basique sans IA (fallback)
        """
        
        job_desc = JobDescription(
            job_title=job_title,
            company_name=company_name,
            raw_description=job_text
        )
        
        # Extractions basiques avec regex
        common_skills = ["python", "javascript", "react", "sql", "git", "aws", "docker"]
        for skill in common_skills:
            if skill.lower() in job_text.lower():
                job_desc.add_requirement(skill, "skill", RequirementType.PREFERRED)
        
        # Extraction années d'expérience
        exp_match = re.search(r'(\d+)[\s-]+an[née]?s?\s+d.expérience', job_text.lower())
        if exp_match:
            job_desc.required_experience_years = int(exp_match.group(1))
        
        return job_desc
    
    def _basic_skill_matching(self, cv: CVDocument, job_desc: JobDescription) -> List[SkillMatch]:
        """
        Correspondance basique des compétences (fallback)
        """
        
        matches = []
        job_skills = {req.keyword.lower(): req for req in job_desc.requirements if req.category == "skill"}
        cv_skills = {skill.name.lower(): skill for skill in cv.skills}
        
        # Correspondances exactes
        for job_skill_lower, job_req in job_skills.items():
            if job_skill_lower in cv_skills:
                matches.append(SkillMatch(
                    cv_skill=cv_skills[job_skill_lower].name,
                    job_requirement=job_req.keyword,
                    match_level=SkillMatchLevel.EXACT_MATCH,
                    confidence_score=0.9,
                    explanation="Correspondance exacte détectée"
                ))
            else:
                matches.append(SkillMatch(
                    cv_skill="",
                    job_requirement=job_req.keyword,
                    match_level=SkillMatchLevel.MISSING,
                    confidence_score=0.0,
                    explanation="Compétence manquante"
                ))
        
        return matches
    
    def _calculate_role_similarity(self, cv: CVDocument, job_desc: JobDescription) -> float:
        """
        Calcule la similarité entre rôles actuels et cible
        """
        
        if not cv.experiences:
            return 0.0
        
        recent_exp = cv.get_recent_experiences(2)
        job_title_words = set(job_desc.job_title.lower().split())
        
        similarity_scores = []
        for exp in recent_exp:
            exp_title_words = set(exp.position.lower().split())
            common_words = job_title_words.intersection(exp_title_words)
            similarity = len(common_words) / max(len(job_title_words), 1)
            similarity_scores.append(similarity)
        
        return max(similarity_scores) if similarity_scores else 0.0