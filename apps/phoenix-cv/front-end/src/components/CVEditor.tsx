import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Sparkles,
  Brain,
  Save,
  Undo,
  Redo,
  Type,
  Layout,
  Award
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  content: any;
  isEditing?: boolean;
}

export function CVEditor() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'header',
      title: 'Personal Information',
      type: 'header',
      content: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe',
        website: 'johndoe.com'
      }
    },
    {
      id: 'summary',
      title: 'Professional Summary',
      type: 'summary',
      content: {
        text: 'Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React and Node.js applications. Proven track record of delivering scalable solutions and leading cross-functional teams.'
      }
    },
    {
      id: 'experience',
      title: 'Work Experience',
      type: 'experience',
      content: [
        {
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          duration: '2022 - Present',
          location: 'New York, NY',
          achievements: [
            'Led development of microservices architecture serving 1M+ users',
            'Improved application performance by 40% through optimization',
            'Mentored 3 junior developers and established coding standards'
          ]
        }
      ]
    }
  ]);

  const [aiSuggestions, setAiSuggestions] = useState([
    'Add quantifiable metrics to your achievements',
    'Include relevant technical skills for ATS optimization',
    'Strengthen your professional summary with industry keywords'
  ]);

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      content: type === 'skills' ? [] : type === 'experience' ? [{}] : {},
      isEditing: true
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const renderSectionContent = (section: Section) => {
    switch (section.type) {
      case 'header':
        return <HeaderEditor section={section} onUpdate={(content) => updateSection(section.id, { content })} />;
      case 'summary':
        return <SummaryEditor section={section} onUpdate={(content) => updateSection(section.id, { content })} />;
      case 'experience':
        return <ExperienceEditor section={section} onUpdate={(content) => updateSection(section.id, { content })} />;
      default:
        return <div className="p-4 text-gray-400">Custom section editor</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-3 space-y-6">
        {/* Editor Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
            >
              <Undo className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
            >
              <Redo className="w-5 h-5" />
            </motion.button>
            <div className="w-px h-6 bg-white/20" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium"
            >
              <Brain className="w-4 h-4" />
              <span>AI Enhance</span>
            </motion.button>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">Auto-saved 2s ago</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 rounded-xl text-white font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>
          </div>
        </motion.div>

        {/* CV Sections */}
        <div className="space-y-4">
          <AnimatePresence>
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateSection(section.id, { isEditing: !section.isEditing })}
                      className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSection(section.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-4">
                  {renderSectionContent(section)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Section Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <AddSectionDropdown onAddSection={addSection} />
        </motion.div>
      </div>

      {/* AI Suggestions Sidebar */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
            AI Suggestions
          </h3>
          
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
              >
                <p className="text-sm text-gray-300">{suggestion}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs text-cyan-400 mt-2 hover:text-cyan-300 transition-colors"
                >
                  Apply Suggestion
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Format Tools */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Layout className="w-5 h-5 mr-2 text-purple-400" />
            Format Tools
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Type, label: 'Font', value: 'Inter' },
              { icon: Layout, label: 'Layout', value: 'Modern' },
              { icon: Award, label: 'Style', value: 'Professional' }
            ].map((tool, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              >
                <tool.icon className="w-5 h-5 text-cyan-400 mb-2" />
                <div className="text-xs text-gray-300">{tool.label}</div>
                <div className="text-xs text-white font-medium">{tool.value}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Individual section editors
function HeaderEditor({ section, onUpdate }: { section: Section; onUpdate: (content: any) => void }) {
  const [content, setContent] = useState(section.content);

  const updateField = (field: string, value: string) => {
    const updated = { ...content, [field]: value };
    setContent(updated);
    onUpdate(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(content).map(([field, value]) => (
        <div key={field} className="space-y-2">
          <label className="text-sm font-medium text-gray-300 capitalize">{field}</label>
          <input
            type="text"
            value={value as string}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      ))}
    </div>
  );
}

function SummaryEditor({ section, onUpdate }: { section: Section; onUpdate: (content: any) => void }) {
  const [content, setContent] = useState(section.content);

  const updateText = (text: string) => {
    const updated = { ...content, text };
    setContent(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={content.text}
        onChange={(e) => updateText(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
        placeholder="Write a compelling professional summary..."
      />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{content.text.length} characters</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-medium"
        >
          <Brain className="w-4 h-4" />
          <span>AI Enhance</span>
        </motion.button>
      </div>
    </div>
  );
}

function ExperienceEditor({ section, onUpdate }: { section: Section; onUpdate: (content: any) => void }) {
  const [experiences, setExperiences] = useState(section.content);

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {experiences.map((exp: any, index: number) => (
        <div key={index} className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company Name"
              value={exp.company || ''}
              onChange={(e) => updateExperience(index, 'company', e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 transition-all"
            />
            <input
              type="text"
              placeholder="Position Title"
              value={exp.position || ''}
              onChange={(e) => updateExperience(index, 'position', e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 transition-all"
            />
            <input
              type="text"
              placeholder="Duration"
              value={exp.duration || ''}
              onChange={(e) => updateExperience(index, 'duration', e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 transition-all"
            />
            <input
              type="text"
              placeholder="Location"
              value={exp.location || ''}
              onChange={(e) => updateExperience(index, 'location', e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 transition-all"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Achievements</label>
            {(exp.achievements || []).map((achievement: string, achievementIndex: number) => (
              <div key={achievementIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => {
                    const updated = [...(exp.achievements || [])];
                    updated[achievementIndex] = e.target.value;
                    updateExperience(index, 'achievements', updated);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 transition-all"
                  placeholder="Describe your achievement..."
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const updated = (exp.achievements || []).filter((_: any, i: number) => i !== achievementIndex);
                    updateExperience(index, 'achievements', updated);
                  }}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const updated = [...(exp.achievements || []), ''];
                updateExperience(index, 'achievements', updated);
              }}
              className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </motion.button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddSectionDropdown({ onAddSection }: { onAddSection: (type: Section['type']) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const sectionTypes = [
    { type: 'experience' as const, label: 'Work Experience', icon: '💼' },
    { type: 'education' as const, label: 'Education', icon: '🎓' },
    { type: 'skills' as const, label: 'Skills', icon: '⚡' },
    { type: 'custom' as const, label: 'Custom Section', icon: '✨' }
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium text-white shadow-lg hover:shadow-cyan-500/25 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Add Section</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-2 z-50"
          >
            {sectionTypes.map((type) => (
              <motion.button
                key={type.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onAddSection(type.type);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-white font-medium">{type.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}