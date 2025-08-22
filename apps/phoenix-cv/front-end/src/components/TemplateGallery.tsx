import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Eye, 
  Download, 
  Star, 
  Crown, 
  Filter,
  Search,
  Grid,
  List,
  Zap,
  Award,
  Briefcase,
  Stethoscope,
  Code,
  TrendingUp,
  Heart,
  Layers
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: 'tech' | 'finance' | 'creative' | 'healthcare' | 'general';
  style: 'modern' | 'classic' | 'minimal' | 'bold';
  atsScore: number;
  downloads: number;
  rating: number;
  isPremium: boolean;
  preview: string;
  description: string;
}

export function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const templates: Template[] = [
    {
      id: '1',
      name: 'Tech Executive',
      category: 'tech',
      style: 'modern',
      atsScore: 98,
      downloads: 15420,
      rating: 4.9,
      isPremium: true,
      preview: 'tech-executive-preview',
      description: 'Perfect for senior tech roles with clean, ATS-optimized design'
    },
    {
      id: '2',
      name: 'Creative Professional',
      category: 'creative',
      style: 'bold',
      atsScore: 92,
      downloads: 8930,
      rating: 4.8,
      isPremium: false,
      preview: 'creative-preview',
      description: 'Showcase your creativity while maintaining professional standards'
    },
    {
      id: '3',
      name: 'Finance Analyst',
      category: 'finance',
      style: 'classic',
      atsScore: 96,
      downloads: 12340,
      rating: 4.7,
      isPremium: true,
      preview: 'finance-preview',
      description: 'Conservative design perfect for financial institutions'
    },
    {
      id: '4',
      name: 'Healthcare Pro',
      category: 'healthcare',
      style: 'minimal',
      atsScore: 94,
      downloads: 6780,
      rating: 4.8,
      isPremium: false,
      preview: 'healthcare-preview',
      description: 'Clean, professional template for medical professionals'
    },
    {
      id: '5',
      name: 'Startup Founder',
      category: 'tech',
      style: 'bold',
      atsScore: 90,
      downloads: 9240,
      rating: 4.6,
      isPremium: true,
      preview: 'startup-preview',
      description: 'Dynamic design for entrepreneurs and startup leaders'
    },
    {
      id: '6',
      name: 'Universal Pro',
      category: 'general',
      style: 'modern',
      atsScore: 95,
      downloads: 25680,
      rating: 4.9,
      isPremium: false,
      preview: 'universal-preview',
      description: 'Versatile template that works for any industry'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Templates', icon: Grid },
    { id: 'tech', label: 'Technology', icon: Code },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
    { id: 'creative', label: 'Creative', icon: Palette },
    { id: 'healthcare', label: 'Healthcare', icon: Stethoscope },
    { id: 'general', label: 'General', icon: Briefcase }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tech': return Code;
      case 'finance': return TrendingUp;
      case 'creative': return Palette;
      case 'healthcare': return Stethoscope;
      default: return Briefcase;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tech': return 'from-cyan-500 to-blue-600';
      case 'finance': return 'from-emerald-500 to-teal-600';
      case 'creative': return 'from-purple-500 to-pink-600';
      case 'healthcare': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
        >
          Premium Template Gallery
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 max-w-3xl mx-auto"
        >
          Choose from our collection of ATS-optimized, industry-specific templates designed by professionals.
        </motion.p>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0"
      >
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{category.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all w-64"
            />
          </div>
          
          <div className="flex items-center bg-white/10 rounded-xl p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Templates Grid */}
      <motion.div
        layout
        className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}
      >
        <AnimatePresence>
          {filteredTemplates.map((template, index) => {
            const CategoryIcon = getCategoryIcon(template.category);
            
            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                {template.isPremium && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400 font-medium">PRO</span>
                    </div>
                  </div>
                )}

                {/* Template Preview */}
                <div className="aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white m-4 rounded-lg shadow-lg">
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-2/3" />
                      <div className="h-2 bg-gray-400 rounded w-1/2" />
                      <div className="h-2 bg-gray-400 rounded w-3/4" />
                      <div className="mt-4 space-y-1">
                        <div className="h-2 bg-gray-300 rounded" />
                        <div className="h-2 bg-gray-300 rounded w-5/6" />
                        <div className="h-2 bg-gray-300 rounded w-4/5" />
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <div className="h-6 bg-cyan-500 rounded w-16" />
                        <div className="h-6 bg-purple-500 rounded w-20" />
                        <div className="h-6 bg-emerald-500 rounded w-14" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-4"
                  >
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(template.category)}`}>
                        <CategoryIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{template.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{template.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">{template.atsScore}% ATS</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {template.downloads.toLocaleString()} downloads
                      </div>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      template.style === 'modern' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      template.style === 'classic' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      template.style === 'minimal' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {template.style}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      template.isPremium
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                    }`}
                  >
                    {template.isPremium ? 'Use Premium Template' : 'Use Template'}
                  </motion.button>
                </div>

                {/* Hover Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTemplate(null)}
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
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(selectedTemplate.category)}`}>
                      {React.createElement(getCategoryIcon(selectedTemplate.category), { className: 'w-5 h-5 text-white' })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                      <p className="text-gray-400">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium text-white"
                    >
                      Use This Template
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTemplate(null)}
                      className="px-4 py-3 bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="aspect-[3/4] bg-white rounded-lg shadow-xl mx-auto max-w-md">
                  <div className="p-8 space-y-4">
                    <div className="text-center border-b border-gray-200 pb-4">
                      <h1 className="text-2xl font-bold text-gray-800">John Doe</h1>
                      <p className="text-gray-600">Senior Software Engineer</p>
                      <p className="text-sm text-gray-500">john.doe@email.com | +1 (555) 123-4567</p>
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-2">Professional Summary</h2>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Experienced software engineer with 5+ years of expertise in full-stack development...
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-2">Experience</h2>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">Senior Software Engineer</h3>
                          <p className="text-sm text-gray-600">Tech Corp • 2022 - Present</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside mt-1">
                            <li>Led development of microservices architecture</li>
                            <li>Improved application performance by 40%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">Unlock Premium Templates</h3>
        </div>
        
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Get access to our complete collection of industry-specific, ATS-optimized templates designed by career experts.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Layers, label: '50+ Premium Templates', color: 'cyan' },
            { icon: Zap, label: 'Advanced AI Features', color: 'purple' },
            { icon: Award, label: '99% ATS Compatibility', color: 'emerald' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-center space-x-2 p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <feature.icon className={`w-5 h-5 ${
                feature.color === 'cyan' ? 'text-cyan-400' :
                feature.color === 'purple' ? 'text-purple-400' :
                'text-emerald-400'
              }`} />
              <span className="text-sm text-gray-300 font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-semibold text-white shadow-xl hover:shadow-purple-500/25 transition-all"
        >
          Upgrade to Premium
        </motion.button>
      </motion.div>

      {/* Template Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Templates', value: '50+', icon: Palette, color: 'cyan' },
          { label: 'Success Rate', value: '96.3%', icon: TrendingUp, color: 'emerald' },
          { label: 'ATS Compatible', value: '100%', icon: Award, color: 'purple' },
          { label: 'Happy Users', value: '25K+', icon: Heart, color: 'pink' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-all"
          >
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${
              stat.color === 'cyan' ? 'text-cyan-400' :
              stat.color === 'emerald' ? 'text-emerald-400' :
              stat.color === 'purple' ? 'text-purple-400' :
              'text-pink-400'
            }`} />
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}