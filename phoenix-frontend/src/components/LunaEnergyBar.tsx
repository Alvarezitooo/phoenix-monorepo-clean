import { useLuna } from '../luna/LunaContext';
import { useNavigate } from 'react-router-dom';

export default function LunaEnergyBar() {
  const luna = useLuna();
  const navigate = useNavigate();
  
  const energy = luna.lunaEnergy || 0;
  const maxEnergy = 100;
  const percentage = (energy / maxEnergy) * 100;
  
  const getEnergyColor = () => {
    if (percentage > 66) return 'text-green-500';
    if (percentage > 33) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEnergyBarColor = () => {
    if (percentage > 66) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (percentage > 33) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-40 min-w-[200px]">
      <div className="flex items-center space-x-3">
        {/* Luna Icon */}
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-sm">🌙</span>
        </div>
        
        {/* Energy Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Énergie Luna</span>
            <span className={`text-xs font-bold ${getEnergyColor()}`}>
              {energy}/{maxEnergy}
            </span>
          </div>
          
          {/* Energy Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getEnergyBarColor()}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          {/* Energy Status */}
          <div className="mt-1">
            {percentage > 66 && (
              <span className="text-xs text-green-600">✨ Pleine puissance !</span>
            )}
            {percentage <= 66 && percentage > 33 && (
              <span className="text-xs text-yellow-600">⚡ Énergie modérée</span>
            )}
            {percentage <= 33 && percentage > 0 && (
              <span className="text-xs text-red-600">🔋 Énergie faible</span>
            )}
            {percentage === 0 && (
              <span className="text-xs text-red-600">💔 Énergie épuisée</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-2 flex space-x-1">
        <button 
          onClick={() => navigate('/energy')}
          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
        >
          Recharger
        </button>
        <button 
          onClick={() => navigate('/journal')}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
        >
          Journal
        </button>
      </div>
    </div>
  );
}