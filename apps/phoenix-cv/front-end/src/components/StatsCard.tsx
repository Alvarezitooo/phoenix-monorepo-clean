import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'cyan' | 'emerald' | 'purple' | 'orange';
}

const colorClasses = {
  cyan: 'from-luna-500/20 to-luna-accent/20 border-luna-500/30 text-luna-300',
  emerald: 'from-success/20 to-emerald-500/20 border-success/30 text-emerald-300',
  purple: 'from-luna-secondary/20 to-luna-500/20 border-luna-secondary/30 text-luna-300',
  orange: 'from-phoenix-500/20 to-phoenix-accent/20 border-phoenix-500/30 text-phoenix-300'
};

export function StatsCard({ label, value, icon: Icon, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-300">{label}</div>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </motion.div>
  );
}