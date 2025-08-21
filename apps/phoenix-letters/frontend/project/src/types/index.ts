export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription: 'free' | 'premium';
  createdAt: Date;
}

export interface Letter {
  id: string;
  userId: string;
  companyName: string;
  positionTitle: string;
  experienceLevel: 'junior' | 'intermediate' | 'senior';
  tone: 'professional' | 'enthusiastic' | 'creative' | 'casual';
  jobDescription?: string;
  content: string;
  wordCount: number;
  readingTime: number;
  qualityScore: number;
  status: 'draft' | 'generated' | 'edited' | 'finalized' | 'sent';
  createdAt: Date;
  updatedAt: Date;
  settings: {
    wordCount: number;
    includeAchievements: boolean;
    includeMotivation: boolean;
    companyResearch: boolean;
    customInstructions?: string;
  };
}

export interface GenerationProgress {
  step: number;
  totalSteps: number;
  message: string;
  estimatedTime: number;
}

export interface UserStats {
  totalLetters: number;
  monthlyUsage: number;
  averageQuality: number;
  successRate: number;
  timeSaved: number;
  monthlyLimit: number;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  comingSoon?: boolean;
}

export interface FormData {
  companyName: string;
  positionTitle: string;
  experienceLevel: 'junior' | 'intermediate' | 'senior';
  tone: 'professional' | 'enthusiastic' | 'creative' | 'casual';
  jobDescription: string;
  wordCount: number;
  includeAchievements: boolean;
  includeMotivation: boolean;
  companyResearch: boolean;
  customInstructions: string;
  // 🎯 GAME CHANGER - Career Transition fields
  previousRole: string;
  targetRole: string;
}

// 🎯 CAREER TRANSITION TYPES - Compatible avec notre backend API

export interface TransferableSkill {
  id: string;
  name: string;
  description: string;
  confidenceScore: number;
  relevanceScore: number;
  examples: string[];
  category: 'technical' | 'soft' | 'leadership' | 'analytical' | 'creative';
  // Compatibilité avec backend
  previousContext?: string;
  targetContext?: string;
  marketDemand?: number;
}

export interface SkillGap {
  id: string;
  skill: string;
  importance: 'high' | 'medium' | 'low';
  suggestion: string;
  howToAddress: string;
  // Compatibilité avec backend
  category?: 'technical' | 'management' | 'communication' | 'analytical' | 'creative' | 'interpersonal' | 'project' | 'strategic';
  learningDifficulty?: string;
  timeToAcquire?: string;
  learningResources?: string[];
}

export interface NarrativeBridge {
  id: string;
  title: string;
  description: string;
  example: string;
  strength: number;
  // Compatibilité avec backend
  bridgeType?: string;
  narrativeText?: string;
  previousSituation?: string;
  transferableLesson?: string;
  targetApplication?: string;
}

export interface CareerTransition {
  id: string;
  previousRole: string;
  targetRole: string;
  overallCompatibility: number;
  transferableSkills: TransferableSkill[];
  skillGaps: SkillGap[];
  narrativeBridges: NarrativeBridge[];
  recommendations: string[];
  createdAt: Date;
  // Compatibilité avec backend API
  userId?: string;
  previousIndustry?: string;
  targetIndustry?: string;
  transitionDifficulty?: string;
  analysisMetadata?: {
    analysisTimeSeconds?: number;
    aiServiceUsed?: boolean;
    fallbackUsed?: boolean;
  };
}

// API Response Types pour l'intégration backend
export interface CareerTransitionResponse {
  career_transition: {
    id: string;
    user_id: string;
    previous_role: string;
    target_role: string;
    previous_industry?: string;
    target_industry?: string;
    transferable_skills: Array<{
      skill_name: string;
      confidence_level: string;
      category: string;
      description: string;
      relevance_explanation: string;
      previous_context: string;
      target_context: string;
      confidence_score: number;
      market_demand: number;
    }>;
    skill_gaps: Array<{
      skill_name: string;
      category: string;
      importance_level: string;
      learning_difficulty: string;
      time_to_acquire: string;
      learning_resources: string[];
      certification_suggestions: string[];
    }>;
    narrative_bridges: Array<{
      bridge_type: string;
      narrative_text: string;
      strength_score: number;
      previous_situation: string;
      transferable_lesson: string;
      target_application: string;
    }>;
    overall_transition_score: number;
    transition_difficulty: string;
    created_at: string;
    updated_at: string;
    analysis_version: string;
  };
  analysis_metadata: {
    analysis_time_seconds: number;
    ai_service_used: boolean;
    fallback_used: boolean;
  };
}