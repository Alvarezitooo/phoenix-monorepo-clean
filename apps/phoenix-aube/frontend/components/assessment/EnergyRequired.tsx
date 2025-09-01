'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Battery } from 'lucide-react';
import { lunaHubHelpers } from '@/lib/api';

interface EnergyRequiredProps {
  required: number;
  current: number;
  actionName: string;
  onRecharge?: () => void;
}

export function EnergyRequired({ required, current, actionName, onRecharge }: EnergyRequiredProps) {
  const handleRecharge = () => {
    if (onRecharge) {
      onRecharge();
    } else {
      lunaHubHelpers.redirectToEnergyPurchase();
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-800">Énergie insuffisante</h3>
          <p className="text-yellow-700">
            Vous avez besoin de <strong>{required} points d'énergie</strong> pour {actionName}.
            <br />
            Vous n'avez actuellement que <strong>{current} points</strong>.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 p-4 bg-white rounded-lg">
          <Battery className="w-6 h-6 text-yellow-600" />
          <div className="text-left">
            <p className="font-medium text-gray-900">Points manquants: {required - current}</p>
            <p className="text-sm text-gray-600">Rechargez sur Luna Hub</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleRecharge}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Recharger mon énergie
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>

        <p className="text-xs text-yellow-600">
          💡 L'énergie se recharge automatiquement chaque jour ou peut être achetée sur Luna Hub
        </p>
      </CardContent>
    </Card>
  );
}