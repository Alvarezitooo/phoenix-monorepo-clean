import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Monitor, 
  Smartphone,
  Tablet,
  Globe,
  File,
  Share2,
  Printer,
  Copy,
  Check,
  Zap
} from 'lucide-react';

interface PreviewFormat {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

export function MultiFormatPreview() {
  const [selectedFormat, setSelectedFormat] = useState<string>('web');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const formats: PreviewFormat[] = [
    {
      id: 'web',
      name: 'Web',
      icon: Globe,
      description: 'Format web interactif',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'pdf',
      name: 'PDF',
      icon: FileText,
      description: 'Document PDF professionnel',
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'word',
      name: 'Word',
      icon: File,
      description: 'Document Microsoft Word',
      color: 'from-blue-600 to-indigo-600'
    }
  ];

  const viewModes = [
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' }
  ];

  const mockCVData = {
    name: 'John Doe',
    title: 'Senior Software Engineer',
    email: 'john.doe@email.com',
    phone: '+33 1 23 45 67 89',
    location: 'Paris, France',
    summary: 'Développeur full-stack expérimenté avec 5+ années d\'expertise en React, Node.js et architecture cloud.',
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        duration: '2022 - Présent',
        achievements: [
          'Architecture microservices pour 1M+ utilisateurs',
          'Amélioration des performances de 40%',
          'Encadrement de 3 développeurs juniors'
        ]
      }
    ],
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes']
  };

  const getViewModeClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-4xl';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://phoenix-cv.com/cv/john-doe-123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPreview = () => {
    switch (selectedFormat) {
      case 'pdf':
        return (
          <div className="bg-white text-gray-900 shadow-2xl rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 border-b flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600 ml-4">CV_John_Doe.pdf</span>
            </div>
            <PDFPreview data={mockCVData} />
          </div>
        );
      
      case 'word':
        return (
          <div className="bg-white text-gray-900 shadow-2xl rounded-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-3 flex items-center space-x-2">
              <File className="w-5 h-5" />
              <span className="font-medium">CV_John_Doe.docx</span>
              <div className="ml-auto flex space-x-1">
                <div className="w-2 h-2 bg-white/50 rounded-full" />
                <div className="w-2 h-2 bg-white/50 rounded-full" />
                <div className="w-2 h-2 bg-white/50 rounded-full" />
              </div>
            </div>
            <WordPreview data={mockCVData} />
          </div>
        );
      
      default:
        return (
          <div className="bg-white text-gray-900 shadow-2xl rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-2 flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm">phoenix-cv.com/cv/john-doe</span>
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
            <WebPreview data={mockCVData} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Prévisualisation Multi-Format</h3>
          <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-1">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <motion.button
                  key={format.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    selectedFormat === format.id
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{format.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/10 rounded-xl p-1">
            {viewModes.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(id as any)}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === id ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-400 hover:text-white'
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié!' : 'Partager'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger {formats.find(f => f.id === selectedFormat)?.name}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Format Description */}
      <motion.div
        key={selectedFormat}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${formats.find(f => f.id === selectedFormat)?.color}`}>
            {React.createElement(formats.find(f => f.id === selectedFormat)?.icon || FileText, { className: 'w-5 h-5 text-white' })}
          </div>
          <div>
            <h4 className="text-white font-medium">Format {formats.find(f => f.id === selectedFormat)?.name}</h4>
            <p className="text-gray-400 text-sm">{formats.find(f => f.id === selectedFormat)?.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Preview Area */}
      <div className="flex justify-center">
        <motion.div
          key={`${selectedFormat}-${viewMode}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`${getViewModeClass()} transition-all duration-300`}
        >
          {renderPreview()}
        </motion.div>
      </div>

      {/* Format Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {formats.map((format) => (
          <div
            key={format.id}
            className={`p-4 backdrop-blur-xl bg-white/5 border rounded-xl transition-all ${
              selectedFormat === format.id ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${format.color}`}>
                <format.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="text-white font-medium">{format.name}</h5>
                <p className="text-gray-400 text-xs">{format.description}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {format.id === 'web' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Interactivité</span>
                    <span className="text-emerald-400">Élevée</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SEO</span>
                    <span className="text-emerald-400">Optimisé</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Partage</span>
                    <span className="text-emerald-400">Facile</span>
                  </div>
                </>
              )}
              
              {format.id === 'pdf' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ATS Compatible</span>
                    <span className="text-emerald-400">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Impression</span>
                    <span className="text-emerald-400">Parfaite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taille</span>
                    <span className="text-cyan-400">Optimisée</span>
                  </div>
                </>
              )}
              
              {format.id === 'word' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Éditable</span>
                    <span className="text-emerald-400">Oui</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compatibilité</span>
                    <span className="text-emerald-400">Universelle</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collaboration</span>
                    <span className="text-cyan-400">Facile</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Preview Components
function WebPreview({ data }: { data: any }) {
  return (
    <div className="p-8 space-y-6">
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{data.name}</h1>
        <p className="text-xl text-cyan-600 mb-4">{data.title}</p>
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <span>{data.email}</span>
          <span>{data.phone}</span>
          <span>{data.location}</span>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b-2 border-cyan-500 pb-1">Résumé Professionnel</h2>
        <p className="text-gray-700 leading-relaxed">{data.summary}</p>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b-2 border-cyan-500 pb-1">Expérience</h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="border-l-4 border-cyan-500 pl-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{exp.position}</h3>
            <p className="text-cyan-600 font-medium mb-2">{exp.company} • {exp.duration}</p>
            <ul className="list-disc list-inside space-y-1">
              {exp.achievements.map((achievement: string, i: number) => (
                <li key={i} className="text-gray-700">{achievement}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b-2 border-cyan-500 pb-1">Compétences</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full text-sm font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PDFPreview({ data }: { data: any }) {
  return (
    <div className="p-8 space-y-4 bg-white text-gray-900" style={{ fontFamily: 'Times, serif' }}>
      <div className="text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{data.name}</h1>
        <p className="text-lg text-gray-700 mb-2">{data.title}</p>
        <div className="text-sm text-gray-600">
          {data.email} • {data.phone} • {data.location}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">Résumé Professionnel</h2>
        <p className="text-sm text-gray-800 leading-relaxed text-justify">{data.summary}</p>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">Expérience Professionnelle</h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-900">{exp.position}</h3>
              <span className="text-sm text-gray-600">{exp.duration}</span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">{exp.company}</p>
            <ul className="text-sm text-gray-800 space-y-1">
              {exp.achievements.map((achievement: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">Compétences Techniques</h2>
        <p className="text-sm text-gray-800">{data.skills.join(' • ')}</p>
      </div>
    </div>
  );
}

function WordPreview({ data }: { data: any }) {
  return (
    <div className="p-8 space-y-4 bg-white text-gray-900" style={{ fontFamily: 'Calibri, sans-serif' }}>
      <div className="text-center pb-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-1">{data.name}</h1>
        <p className="text-lg text-gray-700 mb-2">{data.title}</p>
        <div className="text-sm text-gray-600 border-b border-gray-300 pb-2">
          {data.email} | {data.phone} | {data.location}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">RÉSUMÉ PROFESSIONNEL</h2>
        <p className="text-sm text-gray-800 leading-relaxed">{data.summary}</p>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">EXPÉRIENCE PROFESSIONNELLE</h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-900">{exp.position}</h3>
              <span className="text-sm text-gray-600 italic">{exp.duration}</span>
            </div>
            <p className="text-sm font-medium text-blue-800 mb-2">{exp.company}</p>
            <ul className="text-sm text-gray-800 space-y-1 ml-4">
              {exp.achievements.map((achievement: string, i: number) => (
                <li key={i} className="list-disc">{achievement}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">COMPÉTENCES TECHNIQUES</h2>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-800">
          {data.skills.map((skill: string, index: number) => (
            <span key={index} className="bg-blue-50 px-2 py-1 rounded border border-blue-200">{skill}</span>
          ))}
        </div>
      </div>
    </div>
  );
}