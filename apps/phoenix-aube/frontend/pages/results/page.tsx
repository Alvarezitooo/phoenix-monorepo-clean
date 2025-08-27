'use client';
import { useEffect, useState } from 'react';
import { HUB } from '../../../config/hub';
import TopJobsList from '@/components/aube/TopJobsList';
import DisclaimerFooter from '@/components/aube/DisclaimerFooter';

export default function AubeResultsPage(){
  const [data,setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(()=>{
    // Récupérer l'utilisateur authentifié
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Veuillez vous connecter pour accéder aux recommandations');
      setLoading(false);
      return;
    }

    let currentUserId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.sub;
      
      if (!currentUserId) {
        setError('Token invalide - Veuillez vous reconnecter');
        setLoading(false);
        return;
      }
      setUserId(currentUserId);
    } catch (error) {
      setError('Token malformé - Veuillez vous reconnecter');
      setLoading(false);
      return;
    }

    const fetchRecommendations = async()=>{
      try {
        setLoading(true);
        const response = await fetch(`${HUB}/luna/aube/match/recommend`, {
          method:'POST', 
          headers:{
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify({
            k: 5,
            features: {
              appetences: {
                people: 1,
                data: 0
              }
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json(); 
        setData(result);
      } catch (error) {
        console.error('Erreur chargement recommandations:', error);
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  },[]);
  
  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-semibold">Tes pistes alignées</h1>
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-gray-600">Génération en cours... 🚀</div>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-semibold">Tes pistes alignées</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ Erreur lors du chargement : {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Tes pistes alignées</h1>
        <p className="text-sm text-gray-600 mt-1">
          Recommandations basées sur tes appétences et contraintes
        </p>
        {userId && (
          <p className="text-xs text-gray-500 mt-1">
            Utilisateur: {userId.slice(0, 8)}...
          </p>
        )}
      </header>
      
      {data ? (
        <TopJobsList data={data} />
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucune recommandation disponible pour le moment.
          </p>
        </div>
      )}
      
      <DisclaimerFooter />
    </main>
  );
}