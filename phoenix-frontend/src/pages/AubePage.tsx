import PhoenixNavigation from "../components/PhoenixNavigation";
import LunaChatWidget from "../components/LunaChatWidget";
import { Sunrise, Moon, Target } from 'lucide-react';

export default function AubePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
      <PhoenixNavigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full">
                <Sunrise className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Phoenix <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Aube</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              🌅 Découvrez votre nouvelle voie avec Luna, votre guide IA bienveillant pour la reconversion
            </p>
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 max-w-3xl mx-auto mb-8 border border-indigo-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Moon className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold text-indigo-700">Luna vous accompagne :</span>
              </div>
              <p className="text-indigo-600">
                "Je vous guide avec mes 3 boucles d'analyse pour révéler votre potentiel et tracer votre chemin de réussite."
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Boucle 1: Découverte</h3>
              </div>
              <p className="text-slate-600">Luna analyse votre profil, vos passions et vos compétences actuelles.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sunrise className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Boucle 2: Exploration</h3>
              </div>
              <p className="text-slate-600">Luna explore les métiers qui correspondent à votre personnalité unique.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Moon className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Boucle 3: Projection</h3>
              </div>
              <p className="text-slate-600">Luna projette votre évolution et trace votre plan d'action personnalisé.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Moon className="h-8 w-8 text-indigo-500" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Conversation avec Luna</h2>
                  <p className="text-slate-600">Votre guide IA pour découvrir votre nouvelle voie</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <LunaChatWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}