from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os

from app.clients.hub_client import get_hub_client, HubClient
from app.clients.gemini_client import get_gemini_client, GeminiClient
from app.dependencies import get_current_user_id

router = APIRouter()

# --- CV Templates Data (Centralized) ---
CV_TEMPLATES = [
    # === CATÉGORIE SOBRE PROFESSIONNEL ===
    {
        "id": "executive_minimal",
        "name": "Executive Minimal",
        "description": "Design ultra-épuré pour dirigeants et cadres supérieurs",
        "category": "Sobre Professionnel",
        "difficulty": "Facile",
        "ats_compatible": True,
        "popularity": 92,
        "best_for": ["Direction", "Management", "Consulting"],
        "industries": ["Finance", "Consulting", "Tech", "Corporate"],
        "preview_image": "/templates/executive-minimal-preview.jpg",
        "tags": ["minimal", "executive", "professional", "clean"],
        "estimated_creation_time": "10 minutes"
    }
    # Note: Full template data would be here - abbreviated for clarity
]

# --- Pydantic Models for CV API ---

class MirrorMatchRequest(BaseModel):
    cv_id: str
    job_description: str

class CVOptimizationRequest(BaseModel):
    cv_id: str
    target_job_title: Optional[str] = None

class CVBuilderRequest(BaseModel):
    personal_info: Dict[str, Any]
    experience: list
    skills: list
    education: list
    template_id: str = "modern"

class CVTemplateRenderRequest(BaseModel):
    template_id: str
    cv_data: Dict[str, Any]

# --- API Endpoints ---

@router.get("/", summary="CV Module status")
async def cv_status():
    return {
        "module": "CV",
        "status": "active", 
        "features": ["mirror-match", "optimization", "ats-scoring", "cv-builder", "templates"],
        "version": "2.0.0"
    }

@router.post("/mirror-match", summary="Run Mirror Match analysis for a CV and job description")
async def mirror_match(
    request: MirrorMatchRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the Mirror Match feature.
    """
    # 1. Check energy with the Hub
    if not await hub.can_perform(user_id=user_id, action="CV_MIRROR_MATCH"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    # 2. Build prompt and call Gemini
    prompt = f"""Analyze the compatibility between the CV (id: {request.cv_id}) and the job description: '{request.job_description}'. 
    Provide a compatibility score, strengths, weaknesses, and suggestions."""
    
    analysis_result = await gemini.generate_content(prompt)

    # 3. Track event in Narrative Capital
    await hub.track_event(
        user_id=user_id,
        event_type="CV_MIRROR_MATCH_COMPLETED",
        event_data={"cv_id": request.cv_id, "job_description_preview": request.job_description[:100]}
    )

    return {
        "message": "Mirror Match analysis complete",
        "analysis": analysis_result
    }

@router.post("/optimize", summary="Optimize a CV for a target job")
async def optimize_cv(
    request: CVOptimizationRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Orchestrates the CV Optimization feature.
    """
    if not await hub.can_perform(user_id=user_id, action="CV_OPTIMIZE"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"Optimize CV (id: {request.cv_id}) for the target job: '{request.target_job_title or 'general improvement'}'. Provide actionable suggestions."
    
    optimization_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="CV_OPTIMIZATION_COMPLETED",
        event_data={"cv_id": request.cv_id, "target_job": request.target_job_title}
    )

    return {
        "message": "CV Optimization complete",
        "suggestions": optimization_result
    }

@router.get("/templates", summary="Get available CV templates")
async def get_cv_templates():
    """Get comprehensive database of professional CV templates"""
    templates = CV_TEMPLATES
            "preview": "/templates/executive-minimal.png",
            "ats_compatible": True,
            "popularity": 95,
            "sectors": ["Direction", "C-Level", "Consulting", "Finance"],
            "features": ["Typographie classique", "Espacement généreux", "Focus sur l'expérience"]
        },
        {
            "id": "finance_classic",
            "name": "Finance Classic",
            "description": "Format traditionnel pour secteurs bancaires et financiers",
            "category": "Sobre Professionnel", 
            "preview": "/templates/finance-classic.png",
            "ats_compatible": True,
            "popularity": 88,
            "sectors": ["Finance", "Banque", "Assurance", "Audit"],
            "features": ["Format conservateur", "Sections claires", "Optimisé ATS"]
        },
        {
            "id": "legal_formal",
            "name": "Legal Formal",
            "description": "Template élégant pour professions juridiques",
            "category": "Sobre Professionnel",
            "preview": "/templates/legal-formal.png",
            "ats_compatible": True,
            "popularity": 82,
            "sectors": ["Juridique", "Notariat", "Administration", "Public"],
            "features": ["Typographie serif", "Structure formelle", "Présentation rigoureuse"]
        },
        {
            "id": "corporate_standard",
            "name": "Corporate Standard",
            "description": "Le grand classique des entreprises Fortune 500",
            "category": "Sobre Professionnel",
            "preview": "/templates/corporate-standard.png",
            "ats_compatible": True,
            "popularity": 91,
            "sectors": ["Corporate", "Industrie", "Pharma", "Énergie"],
            "features": ["Design intemporel", "Compatibilité universelle", "Lisibilité maximale"]
        },
        {
            "id": "medical_professional",
            "name": "Medical Professional",
            "description": "Template sobre pour professionnels de santé",
            "category": "Sobre Professionnel",
            "preview": "/templates/medical-professional.png",
            "ats_compatible": True,
            "popularity": 86,
            "sectors": ["Santé", "Médical", "Pharmacie", "Recherche"],
            "features": ["Mise en page médicale", "Sections certifications", "Format académique"]
        },
        {
            "id": "academic_scholar",
            "name": "Academic Scholar",
            "description": "Pour chercheurs et enseignants universitaires",
            "category": "Sobre Professionnel",
            "preview": "/templates/academic-scholar.png",
            "ats_compatible": True,
            "popularity": 79,
            "sectors": ["Académique", "Recherche", "Enseignement", "Think Tanks"],
            "features": ["Format publication", "Section recherches", "Bibliographie intégrée"]
        },

        # === CATÉGORIE MODERNE TECH ===
        {
            "id": "silicon_valley",
            "name": "Silicon Valley",
            "description": "Design moderne pour écosystème tech américain",
            "category": "Moderne Tech",
            "preview": "/templates/silicon-valley.png",
            "ats_compatible": True,
            "popularity": 94,
            "sectors": ["Tech", "Startup", "SaaS", "IA/ML"],
            "features": ["Design système", "Métriques mises en avant", "Stack technique"]
        },
        {
            "id": "developer_focused",
            "name": "Developer Focus",
            "description": "Optimisé pour développeurs et ingénieurs logiciel",
            "category": "Moderne Tech",
            "preview": "/templates/developer-focused.png",
            "ats_compatible": True,
            "popularity": 89,
            "sectors": ["Développement", "DevOps", "Cybersécurité", "Data"],
            "features": ["Section projets", "GitHub intégré", "Skills techniques"]
        },
        {
            "id": "product_manager_pro",
            "name": "Product Manager Pro",
            "description": "Conçu spécifiquement pour Product Managers",
            "category": "Moderne Tech",
            "preview": "/templates/product-manager-pro.png",
            "ats_compatible": True,
            "popularity": 92,
            "sectors": ["Product", "UX/UI", "Growth", "Strategy"],
            "features": ["KPIs en évidence", "Roadmaps produit", "Impact business"]
        },
        {
            "id": "data_scientist",
            "name": "Data Scientist",
            "description": "Template pour professionnels de la data",
            "category": "Moderne Tech",
            "preview": "/templates/data-scientist.png",
            "ats_compatible": True,
            "popularity": 87,
            "sectors": ["Data Science", "Analytics", "BI", "Research"],
            "features": ["Visualisations data", "Modèles ML", "Publications scientifiques"]
        },

        # === CATÉGORIE CRÉATIVE ===
        {
            "id": "designer_portfolio",
            "name": "Designer Portfolio",
            "description": "Showcase créatif pour designers et artistes",
            "category": "Créative",
            "preview": "/templates/designer-portfolio.png",
            "ats_compatible": False,
            "popularity": 78,
            "sectors": ["Design", "Arts", "Mode", "Architecture"],
            "features": ["Portfolio intégré", "Typographie créative", "Couleurs brand"]
        },
        {
            "id": "marketing_creative",
            "name": "Marketing Creative",
            "description": "Template dynamique pour marketeurs créatifs",
            "category": "Créative",
            "preview": "/templates/marketing-creative.png",
            "ats_compatible": False,
            "popularity": 81,
            "sectors": ["Marketing", "Communication", "Publicité", "Média"],
            "features": ["Infographies", "Campagnes mises en avant", "ROI visuel"]
        },
        {
            "id": "media_journalist",
            "name": "Media Journalist",
            "description": "Pour journalistes et professionnels des médias",
            "category": "Créative",
            "preview": "/templates/media-journalist.png",
            "ats_compatible": False,
            "popularity": 74,
            "sectors": ["Journalisme", "Média", "Communication", "Relations Publiques"],
            "features": ["Articles publiés", "Interviews", "Récompenses média"]
        },

        # === CATÉGORIE INTERNATIONAL ===
        {
            "id": "european_standard",
            "name": "European Standard",
            "description": "Format Europass adapté aux standards européens",
            "category": "International",
            "preview": "/templates/european-standard.png",
            "ats_compatible": True,
            "popularity": 85,
            "sectors": ["International", "Institutions", "Diplomatie", "NGO"],
            "features": ["Format Europass", "Langues détaillées", "Mobilité européenne"]
        },
        {
            "id": "consulting_mckinsey",
            "name": "Consulting McKinsey",
            "description": "Template style MBB pour consulting de prestige",
            "category": "International",
            "preview": "/templates/consulting-mckinsey.png",
            "ats_compatible": True,
            "popularity": 90,
            "sectors": ["Consulting", "Strategy", "M&A", "Private Equity"],
            "features": ["Cases studies", "Impact quantifié", "Éducation elite"]
        },
        {
            "id": "investment_banking",
            "name": "Investment Banking",
            "description": "Format Wall Street pour finance d'investissement",
            "category": "International", 
            "preview": "/templates/investment-banking.png",
            "ats_compatible": True,
            "popularity": 88,
            "sectors": ["Investment Banking", "Private Equity", "Hedge Funds", "Trading"],
            "features": ["Deals fermés", "Valorisations", "Certifications CFA"]
        },

        # === CATÉGORIE SECTORIELLE ===
        {
            "id": "retail_manager",
            "name": "Retail Manager",
            "description": "Spécialisé pour management retail et commerce",
            "category": "Sectorielle",
            "preview": "/templates/retail-manager.png",
            "ats_compatible": True,
            "popularity": 76,
            "sectors": ["Retail", "Commerce", "Grande Distribution", "E-commerce"],
            "features": ["Chiffres ventes", "Équipes gérées", "Ouvertures magasins"]
        },
        {
            "id": "hospitality_luxury",
            "name": "Hospitality Luxury",
            "description": "Pour hôtellerie et secteur du luxe",
            "category": "Sectorielle",
            "preview": "/templates/hospitality-luxury.png",
            "ats_compatible": True,
            "popularity": 72,
            "sectors": ["Hôtellerie", "Luxe", "Tourisme", "Événementiel"],
            "features": ["Expérience client", "Standards luxe", "Langues étrangères"]
        },
        {
            "id": "manufacturing_ops",
            "name": "Manufacturing Operations",
            "description": "Pour ingénieurs et responsables production",
            "category": "Sectorielle",
            "preview": "/templates/manufacturing-ops.png",
            "ats_compatible": True,
            "popularity": 78,
            "sectors": ["Manufacturing", "Production", "Supply Chain", "Qualité"],
            "features": ["Processus optimisés", "Certifications ISO", "Lean Six Sigma"]
        }
    ]
    
    # Organiser par catégorie
    categories = {}
    for template in templates:
        category = template["category"]
        if category not in categories:
            categories[category] = []
        categories[category].append(template)
    
    return {
        "templates": templates,
        "categories": categories,
        "total": len(templates),
        "stats": {
            "most_popular": max(templates, key=lambda x: x["popularity"]),
            "ats_compatible_count": len([t for t in templates if t["ats_compatible"]]),
            "categories_count": len(categories)
        }
    }

async def get_template_by_id(template_id: str) -> Optional[Dict[str, Any]]:
    """Get template data by ID for intelligent CV generation"""
    # Récupérer la même data que l'endpoint templates
    templates = [
        # === CATÉGORIE SOBRE PROFESSIONNEL ===
        {
            "id": "executive_minimal",
            "name": "Executive Minimal",
            "description": "Design ultra-épuré pour dirigeants et cadres supérieurs",
            "category": "Sobre Professionnel",
            "preview": "/templates/executive-minimal.png",
            "ats_compatible": True,
            "popularity": 95,
            "sectors": ["Direction", "C-Level", "Consulting", "Finance"],
            "features": ["Typographie classique", "Espacement généreux", "Focus sur l'expérience"]
        },
        {
            "id": "finance_classic",
            "name": "Finance Classic",
            "description": "Format traditionnel pour secteurs bancaires et financiers",
            "category": "Sobre Professionnel", 
            "preview": "/templates/finance-classic.png",
            "ats_compatible": True,
            "popularity": 88,
            "sectors": ["Finance", "Banque", "Assurance", "Audit"],
            "features": ["Format conservateur", "Sections claires", "Optimisé ATS"]
        },
        {
            "id": "legal_formal",
            "name": "Legal Formal",
            "description": "Template élégant pour professions juridiques",
            "category": "Sobre Professionnel",
            "preview": "/templates/legal-formal.png",
            "ats_compatible": True,
            "popularity": 82,
            "sectors": ["Juridique", "Notariat", "Administration", "Public"],
            "features": ["Typographie serif", "Structure formelle", "Présentation rigoureuse"]
        },
        {
            "id": "corporate_standard",
            "name": "Corporate Standard",
            "description": "Le grand classique des entreprises Fortune 500",
            "category": "Sobre Professionnel",
            "preview": "/templates/corporate-standard.png",
            "ats_compatible": True,
            "popularity": 91,
            "sectors": ["Corporate", "Industrie", "Pharma", "Énergie"],
            "features": ["Design intemporel", "Compatibilité universelle", "Lisibilité maximale"]
        },
        {
            "id": "medical_professional",
            "name": "Medical Professional",
            "description": "Template sobre pour professionnels de santé",
            "category": "Sobre Professionnel",
            "preview": "/templates/medical-professional.png",
            "ats_compatible": True,
            "popularity": 86,
            "sectors": ["Santé", "Médical", "Pharmacie", "Recherche"],
            "features": ["Mise en page médicale", "Sections certifications", "Format académique"]
        },
        {
            "id": "academic_scholar",
            "name": "Academic Scholar",
            "description": "Pour chercheurs et enseignants universitaires",
            "category": "Sobre Professionnel",
            "preview": "/templates/academic-scholar.png",
            "ats_compatible": True,
            "popularity": 79,
            "sectors": ["Académique", "Recherche", "Enseignement", "Think Tanks"],
            "features": ["Format publication", "Section recherches", "Bibliographie intégrée"]
        },

        # === CATÉGORIE MODERNE TECH ===
        {
            "id": "silicon_valley",
            "name": "Silicon Valley",
            "description": "Design moderne pour écosystème tech américain",
            "category": "Moderne Tech",
            "preview": "/templates/silicon-valley.png",
            "ats_compatible": True,
            "popularity": 94,
            "sectors": ["Tech", "Startup", "SaaS", "IA/ML"],
            "features": ["Design système", "Métriques mises en avant", "Stack technique"]
        },
        {
            "id": "developer_focused",
            "name": "Developer Focus",
            "description": "Optimisé pour développeurs et ingénieurs logiciel",
            "category": "Moderne Tech",
            "preview": "/templates/developer-focused.png",
            "ats_compatible": True,
            "popularity": 89,
            "sectors": ["Développement", "DevOps", "Cybersécurité", "Data"],
            "features": ["Section projets", "GitHub intégré", "Skills techniques"]
        },
        {
            "id": "product_manager_pro",
            "name": "Product Manager Pro",
            "description": "Conçu spécifiquement pour Product Managers",
            "category": "Moderne Tech",
            "preview": "/templates/product-manager-pro.png",
            "ats_compatible": True,
            "popularity": 92,
            "sectors": ["Product", "UX/UI", "Growth", "Strategy"],
            "features": ["KPIs en évidence", "Roadmaps produit", "Impact business"]
        },
        {
            "id": "data_scientist",
            "name": "Data Scientist",
            "description": "Template pour professionnels de la data",
            "category": "Moderne Tech",
            "preview": "/templates/data-scientist.png",
            "ats_compatible": True,
            "popularity": 87,
            "sectors": ["Data Science", "Analytics", "BI", "Research"],
            "features": ["Visualisations data", "Modèles ML", "Publications scientifiques"]
        },

        # === CATÉGORIE CRÉATIVE ===
        {
            "id": "designer_portfolio",
            "name": "Designer Portfolio",
            "description": "Showcase créatif pour designers et artistes",
            "category": "Créative",
            "preview": "/templates/designer-portfolio.png",
            "ats_compatible": False,
            "popularity": 78,
            "sectors": ["Design", "Arts", "Mode", "Architecture"],
            "features": ["Portfolio intégré", "Typographie créative", "Couleurs brand"]
        },
        {
            "id": "marketing_creative",
            "name": "Marketing Creative",
            "description": "Template dynamique pour marketeurs créatifs",
            "category": "Créative",
            "preview": "/templates/marketing-creative.png",
            "ats_compatible": False,
            "popularity": 81,
            "sectors": ["Marketing", "Communication", "Publicité", "Média"],
            "features": ["Infographies", "Campagnes mises en avant", "ROI visuel"]
        },
        {
            "id": "media_journalist",
            "name": "Media Journalist",
            "description": "Pour journalistes et professionnels des médias",
            "category": "Créative",
            "preview": "/templates/media-journalist.png",
            "ats_compatible": False,
            "popularity": 74,
            "sectors": ["Journalisme", "Média", "Communication", "Relations Publiques"],
            "features": ["Articles publiés", "Interviews", "Récompenses média"]
        },

        # === CATÉGORIE INTERNATIONAL ===
        {
            "id": "european_standard",
            "name": "European Standard",
            "description": "Format Europass adapté aux standards européens",
            "category": "International",
            "preview": "/templates/european-standard.png",
            "ats_compatible": True,
            "popularity": 85,
            "sectors": ["International", "Institutions", "Diplomatie", "NGO"],
            "features": ["Format Europass", "Langues détaillées", "Mobilité européenne"]
        },
        {
            "id": "consulting_mckinsey",
            "name": "Consulting McKinsey",
            "description": "Template style MBB pour consulting de prestige",
            "category": "International",
            "preview": "/templates/consulting-mckinsey.png",
            "ats_compatible": True,
            "popularity": 90,
            "sectors": ["Consulting", "Strategy", "M&A", "Private Equity"],
            "features": ["Cases studies", "Impact quantifié", "Éducation elite"]
        },
        {
            "id": "investment_banking",
            "name": "Investment Banking",
            "description": "Format Wall Street pour finance d'investissement",
            "category": "International", 
            "preview": "/templates/investment-banking.png",
            "ats_compatible": True,
            "popularity": 88,
            "sectors": ["Investment Banking", "Private Equity", "Hedge Funds", "Trading"],
            "features": ["Deals fermés", "Valorisations", "Certifications CFA"]
        },

        # === CATÉGORIE SECTORIELLE ===
        {
            "id": "retail_manager",
            "name": "Retail Manager",
            "description": "Spécialisé pour management retail et commerce",
            "category": "Sectorielle",
            "preview": "/templates/retail-manager.png",
            "ats_compatible": True,
            "popularity": 76,
            "sectors": ["Retail", "Commerce", "Grande Distribution", "E-commerce"],
            "features": ["Chiffres ventes", "Équipes gérées", "Ouvertures magasins"]
        },
        {
            "id": "hospitality_luxury",
            "name": "Hospitality Luxury",
            "description": "Pour hôtellerie et secteur du luxe",
            "category": "Sectorielle",
            "preview": "/templates/hospitality-luxury.png",
            "ats_compatible": True,
            "popularity": 72,
            "sectors": ["Hôtellerie", "Luxe", "Tourisme", "Événementiel"],
            "features": ["Expérience client", "Standards luxe", "Langues étrangères"]
        },
        {
            "id": "manufacturing_ops",
            "name": "Manufacturing Operations",
            "description": "Pour ingénieurs et responsables production",
            "category": "Sectorielle",
            "preview": "/templates/manufacturing-ops.png",
            "ats_compatible": True,
            "popularity": 78,
            "sectors": ["Manufacturing", "Production", "Supply Chain", "Qualité"],
            "features": ["Processus optimisés", "Certifications ISO", "Lean Six Sigma"]
        }
    ]
    
    # Trouver le template par ID
    for template in templates:
        if template["id"] == template_id:
            return template
    
    return None

@router.post("/build", summary="Generate CV from structured data")
async def build_cv(
    request: CVBuilderRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """Generate a professional CV from structured user data"""
    if not await hub.can_perform(user_id=user_id, action="CV_BUILD"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    # 🎯 Get template data for intelligent generation
    template_data = await get_template_by_id(request.template_id)
    
    if not template_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Template {request.template_id} not found")

    # 🧠 Construct template-aware prompt for CV generation
    template_guidance = f"""
    TEMPLATE SÉLECTIONNÉ: {template_data['name']} ({template_data['category']})
    STYLE: {template_data['description']}
    SECTEURS CIBLES: {', '.join(template_data['sectors'])}
    FEATURES CLÉS: {', '.join(template_data['features'])}
    COMPATIBILITÉ ATS: {'OUI' if template_data['ats_compatible'] else 'NON'}
    POPULARITÉ: {template_data['popularity']}%
    """

    prompt = f"""
    Tu es un expert en rédaction CV spécialisé dans le template "{template_data['name']}" ({template_data['category']}).
    
    {template_guidance}
    
    DONNÉES UTILISATEUR:
    
    INFORMATIONS PERSONNELLES:
    {request.personal_info}
    
    EXPÉRIENCES:
    {request.experience}
    
    COMPÉTENCES:
    {request.skills}
    
    FORMATION:
    {request.education}
    
    INSTRUCTIONS SPÉCIALISÉES:
    
    1. ADAPTATION AU TEMPLATE:
    - Respecte le style "{template_data['description']}"
    - Optimise pour les secteurs: {', '.join(template_data['sectors'])}
    - Intègre les features: {', '.join(template_data['features'])}
    
    2. COMPATIBILITÉ ATS:
    {'- PRIORITÉ ATS: Format simple, mots-clés sectoriels, sections standards' if template_data['ats_compatible'] else '- CRÉATIVITÉ: Mise en forme créative acceptée, focus sur l\'impact visuel'}
    
    3. STYLE RÉDACTIONNEL:
    - Vocabulaire spécialisé pour {template_data['category']}
    - Verbes d'action adaptés aux secteurs cibles
    - Quantification des résultats (métriques, chiffres, pourcentages)
    
    4. STRUCTURE OPTIMISÉE:
    - Hiérarchisation selon la popularité du template ({template_data['popularity']}%)
    - Adaptation longueur selon le niveau ({template_data['category']})
    - Mise en valeur des éléments clés du secteur
    
    Génère un CV professionnel qui exploite pleinement les avantages du template sélectionné.
    """

    cv_content = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="CV_BUILT",
        event_data={
            "template_id": request.template_id,
            "template_name": template_data['name'],
            "template_category": template_data['category'],
            "ats_optimized": template_data['ats_compatible'],
            "sectors_count": len(template_data['sectors']),
            "sections_count": len([x for x in [request.experience, request.skills, request.education] if x])
        }
    )

    return {
        "message": "CV generated successfully",
        "cv_content": cv_content,
        "template_id": request.template_id,
        "template_name": template_data['name'],
        "template_category": template_data['category'],
        "energy_consumed": 20,
        "template_features_applied": template_data['features']
    }

# Mapping des templates vers leurs fichiers HTML
TEMPLATE_FILE_MAPPING = {
    "executive_minimal": "executive-minimal-template.html",
    "silicon_valley": "silicon-valley-template.html",
    "finance_classic": "finance-classic-template.html", 
    "designer_portfolio": "designer-portfolio-template.html",
    "legal_formal": "legal-formal-template.html"
}

@router.post("/render", response_class=HTMLResponse, summary="Render CV with HTML template")
async def render_cv_template(
    request: CVTemplateRenderRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client)
):
    """Render CV data into professional HTML template"""
    
    # Vérification que le template existe
    if request.template_id not in TEMPLATE_FILE_MAPPING:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Template {request.template_id} not found")
    
    template_file = TEMPLATE_FILE_MAPPING[request.template_id]
    template_path = f"/Users/mattvaness/Desktop/IA/phoenix-production/phoenix-frontend/public/templates/{template_file}"
    
    # Vérifier que le fichier template existe
    if not os.path.exists(template_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Template file {template_file} not found")
    
    try:
        # Charger le template HTML
        with open(template_path, 'r', encoding='utf-8') as f:
            template_html = f.read()
        
        # Fonction simple de remplacement de variables Mustache-style
        def replace_variables(html: str, data: Dict[str, Any]) -> str:
            """Remplace les variables {{VAR}} dans le HTML avec les données"""
            
            # Variables simples
            for key, value in data.items():
                if isinstance(value, (str, int, float)):
                    placeholder = f"{{{{{key}}}}}"
                    html = html.replace(placeholder, str(value))
            
            # Gestion des listes (sections)
            # Exemple: {{#EXPERIENCES}} ... {{/EXPERIENCES}}
            for key, value in data.items():
                if isinstance(value, list) and value:  # Si c'est une liste non vide
                    # Section start/end
                    section_start = f"{{{{#{key}}}}}"
                    section_end = f"{{{{/{key}}}}}"
                    
                    if section_start in html and section_end in html:
                        # Extraire le template de la section
                        start_idx = html.find(section_start)
                        end_idx = html.find(section_end) + len(section_end)
                        
                        if start_idx != -1 and end_idx != -1:
                            before_section = html[:start_idx]
                            after_section = html[end_idx:]
                            section_template = html[start_idx + len(section_start):end_idx - len(section_end)]
                            
                            # Répéter pour chaque élément de la liste
                            rendered_items = ""
                            for item in value:
                                item_html = section_template
                                if isinstance(item, dict):
                                    for item_key, item_value in item.items():
                                        item_placeholder = f"{{{{{item_key}}}}}"
                                        item_html = item_html.replace(item_placeholder, str(item_value))
                                elif isinstance(item, str):
                                    item_html = item_html.replace("{{.}}", item)
                                rendered_items += item_html
                            
                            html = before_section + rendered_items + after_section
                
                # Gestion des sections conditionnelles vides
                elif isinstance(value, list) and not value:  # Liste vide
                    section_start = f"{{{{#{key}}}}}"
                    section_end = f"{{{{/{key}}}}}"
                    
                    if section_start in html and section_end in html:
                        start_idx = html.find(section_start)
                        end_idx = html.find(section_end) + len(section_end)
                        
                        if start_idx != -1 and end_idx != -1:
                            html = html[:start_idx] + html[end_idx:]
            
            return html
        
        # Appliquer les données au template
        rendered_html = replace_variables(template_html, request.cv_data)
        
        # Nettoyer les variables non remplacées
        import re
        rendered_html = re.sub(r'{{[^}]*}}', '', rendered_html)
        
        # Track l'événement
        await hub.track_event(
            user_id=user_id,
            event_type="CV_TEMPLATE_RENDERED",
            event_data={
                "template_id": request.template_id,
                "template_file": template_file,
                "data_sections": list(request.cv_data.keys())
            }
        )
        
        return rendered_html
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Template rendering failed: {str(e)}")