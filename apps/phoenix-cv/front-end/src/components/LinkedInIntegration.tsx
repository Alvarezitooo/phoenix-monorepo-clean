import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Linkedin, 
  Download, 
  Check, 
  AlertCircle, 
  User, 
  Briefcase, 
  GraduationCap,
  Award,
  MapPin,
  Mail,
  Phone,
  Globe,
  Zap,
  RefreshCw,
  Eye,
  Edit,
  Sparkles,
  ArrowRight,
  Shield,
  Lock
} from 'lucide-react';

interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    location: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    duration: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export function LinkedInIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'basic', 'experience', 'education', 'skills'
  ]);
  const [showPreview, setShowPreview] = useState(false);

  // Mock LinkedIn profile data
  const mockProfile: LinkedInProfile = {
    name: 'Jean Dupont',
    headline: 'Senior Software Engineer chez Tech Corp | React & Node.js Expert',
    location: 'Paris, Île-de-France, France',
    email: 'jean.dupont@email.com',
    phone: '+33 1 23 45 67 89',
    website: 'https://jeandupont.dev',
    summary: 'Développeur full-stack passionné avec 6 ans d\'expérience dans la création d\'applications web modernes. Expert en React, Node.js et architecture cloud. J\'aime résoudre des problèmes complexes et créer des solutions innovantes qui impactent positivement les utilisateurs.',
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        duration: 'Jan 2022 - Présent · 2 ans',
        location: 'Paris, France',
        description: 'Lead technique sur des projets d\'envergure, architecture microservices, encadrement d\'équipe de 4 développeurs.'
      },
      {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        duration: 'Mar 2020 - Dec 2021 · 1 an 10 mois',
        location: 'Lyon, France',
        description: 'Développement d\'applications React/Node.js, mise en place de l\'infrastructure AWS, amélioration des performances.'
      }
    ],
    education: [
      {
        school: 'École Supérieure d\'Informatique',
        degree: 'Master',
        field: 'Informatique et Systèmes d\'Information',
        duration: '2016 - 2018'
      }
    ],
    skills: [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'AWS', 
      'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Git', 'Agile'
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: 'Oct 2023'
      },
      {
        name: 'React Developer Certification',
        issuer: 'Meta',
        date: 'Jun 2023'
      }
    ]
  };

  const importSections = [
    {
      id: 'basic',
      name: 'Informations personnelles',
      icon: User,
      description: 'Nom, titre, contact, localisation',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'experience',
      name: 'Expérience professionnelle',
      icon: Briefcase,
      description: 'Postes, entreprises, responsabilités',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'education',
      name: 'Formation',
      icon: GraduationCap,
      description: 'Diplômes, écoles, certifications',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'skills',
      name: 'Compétences',
      icon: Award,
      description: 'Compétences techniques et soft skills',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleConnect = async () => {
    setIsImporting(true);
    // Simulate LinkedIn OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsImporting(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    // Simulate data import
    await new Promise(resolve => setTimeout(resolve, 3000));
    setImportComplete(true);
    setIsImporting(false);
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Intégration LinkedIn
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Importez automatiquement vos données LinkedIn pour créer un CV professionnel en quelques clics.
        </p>
      </motion.div>

      {!isConnected ? (
        /* Connection Flow */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Linkedin className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">Connectez votre profil LinkedIn</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Accédez instantanément à toutes vos informations professionnelles et créez un CV optimisé 
              basé sur votre profil LinkedIn existant.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Zap, title: 'Import instantané', desc: 'Toutes vos données en 1 clic' },
                { icon: Shield, title: 'Sécurisé', desc: 'Connexion OAuth officielle' },
                { icon: RefreshCw, title: 'Synchronisation', desc: 'Mise à jour automatique' },
                { icon: Sparkles, title: 'Optimisation IA', desc: 'Amélioration automatique' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <benefit.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium text-sm">{benefit.title}</div>
                    <div className="text-gray-400 text-xs">{benefit.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConnect}
              disabled={isImporting}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-semibold text-white shadow-lg hover:shadow-blue-500/25 transition-all mx-auto disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Linkedin className="w-6 h-6" />
                  <span>Se connecter avec LinkedIn</span>
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-center space-x-2 mt-6 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Connexion sécurisée • Vos données restent privées</span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Import Flow */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Profil LinkedIn connecté
                </h3>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Connecté</span>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {mockProfile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">{mockProfile.name}</h4>
                  <p className="text-gray-300 text-sm mb-2">{mockProfile.headline}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{mockProfile.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{mockProfile.experience.length} expériences</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>{mockProfile.skills.length} compétences</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Sélectionnez les sections à importer</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => toggleSection(section.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSections.includes(section.id)
                        ? 'bg-gradient-to-r from-white/10 to-white/5 border-cyan-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color}`}>
                          <section.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-white">{section.name}</h4>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedSections.includes(section.id)
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedSections.includes(section.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Import Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-6 py-3 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all"
              >
                <Eye className="w-5 h-5" />
                <span>Prévisualiser les données</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImport}
                disabled={isImporting || selectedSections.length === 0}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Import en cours...</span>
                  </>
                ) : importComplete ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Import terminé</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Importer les données</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Import Progress & Stats */}
          <div className="space-y-6">
            {/* Import Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                Statut de l'import
              </h4>

              <div className="space-y-4">
                {importSections.map((section, index) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        selectedSections.includes(section.id) ? 'text-white' : 'text-gray-500'
                      }`}>
                        {section.name}
                      </span>
                      {selectedSections.includes(section.id) && (
                        <div className="flex items-center space-x-1">
                          {importComplete ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : isImporting ? (
                            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                          ) : (
                            <div className="w-4 h-4 border border-gray-400 rounded" />
                          )}
                        </div>
                      )}
                    </div>
                    {selectedSections.includes(section.id) && (
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: importComplete ? '100%' : isImporting ? '60%' : '0%' 
                          }}
                          transition={{ duration: 0.8, delay: index * 0.2 }}
                          className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Data Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4">Données disponibles</h4>
              
              <div className="space-y-3">
                {[
                  { label: 'Expériences', count: mockProfile.experience.length, icon: Briefcase },
                  { label: 'Formations', count: mockProfile.education.length, icon: GraduationCap },
                  { label: 'Compétences', count: mockProfile.skills.length, icon: Award },
                  { label: 'Certifications', count: mockProfile.certifications.length, icon: Award }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Next Steps */}
            {importComplete && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  Import réussi !
                </h4>
                
                <p className="text-sm text-gray-300 mb-4">
                  Vos données LinkedIn ont été importées avec succès. Vous pouvez maintenant :
                </p>
                
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-left"
                  >
                    <span className="text-sm text-white">Éditer votre CV</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-left"
                  >
                    <span className="text-sm text-white">Optimiser avec l'IA</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Data Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full max-h-[90vh] backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Prévisualisation des données LinkedIn</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <span className="text-gray-300 text-xl">✕</span>
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                {/* Basic Info */}
                {selectedSections.includes('basic') && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Informations personnelles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl">
                      <div><span className="text-gray-400">Nom:</span> <span className="text-white">{mockProfile.name}</span></div>
                      <div><span className="text-gray-400">Email:</span> <span className="text-white">{mockProfile.email}</span></div>
                      <div><span className="text-gray-400">Téléphone:</span> <span className="text-white">{mockProfile.phone}</span></div>
                      <div><span className="text-gray-400">Localisation:</span> <span className="text-white">{mockProfile.location}</span></div>
                    </div>
                  </div>
                )}

                {/* Experience */}
                {selectedSections.includes('experience') && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Expérience professionnelle</h4>
                    <div className="space-y-4">
                      {mockProfile.experience.map((exp, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-xl">
                          <h5 className="font-semibold text-white">{exp.position}</h5>
                          <p className="text-cyan-400">{exp.company} • {exp.duration}</p>
                          <p className="text-gray-300 text-sm mt-2">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedSections.includes('skills') && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Compétences</h4>
                    <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-xl">
                      {mockProfile.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}