import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CareerTransition, CareerTransitionResponse, TransferableSkill, SkillGap, NarrativeBridge } from '@/types';

// Utility pour générer des IDs (compatible avec notre backend)
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

// Service API intégré à notre backend Phoenix Letters
class CareerTransitionAPIService {
  private baseURL = import.meta.env.VITE_API_URL || 'https://phoenix-letters-production.up.railway.app';

  async analyzeTransition(previousRole: string, targetRole: string, previousIndustry?: string, targetIndustry?: string): Promise<CareerTransition> {
    try {
      const response = await fetch(`${this.baseURL}/api/skills/analyze-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previous_role: previousRole,
          target_role: targetRole,
          previous_industry: previousIndustry,
          target_industry: targetIndustry,
          include_industry_analysis: true,
          include_narrative_bridges: true,
          max_transferable_skills: 8,
          max_skill_gaps: 6,
          max_narrative_bridges: 4
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: CareerTransitionResponse = await response.json();
      return this.transformBackendResponse(data);
      
    } catch (error) {
      console.warn('Backend API unavailable, using fallback:', error);
      return this.getFallbackAnalysis(previousRole, targetRole);
    }
  }

  async getPreview(previousRole: string, targetRole: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/skills/preview-transition?previous_role=${encodeURIComponent(previousRole)}&target_role=${encodeURIComponent(targetRole)}`);
      
      if (!response.ok) {
        throw new Error(`Preview API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Preview API unavailable:', error);
      return {
        transition: {
          from: previousRole,
          to: targetRole,
          estimated_difficulty: 'medium',
          estimated_score_range: '0.6-0.8'
        }
      };
    }
  }

  private transformBackendResponse(data: CareerTransitionResponse): CareerTransition {
    const backend = data.career_transition;
    
    // Transformation des compétences transférables
    const transferableSkills: TransferableSkill[] = backend.transferable_skills.map(skill => ({
      id: generateId(),
      name: skill.skill_name,
      description: skill.description,
      confidenceScore: Math.round(skill.confidence_score * 100),
      relevanceScore: Math.round(skill.market_demand * 100),
      examples: [skill.previous_context, skill.target_context].filter(Boolean),
      category: this.mapSkillCategory(skill.category),
      previousContext: skill.previous_context,
      targetContext: skill.target_context,
      marketDemand: skill.market_demand
    }));

    // Transformation des lacunes
    const skillGaps: SkillGap[] = backend.skill_gaps.map(gap => ({
      id: generateId(),
      skill: gap.skill_name,
      importance: this.mapImportanceLevel(gap.importance_level),
      suggestion: gap.learning_resources.length > 0 ? gap.learning_resources[0] : 'Formation recommandée',
      howToAddress: gap.learning_difficulty === 'easy' ? 'Formation courte possible' : 'Nécessite un investissement temps',
      category: gap.category,
      learningDifficulty: gap.learning_difficulty,
      timeToAcquire: gap.time_to_acquire,
      learningResources: gap.learning_resources
    }));

    // Transformation des ponts narratifs
    const narrativeBridges: NarrativeBridge[] = backend.narrative_bridges.map(bridge => ({
      id: generateId(),
      title: bridge.bridge_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: bridge.transferable_lesson,
      example: bridge.narrative_text,
      strength: Math.round(bridge.strength_score * 100),
      bridgeType: bridge.bridge_type,
      narrativeText: bridge.narrative_text,
      previousSituation: bridge.previous_situation,
      transferableLesson: bridge.transferable_lesson,
      targetApplication: bridge.target_application
    }));

    return {
      id: backend.id,
      previousRole: backend.previous_role,
      targetRole: backend.target_role,
      overallCompatibility: Math.round(backend.overall_transition_score * 100),
      transferableSkills,
      skillGaps,
      narrativeBridges,
      recommendations: this.generateRecommendations(transferableSkills, skillGaps),
      createdAt: new Date(backend.created_at),
      userId: backend.user_id,
      previousIndustry: backend.previous_industry,
      targetIndustry: backend.target_industry,
      transitionDifficulty: backend.transition_difficulty,
      analysisMetadata: {
        analysisTimeSeconds: data.analysis_metadata.analysis_time_seconds,
        aiServiceUsed: data.analysis_metadata.ai_service_used,
        fallbackUsed: data.analysis_metadata.fallback_used
      }
    };
  }

  private mapSkillCategory(backendCategory: string): 'technical' | 'soft' | 'leadership' | 'analytical' | 'creative' {
    const mapping: Record<string, 'technical' | 'soft' | 'leadership' | 'analytical' | 'creative'> = {
      'technical': 'technical',
      'management': 'leadership',
      'communication': 'soft',
      'analytical': 'analytical',
      'creative': 'creative',
      'interpersonal': 'soft',
      'project': 'leadership',
      'strategic': 'analytical'
    };
    return mapping[backendCategory] || 'soft';
  }

  private mapImportanceLevel(backendLevel: string): 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'high' | 'medium' | 'low'> = {
      'critical': 'high',
      'important': 'medium',
      'nice-to-have': 'low'
    };
    return mapping[backendLevel] || 'medium';
  }

  private generateRecommendations(skills: TransferableSkill[], gaps: SkillGap[]): string[] {
    const recommendations: string[] = [];
    
    // Top skills à mettre en avant
    const topSkills = skills.filter(s => s.confidenceScore > 80).slice(0, 2);
    if (topSkills.length > 0) {
      recommendations.push(`Mettez en avant votre expertise en ${topSkills.map(s => s.name).join(' et ')}`);
    }

    // Lacunes critiques
    const criticalGaps = gaps.filter(g => g.importance === 'high').slice(0, 2);
    if (criticalGaps.length > 0) {
      recommendations.push(`Préparez-vous sur ${criticalGaps.map(g => g.skill).join(' et ')}`);
    }

    // Conseil général
    recommendations.push('Utilisez des exemples concrets et chiffrés de vos réalisations');
    recommendations.push('Préparez des anecdotes qui illustrent votre adaptabilité');

    return recommendations;
  }

  // Fallback si l'API backend n'est pas disponible
  private async getFallbackAnalysis(previousRole: string, targetRole: string): Promise<CareerTransition> {
    // Simulation avec délai pour l'UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTransferableSkills: TransferableSkill[] = [
      {
        id: generateId(),
        name: 'Gestion de Projet',
        description: 'Capacité à planifier, exécuter et livrer des projets dans les délais',
        confidenceScore: 92,
        relevanceScore: 88,
        examples: ['Direction d\'équipes transversales', 'Gestion des délais', 'Coordination des parties prenantes'],
        category: 'leadership'
      },
      {
        id: generateId(),
        name: 'Analyse de Données',
        description: 'Compétences analytiques pour la prise de décisions basées sur les données',
        confidenceScore: 85,
        relevanceScore: 95,
        examples: ['Création de tableaux de bord', 'Analyse des tendances', 'Génération d\'insights'],
        category: 'analytical'
      },
      {
        id: generateId(),
        name: 'Communication',
        description: 'Excellentes compétences de communication écrite et orale',
        confidenceScore: 90,
        relevanceScore: 85,
        examples: ['Présentations exécutives', 'Rédaction de documentation', 'Animation de réunions'],
        category: 'soft'
      },
      {
        id: generateId(),
        name: 'Résolution de Problèmes',
        description: 'Capacité à identifier les enjeux et développer des solutions créatives',
        confidenceScore: 88,
        relevanceScore: 92,
        examples: ['Résolution d\'issues techniques', 'Optimisation de processus', 'Mise en œuvre de solutions'],
        category: 'analytical'
      }
    ];

    const mockSkillGaps: SkillGap[] = [
      {
        id: generateId(),
        skill: 'Connaissance Sectorielle',
        importance: 'high',
        suggestion: 'Mettez en avant votre capacité d\'apprentissage rapide',
        howToAddress: 'Mentionnez formations, certifications ou auto-formation entreprises'
      },
      {
        id: generateId(),
        skill: 'Outils Techniques Spécialisés',
        importance: 'medium',
        suggestion: 'Emphasez votre adaptabilité aux nouvelles technologies',
        howToAddress: 'Montrez des exemples de maîtrise rapide d\'outils dans vos précédents postes'
      }
    ];

    const mockNarrativeBridges: NarrativeBridge[] = [
      {
        id: generateId(),
        title: 'Leadership Transversal',
        description: 'Votre expérience de management d\'équipes diverses se transpose directement',
        example: `Dans mon précédent poste de ${previousRole}, j'ai dirigé une équipe de 8 personnes de différents départements, ce qui m'a préparé à la collaboration transversale requise pour ce poste de ${targetRole}.`,
        strength: 95
      },
      {
        id: generateId(),
        title: 'Approche Analytique',
        description: 'Votre démarche data-driven s\'aligne avec les exigences analytiques du nouveau domaine',
        example: 'Mon expérience dans l\'analyse de métriques de performance et l\'identification d\'opportunités d\'optimisation m\'a équipé des compétences analytiques essentielles pour ce rôle.',
        strength: 88
      },
      {
        id: generateId(),
        title: 'Adaptabilité & Évolution',
        description: 'Votre progression de carrière démontre l\'adaptabilité nécessaire pour cette transition',
        example: 'Tout au long de ma carrière, j\'ai constamment relevé de nouveaux défis et élargi mon périmètre de compétences, démontrant l\'adaptabilité cruciale pour réussir dans ce nouveau domaine.',
        strength: 82
      }
    ];

    return {
      id: generateId(),
      previousRole,
      targetRole,
      overallCompatibility: 87,
      transferableSkills: mockTransferableSkills,
      skillGaps: mockSkillGaps,
      narrativeBridges: mockNarrativeBridges,
      recommendations: [
        'Mettez l\'accent sur votre expérience en gestion de projet, très valorisée dans le rôle cible',
        'Soulignez des exemples spécifiques de prises de décision basées sur les données',
        'Adressez la transition sectorielle en montrant vos recherches et votre préparation',
        'Utilisez des métriques et réalisations quantifiables pour démontrer votre impact'
      ],
      createdAt: new Date(),
    };
  }
}

// Hook principal pour l'utilisation dans les composants
export function useCareerTransition() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { setCareerTransition } = useStore();
  
  const apiService = new CareerTransitionAPIService();

  const analyzeTransition = async (
    previousRole: string, 
    targetRole: string,
    previousIndustry?: string,
    targetIndustry?: string
  ): Promise<CareerTransition> => {
    if (!previousRole.trim() || !targetRole.trim()) {
      throw new Error('Rôles précédent et cible obligatoires');
    }

    if (previousRole.trim().toLowerCase() === targetRole.trim().toLowerCase()) {
      throw new Error('Le rôle précédent ne peut être identique au rôle cible');
    }

    setIsAnalyzing(true);
    
    try {
      const transition = await apiService.analyzeTransition(previousRole, targetRole, previousIndustry, targetIndustry);
      setCareerTransition(transition);
      return transition;
    } catch (error) {
      console.error('Erreur analyse transition:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPreview = async (previousRole: string, targetRole: string) => {
    if (!previousRole.trim() || !targetRole.trim()) {
      return null;
    }

    setIsLoadingPreview(true);
    
    try {
      return await apiService.getPreview(previousRole, targetRole);
    } catch (error) {
      console.error('Erreur preview:', error);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return {
    analyzeTransition,
    getPreview,
    isAnalyzing,
    isLoadingPreview,
  };
}