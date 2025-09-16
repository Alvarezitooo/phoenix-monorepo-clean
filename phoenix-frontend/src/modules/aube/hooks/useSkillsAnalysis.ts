import { useState, useCallback } from 'react';
import { aubeApi, type SkillsAnalysisRequest } from '../../../services/aubeApi';

export interface AnalysisForm {
  currentJob: string;
  targetJob: string;
}

export interface SkillMatch {
  name: string;
  mapped: string;
  score: number;
  confidence: string;
}

export interface SkillsAnalysisResult {
  exact: SkillMatch[];
  transferable: SkillMatch[];
  toAcquire: string[];
  compatibilityScore: number;
}

export const useSkillsAnalysis = () => {
  const [form, setForm] = useState<AnalysisForm>({
    currentJob: '',
    targetJob: ''
  });
  
  const [results, setResults] = useState<SkillsAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mapping intelligent des compétences
  const skillTransferMap: Record<string, { exact?: string[], transferable?: string[] }> = {
    // Management & Leadership
    'gestion équipe': { exact: ['Management', 'Leadership'], transferable: ['Coordination projets', 'Mentoring'] },
    'management': { exact: ['Leadership', 'Gestion équipe'], transferable: ['Coordination', 'Supervision'] },
    'coordination': { exact: ['Coordination projets'], transferable: ['Management', 'Organisation'] },
    
    // Communication
    'communication client': { exact: ['Communication stakeholders', 'Communication client'], transferable: ['Présentation exécutive'] },
    'communication': { exact: ['Communication'], transferable: ['Storytelling data', 'Communication digitale'] },
    
    // Techniques spécialisées
    'méthodologies agile': { exact: ['Méthodologies Agile'], transferable: ['Roadmapping', 'Priorisation features'] },
    'programmation': { transferable: ['Architecture logicielle', 'Analyse technique'] },
    'architecture logicielle': { transferable: ['Vision technique', 'Architecture système'] }
  };

  const analyzeSkillsCompatibility = useCallback((currentJob: string, targetJob: string): SkillsAnalysisResult => {
    // Extraction intelligente des compétences selon les métiers
    const getSkillsForJob = (job: string): string[] => {
      const jobLower = job.toLowerCase();
      
      if (jobLower.includes('product manager') || jobLower.includes('chef produit')) {
        return ['Vision produit', 'Roadmapping', 'Analyse utilisateur', 'Communication stakeholders', 'Priorisation features'];
      }
      if (jobLower.includes('développeur') || jobLower.includes('developer')) {
        return ['Développement logiciel', 'Résolution de problèmes', 'Architecture logicielle', 'Logique', 'Tests'];
      }
      if (jobLower.includes('chef projet') || jobLower.includes('project manager')) {
        return ['Gestion de projet', 'Planification', 'Communication équipe', 'Suivi budgets', 'Coordination'];
      }
      if (jobLower.includes('ux') || jobLower.includes('designer')) {
        return ['Design thinking', 'Prototypage', 'Recherche utilisateur', 'Wireframing', 'Tests usabilité'];
      }
      if (jobLower.includes('data') || jobLower.includes('analyst')) {
        return ['Analyse de données', 'SQL', 'Visualisation', 'Statistiques', 'Reporting'];
      }
      
      // Par défaut
      return ['Communication', 'Organisation', 'Travail équipe', 'Résolution problèmes'];
    };

    const sourceSkills = getSkillsForJob(currentJob);
    const targetSkills = getSkillsForJob(targetJob);
    
    const skillsAnalysis: SkillsAnalysisResult = {
      exact: [],
      transferable: [],
      toAcquire: [],
      compatibilityScore: 0
    };
    
    // Analyse des correspondances
    sourceSkills.forEach(sourceSkill => {
      const lowerSource = sourceSkill.toLowerCase();
      let hasDirectMatch = false;
      
      // Correspondance exacte
      targetSkills.forEach(targetSkill => {
        if (lowerSource.includes(targetSkill.toLowerCase()) || targetSkill.toLowerCase().includes(lowerSource)) {
          skillsAnalysis.exact.push({
            name: sourceSkill,
            mapped: targetSkill,
            score: 95,
            confidence: 'Très élevée'
          });
          hasDirectMatch = true;
        }
      });
      
      // Correspondance transférable
      if (!hasDirectMatch) {
        let hasTransfer = false;
        Object.keys(skillTransferMap).forEach(key => {
          if (lowerSource.includes(key)) {
            const mapping = skillTransferMap[key];
            
            mapping.transferable?.forEach(transferSkill => {
              if (targetSkills.some(t => t.toLowerCase().includes(transferSkill.toLowerCase()))) {
                skillsAnalysis.transferable.push({
                  name: sourceSkill,
                  mapped: transferSkill,
                  score: 75,
                  confidence: 'Moyenne'
                });
                hasTransfer = true;
              }
            });
          }
        });
      }
    });
    
    // Compétences à acquérir
    targetSkills.forEach(targetSkill => {
      const hasMatch = skillsAnalysis.exact.some(s => s.mapped === targetSkill) ||
                      skillsAnalysis.transferable.some(s => s.mapped === targetSkill);
      
      if (!hasMatch) {
        skillsAnalysis.toAcquire.push(targetSkill);
      }
    });
    
    // Calcul score de compatibilité
    const totalMatches = skillsAnalysis.exact.length + (skillsAnalysis.transferable.length * 0.6);
    const maxPossible = targetSkills.length;
    skillsAnalysis.compatibilityScore = Math.round((totalMatches / maxPossible) * 100);
    
    return skillsAnalysis;
  }, []);

  const analyzeSkills = useCallback(async (formData: AnalysisForm) => {
    if (!formData.currentJob.trim() || !formData.targetJob.trim()) {
      throw new Error('Veuillez renseigner votre poste actuel et le poste cible');
    }

    setIsAnalyzing(true);
    
    try {
      // Appel API réel au backend
      const requestData: SkillsAnalysisRequest = {
        current_job: formData.currentJob,
        target_job: formData.targetJob,
        experience_level: "intermediate" // Peut être enrichi plus tard
      };

      const backendResults = await aubeApi.analyzeSkills(requestData);
      
      // Transform backend results ou fallback vers calcul local
      if (backendResults?.transferable_skills && backendResults?.skills_to_develop) {
        const transformedResults: SkillsAnalysisResult = {
          exact: backendResults.transferable_skills
            .filter((skill: any) => skill.type === 'exact')
            .map((skill: any) => ({
              name: skill.name,
              mapped: skill.name,
              score: skill.compatibility,
              confidence: skill.compatibility > 90 ? 'Très élevée' : 'Élevée'
            })),
          transferable: backendResults.transferable_skills
            .filter((skill: any) => skill.type === 'transferable')
            .map((skill: any) => ({
              name: skill.name,
              mapped: skill.name,
              score: skill.compatibility,
              confidence: skill.compatibility > 70 ? 'Moyenne' : 'Faible'
            })),
          toAcquire: backendResults.skills_to_develop.map((skill: any) => skill.name),
          compatibilityScore: backendResults.transition_score || 75
        };
        setResults(transformedResults);
      } else {
        // Fallback vers calcul local si backend non disponible
        const analysis = analyzeSkillsCompatibility(formData.currentJob, formData.targetJob);
        setResults(analysis);
      }
    } catch (error) {
      console.error('Error with backend skills analysis:', error);
      // Fallback vers calcul local
      const analysis = analyzeSkillsCompatibility(formData.currentJob, formData.targetJob);
      setResults(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeSkillsCompatibility]);

  const updateForm = useCallback((field: keyof AnalysisForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setForm({
      currentJob: '',
      targetJob: ''
    });
    setResults(null);
    setIsAnalyzing(false);
  }, []);

  return {
    form,
    results,
    isAnalyzing,
    updateForm,
    analyzeSkills,
    resetAnalysis
  };
};