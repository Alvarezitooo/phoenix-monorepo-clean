import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, SalaryBenchmarkResponse } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  Award, 
  Users,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Star,
  Building,
  Calendar,
  Sparkles
} from 'lucide-react';

interface SalaryData {
  position: string;
  location: string;
  experience: string;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
  currency: string;
  marketTrend: 'up' | 'down' | 'stable';
  confidence: number;
  dataPoints: number;
  isLoading?: boolean;
  error?: string;
}

interface CompanySize {
  size: string;
  salaryMultiplier: number;
  description: string;
}

interface Skill {
  name: string;
  impact: number;
  demand: 'high' | 'medium' | 'low';
  salaryBoost: number;
}

export function SalarySuggestions() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('france');
  const [selectedExperience, setSelectedExperience] = useState('mid');
  const [selectedPosition, setSelectedPosition] = useState('software-engineer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const locations = [
    { id: 'france', name: 'France', country: 'France', flag: '🇫🇷' },
    { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷' },
    { id: 'lyon', name: 'Lyon', country: 'France', flag: '🇫🇷' },
    { id: 'uk', name: 'Royaume-Uni', country: 'UK', flag: '🇬🇧' },
    { id: 'germany', name: 'Allemagne', country: 'Allemagne', flag: '🇩🇪' },
    { id: 'netherlands', name: 'Pays-Bas', country: 'Pays-Bas', flag: '🇳🇱' },
    { id: 'switzerland', name: 'Suisse', country: 'Suisse', flag: '🇨🇭' }
  ];

  const experienceLevels = [
    { id: 'junior', name: 'Junior', years: '0-2 ans', apiKey: 'junior_level' },
    { id: 'mid', name: 'Intermédiaire', years: '3-5 ans', apiKey: 'mid_level' },
    { id: 'senior', name: 'Senior', years: '5-8 ans', apiKey: 'senior_level' },
    { id: 'lead', name: 'Lead/Principal', years: '8+ ans', apiKey: 'principal_level' }
  ];

  const positions = [
    { id: 'software-engineer', name: 'Développeur Software', icon: '💻' },
    { id: 'frontend-dev', name: 'Développeur Frontend', icon: '🎨' },
    { id: 'backend-dev', name: 'Développeur Backend', icon: '⚙️' },
    { id: 'fullstack-dev', name: 'Développeur Full-Stack', icon: '🔧' },
    { id: 'devops', name: 'DevOps Engineer', icon: '🚀' },
    { id: 'data-scientist', name: 'Data Scientist', icon: '📊' }
  ];

  const companySizes: CompanySize[] = [
    { size: 'Startup (<50)', salaryMultiplier: 0.85, description: 'Equity potentielle, croissance rapide' },
    { size: 'PME (50-200)', salaryMultiplier: 0.95, description: 'Équilibre salaire/responsabilités' },
    { size: 'Grande entreprise (200-1000)', salaryMultiplier: 1.1, description: 'Stabilité et avantages' },
    { size: 'Multinationale (1000+)', salaryMultiplier: 1.25, description: 'Salaires compétitifs, avantages premium' }
  ];

  const topSkills: Skill[] = [
    { name: 'React', impact: 15, demand: 'high', salaryBoost: 8000 },
    { name: 'TypeScript', impact: 12, demand: 'high', salaryBoost: 6000 },
    { name: 'AWS', impact: 18, demand: 'high', salaryBoost: 10000 },
    { name: 'Kubernetes', impact: 20, demand: 'high', salaryBoost: 12000 },
    { name: 'Python', impact: 14, demand: 'high', salaryBoost: 7000 },
    { name: 'Node.js', impact: 13, demand: 'medium', salaryBoost: 6500 }
  ];

  // Fonction pour récupérer les vraies données salariales via API
  const fetchSalaryData = async (): Promise<SalaryData> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      const selectedPositionName = positions.find(p => p.id === selectedPosition)?.name || 'Développeur Software';
      const selectedLocationName = locations.find(l => l.id === selectedLocation)?.name || 'France';
      const selectedExperienceName = experienceLevels.find(e => e.id === selectedExperience)?.name || 'Senior';
      const selectedExperienceApiKey = experienceLevels.find(e => e.id === selectedExperience)?.apiKey || 'senior_level';
      
      // Appel à l'API de benchmark salarial
      const benchmarkResponse = await apiService.getSalaryBenchmark(
        selectedPositionName,
        selectedLocation,
        selectedExperienceApiKey
      );

      if (!benchmarkResponse.success) {
        throw new Error('Échec de récupération des données benchmark');
      }

      const benchmark = benchmarkResponse.benchmark;
      const salaryRange = benchmark.salary_range;

      // Détermination de la devise basée sur la localisation
      let currency = '€';
      if (selectedLocation === 'switzerland') currency = 'CHF';
      else if (selectedLocation === 'uk') currency = '£';

      // Calcul de la tendance du marché (simulé basé sur la confiance)
      const marketTrend: 'up' | 'down' | 'stable' = 
        benchmark.confidence_score > 0.8 ? 'up' :
        benchmark.confidence_score < 0.6 ? 'down' : 'stable';

      return {
        position: selectedPositionName,
        location: selectedLocationName,
        experience: selectedExperienceName,
        minSalary: salaryRange.min,
        maxSalary: salaryRange.max,
        averageSalary: salaryRange.median,
        currency,
        marketTrend,
        confidence: Math.round(benchmark.confidence_score * 100),
        dataPoints: benchmark.sample_size,
        isLoading: false,
        error: undefined
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des données salariales:', error);
      
      // Fallback avec données par défaut en cas d'erreur
      const selectedPositionName = positions.find(p => p.id === selectedPosition)?.name || 'Développeur Software';
      const selectedLocationName = locations.find(l => l.id === selectedLocation)?.name || 'France';
      const selectedExperienceName = experienceLevels.find(e => e.id === selectedExperience)?.name || 'Senior';
      
      return {
        position: selectedPositionName,
        location: selectedLocationName,
        experience: selectedExperienceName,
        minSalary: 45000,
        maxSalary: 75000,
        averageSalary: 60000,
        currency: '€',
        marketTrend: 'stable',
        confidence: 75,
        dataPoints: 150,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de récupération des données'
      };
    }
  };

  const [salaryData, setSalaryData] = useState<SalaryData>({
    position: 'Développeur Software',
    location: 'France', 
    experience: 'Senior',
    minSalary: 0,
    maxSalary: 0,
    averageSalary: 0,
    currency: '€',
    marketTrend: 'stable',
    confidence: 0,
    dataPoints: 0,
    isLoading: true
  });

  useEffect(() => {
    const loadSalaryData = async () => {
      if (!user) return;
      
      setIsAnalyzing(true);
      setApiError(null);
      
      try {
        // Petit délai pour UX
        await new Promise(resolve => setTimeout(resolve, 800));
        const data = await fetchSalaryData();
        setSalaryData(data);
        
        if (data.error) {
          setApiError(data.error);
        }
      } catch (error) {
        console.error('Erreur chargement données salariales:', error);
        setApiError(error instanceof Error ? error.message : 'Erreur de chargement');
      } finally {
        setIsAnalyzing(false);
      }
    };

    loadSalaryData();
  }, [selectedLocation, selectedExperience, selectedPosition, user]);

  // Fonction pour optimiser le CV selon le salaire cible
  const handleOptimizeCV = async () => {
    if (!user || !salaryData) return;

    setIsOptimizing(true);
    
    try {
      // Simulation d'un CV ID (dans une vraie app, on récupérerait depuis le contexte CV)
      const cvId = 'user-cv-' + user.id;
      const targetSalary = salaryData.averageSalary;
      const selectedPositionName = positions.find(p => p.id === selectedPosition)?.name;

      const optimizationRequest = {
        cv_id: cvId,
        optimization_type: 'salary_focused',
        target_job_title: selectedPositionName,
        target_industry: 'technology',
        focus_areas: ['salary_optimization', 'skills_enhancement', 'ats_compatibility']
      };

      const result = await apiService.optimizeCV(optimizationRequest);
      
      if (result.success) {
        // Succès - on pourrait ouvrir une modal avec les suggestions
        alert(`CV optimisé avec succès ! Score d'amélioration : ${result.current_score || 'N/A'} → ${result.optimized_score || 'N/A'}`);
      } else {
        throw new Error(result.error_message || 'Erreur lors de l\'optimisation');
      }
      
    } catch (error) {
      console.error('Erreur optimisation CV:', error);
      alert(`Erreur lors de l'optimisation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatSalary = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === '€' ? 'EUR' : currency === '£' ? 'GBP' : 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Protection si l'utilisateur n'est pas authentifié
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            Suggestions de Salaire IA
          </h2>
          <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-yellow-300 font-medium">Authentification requise</p>
            <p className="text-gray-300 text-sm mt-2">
              Veuillez vous connecter pour accéder à l'analyse salariale.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
          Suggestions de Salaire IA
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Découvrez votre valeur sur le marché avec nos analyses basées sur l'IA, les données du marché et votre profil unique.
        </p>
      </motion.div>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Target className="w-5 h-5 mr-2 text-emerald-400" />
          Configurez votre profil
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Position Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Poste</label>
            <div className="space-y-2">
              {positions.map((position) => (
                <motion.button
                  key={position.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPosition(position.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                    selectedPosition === position.id
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{position.icon}</span>
                  <span className="text-sm font-medium">{position.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Location Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Localisation</label>
            <div className="space-y-2">
              {locations.map((location) => (
                <motion.button
                  key={location.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                    selectedLocation === location.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{location.flag}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium">{location.name}</div>
                    <div className="text-xs text-gray-400">{location.country}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Experience Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Expérience</label>
            <div className="space-y-2">
              {experienceLevels.map((level) => (
                <motion.button
                  key={level.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedExperience(level.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedExperience === level.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm font-medium">{level.name}</span>
                  <span className="text-xs text-gray-400">{level.years}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Notification */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-sm">!</span>
            </div>
            <div>
              <h4 className="text-red-300 font-medium">Erreur de chargement des données salariales</h4>
              <p className="text-red-400 text-sm">{apiError}</p>
              <p className="text-gray-400 text-xs mt-1">Les données affichées sont des estimations de fallback.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Salary Analysis */}
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
              >
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white">Analyse en cours...</h3>
            </div>
            <p className="text-gray-400">L'IA analyse les données du marché pour votre profil</p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Salary Card */}
            <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Estimation Salariale</h3>
                  <p className="text-gray-400">
                    {salaryData.position} • {salaryData.location} • {salaryData.experience}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                    salaryData.marketTrend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                    salaryData.marketTrend === 'down' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {salaryData.marketTrend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                     salaryData.marketTrend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
                     <BarChart3 className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {salaryData.marketTrend === 'up' ? 'En hausse' :
                       salaryData.marketTrend === 'down' ? 'En baisse' : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary Range */}
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {formatSalary(salaryData.averageSalary, salaryData.currency)}
                  </div>
                  <p className="text-gray-400">Salaire moyen estimé</p>
                </div>

                <div className="relative">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{formatSalary(salaryData.minSalary, salaryData.currency)}</span>
                    <span>{formatSalary(salaryData.maxSalary, salaryData.currency)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                    />
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-emerald-400 shadow-lg"
                      style={{ 
                        left: `${((salaryData.averageSalary - salaryData.minSalary) / (salaryData.maxSalary - salaryData.minSalary)) * 100}%`,
                        transform: 'translateX(-50%) translateY(-50%)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Company Size Impact */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-cyan-400" />
                  Impact de la taille d'entreprise
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companySizes.map((company, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-white">{company.size}</h5>
                        <span className={`text-sm font-medium ${
                          company.salaryMultiplier > 1 ? 'text-emerald-400' : 'text-orange-400'
                        }`}>
                          {formatSalary(Math.round(salaryData.averageSalary * company.salaryMultiplier), salaryData.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{company.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Impact & Insights */}
            <div className="space-y-6">
              {/* Confidence Score */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-400" />
                  Fiabilité de l'analyse
                </h4>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-purple-400 mb-1">{salaryData.confidence}%</div>
                  <p className="text-sm text-gray-400">Basé sur {salaryData.dataPoints} points de données</p>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${salaryData.confidence}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </motion.div>

              {/* Top Skills Impact */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Compétences valorisées
                </h4>
                
                <div className="space-y-3">
                  {topSkills.slice(0, 4).map((skill, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          skill.demand === 'high' ? 'bg-emerald-400' :
                          skill.demand === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-white font-medium">{skill.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-medium text-sm">
                          +{formatSalary(skill.salaryBoost, salaryData.currency)}
                        </div>
                        <div className="text-xs text-gray-400">+{skill.impact}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Market Insights */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                  Insights du marché
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-emerald-300 font-medium">Demande élevée</p>
                      <p className="text-xs text-gray-400">+23% d'offres ce trimestre</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-cyan-300 font-medium">Compétences recherchées</p>
                      <p className="text-xs text-gray-400">Cloud & DevOps en forte demande</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Calendar className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-purple-300 font-medium">Évolution salariale</p>
                      <p className="text-xs text-gray-400">+8% en moyenne cette année</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 px-6 py-3 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Voir les détails</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOptimizeCV}
          disabled={isOptimizing || isAnalyzing}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Optimiser le CV selon les données salariales"
        >
          {isOptimizing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Optimisation...</span>
            </>
          ) : (
            <>
              <Target className="w-5 h-5" />
              <span>Optimiser mon CV pour ce salaire</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}