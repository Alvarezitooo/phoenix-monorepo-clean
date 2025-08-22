import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Award,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import { LunaInteractionPoint, useLuna } from '@/components/Luna';

export function Dashboard() {
  const { user, letters, userStats, setUserStats } = useStore();
  const { setContext } = useLuna();

  // Set Luna context for dashboard
  useEffect(() => {
    setContext('dashboard');
  }, [setContext]);

  useEffect(() => {
    // Simulate fetching user stats
    setUserStats({
      totalLetters: letters.length,
      monthlyUsage: letters.filter(l => 
        new Date(l.createdAt).getMonth() === new Date().getMonth()
      ).length,
      averageQuality: letters.length > 0 
        ? Math.round(letters.reduce((acc, l) => acc + l.qualityScore, 0) / letters.length)
        : 0,
      successRate: 85,
      timeSaved: letters.length * 45,
      monthlyLimit: user?.subscription === 'premium' ? 999 : 3,
    });
  }, [letters, user, setUserStats]);

  const recentLetters = letters.slice(0, 5);

  const statsCards = [
    {
      title: 'Letters Generated',
      value: userStats?.totalLetters || 0,
      subtitle: 'Total letters created',
      icon: <FileText className="w-6 h-6" />,
      color: 'primary' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'This Month',
      value: userStats?.monthlyUsage || 0,
      subtitle: `of ${userStats?.monthlyLimit} limit`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'secondary' as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Average Quality',
      value: userStats?.averageQuality || 0,
      subtitle: 'Quality score',
      icon: <Award className="w-6 h-6" />,
      color: 'success' as const,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Time Saved',
      value: userStats?.timeSaved || 0,
      subtitle: 'Minutes saved',
      icon: <Clock className="w-6 h-6" />,
      color: 'warning' as const,
      trend: { value: 15, isPositive: true }
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          Welcome back, {user?.name}! 👋
          <LunaInteractionPoint
            variant="prominent"
            tooltipText="Luna peut vous expliquer votre tableau de bord"
            contextMessage="🌙 Bienvenue sur votre tableau de bord Phoenix Letters ! Je peux vous expliquer vos statistiques, vous aider à améliorer vos performances ou vous guider vers les bonnes fonctionnalités. Que souhaitez-vous faire ?"
          />
        </h1>
        <p className="text-gray-600">
          Ready to create your next outstanding cover letter?
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-gradient-primary" />
              Quick Actions
              <LunaInteractionPoint
                variant="subtle"
                tooltipText="Luna peut vous guider dans vos actions"
                contextMessage="🚀 Ces actions rapides vous permettent de naviguer efficacement dans Phoenix Letters. Voulez-vous que je vous explique chaque fonctionnalité ou que je vous aide à choisir la meilleure action pour votre situation ?"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                size="lg" 
                className="h-20 flex-col space-y-2"
                onClick={() => window.location.href = '/generate'}
              >
                <Plus className="w-6 h-6" />
                <span>New Letter</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col space-y-2"
                onClick={() => window.location.href = '/letters'}
              >
                <FileText className="w-6 h-6" />
                <span>My Letters</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col space-y-2"
                onClick={() => window.location.href = '/analytics'}
              >
                <TrendingUp className="w-6 h-6" />
                <span>Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Letters */}
      {recentLetters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Letters</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/letters'}
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLetters.map((letter) => (
                  <motion.div
                    key={letter.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {letter.positionTitle} at {letter.companyName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(letter.createdAt)} • {letter.wordCount} words
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {letter.qualityScore}/100
                        </div>
                        <div className="text-xs text-gray-500">Quality</div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        letter.status === 'generated' ? 'bg-green-400' :
                        letter.status === 'draft' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Premium Upgrade CTA */}
      {user?.subscription === 'free' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gradient-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Upgrade to Phoenix Premium
                  </h3>
                  <p className="text-white/90 mb-4">
                    Unlock unlimited letters, advanced features, and AI-powered optimization
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-white text-purple-600 hover:bg-white/90"
                  >
                    Upgrade Now
                  </Button>
                </div>
                <div className="hidden md:block">
                  <Sparkles className="w-16 h-16 text-white/30" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}