import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedLocation, setSelectedLocation] = useState('paris');
  const [selectedExperience, setSelectedExperience] = useState('senior');
  const [selectedPosition, setSelectedPosition] = useState('software-engineer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const locations = [
    { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷' },
    { id: 'lyon', name: 'Lyon', country: 'France', flag: '🇫🇷' },
    { id: 'london', name: 'Londres', country: 'UK', flag: '🇬🇧' },
    { id: 'berlin', name: 'Berlin', country: 'Allemagne', flag: '🇩🇪' },
    { id: 'amsterdam', name: 'Amsterdam', country: 'Pays-Bas', flag: '🇳🇱' },
    { id: 'zurich', name: 'Zurich', country: 'Suisse', flag: '🇨🇭' }
  ];

  const experienceLevels = [
    { id: 'junior', name: 'Junior', years: '0-2 ans' },
    { id: 'mid', name: 'Intermédiaire', years: '3-5 ans' },
    { id: 'senior', name: 'Senior', years: '5-8 ans' },
    { id: 'lead', name: 'Lead/Principal', years: '8+ ans' }
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

  // Mock salary data - in real app, this would come from an API
  const getSalaryData = (): SalaryData => {
    const baseData = {
      'paris': { min: 45000, max: 75000, avg: 60000 },
      'lyon': { min: 40000, max: 65000, avg: 52500 },
      'london': { min: 50000, max: 85000, avg: 67500 },
      'berlin': { min: 48000, max: 78000, avg: 63000 },
      'amsterdam': { min: 52000, max: 82000, avg: 67000 },
      'zurich': { min: 80000, max: 120000, avg: 100000 }
    };

    const experienceMultipliers = {
      'junior': 0.7,
      'mid': 0.9,
      'senior': 1.0,
      'lead': 1.3
    };

    const base = baseData[selectedLocation as keyof typeof baseData];
    const multiplier = experienceMultipliers[selectedExperience as keyof typeof experienceMultipliers];

    return {
      position: positions.find(p => p.id === selectedPosition)?.name || 'Développeur',
      location: locations.find(l => l.id === selectedLocation)?.name || 'Paris',
      experience: experienceLevels.find(e => e.id === selectedExperience)?.name || 'Senior',
      minSalary: Math.round(base.min * multiplier),
      maxSalary: Math.round(base.max * multiplier),
      averageSalary: Math.round(base.avg * multiplier),
      currency: selectedLocation === 'zurich' ? 'CHF' : selectedLocation === 'london' ? '£' : '€',
      marketTrend: Math.random() > 0.5 ? 'up' : 'stable',
      confidence: Math.round(85 + Math.random() * 10),
      dataPoints: Math.round(150 + Math.random() * 200)
    };
  };

  const [salaryData, setSalaryData] = useState<SalaryData>(getSalaryData());

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setSalaryData(getSalaryData());
      setIsAnalyzing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedLocation, selectedExperience, selectedPosition]);

  const formatSalary = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === '€' ? 'EUR' : currency === '£' ? 'GBP' : 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium"
        >
          <Target className="w-5 h-5" />
          <span>Optimiser mon CV pour ce salaire</span>
        </motion.button>
      </motion.div>
    </div>
  );
}