import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface SectorTrend {
  sector: string;
  growth_rate: number;
  hiring_demand: 'Très forte' | 'Forte' | 'Modérée' | 'Faible';
  avg_salary: string;
  hot_roles: string[];
  future_outlook: string;
  skill_demand: string[];
}

interface MarketInsight {
  emerging_sectors: SectorTrend[];
  declining_sectors: string[];
  skills_in_demand: {
    technical: string[];
    soft: string[];
    trending: string[];
  };
  salary_trends: {
    highest_growth: { role: string; increase: string }[];
    stable_sectors: string[];
  };
  remote_work_impact: {
    sectors_benefiting: string[];
    hybrid_adoption: string;
    geographic_trends: string[];
  };
  ai_disruption: {
    threatened_roles: string[];
    emerging_roles: string[];
    adaptation_strategies: string[];
  };
}

export const MarketIntelligenceTab = memo(() => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketData, setMarketData] = useState<MarketInsight | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('France');
  const [selectedTimeframe, setSelectedTimeframe] = useState('12_months');
  const [activeTab, setActiveTab] = useState('sectors');

  const analyzeMarket = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock sophisticated market analysis data
    const mockData: MarketInsight = {
      emerging_sectors: [
        {
          sector: 'Intelligence Artificielle & Data',
          growth_rate: 23.4,
          hiring_demand: 'Très forte',
          avg_salary: '55-85K€',
          hot_roles: ['Data Scientist', 'ML Engineer', 'AI Product Manager', 'Prompt Engineer'],
          future_outlook: 'Croissance explosive prévue jusqu\'en 2030',
          skill_demand: ['Python', 'TensorFlow', 'LLMs', 'Data Visualization']
        },
        {
          sector: 'Cybersécurité',
          growth_rate: 18.7,
          hiring_demand: 'Très forte',
          avg_salary: '50-80K€',
          hot_roles: ['Security Analyst', 'Ethical Hacker', 'CISO', 'DevSecOps'],
          future_outlook: 'Demande critique avec pénurie de talents',
          skill_demand: ['Ethical Hacking', 'Cloud Security', 'Zero Trust', 'SIEM']
        },
        {
          sector: 'Green Tech & Durabilité',
          growth_rate: 16.2,
          hiring_demand: 'Forte',
          avg_salary: '45-70K€',
          hot_roles: ['Sustainability Manager', 'Green Data Analyst', 'ESG Consultant'],
          future_outlook: 'Secteur d\'avenir avec réglementations strictes',
          skill_demand: ['ESG Reporting', 'Carbon Accounting', 'Life Cycle Analysis']
        },
        {
          sector: 'FinTech & Blockchain',
          growth_rate: 14.8,
          hiring_demand: 'Forte',
          avg_salary: '50-90K€',
          hot_roles: ['Blockchain Developer', 'DeFi Analyst', 'Crypto Compliance'],
          future_outlook: 'Consolidation en cours, opportunités sélectives',
          skill_demand: ['Solidity', 'Smart Contracts', 'DeFi Protocols', 'Web3']
        }
      ],
      declining_sectors: [
        'Retail traditionnel',
        'Banque classique',
        'Manufacturing traditionnel',
        'Print Media'
      ],
      skills_in_demand: {
        technical: ['Cloud Computing', 'React/Next.js', 'Kubernetes', 'Terraform', 'GraphQL'],
        soft: ['Leadership digital', 'Change Management', 'Communication cross-culturelle', 'Pensée systémique'],
        trending: ['Prompt Engineering', 'No-Code/Low-Code', 'Quantum Computing', 'Edge Computing']
      },
      salary_trends: {
        highest_growth: [
          { role: 'AI/ML Engineer', increase: '+15.2%' },
          { role: 'Cloud Architect', increase: '+12.8%' },
          { role: 'Product Manager', increase: '+11.4%' },
          { role: 'UX Designer', increase: '+9.7%' }
        ],
        stable_sectors: ['Healthcare', 'Education', 'Government', 'Utilities']
      },
      remote_work_impact: {
        sectors_benefiting: ['Tech', 'Consulting', 'Marketing Digital', 'Finance'],
        hybrid_adoption: '78% des entreprises tech adoptent le modèle hybride',
        geographic_trends: [
          'Exode urbain vers villes moyennes',
          'Compétition internationale pour talents remote',
          'Nouveaux hubs tech en région (Lyon, Toulouse, Nantes)'
        ]
      },
      ai_disruption: {
        threatened_roles: [
          'Data Entry Clerk',
          'Basic Accounting',
          'Routine Legal Tasks',
          'Level 1 Customer Support'
        ],
        emerging_roles: [
          'AI Trainer',
          'Human-AI Interaction Designer',
          'AI Ethics Specialist',
          'Automation Process Designer'
        ],
        adaptation_strategies: [
          'Développer compétences complémentaires à l\'IA',
          'Se spécialiser dans supervision/validation IA',
          'Évoluer vers rôles créatifs et stratégiques'
        ]
      }
    };
    
    setMarketData(mockData);
    setIsAnalyzing(false);
  }, [selectedRegion, selectedTimeframe]);

  useEffect(() => {
    analyzeMarket();
  }, [analyzeMarket]);

  const tabConfig = [
    { id: 'sectors', label: 'Secteurs', icon: '📈' },
    { id: 'skills', label: 'Compétences', icon: '🎯' },
    { id: 'salaries', label: 'Salaires', icon: '💰' },
    { id: 'remote', label: 'Remote', icon: '🌐' },
    { id: 'ai', label: 'Impact IA', icon: '🤖' }
  ];

  if (isAnalyzing) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Analyse du marché en cours...</h3>
              <p className="text-gray-600 max-w-md">
                Luna scrute les tendances sectorielles, salaires et opportunités émergentes pour vous
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Région:</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="France">France</option>
                <option value="Europe">Europe</option>
                <option value="Global">Global</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Horizon:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="6_months">6 mois</option>
                <option value="12_months">12 mois</option>
                <option value="24_months">24 mois</option>
              </select>
            </div>
            <button
              onClick={analyzeMarket}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Actualiser
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'sectors' && marketData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Secteurs en Croissance</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.emerging_sectors.map((sector, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{sector.sector}</h4>
                      <div className="flex items-center space-x-3">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          +{sector.growth_rate}%
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sector.hiring_demand === 'Très forte' 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {sector.hiring_demand}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-2"><strong>Salaires:</strong> {sector.avg_salary}</p>
                        <p className="text-gray-600"><strong>Perspectives:</strong> {sector.future_outlook}</p>
                      </div>
                      <div>
                        <div className="mb-2">
                          <strong className="text-gray-700">Métiers porteurs:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sector.hot_roles.map((role, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong className="text-gray-700">Compétences clés:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sector.skill_demand.map((skill, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Secteurs en Déclin</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {marketData.declining_sectors.map((sector, index) => (
                  <span
                    key={index}
                    className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-center text-sm font-medium"
                  >
                    {sector}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 text-sm mt-4">
                ⚠️ Ces secteurs connaissent une contraction. Envisagez une reconversion ou une spécialisation.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'skills' && marketData && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Compétences les Plus Demandées</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🔧 Compétences Techniques</h4>
                <div className="flex flex-wrap gap-2">
                  {marketData.skills_in_demand.technical.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🧠 Compétences Comportementales</h4>
                <div className="flex flex-wrap gap-2">
                  {marketData.skills_in_demand.soft.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🚀 Compétences Émergentes</h4>
                <div className="flex flex-wrap gap-2">
                  {marketData.skills_in_demand.trending.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'salaries' && marketData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Tendances Salariales</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">📈 Plus Fortes Augmentations</h4>
                  <div className="space-y-3">
                    {marketData.salary_trends.highest_growth.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-800">{item.role}</span>
                        <span className="text-green-600 font-bold">{item.increase}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">⚖️ Secteurs Stables</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {marketData.salary_trends.stable_sectors.map((sector, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center text-sm"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'remote' && marketData && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Impact du Travail à Distance</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📊 Adoption du Modèle Hybride</h4>
                <p className="text-blue-700">{marketData.remote_work_impact.hybrid_adoption}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🚀 Secteurs Bénéficiaires</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {marketData.remote_work_impact.sectors_benefiting.map((sector, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-center text-sm font-medium"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🗺️ Tendances Géographiques</h4>
                <ul className="space-y-2">
                  {marketData.remote_work_impact.geographic_trends.map((trend, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span className="text-gray-700">{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ai' && marketData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Impact de l'IA sur l'Emploi</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-red-600 mb-3">⚠️ Métiers à Risque</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {marketData.ai_disruption.threatened_roles.map((role, index) => (
                      <span
                        key={index}
                        className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-center text-sm"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-600 mb-3">🌟 Nouveaux Métiers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {marketData.ai_disruption.emerging_roles.map((role, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-center text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-purple-600 mb-3">🎯 Stratégies d'Adaptation</h4>
                  <ul className="space-y-3">
                    {marketData.ai_disruption.adaptation_strategies.map((strategy, index) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-500 font-bold">{index + 1}</span>
                        <span className="text-purple-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});