/**
 * 🔄 Page Refund - Garantie Satisfaction Luna
 * Interface utilisateur pour demandes de remboursement
 */

import React, { useState, useEffect } from 'react';
import { lunaAPI, formatDate, formatCurrency } from '../lib/api';

interface User {
  id: string;
  jwt: string;
  email?: string;
}

interface RefundFormData {
  actionEventId: string;
  reason: string;
}

interface RefundState {
  loading: boolean;
  error: string | null;
  success: string | null;
  eligibilityChecked: boolean;
  eligible: boolean;
  eligibilityReason: string;
  actionDetails: any;
  refundHistory: any[];
}

export const RefundPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<RefundFormData>({
    actionEventId: '',
    reason: '',
  });
  const [state, setState] = useState<RefundState>({
    loading: false,
    error: null,
    success: null,
    eligibilityChecked: false,
    eligible: false,
    eligibilityReason: '',
    actionDetails: null,
    refundHistory: [],
  });
  
  // Chargement historique remboursements
  useEffect(() => {
    if (user?.jwt) {
      loadRefundHistory();
    }
  }, [user]);
  
  const loadRefundHistory = async () => {
    if (!user) return;
    
    try {
      const history = await lunaAPI.getRefundHistory(user.jwt, user.id);
      setState(prev => ({ 
        ...prev, 
        refundHistory: history.refunds || [] 
      }));
    } catch (error) {
      console.error('Error loading refund history:', error);
    }
  };
  
  const checkEligibility = async () => {
    if (!user?.jwt || !formData.actionEventId) {
      setState(prev => ({ 
        ...prev, 
        error: 'Veuillez saisir un ID d\'événement d\'action' 
      }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const eligibility = await lunaAPI.checkRefundEligibility(
        user.jwt,
        user.id,
        formData.actionEventId
      );
      
      setState(prev => ({
        ...prev,
        loading: false,
        eligibilityChecked: true,
        eligible: eligibility.eligible,
        eligibilityReason: eligibility.reason,
        actionDetails: eligibility,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erreur vérification éligibilité: ${error}`,
      }));
    }
  };
  
  const submitRefund = async () => {
    if (!user?.jwt || !formData.actionEventId || !state.eligible) {
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const refund = await lunaAPI.requestRefund(user.jwt, {
        user_id: user.id,
        action_event_id: formData.actionEventId,
        reason: formData.reason,
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        success: `✅ Remboursement effectué ! ${refund.refunded_units} unités remboursées. Nouveau solde: ${refund.new_energy_balance} ⚡`,
        eligibilityChecked: false,
        eligible: false,
      }));
      
      // Reset formulaire
      setFormData({ actionEventId: '', reason: '' });
      
      // Recharger historique
      loadRefundHistory();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erreur remboursement: ${error}`,
      }));
    }
  };
  
  // Interface de connexion utilisateur (simplifié pour demo)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">🔄 Remboursement Luna</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="User ID (UUID)"
              className="w-full border rounded-lg p-3"
              onChange={(e) => setUser(prev => ({ ...prev!, id: e.target.value }))}
            />
            <input
              type="text"
              placeholder="JWT Token"
              className="w-full border rounded-lg p-3"
              onChange={(e) => setUser(prev => ({ ...prev!, jwt: e.target.value }))}
            />
            <input
              type="email"
              placeholder="Email (optionnel)"
              className="w-full border rounded-lg p-3"
              onChange={(e) => setUser(prev => ({ ...prev!, email: e.target.value }))}
            />
            <button
              onClick={() => user?.id && user?.jwt && setUser(user)}
              className="w-full bg-orange-600 text-white rounded-lg p-3 hover:bg-orange-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            🔄 Garantie Satisfaction Luna
          </h1>
          <p className="text-lg opacity-75">
            Pas satisfait d'une action ? Nous vous remboursons sous 7 jours
          </p>
        </div>
        
        {/* Messages */}
        {state.error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
            {state.error}
          </div>
        )}
        
        {state.success && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
            {state.success}
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Formulaire de remboursement */}
          <div className="bg-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Demander un remboursement</h2>
            
            <div className="space-y-6">
              {/* ID événement action */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID de l'événement d'action *
                </label>
                <input
                  type="text"
                  value={formData.actionEventId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    actionEventId: e.target.value 
                  }))}
                  placeholder="ex: evt_12345abcde..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-300"
                />
                <p className="text-xs opacity-75 mt-1">
                  Trouvez cet ID dans votre historique d'actions ou email de confirmation
                </p>
              </div>
              
              {/* Raison */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Raison du remboursement (optionnel)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reason: e.target.value 
                  }))}
                  placeholder="Décrivez pourquoi vous souhaitez être remboursé..."
                  rows={3}
                  maxLength={280}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-300 resize-none"
                />
                <p className="text-xs opacity-75 mt-1">
                  {formData.reason.length}/280 caractères
                </p>
              </div>
              
              {/* Bouton vérification éligibilité */}
              {!state.eligibilityChecked && (
                <button
                  onClick={checkEligibility}
                  disabled={state.loading || !formData.actionEventId}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {state.loading ? 'Vérification...' : 'Vérifier l\'éligibilité'}
                </button>
              )}
              
              {/* Résultat éligibilité */}
              {state.eligibilityChecked && (
                <div className={`p-4 rounded-lg border ${
                  state.eligible 
                    ? 'bg-green-500/20 border-green-500' 
                    : 'bg-red-500/20 border-red-500'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className="mr-2">
                      {state.eligible ? '✅' : '❌'}
                    </span>
                    <span className="font-semibold">
                      {state.eligible ? 'Éligible au remboursement' : 'Non éligible'}
                    </span>
                  </div>
                  <p className="text-sm opacity-75">
                    {state.eligibilityReason}
                  </p>
                  
                  {state.actionDetails && (
                    <div className="mt-3 text-xs space-y-1">
                      <p><strong>Action:</strong> {state.actionDetails.action_name}</p>
                      <p><strong>Énergie:</strong> {state.actionDetails.energy_consumed} unités</p>
                      <p><strong>Date:</strong> {formatDate(state.actionDetails.action_date)}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Bouton remboursement */}
              {state.eligible && (
                <button
                  onClick={submitRefund}
                  disabled={state.loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {state.loading ? 'Traitement...' : 'Confirmer le remboursement'}
                </button>
              )}
              
              {/* Reset */}
              {state.eligibilityChecked && (
                <button
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    eligibilityChecked: false, 
                    eligible: false,
                    error: null 
                  }))}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors"
                >
                  Vérifier une autre action
                </button>
              )}
            </div>
          </div>
          
          {/* Politique et historique */}
          <div className="space-y-6">
            
            {/* Politique de remboursement */}
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">📋 Politique de remboursement</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="mr-2">⏰</span>
                  <span>Remboursement dans les <strong>7 jours</strong> suivant l'action</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span>Actions éligibles: analyse CV, Mirror Match, lettres de motivation</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Non éligible: actions gratuites (conseils rapides)</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">⚡</span>
                  <span>Remboursement automatique sous <strong>24h</strong></span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">📚</span>
                  <span>Capital Narratif conservé</span>
                </div>
              </div>
            </div>
            
            {/* Historique remboursements */}
            {state.refundHistory.length > 0 && (
              <div className="bg-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">📜 Historique des remboursements</h3>
                <div className="space-y-3">
                  {state.refundHistory.slice(0, 5).map((refund, idx) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{refund.original_action}</p>
                          <p className="text-sm opacity-75">
                            {formatDate(refund.date)}
                          </p>
                          {refund.reason && (
                            <p className="text-xs opacity-75 mt-1">
                              "{refund.reason}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">
                            +{refund.energy_refunded} ⚡
                          </p>
                          <p className="text-xs opacity-75">
                            {refund.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contact support */}
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold mb-2">💬 Besoin d'aide ?</h3>
              <p className="text-sm opacity-75 mb-4">
                Notre équipe support est là pour vous aider
              </p>
              <a
                href="mailto:support@phoenix.ai"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <span className="mr-2">📧</span>
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;