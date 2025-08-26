import React from 'react';
import { motion } from 'framer-motion';
import { JournalHeader } from '@/components/journal/JournalHeader';
import { ChaptersTimeline } from '@/components/journal/ChaptersTimeline';
import { NextSteps } from '@/components/journal/NextSteps';
import { LastDoubt } from '@/components/journal/LastDoubt';
import { useQuery } from '@tanstack/react-query';
import { journalAPI } from '@/services/journalAPI';
import { useStore } from '@/store/useStore';

export function Journal() {
  const { user } = useStore();

  // Fetch Journal data from Hub backend
  const { 
    data: journalData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['journal', user?.id],
    queryFn: () => journalAPI.getJournalData(user?.id || ''),
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de votre récit...</p>
              <p className="text-gray-500 text-sm mt-2">Luna prépare votre Journal Narratif</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Oups ! Erreur de chargement</h2>
              <p className="text-gray-600 mb-6">
                Impossible de charger votre Journal. Luna va corriger cela rapidement.
              </p>
              <button 
                onClick={() => refetch()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome message for new users with no data
  if (!journalData || journalData.narrative.chapters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <JournalHeader 
            user={journalData?.user || { id: user?.id || '', first_name: user?.name || 'Utilisateur', plan: 'standard' }}
            energy={journalData?.energy || { balance_pct: 100, last_purchase: null }}
          />
          
          <motion.div 
            className="mt-8 text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-6">🌙</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue dans votre Journal Narratif !
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Votre histoire professionnelle commence ici. Chaque action que vous accomplissez 
              avec Luna devient un chapitre de votre transformation en héros de votre carrière.
            </p>
            
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">🚀 Prêt pour votre première action ?</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Générer ma première lettre
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Explorer le dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header avec profil utilisateur et énergie */}
        <JournalHeader 
          user={journalData.user}
          energy={journalData.energy}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeline des chapitres - 2/3 de l'espace */}
          <div className="lg:col-span-2">
            <ChaptersTimeline 
              chapters={journalData.narrative.chapters}
              kpis={journalData.narrative.kpis}
            />
          </div>

          {/* Sidebar avec next steps et doute - 1/3 de l'espace */}
          <div className="space-y-6">
            {/* Dernier doute exprimé */}
            {journalData.narrative.last_doubt && (
              <LastDoubt doubt={journalData.narrative.last_doubt} />
            )}

            {/* Prochaines étapes suggérées */}
            <NextSteps 
              steps={journalData.narrative.next_steps}
              userEnergy={journalData.energy.balance_pct}
              socialProof={journalData.social_proof}
              onRefetch={refetch}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}