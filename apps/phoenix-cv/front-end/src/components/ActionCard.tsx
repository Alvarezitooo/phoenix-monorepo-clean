import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DivideIcon as LucideIcon, Crown, ArrowRight, CheckCircle } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
  premium: boolean;
}

export function ActionCard({ title, description, icon: Icon, color, path, premium }: ActionCardProps) {
  const { isUnlimited } = useUserProfile();
  const isPremiumUnlocked = !premium || isUnlimited;

  return (
    <Link to={isPremiumUnlocked ? path : '/upgrade'}>
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`relative group overflow-hidden backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
          isPremiumUnlocked 
            ? 'bg-white/5 border-white/10 hover:border-white/20' 
            : 'bg-gray-900/30 border-gray-600/30 hover:border-gray-500/50'
        }`}
      >
        {premium && (
          <div className="absolute top-4 right-4">
            {isUnlimited ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Crown className="w-5 h-5 text-yellow-400" />
            )}
          </div>
        )}
        
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <h3 className={`text-xl font-semibold mb-2 transition-colors ${
          isPremiumUnlocked 
            ? 'text-white group-hover:text-luna-300' 
            : 'text-gray-400'
        }`}>
          {title}
        </h3>
        
        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
          {!isPremiumUnlocked ? 'Fonctionnalité Premium - Luna Unlimited requis' : description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isPremiumUnlocked ? 'text-luna-400' : 'text-gray-500'
          }`}>
            {isPremiumUnlocked ? 'Commencer' : 'Upgrade Requis'}
          </span>
          <ArrowRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${
            isPremiumUnlocked ? 'text-luna-400' : 'text-gray-500'
          }`} />
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </motion.div>
    </Link>
  );
}