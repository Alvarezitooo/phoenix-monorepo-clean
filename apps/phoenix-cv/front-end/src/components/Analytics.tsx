import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Zap,
  Crown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin
} from 'lucide-react';

interface AnalyticsData {
  totalApplications: number;
  successRate: number;
  averageAtsScore: number;
  profileViews: number;
  monthlyGrowth: number;
  topPerformingKeywords: string[];
  industryRanking: number;
  optimizationHistory: Array<{
    date: string;
    score: number;
    change: number;
  }>;
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('applications');

  const analyticsData: AnalyticsData = {
    totalApplications: 47,
    successRate: 89.4,
    averageAtsScore: 92.7,
    profileViews: 1284,
    monthlyGrowth: 23.5,
    topPerformingKeywords: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
    industryRanking: 15,
    optimizationHistory: [
      { date: '2024-01-15', score: 73, change: 0 },
      { date: '2024-01-16', score: 78, change: 5 },
      { date: '2024-01-17', score: 85, change: 7 },
      { date: '2024-01-18', score: 89, change: 4 },
      { date: '2024-01-19', score: 92, change: 3 },
      { date: '2024-01-20', score: 94, change: 2 }
    ]
  };

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const mainMetrics = [
    {
      id: 'applications',
      label: 'Total Applications',
      value: analyticsData.totalApplications,
      change: '+12',
      changeType: 'positive' as const,
      icon: Target,
      color: 'cyan'
    },
    {
      id: 'success',
      label: 'Success Rate',
      value: `${analyticsData.successRate}%`,
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      id: 'ats',
      label: 'Avg ATS Score',
      value: `${analyticsData.averageAtsScore}/100`,
      change: '+8.3',
      changeType: 'positive' as const,
      icon: Award,
      color: 'purple'
    },
    {
      id: 'views',
      label: 'Profile Views',
      value: analyticsData.profileViews.toLocaleString(),
      change: '+187',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'cyan': return 'from-cyan-500 to-blue-600 text-cyan-300';
      case 'emerald': return 'from-emerald-500 to-teal-600 text-emerald-300';
      case 'purple': return 'from-purple-500 to-pink-600 text-purple-300';
      case 'orange': return 'from-orange-500 to-red-600 text-orange-300';
      default: return 'from-gray-500 to-gray-600 text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            Analytics Hub
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 mt-2"
          >
            Track your CV performance and application success in real-time
          </motion.p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            {timeRanges.map((range) => (
              <motion.button
                key={range.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range.value as any)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  timeRange === range.value
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {mainMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer ${
              selectedMetric === metric.id ? 'ring-2 ring-cyan-500/50' : ''
            }`}
            onClick={() => setSelectedMetric(metric.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(metric.color)} border-0`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className={`flex items-center space-x-1 ${
                metric.changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {metric.changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{metric.change}</span>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyan-400" />
              CV Optimization Progress
            </h3>
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Last 30 days</span>
            </div>
          </div>

          {/* Simple Chart Visualization */}
          <div className="space-y-4">
            {analyticsData.optimizationHistory.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">{point.date}</span>
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${point.score}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">{point.score}%</span>
                  {point.change > 0 && (
                    <span className="text-emerald-400 text-sm">+{point.change}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Side Panel - Industry Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Industry Ranking */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-400" />
              Industry Ranking
            </h4>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-purple-400 mb-2">#{analyticsData.industryRanking}</div>
              <p className="text-sm text-gray-400">Among Software Engineers</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Top 5%</span>
                <span className="text-emerald-400">You're here!</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          {/* Top Keywords */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-cyan-400" />
              Top Keywords
            </h4>
            
            <div className="space-y-3">
              {analyticsData.topPerformingKeywords.map((keyword, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                >
                  <span className="text-gray-300 text-sm">{keyword}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 bg-gray-700 rounded-full h-1">
                      <div 
                        className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      />
                    </div>
                    <span className="text-xs text-cyan-400">{Math.floor(Math.random() * 30 + 70)}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-emerald-400" />
              Recent Activity
            </h4>
            
            <div className="space-y-3">
              {[
                { action: 'CV optimized', time: '2 hours ago', type: 'optimization' },
                { action: 'Template applied', time: '1 day ago', type: 'template' },
                { action: 'Mirror Match run', time: '2 days ago', type: 'analysis' },
                { action: 'Profile viewed', time: '3 days ago', type: 'view' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3 p-2"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'optimization' ? 'bg-purple-400' :
                    activity.type === 'template' ? 'bg-cyan-400' :
                    activity.type === 'analysis' ? 'bg-emerald-400' :
                    'bg-orange-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Analytics Charts */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Application Success Breakdown */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-xl font-bold text-white mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-emerald-400" />
            Application Outcomes
          </h4>
          
          <div className="space-y-4">
            {[
              { label: 'Interviews Secured', percentage: 42, color: 'emerald', count: 20 },
              { label: 'Under Review', percentage: 28, color: 'cyan', count: 13 },
              { label: 'Rejected', percentage: 19, color: 'red', count: 9 },
              { label: 'No Response', percentage: 11, color: 'gray', count: 5 }
            ].map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{outcome.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{outcome.count}</span>
                    <span className="text-gray-400 text-sm">({outcome.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${outcome.percentage}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                    className={`h-2 rounded-full ${
                      outcome.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      outcome.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                      outcome.color === 'red' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                      'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Geographic Performance */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-xl font-bold text-white mb-6 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-orange-400" />
            Geographic Performance
          </h4>
          
          <div className="space-y-4">
            {[
              { location: 'San Francisco, CA', applications: 18, success: 94, color: 'emerald' },
              { location: 'New York, NY', applications: 15, success: 87, color: 'cyan' },
              { location: 'Seattle, WA', applications: 8, success: 75, color: 'purple' },
              { location: 'Austin, TX', applications: 6, success: 83, color: 'orange' }
            ].map((location, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{location.location}</span>
                  <span className="text-sm text-gray-400">{location.applications} apps</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Success Rate</span>
                  <span className={`text-sm font-medium ${
                    location.success >= 90 ? 'text-emerald-400' :
                    location.success >= 80 ? 'text-cyan-400' :
                    'text-orange-400'
                  }`}>
                    {location.success}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${location.success}%` }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.8 }}
                    className={`h-2 rounded-full ${
                      location.success >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      location.success >= 80 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Premium Analytics Upgrade */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">Advanced Analytics</h3>
        </div>
        
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Unlock detailed insights, competitor analysis, salary benchmarks, and personalized career recommendations with Premium.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: BarChart3, label: 'Industry Benchmarks', color: 'cyan' },
            { icon: Users, label: 'Competitor Analysis', color: 'purple' },
            { icon: Target, label: 'Career Recommendations', color: 'emerald' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
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
          Unlock Premium Analytics
        </motion.button>
      </motion.div>
    </div>
  );
}