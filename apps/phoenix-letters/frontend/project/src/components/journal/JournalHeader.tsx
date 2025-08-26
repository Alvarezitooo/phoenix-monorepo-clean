import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JournalUser, JournalEnergy } from '@/services/journalAPI';

interface JournalHeaderProps {
  user: JournalUser;
  energy: JournalEnergy;
}

export function JournalHeader({ user, energy }: JournalHeaderProps) {
  const isUnlimited = user.plan === 'unlimited';
  const energyPercentage = isUnlimited ? 100 : energy.balance_pct;
  
  // Format last purchase date
  const formatLastPurchase = (dateString: string | null) => {
    if (!dateString) return 'Jamais rechargé';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        {/* User Profile Section */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {user.first_name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                🌙 {user.first_name}, Héroïne de votre Carrière
              </h1>
              {isUnlimited && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  UNLIMITED
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              Votre récit de transformation professionnelle
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-lg font-bold text-gray-900">+12%</span>
            </div>
            <p className="text-xs text-gray-500">Cette semaine</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-lg font-bold text-gray-900">7</span>
            </div>
            <p className="text-xs text-gray-500">Chapitres</p>
          </div>
        </div>
      </div>

      {/* Energy Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${isUnlimited ? 'text-yellow-500' : 'text-purple-600'}`} />
            <span className="font-semibold text-gray-900">
              {isUnlimited ? 'Énergie Luna Illimitée' : 'Énergie Luna'}
            </span>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {isUnlimited ? '∞' : `${Math.round(energyPercentage)}%`}
            </div>
            <div className="text-xs text-gray-500">
              {formatLastPurchase(energy.last_purchase)}
            </div>
          </div>
        </div>

        {!isUnlimited && (
          <>
            <Progress 
              value={energyPercentage} 
              className="h-2 mb-2"
            />
            
            {energyPercentage < 20 && (
              <motion.div
                className="flex items-center justify-between mt-3 p-2 bg-orange-100 rounded text-orange-800 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span>⚠️ Énergie faible - Rechargez pour continuer votre aventure</span>
                <button className="text-orange-600 hover:text-orange-800 font-medium">
                  Recharger
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}