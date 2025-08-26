import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Lightbulb, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LastDoubtProps {
  doubt: string;
}

export function LastDoubt({ doubt }: LastDoubtProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Quelques réponses empathiques de Luna selon le type de doute
  const getEmpathicResponse = (doubt: string) => {
    const lowerDoubt = doubt.toLowerCase();
    
    if (lowerDoubt.includes('expérience') || lowerDoubt.includes('suffisant')) {
      return "Votre expérience unique est votre force. Chaque parcours professionnel a sa valeur. 💫";
    }
    if (lowerDoubt.includes('âge') || lowerDoubt.includes('trop')) {
      return "L'âge apporte sagesse et perspective. De nombreux succès commencent après 40 ans ! 🌟";
    }
    if (lowerDoubt.includes('compétence') || lowerDoubt.includes('capable')) {
      return "Vos doutes prouvent votre humilité. C'est souvent le signe des meilleurs professionnels. ✨";
    }
    if (lowerDoubt.includes('reconversion') || lowerDoubt.includes('changement')) {
      return "Chaque reconversion est un acte de courage. Vous avez déjà franchi le plus dur : commencer. 🚀";
    }
    
    return "Chaque doute est une opportunité de croissance. Luna est là pour vous accompagner. 💜";
  };

  const empathicResponse = getEmpathicResponse(doubt);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-blue-500">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 flex items-center">
                💭 Votre dernier doute
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-700"
              >
                {isExpanded ? 'Réduire' : 'Voir conseil Luna'}
                <ArrowRight className={`w-3 h-3 ml-1 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} />
              </Button>
            </div>
            
            <blockquote className="text-gray-700 italic text-sm mb-3 pl-3 border-l-2 border-blue-200">
              "{doubt}"
            </blockquote>

            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-lg p-3 mt-3">
                <div className="flex items-start space-x-2">
                  <Heart className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 text-sm mb-2">
                      <strong>Conseil de Luna :</strong>
                    </p>
                    <p className="text-gray-700 text-sm">
                      {empathicResponse}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    onClick={() => {
                      // TODO: Redirect to Luna chat or coaching session
                      console.log('Open Luna coaching session');
                    }}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Parler avec Luna de ce doute
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}