/**
 * 🧠 Narrative Capture Service - Event Enrichment Layer
 * 
 * Service intelligent qui capture et enrichit automatiquement CHAQUE action
 * utilisateur pour nourrir le Journal Narratif Luna Hub.
 * 
 * Transforme les actions silencieuses en insights narratifs riches.
 */

import { useLuna } from '../luna';

// Types pour l'enrichissement narratif
export interface UserBehaviorSignals {
  time_spent_ms: number;
  interaction_depth: 'surface' | 'engaged' | 'deep';
  completion_confidence: 'hesitant' | 'confident' | 'decisive';
  session_momentum: 'building' | 'maintaining' | 'declining';
  emotional_indicators: string[];
}

export interface ModuleActionContext {
  module: 'aube' | 'cv' | 'letters' | 'rise';
  action_type: string;
  tool_used: string;
  results_quality?: 'low' | 'medium' | 'high';
  user_satisfaction_inferred?: 'dissatisfied' | 'neutral' | 'satisfied';
  next_likely_actions: string[];
}

export interface NarrativeEnrichment {
  // Données explicites de l'action
  explicit_data: Record<string, any>;
  
  // Signaux comportementaux détectés
  behavioral_signals: UserBehaviorSignals;
  
  // Contexte du module et de l'action
  module_context: ModuleActionContext;
  
  // Prédictions intelligentes
  predictions: {
    next_module_likely: string;
    user_emotional_state: string;
    journey_stage: string;
    blockers_detected: string[];
    opportunities_identified: string[];
  };
  
  // Métadonnées pour le Journal Narratif
  narrative_metadata: {
    story_chapter: string;
    character_development: string;
    plot_advancement: 'major' | 'minor' | 'setup';
    emotional_arc_change: 'positive' | 'negative' | 'neutral';
  };
}

class NarrativeCaptureService {
  private sessionStartTime: number;
  private actionHistory: Array<{ action: string; timestamp: number; module: string }> = [];
  private currentSessionMomentum: 'building' | 'maintaining' | 'declining' = 'building';
  
  constructor() {
    this.sessionStartTime = Date.now();
    this.initializeBehaviorTracking();
  }

  /**
   * 🎯 Point d'entrée principal - Capture et enrichit une action utilisateur
   */
  async captureActionWithEnrichment(
    actionType: string,
    module: string,
    explicitData: Record<string, any>,
    actionStartTime?: number
  ): Promise<void> {
    const actionDuration = actionStartTime ? Date.now() - actionStartTime : 0;
    
    try {
      // 1. Analyser les signaux comportementaux
      const behavioralSignals = this.analyzeBehavioralSignals(
        actionType, 
        module, 
        actionDuration
      );

      // 2. Construire le contexte du module
      const moduleContext = this.buildModuleContext(
        module as 'aube' | 'cv' | 'letters' | 'rise',
        actionType,
        explicitData
      );

      // 3. Générer des prédictions intelligentes
      const predictions = this.generatePredictions(
        module,
        actionType,
        explicitData,
        behavioralSignals
      );

      // 4. Créer les métadonnées narratives
      const narrativeMetadata = this.generateNarrativeMetadata(
        module,
        actionType,
        predictions
      );

      // 5. Assembler l'enrichissement complet
      const enrichment: NarrativeEnrichment = {
        explicit_data: explicitData,
        behavioral_signals: behavioralSignals,
        module_context: moduleContext,
        predictions: predictions,
        narrative_metadata: narrativeMetadata
      };

      // 6. Transmettre à Luna Hub pour mise à jour Journal Narratif
      await this.transmitToNarrativeJournal(actionType, module, enrichment);

      // 7. Mettre à jour l'historique local
      this.updateActionHistory(actionType, module);

      console.log('🧠 Narrative capture enriched:', {
        action: actionType,
        module: module,
        behavioral_depth: behavioralSignals.interaction_depth,
        predicted_next: predictions.next_module_likely,
        story_chapter: narrativeMetadata.story_chapter
      });

    } catch (error) {
      console.error('❌ Narrative capture failed:', error);
      // Ne pas faire échouer l'action utilisateur si la capture narrative échoue
    }
  }

  /**
   * 🎭 Analyse des signaux comportementaux implicites
   */
  private analyzeBehavioralSignals(
    actionType: string,
    module: string,
    duration: number
  ): UserBehaviorSignals {
    // Calculer la profondeur d'interaction basée sur la durée
    let interactionDepth: 'surface' | 'engaged' | 'deep' = 'surface';
    if (duration > 2000) interactionDepth = 'engaged';
    if (duration > 10000) interactionDepth = 'deep';

    // Détecter la confiance basée sur la vitesse d'action
    let completionConfidence: 'hesitant' | 'confident' | 'decisive' = 'confident';
    if (duration < 500) completionConfidence = 'decisive';
    if (duration > 15000) completionConfidence = 'hesitant';

    // Analyser la momentum de session
    this.updateSessionMomentum(actionType, module);

    // Indicateurs émotionnels inférés
    const emotionalIndicators = this.inferEmotionalIndicators(
      actionType,
      duration,
      interactionDepth
    );

    return {
      time_spent_ms: duration,
      interaction_depth: interactionDepth,
      completion_confidence: completionConfidence,
      session_momentum: this.currentSessionMomentum,
      emotional_indicators: emotionalIndicators
    };
  }

  /**
   * 🏗️ Construction du contexte spécifique au module
   */
  private buildModuleContext(
    module: 'aube' | 'cv' | 'letters' | 'rise',
    actionType: string,
    data: Record<string, any>
  ): ModuleActionContext {
    // Mapping des outils par module
    const toolMapping = {
      aube: this.identifyAubeTool(actionType, data),
      cv: this.identifyCVTool(actionType, data),
      letters: this.identifyLettersTool(actionType, data),
      rise: this.identifyRiseTool(actionType, data)
    };

    // Évaluer la qualité des résultats si disponible
    const resultsQuality = this.assessResultsQuality(module, data);

    // Prédire les prochaines actions probables
    const nextLikelyActions = this.predictNextActions(module, actionType, data);

    return {
      module: module,
      action_type: actionType,
      tool_used: toolMapping[module],
      results_quality: resultsQuality,
      user_satisfaction_inferred: this.inferSatisfaction(resultsQuality, data),
      next_likely_actions: nextLikelyActions
    };
  }

  /**
   * 🔮 Génération de prédictions intelligentes
   */
  private generatePredictions(
    module: string,
    actionType: string,
    data: Record<string, any>,
    behavioralSignals: UserBehaviorSignals
  ) {
    // Prédiction du prochain module probable
    const nextModuleProbability = this.calculateModuleProbabilities(
      module, 
      actionType, 
      data
    );

    // État émotionnel inféré
    const emotionalState = this.inferEmotionalState(
      behavioralSignals,
      actionType,
      data
    );

    // Stage du journey utilisateur
    const journeyStage = this.identifyJourneyStage(module, actionType, data);

    // Détection de blocages potentiels
    const blockersDetected = this.detectPotentialBlockers(
      module,
      behavioralSignals,
      data
    );

    // Identification d'opportunités
    const opportunitiesIdentified = this.identifyOpportunities(
      module,
      actionType,
      data,
      emotionalState
    );

    return {
      next_module_likely: nextModuleProbability[0]?.module || 'cv',
      user_emotional_state: emotionalState,
      journey_stage: journeyStage,
      blockers_detected: blockersDetected,
      opportunities_identified: opportunitiesIdentified
    };
  }

  /**
   * 📖 Génération des métadonnées narratives pour le Journal
   */
  private generateNarrativeMetadata(
    module: string,
    actionType: string,
    predictions: any
  ) {
    // Identifier le chapitre de l'histoire
    const storyChapter = this.identifyStoryChapter(module, actionType, predictions);

    // Évaluer le développement du "personnage" (utilisateur)
    const characterDevelopment = this.assessCharacterDevelopment(
      module,
      actionType,
      predictions.user_emotional_state
    );

    // Mesurer l'avancement de l'intrigue
    const plotAdvancement = this.assessPlotAdvancement(actionType, module);

    // Changement dans l'arc émotionnel
    const emotionalArcChange = this.assessEmotionalArcChange(
      predictions.user_emotional_state
    );

    return {
      story_chapter: storyChapter,
      character_development: characterDevelopment,
      plot_advancement: plotAdvancement,
      emotional_arc_change: emotionalArcChange
    };
  }

  /**
   * 📡 Transmission vers Luna Hub pour mise à jour Journal Narratif
   */
  private async transmitToNarrativeJournal(
    actionType: string,
    module: string,
    enrichment: NarrativeEnrichment
  ): Promise<void> {
    try {
      // Récupération du contexte utilisateur via Luna
      const { user } = useLuna.getState ? useLuna.getState() : { user: null };
      if (!user?.id) return;

      // Appel à Luna Hub pour enrichissement narratif
      const response = await fetch(`${import.meta.env.MODE === 'development' 
        ? 'http://localhost:8003' 
        : 'https://luna-hub-production.up.railway.app'}/luna/narrative/enrich-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: user.id,
          event_type: `${module}_${actionType}`,
          app_source: module,
          narrative_enrichment: enrichment,
          timestamp: new Date().toISOString(),
          session_id: this.getCurrentSessionId()
        })
      });

      if (!response.ok) {
        throw new Error(`Narrative transmission failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📡 Narrative enrichment transmitted successfully:', result);

    } catch (error) {
      console.warn('⚠️ Narrative transmission failed (non-blocking):', error);
      // L'échec de transmission ne doit pas affecter l'UX
    }
  }

  // ========== MÉTHODES UTILITAIRES ==========

  private initializeBehaviorTracking(): void {
    // Tracking des patterns de navigation et d'engagement
    if (typeof window !== 'undefined') {
      // Track page focus/blur pour mesurer l'engagement
      window.addEventListener('focus', () => this.recordEngagementSignal('focus'));
      window.addEventListener('blur', () => this.recordEngagementSignal('blur'));
    }
  }

  private updateActionHistory(actionType: string, module: string): void {
    this.actionHistory.push({
      action: actionType,
      timestamp: Date.now(),
      module: module
    });

    // Garder seulement les 20 dernières actions
    if (this.actionHistory.length > 20) {
      this.actionHistory = this.actionHistory.slice(-20);
    }
  }

  private updateSessionMomentum(actionType: string, module: string): void {
    const recentActions = this.actionHistory.slice(-5);
    const uniqueModules = new Set(recentActions.map(a => a.module));
    
    if (uniqueModules.size > 2) {
      this.currentSessionMomentum = 'building'; // Exploration active
    } else if (recentActions.length >= 3) {
      this.currentSessionMomentum = 'maintaining'; // Focus soutenu
    } else {
      this.currentSessionMomentum = 'declining'; // Activité faible
    }
  }

  private inferEmotionalIndicators(
    actionType: string,
    duration: number,
    depth: string
  ): string[] {
    const indicators: string[] = [];

    if (duration < 1000) indicators.push('impatient');
    if (duration > 10000) indicators.push('thoughtful');
    if (depth === 'deep') indicators.push('engaged');
    if (actionType.includes('discover') || actionType.includes('explore')) {
      indicators.push('curious');
    }

    return indicators;
  }

  // Méthodes d'identification des outils par module
  private identifyAubeTool(actionType: string, data: any): string {
    if (actionType.includes('career_discovery')) return 'Career Discovery';
    if (actionType.includes('psychometric')) return 'Personality Assessment';
    return 'General Exploration';
  }

  private identifyCVTool(actionType: string, data: any): string {
    if (actionType.includes('mirror_match')) return 'Mirror Match Analysis';
    if (actionType.includes('ats_optimization')) return 'ATS Optimization';
    if (actionType.includes('upload')) return 'CV Upload';
    return 'CV Enhancement';
  }

  private identifyLettersTool(actionType: string, data: any): string {
    if (actionType.includes('generate')) return 'Letter Generation';
    if (actionType.includes('company_research')) return 'Company Research';
    return 'Letter Optimization';
  }

  private identifyRiseTool(actionType: string, data: any): string {
    if (actionType.includes('interview_simulation')) return 'Interview Simulation';
    if (actionType.includes('storytelling')) return 'Storytelling Coach';
    return 'Interview Preparation';
  }

  private assessResultsQuality(module: string, data: any): 'low' | 'medium' | 'high' {
    // Logique d'évaluation de qualité basée sur les scores/métriques
    if (data.score >= 85 || data.compatibility_score >= 90) return 'high';
    if (data.score >= 70 || data.compatibility_score >= 75) return 'medium';
    return 'low';
  }

  private inferSatisfaction(
    quality: 'low' | 'medium' | 'high' | undefined,
    data: any
  ): 'dissatisfied' | 'neutral' | 'satisfied' {
    if (quality === 'high') return 'satisfied';
    if (quality === 'low') return 'dissatisfied';
    return 'neutral';
  }

  private predictNextActions(
    module: string,
    actionType: string,
    data: any
  ): string[] {
    const nextActions: Record<string, string[]> = {
      aube: ['optimize_cv_for_target', 'create_targeted_letter', 'prepare_interview'],
      cv: ['generate_cover_letter', 'practice_interview', 'apply_to_jobs'],
      letters: ['submit_application', 'prepare_interview', 'follow_up'],
      rise: ['schedule_interview', 'refine_cv', 'practice_more']
    };

    return nextActions[module] || ['explore_other_modules'];
  }

  private calculateModuleProbabilities(
    currentModule: string,
    actionType: string,
    data: any
  ): Array<{module: string, probability: number}> {
    // Matrice de probabilités de transition entre modules
    const transitionMatrix: Record<string, Record<string, number>> = {
      aube: { cv: 0.4, letters: 0.3, rise: 0.2, aube: 0.1 },
      cv: { letters: 0.4, rise: 0.3, aube: 0.2, cv: 0.1 },
      letters: { rise: 0.5, cv: 0.3, aube: 0.1, letters: 0.1 },
      rise: { cv: 0.4, letters: 0.3, aube: 0.2, rise: 0.1 }
    };

    const probabilities = transitionMatrix[currentModule] || transitionMatrix.aube;
    
    return Object.entries(probabilities)
      .map(([module, probability]) => ({ module, probability }))
      .sort((a, b) => b.probability - a.probability);
  }

  private inferEmotionalState(
    signals: UserBehaviorSignals,
    actionType: string,
    data: any
  ): string {
    if (signals.completion_confidence === 'decisive' && signals.interaction_depth === 'engaged') {
      return 'confident_and_motivated';
    }
    if (signals.completion_confidence === 'hesitant') {
      return 'uncertain_needs_guidance';
    }
    if (signals.emotional_indicators.includes('curious')) {
      return 'exploratory_and_open';
    }
    return 'neutral_progressing';
  }

  private identifyJourneyStage(module: string, actionType: string, data: any): string {
    if (module === 'aube') return 'career_exploration';
    if (module === 'cv') return 'profile_optimization';
    if (module === 'letters') return 'application_preparation';
    if (module === 'rise') return 'interview_readiness';
    return 'general_progression';
  }

  private detectPotentialBlockers(
    module: string,
    signals: UserBehaviorSignals,
    data: any
  ): string[] {
    const blockers: string[] = [];

    if (signals.completion_confidence === 'hesitant') {
      blockers.push('decision_paralysis');
    }
    if (signals.session_momentum === 'declining') {
      blockers.push('engagement_drop');
    }
    if (data.score && data.score < 70) {
      blockers.push('quality_concerns');
    }

    return blockers;
  }

  private identifyOpportunities(
    module: string,
    actionType: string,
    data: any,
    emotionalState: string
  ): string[] {
    const opportunities: string[] = [];

    if (emotionalState === 'confident_and_motivated') {
      opportunities.push('accelerate_to_next_phase');
    }
    if (data.score && data.score > 85) {
      opportunities.push('leverage_high_quality_results');
    }
    if (emotionalState === 'exploratory_and_open') {
      opportunities.push('introduce_advanced_features');
    }

    return opportunities;
  }

  // Méthodes de métadonnées narratives
  private identifyStoryChapter(module: string, actionType: string, predictions: any): string {
    const chapters = {
      aube: 'Career Discovery & Self-Awareness',
      cv: 'Professional Identity Crafting',
      letters: 'Targeted Communication Mastery',
      rise: 'Confidence & Interview Excellence'
    };

    return chapters[module as keyof typeof chapters] || 'Phoenix Journey';
  }

  private assessCharacterDevelopment(
    module: string,
    actionType: string,
    emotionalState: string
  ): string {
    if (emotionalState.includes('confident')) {
      return 'Growing confidence and clarity';
    }
    if (emotionalState.includes('uncertain')) {
      return 'Seeking direction and support';
    }
    return 'Steady progression and learning';
  }

  private assessPlotAdvancement(actionType: string, module: string): 'major' | 'minor' | 'setup' {
    if (actionType.includes('complete') || actionType.includes('generate')) {
      return 'major';
    }
    if (actionType.includes('start') || actionType.includes('explore')) {
      return 'setup';
    }
    return 'minor';
  }

  private assessEmotionalArcChange(emotionalState: string): 'positive' | 'negative' | 'neutral' {
    if (emotionalState.includes('confident') || emotionalState.includes('motivated')) {
      return 'positive';
    }
    if (emotionalState.includes('uncertain') || emotionalState.includes('concerns')) {
      return 'negative';
    }
    return 'neutral';
  }

  private recordEngagementSignal(signal: string): void {
    // Enregistrement des signaux d'engagement pour analyse comportementale
    console.log(`📊 Engagement signal recorded: ${signal}`);
  }

  private getCurrentSessionId(): string {
    // Génération ou récupération d'un ID de session
    return `session_${this.sessionStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instance globale du service
export const narrativeCapture = new NarrativeCaptureService();

// Hook React pour utilisation facile dans les composants
export const useNarrativeCapture = () => {
  return {
    captureAction: narrativeCapture.captureActionWithEnrichment.bind(narrativeCapture),
    
    // Méthodes de convenance pour les actions courantes
    captureCareerDiscovery: (data: any, startTime?: number) =>
      narrativeCapture.captureActionWithEnrichment('career_discovery_completed', 'aube', data, startTime),
      
    captureCVAnalysis: (data: any, startTime?: number) =>
      narrativeCapture.captureActionWithEnrichment('cv_analysis_completed', 'cv', data, startTime),
      
    captureLetterGeneration: (data: any, startTime?: number) =>
      narrativeCapture.captureActionWithEnrichment('letter_generated', 'letters', data, startTime),
      
    captureInterviewPrep: (data: any, startTime?: number) =>
      narrativeCapture.captureActionWithEnrichment('interview_prep_completed', 'rise', data, startTime),
      
    captureInterviewSimulation: (data: any, startTime?: number) =>
      narrativeCapture.captureActionWithEnrichment('interview_simulation_completed', 'rise', data, startTime)
  };
};

export default narrativeCapture;