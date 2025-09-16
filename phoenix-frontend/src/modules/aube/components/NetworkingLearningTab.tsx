import React, { useState } from 'react';
import { Network, GraduationCap, Users, BookOpen, Target, CheckCircle, Zap } from 'lucide-react';

const NetworkingLearningTab = () => {
  const [activeSubModule, setActiveSubModule] = useState<'networking' | 'learning'>('networking');

  const networkingStrategies = [
    {
      title: 'LinkedIn Mastery',
      description: 'Optimisez votre profil et développez votre réseau professionnel',
      actions: ['Optimisation profil', 'Contenu engageant', 'Networking ciblé'],
      energyCost: 10
    },
    {
      title: 'Événements & Salons',
      description: 'Stratégie de présence aux événements professionnels de votre secteur',
      actions: ['Sélection événements', 'Préparation pitch', 'Suivi contacts'],
      energyCost: 15
    },
    {
      title: 'Mentoring & Référents',
      description: 'Identifiez et approchez des mentors dans votre domaine cible',
      actions: ['Identification mentors', 'Approche personnalisée', 'Relation long terme'],
      energyCost: 20
    }
  ];

  const learningPaths = [
    {
      title: 'Compétences Techniques',
      description: 'Formations spécialisées pour votre secteur cible',
      duration: '2-6 mois',
      level: 'Débutant à Expert',
      certifications: ['AWS', 'Google Analytics', 'Project Management'],
      energyCost: 15
    },
    {
      title: 'Soft Skills',
      description: 'Développement des compétences comportementales essentielles',
      duration: '1-3 mois',
      level: 'Tous niveaux',
      certifications: ['Leadership', 'Communication', 'Gestion du temps'],
      energyCost: 12
    },
    {
      title: 'Secteur Spécifique',
      description: 'Formation aux spécificités de votre domaine cible',
      duration: '3-9 mois',
      level: 'Intermédiaire',
      certifications: ['Réglementation', 'Outils métier', 'Processus'],
      energyCost: 18
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header avec sélecteur de sous-module */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Networking & Formation</h2>
        <p className="text-slate-600 mb-6">
          Développez votre réseau professionnel et acquérez les compétences nécessaires pour votre transition
        </p>
        
        {/* Tab Selector */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveSubModule('networking')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeSubModule === 'networking'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Network className="inline w-5 h-5 mr-2" />
            Stratégie Networking
          </button>
          <button
            onClick={() => setActiveSubModule('learning')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeSubModule === 'learning'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <GraduationCap className="inline w-5 h-5 mr-2" />
            Parcours Formation
          </button>
        </div>
      </div>

      {activeSubModule === 'networking' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Stratégies de Networking</h3>
          <div className="grid md:grid-cols-1 gap-6">
            {networkingStrategies.map((strategy, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{strategy.title}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Zap className="h-4 w-4" />
                        <span>{strategy.energyCost}⚡</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-600 mb-4">{strategy.description}</p>
                
                <div className="space-y-2">
                  <h5 className="font-semibold text-slate-700">Actions recommandées :</h5>
                  {strategy.actions.map((action, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-teal-500" />
                      <span className="text-sm text-slate-600">{action}</span>
                    </div>
                  ))}
                </div>
                
                <button className="mt-4 w-full bg-teal-500 text-white py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors">
                  Démarrer cette stratégie
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubModule === 'learning' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Parcours de Formation Personnalisés</h3>
          <div className="grid md:grid-cols-1 gap-6">
            {learningPaths.map((path, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{path.title}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Zap className="h-4 w-4" />
                        <span>{path.energyCost}⚡</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-600 mb-4">{path.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-slate-700">Durée :</span>
                    <span className="text-slate-600 ml-2">{path.duration}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Niveau :</span>
                    <span className="text-slate-600 ml-2">{path.level}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h5 className="font-semibold text-slate-700">Certifications incluses :</h5>
                  <div className="flex flex-wrap gap-2">
                    {path.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg hover:bg-pink-600 transition-colors">
                  Commencer ce parcours
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section d'aide */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-500 rounded-lg">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-slate-800">Conseil Luna</h4>
        </div>
        <p className="text-slate-600">
          Combinez networking et formation pour maximiser vos chances de succès. 
          Commencez par identifier 3 personnes clés dans votre domaine cible, 
          puis développez les compétences qu'elles valorisent le plus.
        </p>
      </div>
    </div>
  );
};

export default NetworkingLearningTab;