/**
 * 👁️ CVPreview - Phoenix CV  
 * Aperçu temps réel du CV avec synchronisation CVContext
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useCV } from '../contexts/CVContext';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Zap
} from 'lucide-react';

function HeaderPreview({ section }: { section: any }) {
  const content = section.content;
  
  return (
    <div className="text-center mb-8 p-6 bg-white/5 rounded-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">
        {content.name || 'Votre Nom'}
      </h1>
      
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
        {content.email && (
          <div className="flex items-center space-x-1">
            <Mail className="w-4 h-4" />
            <span>{content.email}</span>
          </div>
        )}
        {content.phone && (
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4" />
            <span>{content.phone}</span>
          </div>
        )}
        {content.location && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{content.location}</span>
          </div>
        )}
        {content.linkedin && (
          <div className="flex items-center space-x-1">
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn</span>
          </div>
        )}
        {content.website && (
          <div className="flex items-center space-x-1">
            <Globe className="w-4 h-4" />
            <span>Portfolio</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryPreview({ section }: { section: any }) {
  const content = section.content;
  
  if (!content.text) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-5 h-5 text-luna-400" />
        <h2 className="text-xl font-semibold text-white">Résumé Professionnel</h2>
      </div>
      <p className="text-gray-300 leading-relaxed pl-7">
        {content.text}
      </p>
    </div>
  );
}

function SectionPreview({ section }: { section: any }) {
  const icons = {
    header: User,
    summary: FileText,
    experience: Briefcase,
    education: GraduationCap,
    skills: Zap,
    custom: FileText
  };

  const Icon = icons[section.type as keyof typeof icons] || FileText;

  if (section.type === 'header') {
    return <HeaderPreview section={section} />;
  }

  if (section.type === 'summary') {
    return <SummaryPreview section={section} />;
  }

  // Pour les autres sections (à implémenter)
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="w-5 h-5 text-luna-400" />
        <h2 className="text-xl font-semibold text-white">{section.title}</h2>
      </div>
      <div className="pl-7 text-gray-400 italic">
        Section {section.type} en cours de développement...
      </div>
    </div>
  );
}

export function CVPreview() {
  const { cvData } = useCV();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-emerald-400 text-sm font-medium">Aperçu en temps réel</span>
        </div>
      </div>

      {/* CV Paper Simulation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl"
        style={{ aspectRatio: '210/297' }} // Format A4
      >
        <div className="space-y-6">
          {cvData.sections
            .filter(section => section.isVisible)
            .map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SectionPreview section={section} />
              </motion.div>
            ))}
        </div>

        {/* Empty state */}
        {cvData.sections.filter(s => s.isVisible).length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Commencez à éditer votre CV</p>
              <p className="text-sm">Les modifications apparaîtront ici en temps réel</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* CV Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">
              {cvData.sections.filter(s => s.isVisible).length}
            </div>
            <div className="text-xs text-gray-400">Sections</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-luna-400">
              {cvData.template}
            </div>
            <div className="text-xs text-gray-400">Template</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-emerald-400">
              {cvData.lastModified.toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-400">Dernière modif</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}