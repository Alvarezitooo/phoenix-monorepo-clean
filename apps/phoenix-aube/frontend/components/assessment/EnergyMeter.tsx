'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Battery, ExternalLink, AlertTriangle } from 'lucide-react';
// Energy purchase handled via interceptors now
import { cn } from '@/lib/utils';

interface EnergyMeterProps {
  current: number;
  required?: number;
  className?: string;
}

export function EnergyMeter({ current, required, className }: EnergyMeterProps) {
  const hasEnoughEnergy = !required || current >= required;
  const energyPercentage = Math.min((current / 100) * 100, 100);

  const getEnergyStatus = () => {
    if (current >= 80) return { color: 'green', label: 'Élevée' };
    if (current >= 40) return { color: 'yellow', label: 'Modérée' };
    return { color: 'red', label: 'Faible' };
  };

  const status = getEnergyStatus();

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Battery className={cn(
            "w-6 h-6",
            status.color === 'green' ? 'text-green-500' :
            status.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
          )} />
          <span>Énergie Luna Hub</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-blue-600">{current}</div>
          <p className="text-gray-600">points d'énergie</p>
          <Badge className={cn(
            status.color === 'green' ? 'bg-green-100 text-green-800' :
            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          )}>
            Niveau {status.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Disponible</span>
            <span className="text-gray-600">{current}/100</span>
          </div>
          <Progress value={energyPercentage} className="h-3" />
        </div>

        {required && (
          <div className={cn(
            "p-4 rounded-lg border",
            hasEnoughEnergy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center space-x-2 mb-2">
              {hasEnoughEnergy ? (
                <Battery className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={cn(
                "font-medium",
                hasEnoughEnergy ? 'text-green-800' : 'text-red-800'
              )}>
                {required} points requis
              </span>
            </div>
            <p className={cn(
              "text-sm",
              hasEnoughEnergy ? 'text-green-700' : 'text-red-700'
            )}>
              {hasEnoughEnergy 
                ? 'Vous avez suffisamment d\'énergie pour cette action'
                : 'Énergie insuffisante - Rechargez votre compte'
              }
            </p>
          </div>
        )}

        {current < 20 && (
          <Button 
            onClick={() => {
              const LUNA_HUB_URL = process.env.NEXT_PUBLIC_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app';
              window.open(`${LUNA_HUB_URL}/energy/buy`, '_blank');
            }}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Recharger sur Luna Hub
          </Button>
        )}
      </CardContent>
    </Card>
  );
}