import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Share, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  Eye,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

export function CVPreview() {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const mockCVData = {
    personal: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/johndoe'
    },
    summary: 'Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React and Node.js applications.',
    experience: [
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
      },
      {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        duration: '2020 - 2022',
        location: 'San Francisco, CA',
        achievements: [
          'Built responsive web applications using React and TypeScript',
          'Implemented RESTful APIs with Node.js and PostgreSQL',
          'Collaborated with design team to improve user experience'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Computer Science',
        school: 'University of Technology',
        year: '2016 - 2020',
        location: 'Boston, MA'
      }
    ],
    skills: [
      'React', 'Node.js', 'TypeScript', 'Python', 'PostgreSQL', 
      'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile'
    ]
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

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-2">
            {[
              { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
              { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
              { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' }
            ].map(({ mode, icon: Icon, label }) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === mode
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-all"
            >
              <ZoomOut className="w-5 h-5" />
            </motion.button>
            
            <span className="text-sm text-gray-300 min-w-[60px] text-center">
              {zoomLevel}%
            </span>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-all"
            >
              <ZoomIn className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </motion.button>
        </div>
      </motion.div>

      {/* CV Preview */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: zoomLevel / 100,
            transition: { duration: 0.3 }
          }}
          className={`${getViewModeClass()} transition-all duration-300`}
        >
          <div className="bg-white text-gray-900 shadow-2xl rounded-lg overflow-hidden">
            {/* CV Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8">
              <h1 className="text-4xl font-bold mb-2">{mockCVData.personal.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>{mockCVData.personal.email}</span>
                <span>{mockCVData.personal.phone}</span>
                <span>{mockCVData.personal.location}</span>
                <span>{mockCVData.personal.linkedin}</span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Professional Summary */}
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-cyan-500 pb-2">
                  Professional Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">{mockCVData.summary}</p>
              </section>

              {/* Experience */}
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-cyan-500 pb-2">
                  Work Experience
                </h2>
                <div className="space-y-6">
                  {mockCVData.experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-cyan-500 pl-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">{exp.position}</h3>
                          <p className="text-lg text-cyan-600 font-medium">{exp.company}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>{exp.duration}</p>
                          <p>{exp.location}</p>
                        </div>
                      </div>
                      <ul className="list-disc list-inside space-y-2">
                        {exp.achievements.map((achievement, achievementIndex) => (
                          <li key={achievementIndex} className="text-gray-700 leading-relaxed">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education */}
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-cyan-500 pb-2">
                  Education
                </h2>
                {mockCVData.education.map((edu, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{edu.degree}</h3>
                      <p className="text-cyan-600 font-medium">{edu.school}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{edu.year}</p>
                      <p>{edu.location}</p>
                    </div>
                  </div>
                ))}
              </section>

              {/* Skills */}
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-cyan-500 pb-2">
                  Technical Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mockCVData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: 'ATS Score', value: '92%', color: 'emerald' },
          { label: 'Readability', value: 'A+', color: 'cyan' },
          { label: 'Keywords', value: '24', color: 'purple' }
        ].map((stat, index) => (
          <div
            key={index}
            className={`p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-center`}
          >
            <div className={`text-2xl font-bold mb-1 ${
              stat.color === 'emerald' ? 'text-emerald-400' :
              stat.color === 'cyan' ? 'text-cyan-400' :
              'text-purple-400'
            }`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}