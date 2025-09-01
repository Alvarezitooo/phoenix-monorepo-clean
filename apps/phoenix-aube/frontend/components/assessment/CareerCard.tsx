'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreCircle } from './ScoreCircle';
import { CareerMatch } from '@/lib/api';
import { DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CareerCardProps {
  career: CareerMatch;
  onExplore: () => void;
  className?: string;
}

const difficultyColors = {
  facile: "bg-green-100 text-green-800 border-green-200",
  modéré: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  élevé: "bg-red-100 text-red-800 border-red-200"
};

export function CareerCard({ career, onExplore, className }: CareerCardProps) {
  return (
    <Card className={cn(
      "cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group", 
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {career.title}
              </h3>
              <Badge className={difficultyColors[career.transition_difficulty]}>
                {career.transition_difficulty}
              </Badge>
            </div>
            <p className="text-gray-600 leading-relaxed">{career.description}</p>
          </div>
          <div className="ml-6">
            <ScoreCircle 
              score={career.compatibility_score} 
              size="md" 
              label="Compatibilité" 
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{career.salary_range}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Croissance {career.growth_outlook}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{career.industry}</Badge>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-900">Compétences requises :</p>
          <div className="flex flex-wrap gap-2">
            {career.required_skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm">
            Détails complets
          </Button>
          <Button 
            onClick={onExplore}
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 group-hover:scale-105"
          >
            Plan de transition
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}