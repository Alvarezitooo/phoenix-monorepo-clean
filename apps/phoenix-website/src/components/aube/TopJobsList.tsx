import React from 'react';

interface JobRecommendation {
  job_code: string;
  label: string;
  reasons: Array<{
    feature: string;
    phrase: string;
  }>;
  counter_example?: {
    risk: string;
    phrase: string;
  };
  futureproof: {
    score_0_1: number;
    drivers: Array<{
      factor: string;
      direction: string;
      phrase: string;
    }>;
  };
  timeline: Array<{
    year: number;
    change: string;
    signal: string;
    confidence: number;
  }>;
  ia_plan: Array<{
    skill: string;
    micro_action: string;
    effort_min_per_day: number;
    resource_hint: string;
    benefit_phrase: string;
    difficulty: number;
  }>;
}

interface TopJobsListProps {
  data: {
    recommendations: JobRecommendation[];
  };
}

const TopJobsList: React.FC<TopJobsListProps> = ({ data }) => {
  const confidenceIcon = (level: number) => {
    return "×".repeat(level);
  };

  return (
    <div className="space-y-6">
      {data.recommendations.map((job, index) => (
        <div key={job.job_code} className="bg-white border rounded-2xl p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{job.label}</h3>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Pérennité estimée</div>
              <div className="text-lg font-mono">{job.futureproof.score_0_1.toFixed(2)}</div>
            </div>
          </div>

          {/* Raisons */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Pourquoi ce métier te correspond :</h4>
            <div className="space-y-1">
              {job.reasons.map((reason, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  • {reason.phrase}
                </div>
              ))}
            </div>
          </div>

          {/* Contre-exemple si présent */}
          {job.counter_example && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="text-sm text-yellow-800">
                ⚠️ {job.counter_example.phrase}
              </div>
            </div>
          )}

          {/* Drivers future-proof */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Facteurs de pérennité :</h4>
            <div className="space-y-1">
              {job.futureproof.drivers.map((driver, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  • {driver.phrase}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline secteur */}
          {job.timeline.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Évolution du secteur :</h4>
              <div className="space-y-1">
                {job.timeline.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    {item.year} — {item.change} ({confidenceIcon(item.confidence)})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan IA-skills */}
          {job.ia_plan.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Devenir IA-proof en 30 min/jour — {job.ia_plan.length} idées pour commencer
              </h4>
              <div className="space-y-2">
                {job.ia_plan.map((skill, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium text-blue-700">{skill.skill}</div>
                    <div className="text-blue-600">{skill.micro_action}</div>
                    <div className="text-xs text-blue-500">
                      {skill.effort_min_per_day}min/jour • {skill.benefit_phrase} • 
                      Niveau {skill.difficulty}/3
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TopJobsList;