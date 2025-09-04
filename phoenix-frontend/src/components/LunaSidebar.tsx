import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Moon, 
  Sunrise, 
  BarChart3, 
  FileText, 
  Zap, 
  X,
  ChevronRight,
  Sparkles,
  Battery,
  TrendingUp
} from 'lucide-react';

interface LunaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    name: string;
    energy: number;
    objective: string;
    subscription?: string;
    isUnlimited?: boolean;
  };
}

const services = [
  {
    id: 'aube',
    name: 'Phoenix Aube',
    description: 'Découvre ta nouvelle voie',
    icon: Sunrise,
    path: '/aube',
    energyCost: 25,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    lunaAdvice: "Commençons par explorer tes passions et tes forces naturelles !",
    status: 'available'
  },
  {
    id: 'cv',
    name: 'Phoenix CV',
    description: 'Optimise ton profil',
    icon: BarChart3,
    path: '/cv',
    energyCost: 15,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    lunaAdvice: "Ton CV sera ton meilleur ambassadeur. Rendons-le irrésistible !",
    status: 'available'
  },
  {
    id: 'letters',
    name: 'Phoenix Letters',
    description: 'Écrivons ensemble',
    icon: FileText,
    path: '/letters',
    energyCost: 10,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    lunaAdvice: "Chaque lettre sera unique et authentiquement toi !",
    status: 'available'
  }
];

export default function LunaSidebar({ isOpen, onClose, userProfile }: LunaSidebarProps) {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleServiceClick = (service: typeof services[0]) => {
    navigate(service.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Full-screen overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
        <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
          <SidebarContent 
            userProfile={userProfile}
            services={services}
            hoveredService={hoveredService}
            onServiceHover={setHoveredService}
            onServiceClick={handleServiceClick}
            onClose={onClose}
            isMobile={true}
          />
        </div>
      </div>

      {/* Desktop: Fixed sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out">
        <SidebarContent 
          userProfile={userProfile}
          services={services}
          hoveredService={hoveredService}
          onServiceHover={setHoveredService}
          onServiceClick={handleServiceClick}
          onClose={onClose}
          isMobile={false}
        />
      </div>
      
      {/* Desktop: Backdrop */}
      <div className="hidden md:block fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={onClose}></div>
    </>
  );
}

interface SidebarContentProps {
  userProfile?: {
    name: string;
    energy: number;
    objective: string;
  };
  services: typeof services;
  hoveredService: string | null;
  onServiceHover: (id: string | null) => void;
  onServiceClick: (service: typeof services[0]) => void;
  onClose: () => void;
  isMobile: boolean;
}

function SidebarContent({ 
  userProfile, 
  services, 
  hoveredService, 
  onServiceHover, 
  onServiceClick, 
  onClose,
  isMobile 
}: SidebarContentProps) {
  const currentEnergy = userProfile?.energy || 85;
  const userName = userProfile?.name || 'Mon ami';

  return (
    <div className="flex flex-col h-full">
      {/* Header with Luna */}
      <div className="p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center">
                <Moon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Luna Guide</h2>
                <p className="text-indigo-100 text-sm">Ton copilote IA</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4">
            <p className="text-white/90 text-sm leading-relaxed">
              {hoveredService 
                ? services.find(s => s.id === hoveredService)?.lunaAdvice
                : `Salut ${userName} ! 🌟\n\nJe suis là pour te guider. Quel service t'intéresse aujourd'hui ?`}
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Energy Status */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Battery className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-700">Énergie Luna</span>
          </div>
          <span className="text-lg font-bold text-indigo-600">{currentEnergy}/100</span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${currentEnergy}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Très bien ! ✨</span>
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">
            Recharger 🔋
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Mes Services Phoenix
          </h3>
        </div>
        
        <div className="space-y-3">
          {services.map((service) => {
            const Icon = service.icon;
            const isHovered = hoveredService === service.id;
            const canAfford = currentEnergy >= service.energyCost;
            
            return (
              <div
                key={service.id}
                className={`group relative transition-all duration-200 ${
                  canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
                onMouseEnter={() => onServiceHover(service.id)}
                onMouseLeave={() => onServiceHover(null)}
                onClick={() => canAfford && onServiceClick(service)}
              >
                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                  isHovered 
                    ? `border-indigo-300 ${service.bgColor} shadow-lg scale-105` 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600"></div>
                  </div>
                  
                  <div className="relative p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${service.color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">{service.energyCost}⚡</span>
                        </div>
                        {canAfford ? (
                          <span className="text-xs text-emerald-600 font-medium">✓ Disponible</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">Énergie insuffisante</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">
                        {service.name}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                    
                    {isHovered && canAfford && (
                      <div className="flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center space-x-2 text-xs text-indigo-600">
                          <TrendingUp className="w-3 h-3" />
                          <span>Recommandé pour toi</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-indigo-500 animate-bounce" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-2">
            Propulsé par Luna IA ✨
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>Version 2.1 - Décembre 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}