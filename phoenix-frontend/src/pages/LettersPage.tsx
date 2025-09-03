import { useState } from 'react';
import { FileText, TrendingUp, Clock, Award, Plus, ArrowRight, Sparkles } from 'lucide-react';

interface Letter {
  id: string;
  positionTitle: string;
  companyName: string;
  createdAt: string;
  wordCount: number;
  qualityScore: number;
  status: 'generated' | 'draft' | 'sent';
}

export default function LettersPage() {
  const [letters] = useState<Letter[]>([
    {
      id: '1',
      positionTitle: 'UX Designer',
      companyName: 'Tech Corp',
      createdAt: '2024-12-01',
      wordCount: 350,
      qualityScore: 85,
      status: 'generated'
    },
    {
      id: '2', 
      positionTitle: 'Product Manager',
      companyName: 'Innovation Ltd',
      createdAt: '2024-11-28',
      wordCount: 420,
      qualityScore: 92,
      status: 'sent'
    }
  ]);

  const stats = [
    {
      title: 'Letters Generated',
      value: letters.length,
      subtitle: 'Total letters created',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-400',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Average Quality',
      value: Math.round(letters.reduce((acc, l) => acc + l.qualityScore, 0) / letters.length) || 0,
      subtitle: 'Quality score',
      icon: <Award className="w-6 h-6" />,
      color: 'text-green-400',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Time Saved',
      value: letters.length * 45,
      subtitle: 'Minutes saved',
      icon: <Clock className="w-6 h-6" />,
      color: 'text-yellow-400',
      trend: { value: 15, isPositive: true }
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-300 mb-2 flex items-center justify-center">
          <Sparkles className="w-8 h-8 mr-3" />
          Phoenix Letters - Cover Letter Generator
        </h2>
        <p className="text-lg text-gray-400">
          Create outstanding cover letters with AI assistance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={stat.title} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            {stat.trend && (
              <div className="mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-sm text-green-400">+{stat.trend.value}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors">
            <Plus className="w-6 h-6" />
            <span>New Letter</span>
          </button>
          
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors">
            <FileText className="w-6 h-6" />
            <span>My Letters</span>
          </button>
          
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors">
            <TrendingUp className="w-6 h-6" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Recent Letters */}
      {letters.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Recent Letters</h3>
            <button className="text-blue-400 hover:text-blue-300 flex items-center text-sm">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {letters.map((letter) => (
              <div
                key={letter.id}
                className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      {letter.positionTitle} at {letter.companyName}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {new Date(letter.createdAt).toLocaleDateString()} • {letter.wordCount} words
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {letter.qualityScore}/100
                    </div>
                    <div className="text-xs text-gray-400">Quality</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    letter.status === 'generated' ? 'bg-green-400' :
                    letter.status === 'draft' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">
              Upgrade to Phoenix Premium
            </h3>
            <p className="text-white/90 mb-4">
              Unlock unlimited letters, advanced features, and AI-powered optimization
            </p>
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-colors">
              Upgrade Now
            </button>
          </div>
          <div className="hidden md:block">
            <Sparkles className="w-16 h-16 text-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
