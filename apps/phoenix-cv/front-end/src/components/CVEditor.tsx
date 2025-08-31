/**
 * 📝 CVEditor - Phoenix CV
 * Éditeur de CV avec synchronisation temps réel via CVContext
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCV } from '../contexts/CVContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Eye,
  EyeOff,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Zap
} from 'lucide-react';

interface SectionEditorProps {
  section: any;
  onUpdate: (content: any) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

function HeaderEditor({ section, onUpdate, isEditing, setIsEditing }: SectionEditorProps) {
  const handleChange = (field: string, value: string) => {
    onUpdate({
      ...section.content,
      [field]: value
    });
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="text-lg font-semibold text-white">{section.content.name || 'Votre nom'}</div>
        <div className="text-sm text-gray-400">{section.content.email || 'votre.email@exemple.com'}</div>
        <div className="text-sm text-gray-400">{section.content.phone || 'Téléphone'}</div>
        <div className="text-sm text-gray-400">{section.content.location || 'Localisation'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={section.content.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Votre nom complet"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50"
        aria-label="Nom complet"
      />
      <input
        type="email"
        value={section.content.email || ''}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="votre.email@exemple.com"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50"
        aria-label="Adresse email"
      />
      <input
        type="tel"
        value={section.content.phone || ''}
        onChange={(e) => handleChange('phone', e.target.value)}
        placeholder="Téléphone"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50"
        aria-label="Numéro de téléphone"
      />
      <input
        type="text"
        value={section.content.location || ''}
        onChange={(e) => handleChange('location', e.target.value)}
        placeholder="Ville, Pays"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50"
        aria-label="Localisation"
      />
      <input
        type="url"
        value={section.content.linkedin || ''}
        onChange={(e) => handleChange('linkedin', e.target.value)}
        placeholder="LinkedIn (optionnel)"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50"
        aria-label="Profil LinkedIn"
      />
    </div>
  );
}

function SummaryEditor({ section, onUpdate, isEditing }: SectionEditorProps) {
  const handleChange = (value: string) => {
    onUpdate({
      ...section.content,
      text: value
    });
  };

  if (!isEditing) {
    return (
      <div className="text-gray-300 leading-relaxed">
        {section.content.text || 'Ajoutez un résumé professionnel percutant...'}
      </div>
    );
  }

  return (
    <textarea
      value={section.content.text || ''}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Rédigez un résumé professionnel percutant qui met en valeur vos compétences clés et votre expérience..."
      className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-luna-400/50 resize-none"
      aria-label="Résumé professionnel"
    />
  );
}

function SectionHeader({ section, isVisible, toggleVisibility, isEditing, setIsEditing, onDelete }: {
  section: any;
  isVisible: boolean;
  toggleVisibility: () => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onDelete: () => void;
}) {
  const icons = {
    header: User,
    summary: FileText,
    experience: Briefcase,
    education: GraduationCap,
    skills: Zap,
    custom: FileText
  };

  const Icon = icons[section.type as keyof typeof icons] || FileText;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-luna-400" />
        <h3 className="text-lg font-semibold text-white">{section.title}</h3>
      </div>
      
      <div className="flex items-center space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleVisibility}
          className={`p-2 rounded-lg transition-all ${
            isVisible 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
          aria-label={isVisible ? 'Masquer la section' : 'Afficher la section'}
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-lg transition-all ${
            isEditing 
              ? 'bg-luna-500/20 text-luna-400 hover:bg-luna-500/30' 
              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
          }`}
          aria-label={isEditing ? 'Arrêter l\'édition' : 'Modifier la section'}
        >
          <Edit3 className="w-4 h-4" />
        </motion.button>
        
        {section.type === 'custom' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            aria-label="Supprimer la section"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export function CVEditor() {
  const { cvData, updateSection, removeSection, toggleSectionVisibility } = useCV();
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});

  const setIsEditing = (sectionId: string, editing: boolean) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: editing
    }));
  };

  const renderSectionEditor = (section: any) => {
    const isEditing = editingSections[section.id] || false;
    const props = {
      section,
      onUpdate: (content: any) => updateSection(section.id, content),
      isEditing,
      setIsEditing: (editing: boolean) => setIsEditing(section.id, editing)
    };

    switch (section.type) {
      case 'header':
        return <HeaderEditor {...props} />;
      case 'summary':
        return <SummaryEditor {...props} />;
      default:
        return (
          <div className="text-gray-400 italic">
            Éditeur pour {section.type} à venir...
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sections du CV</h2>
          <p className="text-sm text-gray-400">Modifiez vos informations, l'aperçu se met à jour automatiquement</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-luna-gradient rounded-lg font-medium text-white text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Section</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {cvData.sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              section.isVisible 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-500/5 border-gray-500/10 opacity-60'
            }`}
          >
            <SectionHeader
              section={section}
              isVisible={section.isVisible || false}
              toggleVisibility={() => toggleSectionVisibility(section.id)}
              isEditing={editingSections[section.id] || false}
              setIsEditing={(editing) => setIsEditing(section.id, editing)}
              onDelete={() => removeSection(section.id)}
            />
            
            {section.isVisible && renderSectionEditor(section)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}