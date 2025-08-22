import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DivideIcon as LucideIcon, Crown, ArrowRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
  premium: boolean;
}

export function ActionCard({ title, description, icon: Icon, color, path, premium }: ActionCardProps) {
  return (
    <Link to={path}>
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative group overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
      >
        {premium && (
          <div className="absolute top-4 right-4">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
        )}
        
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-luna-300 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-luna-400">Get Started</span>
          <ArrowRight className="w-4 h-4 text-luna-400 transform group-hover:translate-x-1 transition-transform" />
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </motion.div>
    </Link>
  );
}