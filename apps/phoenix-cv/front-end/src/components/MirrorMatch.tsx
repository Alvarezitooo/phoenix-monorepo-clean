import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Upload, 
  Zap, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  FileText,
  Brain,
  Sparkles,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  Eye,
  Copy
} from 'lucide-react';

interface JobRequirement {
  category: string;
  items: string[];
  matchPercentage: number;
}

interface MatchAnalysis {
  overallScore: number;
  requirements: JobRequirement[];
  missingKeywords: string[];
  suggestions: string[];
}

export function MirrorMatch() {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  const [matchAnalysis] = useState<MatchAnalysis>({
    overallScore: 78,
    requirements: [
      {
        category: 'Technical Skills',
        items: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
        matchPercentage: 85
      },
      {
        category: 'Experience Level',
        items: ['5+ years', 'Team Leadership', 'Agile/Scrum'],
        matchPercentage: 70
      },
      {
        category: 'Education',
        items: ['Computer Science Degree', 'Relevant Certifications'],
        matchPercentage: 90
      },
      {
        category: 'Soft Skills',
        items: ['Communication', 'Problem Solving', 'Collaboration'],
        matchPercentage: 65
      }
    ],
    missingKeywords: ['GraphQL', 'Microservices', 'CI/CD', 'Kubernetes', 'Redis'],
    suggestions: [
      'Add GraphQL experience to your skills section',
      'Highlight microservices architecture experience',
      'Include CI/CD pipeline management in your achievements',
      'Mention Kubernetes orchestration projects',
      'Add Redis caching implementation examples'
    ]
  });

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 4000));
    setIsAnalyzing(false);
    setAnalysisComplete(true);
  };

  const optimizeCV = () => {
    setShowComparison(true);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
        >
          Mirror Match Engine
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 max-w-3xl mx-auto"
        >
          Revolutionary job-specific CV optimization. Upload any job posting and watch your CV transform to match it perfectly.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Description Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Job Description</h3>
                <p className="text-gray-400 text-sm">Paste the job posting you want to target</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here... 

Example:
Senior Software Engineer - Tech Company
We are looking for an experienced Senior Software Engineer with 5+ years of experience in React, TypeScript, and Node.js..."
                rows={12}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {jobDescription.length} characters
                </span>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startAnalysis}
                    disabled={!jobDescription.trim() || isAnalyzing}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        <span>Analyze & Match</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Progress */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-400" />
                  AI Analysis in Progress
                </h4>
                
                <div className="space-y-4">
                  {[
                    { step: 'Extracting job requirements', duration: 1 },
                    { step: 'Analyzing CV compatibility', duration: 1.5 },
                    { step: 'Identifying optimization opportunities', duration: 1 },
                    { step: 'Generating recommendations', duration: 0.5 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{item.step}</span>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ 
                          duration: item.duration,
                          delay: index * 1,
                          ease: "easeInOut"
                        }}
                        className="w-32 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Analysis Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Match Score Card */}
          <AnimatePresence>
            {analysisComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
              >
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <BarChart3 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Compatibility Score</h3>
                    <p className="text-gray-400 text-sm">CV-Job Match Analysis</p>
                  </div>
                </div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="relative mb-6"
                >
                  <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">
                    {matchAnalysis.overallScore}%
                  </div>
                  <div className="text-gray-400 text-sm">Match Compatibility</div>
                </motion.div>

                <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${matchAnalysis.overallScore}%` }}
                    transition={{ delay: 0.8, duration: 1.5 }}
                    className="h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={optimizeCV}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  <span>Optimize My CV Now</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Requirements Breakdown */}
          <AnimatePresence>
            {analysisComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h4 className="text-xl font-bold text-white mb-4">Requirements Analysis</h4>
                
                {matchAnalysis.requirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-white">{req.category}</h5>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                        req.matchPercentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        req.matchPercentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {req.matchPercentage}% Match
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${req.matchPercentage}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                        className={`h-2 rounded-full ${
                          req.matchPercentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          req.matchPercentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {req.items.map((item, itemIndex) => (
                        <span
                          key={itemIndex}
                          className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-lg"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Missing Keywords Section */}
      <AnimatePresence>
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Missing Keywords */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                Missing Keywords
              </h4>
              
              <div className="space-y-3">
                {matchAnalysis.missingKeywords.map((keyword, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <span className="text-gray-300">{keyword}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-3 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                    >
                      Add to CV
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                AI Recommendations
              </h4>
              
              <div className="space-y-3">
                {matchAnalysis.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer"
                  >
                    <p className="text-gray-300 text-sm leading-relaxed">{suggestion}</p>
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Apply All Recommendations
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CV Comparison View */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-bold text-white">Before vs After Comparison</h4>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-medium text-white"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Optimized</span>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original CV */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-300 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  Original CV (Score: 73%)
                </h5>
                <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-xl p-4 h-96 overflow-y-auto">
                  <div className="text-sm text-gray-300 space-y-3">
                    <div className="font-semibold">John Doe</div>
                    <div>Email: john.doe@email.com</div>
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Experience:</div>
                      <div>• Worked on React applications</div>
                      <div>• Developed web solutions</div>
                      <div>• Collaborated with team members</div>
                    </div>
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Skills:</div>
                      <div>React, JavaScript, HTML, CSS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimized CV */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-300 flex items-center">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2" />
                  Optimized CV (Score: 94%)
                </h5>
                <div className="backdrop-blur-xl bg-white/5 border border-emerald-500/20 rounded-xl p-4 h-96 overflow-y-auto">
                  <div className="text-sm text-gray-300 space-y-3">
                    <div className="font-semibold">John Doe</div>
                    <div>Email: john.doe@email.com</div>
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Experience:</div>
                      <div>• Led development of React applications serving 50,000+ users</div>
                      <div>• Architected scalable web solutions using TypeScript and Node.js</div>
                      <div>• Collaborated with cross-functional teams to deliver projects 20% ahead of schedule</div>
                    </div>
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Skills:</div>
                      <div>React, TypeScript, Node.js, AWS, Docker, GraphQL, Microservices, CI/CD, Kubernetes, Redis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Improvement Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Keywords Added', value: '+10', icon: Search, color: 'cyan' },
                { label: 'Score Increase', value: '+21%', icon: TrendingUp, color: 'emerald' },
                { label: 'ATS Compatibility', value: '94%', icon: CheckCircle, color: 'purple' },
                { label: 'Match Improvement', value: '+27%', icon: Target, color: 'orange' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${
                    stat.color === 'cyan' ? 'text-cyan-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'purple' ? 'text-purple-400' :
                    'text-orange-400'
                  }`} />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Feature Callout */}
      {!analysisComplete && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Premium Feature</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Mirror Match uses advanced AI to analyze job postings and optimize your CV for maximum compatibility. 
            Get unlimited analyses with Premium.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg"
          >
            Upgrade to Premium
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}