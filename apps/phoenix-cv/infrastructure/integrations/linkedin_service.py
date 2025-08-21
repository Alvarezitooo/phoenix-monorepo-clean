"""
🔗 Phoenix CV - LinkedIn Integration Service
Service d'intégration LinkedIn avec OAuth et synchronisation profil
"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from urllib.parse import urlencode

from domain.entities.linkedin_integration import (
    LinkedInConnection, LinkedInProfile, SyncOperation, 
    LinkedInIntegrationResult, ProfileSection, SyncStatus, LinkedInConnectionStatus
)
from domain.entities.cv_document import CVDocument
from shared.exceptions.business_exceptions import AIServiceError, ProcessingError, ValidationError
from shared.config.settings import config

logger = logging.getLogger(__name__)


class LinkedInService:
    """Service d'intégration LinkedIn avec API officielle"""
    
    def __init__(self):
        """Initialise le service LinkedIn"""
        
        # Configuration OAuth LinkedIn
        self.client_id = self._get_client_id()
        self.client_secret = self._get_client_secret()
        self.redirect_uri = self._get_redirect_uri()
        
        # URLs API LinkedIn v2
        self.auth_base_url = "https://www.linkedin.com/oauth/v2/authorization"
        self.token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        self.api_base_url = "https://api.linkedin.com/v2"
        
        # Scopes LinkedIn requis
        self.required_scopes = [
            "r_liteprofile",  # Profil de base
            "r_emailaddress",  # Email
            "r_fullprofile",  # Profil complet
            "w_member_social"  # Écriture (optionnel)
        ]
        
        # Client HTTP avec timeout et retry
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Phoenix-CV/1.0",
                "Accept": "application/json"
            }
        )
    
    def _get_client_id(self) -> str:
        """Récupère le Client ID LinkedIn depuis la config"""
        # TODO: Ajouter LINKEDIN_CLIENT_ID à la configuration
        return "LINKEDIN_CLIENT_ID_PLACEHOLDER"  # En attente des vraies clés
    
    def _get_client_secret(self) -> str:
        """Récupère le Client Secret LinkedIn depuis la config"""
        # TODO: Ajouter LINKEDIN_CLIENT_SECRET à la configuration
        return "LINKEDIN_CLIENT_SECRET_PLACEHOLDER"
    
    def _get_redirect_uri(self) -> str:
        """Récupère l'URI de redirection"""
        base_url = config.app.api_base_url or "http://localhost:8002"
        return f"{base_url}/api/linkedin/callback"
    
    def generate_auth_url(self, user_id: str, state: str = None) -> str:
        """Génère l'URL d'authentification LinkedIn OAuth"""
        
        if not state:
            state = f"user_{user_id}_{datetime.now().timestamp()}"
        
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": " ".join(self.required_scopes)
        }
        
        auth_url = f"{self.auth_base_url}?{urlencode(params)}"
        
        logger.info(f"✅ URL d'auth LinkedIn générée pour user {user_id}")
        return auth_url
    
    async def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """Échange le code d'autorisation contre un token d'accès"""
        
        try:
            data = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self.redirect_uri,
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
            
            response = await self.client.post(
                self.token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise ProcessingError(f"Erreur échange token LinkedIn: {response.status_code}")
            
            token_data = response.json()
            
            # Calcul de l'expiration
            expires_in = token_data.get("expires_in", 3600)
            expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            return {
                "access_token": token_data["access_token"],
                "expires_at": expires_at,
                "token_type": token_data.get("token_type", "Bearer"),
                "scope": token_data.get("scope", "")
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur échange token LinkedIn: {e}")
            raise ProcessingError(f"Impossible d'obtenir le token LinkedIn: {str(e)}")
    
    async def create_connection(self, 
                              user_id: str,
                              access_token: str,
                              expires_at: datetime) -> LinkedInConnection:
        """Crée une connexion LinkedIn pour un utilisateur"""
        
        try:
            # Récupération du profil de base pour validation
            basic_profile = await self._get_basic_profile(access_token)
            
            connection = LinkedInConnection(
                user_id=user_id,
                access_token=access_token,
                token_expires_at=expires_at,
                linkedin_user_id=basic_profile.get("id", ""),
                status=LinkedInConnectionStatus.CONNECTED,
                connection_date=datetime.now()
            )
            
            logger.info(f"✅ Connexion LinkedIn créée pour user {user_id}")
            return connection
            
        except Exception as e:
            logger.error(f"❌ Erreur création connexion LinkedIn: {e}")
            raise ProcessingError(f"Impossible de créer la connexion: {str(e)}")
    
    async def sync_linkedin_profile(self, 
                                  connection: LinkedInConnection,
                                  sections: List[ProfileSection] = None) -> LinkedInProfile:
        """Synchronise le profil LinkedIn complet"""
        
        try:
            if not connection.is_token_valid:
                raise ValidationError("Token LinkedIn expiré")
            
            sections_to_sync = sections or connection.enabled_sections
            
            # Récupération des données par section
            profile_data = {}
            
            if ProfileSection.BASIC_INFO in sections_to_sync:
                basic_info = await self._get_basic_profile(connection.access_token)
                profile_data.update(basic_info)
            
            if ProfileSection.EXPERIENCE in sections_to_sync:
                positions = await self._get_positions(connection.access_token)
                profile_data["positions"] = positions
            
            if ProfileSection.EDUCATION in sections_to_sync:
                educations = await self._get_educations(connection.access_token)
                profile_data["educations"] = educations
            
            if ProfileSection.SKILLS in sections_to_sync:
                skills = await self._get_skills(connection.access_token)
                profile_data["skills"] = skills
            
            # Construction du profil LinkedIn
            linkedin_profile = self._build_linkedin_profile(profile_data)
            
            # Mise à jour de la connexion
            connection.profile_data = linkedin_profile
            connection.last_sync = datetime.now()
            connection.sync_count += 1
            
            logger.info(f"✅ Profil LinkedIn synchronisé: {len(sections_to_sync)} sections")
            return linkedin_profile
            
        except Exception as e:
            logger.error(f"❌ Erreur sync profil LinkedIn: {e}")
            connection.status = LinkedInConnectionStatus.ERROR
            connection.error_message = str(e)
            raise ProcessingError(f"Erreur synchronisation LinkedIn: {str(e)}")
    
    async def _get_basic_profile(self, access_token: str) -> Dict[str, Any]:
        """Récupère le profil de base LinkedIn"""
        
        url = f"{self.api_base_url}/people/~"
        params = {
            "projection": "(id,firstName,lastName,headline,summary,location,industry,pictureInfo,publicProfileUrl)"
        }
        
        response = await self._make_api_call(url, access_token, params)
        return response
    
    async def _get_positions(self, access_token: str) -> List[Dict[str, Any]]:
        """Récupère les expériences professionnelles"""
        
        # Note: L'API LinkedIn v2 a des restrictions sur les positions
        # Cette implémentation est simplifiée pour la démo
        
        try:
            url = f"{self.api_base_url}/people/~/positions"
            response = await self._make_api_call(url, access_token)
            
            positions = response.get("elements", [])
            
            # Transformation des données
            formatted_positions = []
            for pos in positions:
                formatted_positions.append({
                    "title": pos.get("title", ""),
                    "companyName": pos.get("companyName", ""),
                    "description": pos.get("description", ""),
                    "startDate": self._parse_date(pos.get("startDate")),
                    "endDate": self._parse_date(pos.get("endDate")),
                    "location": pos.get("location", {}).get("name", ""),
                    "isCurrent": pos.get("isCurrent", False)
                })
            
            return formatted_positions
            
        except Exception as e:
            logger.warning(f"⚠️ Impossible de récupérer les positions: {e}")
            return []  # Fallback graceful
    
    async def _get_educations(self, access_token: str) -> List[Dict[str, Any]]:
        """Récupère les formations"""
        
        try:
            url = f"{self.api_base_url}/people/~/educations"
            response = await self._make_api_call(url, access_token)
            
            educations = response.get("elements", [])
            
            formatted_educations = []
            for edu in educations:
                formatted_educations.append({
                    "schoolName": edu.get("schoolName", ""),
                    "fieldOfStudy": edu.get("fieldOfStudy", ""),
                    "degree": edu.get("degree", ""),
                    "startDate": self._parse_date(edu.get("startDate")),
                    "endDate": self._parse_date(edu.get("endDate"))
                })
            
            return formatted_educations
            
        except Exception as e:
            logger.warning(f"⚠️ Impossible de récupérer les formations: {e}")
            return []
    
    async def _get_skills(self, access_token: str) -> List[str]:
        """Récupère les compétences"""
        
        try:
            url = f"{self.api_base_url}/people/~/skills"
            response = await self._make_api_call(url, access_token)
            
            skills_data = response.get("elements", [])
            skills = [skill.get("name", "") for skill in skills_data if skill.get("name")]
            
            return skills[:20]  # Limite à 20 compétences
            
        except Exception as e:
            logger.warning(f"⚠️ Impossible de récupérer les compétences: {e}")
            return []
    
    async def _make_api_call(self, 
                           url: str, 
                           access_token: str,
                           params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Effectue un appel API LinkedIn avec gestion d'erreurs"""
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        
        try:
            response = await self.client.get(url, headers=headers, params=params or {})
            
            if response.status_code == 401:
                raise ValidationError("Token LinkedIn expiré ou invalide")
            elif response.status_code == 403:
                raise ValidationError("Permissions LinkedIn insuffisantes")
            elif response.status_code != 200:
                raise ProcessingError(f"Erreur API LinkedIn: {response.status_code}")
            
            return response.json()
            
        except httpx.TimeoutException:
            raise ProcessingError("Timeout lors de l'appel API LinkedIn")
        except Exception as e:
            raise ProcessingError(f"Erreur communication LinkedIn: {str(e)}")
    
    def _build_linkedin_profile(self, data: Dict[str, Any]) -> LinkedInProfile:
        """Construit un objet LinkedInProfile à partir des données API"""
        
        # Extraction des informations de base
        first_name = data.get("firstName", {}).get("localized", {}).get("fr_FR", "") or \
                    data.get("firstName", {}).get("localized", {}).get("en_US", "")
        
        last_name = data.get("lastName", {}).get("localized", {}).get("fr_FR", "") or \
                   data.get("lastName", {}).get("localized", {}).get("en_US", "")
        
        # URL de photo de profil
        picture_info = data.get("pictureInfo", {})
        picture_url = None
        if picture_info and "displayImage" in picture_info:
            elements = picture_info["displayImage"].get("elements", [])
            if elements:
                picture_url = elements[0].get("identifiers", [{}])[0].get("identifier")
        
        return LinkedInProfile(
            linkedin_id=data.get("id", ""),
            first_name=first_name,
            last_name=last_name,
            headline=data.get("headline", {}).get("localized", {}).get("fr_FR", "") or \
                    data.get("headline", {}).get("localized", {}).get("en_US", ""),
            summary=data.get("summary", ""),
            location=data.get("location", {}).get("name", ""),
            industry=data.get("industry", {}).get("localizedName", ""),
            profile_picture_url=picture_url,
            public_profile_url=data.get("publicProfileUrl", ""),
            positions=data.get("positions", []),
            educations=data.get("educations", []),
            skills=data.get("skills", []),
            last_updated=datetime.now(),
            raw_data=data
        )
    
    def _parse_date(self, date_obj: Optional[Dict[str, Any]]) -> Optional[str]:
        """Parse les dates LinkedIn au format ISO"""
        
        if not date_obj:
            return None
        
        year = date_obj.get("year")
        month = date_obj.get("month", 1)
        
        if year:
            return f"{year}-{month:02d}-01"
        
        return None
    
    async def analyze_profile_completeness(self, 
                                         linkedin_profile: LinkedInProfile,
                                         cv_data: Optional[CVDocument] = None) -> LinkedInIntegrationResult:
        """Analyse la complétude et génère des recommandations"""
        
        result = LinkedInIntegrationResult()
        result.linkedin_profile = linkedin_profile
        
        # Calcul de la complétude
        result.calculate_profile_completeness()
        
        # Génération des suggestions
        result.generate_improvement_suggestions()
        result.generate_network_insights()
        
        # Analyse de correspondance avec CV si disponible
        if cv_data:
            result.cv_linkedin_match_score = await self._calculate_cv_match_score(
                linkedin_profile, cv_data
            )
        
        # Détection des sections manquantes
        result.missing_sections = self._detect_missing_sections(linkedin_profile)
        
        return result
    
    async def _calculate_cv_match_score(self, 
                                      linkedin_profile: LinkedInProfile,
                                      cv_data: CVDocument) -> float:
        """Calcule le score de correspondance CV-LinkedIn"""
        
        score = 0.0
        total_checks = 0
        
        # Vérification du titre professionnel
        if linkedin_profile.headline and cv_data.target_position:
            if linkedin_profile.headline.lower() in cv_data.target_position.lower() or \
               cv_data.target_position.lower() in linkedin_profile.headline.lower():
                score += 20
        total_checks += 20
        
        # Vérification des compétences
        linkedin_skills = set(skill.lower() for skill in linkedin_profile.skills)
        cv_skills = set(skill.lower() for skill in cv_data.key_skills)
        
        if linkedin_skills and cv_skills:
            skills_overlap = len(linkedin_skills.intersection(cv_skills))
            max_skills = max(len(linkedin_skills), len(cv_skills))
            if max_skills > 0:
                score += (skills_overlap / max_skills) * 30
        total_checks += 30
        
        # Vérification de l'expérience (nombre d'emplois)
        linkedin_exp_count = len(linkedin_profile.positions)
        cv_exp_count = len(cv_data.work_experience)
        
        if linkedin_exp_count > 0 and cv_exp_count > 0:
            exp_ratio = min(linkedin_exp_count, cv_exp_count) / max(linkedin_exp_count, cv_exp_count)
            score += exp_ratio * 25
        total_checks += 25
        
        # Vérification de la localisation
        if linkedin_profile.location and cv_data.location:
            if linkedin_profile.location.lower() in cv_data.location.lower() or \
               cv_data.location.lower() in linkedin_profile.location.lower():
                score += 15
        total_checks += 15
        
        # Vérification de l'industrie
        if linkedin_profile.industry and cv_data.industry:
            if linkedin_profile.industry.lower() in cv_data.industry.lower() or \
               cv_data.industry.lower() in linkedin_profile.industry.lower():
                score += 10
        total_checks += 10
        
        return (score / total_checks) * 100 if total_checks > 0 else 0.0
    
    def _detect_missing_sections(self, profile: LinkedInProfile) -> List[ProfileSection]:
        """Détecte les sections manquantes du profil"""
        
        missing = []
        
        if not profile.headline:
            missing.append(ProfileSection.BASIC_INFO)
        
        if not profile.positions:
            missing.append(ProfileSection.EXPERIENCE)
        
        if not profile.educations:
            missing.append(ProfileSection.EDUCATION)
        
        if len(profile.skills) < 5:
            missing.append(ProfileSection.SKILLS)
        
        if not profile.certifications:
            missing.append(ProfileSection.CERTIFICATIONS)
        
        return missing
    
    async def close(self):
        """Ferme les connexions HTTP"""
        await self.client.aclose()