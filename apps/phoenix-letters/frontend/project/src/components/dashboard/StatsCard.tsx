import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'primary' | 'secondary' | 'success' | 'warning';
}

const colorClasses = {
  primary: 'bg-gradient-primary',
  secondary: 'bg-gradient-secondary',
  success: 'bg-gradient-success',
  warning: 'bg-gradient-warning',
};

export function StatsCard({ title, value, subtitle, icon, trend, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{title}</p>
              <motion.div
                className="text-3xl font-bold text-gray-900 mb-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                {formatNumber(value)}
              </motion.div>
              <p className="text-sm text-gray-500">{subtitle}</p>
              
              {trend && (
                <div className={`flex items-center mt-2 text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="mr-1">
                    {trend.isPositive ? '↗' : '↘'}
                  </span>
                  {Math.abs(trend.value)}% vs last month
                </div>
              )}
            </div>
            
            <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-white flex-shrink-0`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}