import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FileText, 
  BarChart3, 
  Settings, 
  Crown,
  Menu,
  Sparkles,
  Target,
  Zap,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Generate Letter', href: '/generate', icon: FileText },
  { name: 'My Letters', href: '/letters', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const premiumFeatures = [
  { name: 'Smart Coach', icon: Sparkles, isPremium: true },
  { name: 'ATS Optimizer', icon: Target, isPremium: true },
  { name: 'Career Transition', icon: TrendingUpIcon, isPremium: true, isNew: true },
  { name: 'Advanced Templates', icon: Zap, isPremium: true },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user } = useStore();

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <motion.div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 lg:relative lg:translate-x-0",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient-primary">Phoenix</h1>
                <p className="text-xs text-gray-500">Letters</p>
              </div>
            </motion.div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* User info */}
        {!sidebarCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    {user.subscription === 'premium' ? 'Premium' : 'Free Plan'}
                  </p>
                  {user.subscription === 'premium' && (
                    <Badge variant="warning" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <motion.a
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100",
                "text-gray-700 hover:text-gray-900"
              )}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-gray-500",
                  sidebarCollapsed ? "mx-auto" : "mr-3"
                )}
              />
              {!sidebarCollapsed && item.name}
            </motion.a>
          ))}

          {/* Premium features */}
          {!sidebarCollapsed && (
            <div className="pt-6">
              <div className="px-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Premium Features
                </h3>
              </div>
              <div className="mt-2 space-y-1">
                {premiumFeatures.map((item) => (
                  <motion.div
                    key={item.name}
                    className="group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors hover:bg-gray-50"
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center">
                      <item.icon className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="premium" className="text-xs">
                        PRO
                      </Badge>
                      {item.isNew && (
                        <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {user?.subscription === 'free' && (
                <motion.div
                  className="mt-4 mx-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-gradient-primary p-3 rounded-lg text-white">
                    <div className="flex items-center">
                      <Crown className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Upgrade to Pro</span>
                    </div>
                    <p className="text-xs mt-1 opacity-90">
                      Unlock advanced features and unlimited letters
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </nav>
      </motion.div>
    </>
  );
}