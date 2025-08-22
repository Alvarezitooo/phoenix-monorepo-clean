/**
 * 💳 Page Billing Phoenix Website avec Stripe Integration
 * Achat d'énergie Luna sécurisé et UX premium
 */

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { 
  lunaAPI, 
  PACK_INFO, 
  PackCode, 
  CreateIntentResponse,
  formatCurrency,
  formatDate 
} from '../lib/api';

// Configuration Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

// Types
interface User {
  id: string;
  jwt: string;
  name?: string;
  email?: string;
}

interface BillingState {
  loading: boolean;
  error: string | null;
  success: string | null;
  selectedPack: PackCode | null;
  currentIntent: CreateIntentResponse | null;
  energyBalance: number;
  processingPayment: boolean;
}

// Composant principal
export const BillingPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <BillingPageContent />
    </Elements>
  );
};

const BillingPageContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<BillingState>({
    loading: false,
    error: null,
    success: null,
    selectedPack: null,
    currentIntent: null,
    energyBalance: 0,
    processingPayment: false,
  });
  
  const stripe = useStripe();
  const elements = useElements();
  
  // Chargement initial du solde énergie
  useEffect(() => {
    if (user?.jwt) {
      loadEnergyBalance();
    }
  }, [user]);
  
  const loadEnergyBalance = async () => {
    if (!user) return;
    
    try {
      const balance = await lunaAPI.checkEnergyBalance(user.jwt, user.id);
      setState(prev => ({ 
        ...prev, 
        energyBalance: balance.current_energy 
      }));
    } catch (error) {
      console.error('Error loading energy balance:', error);
    }
  };
  
  const selectPack = async (pack: PackCode) => {
    if (!user?.jwt) {
      setState(prev => ({ 
        ...prev, 
        error: 'Veuillez vous connecter pour acheter de l\'énergie' 
      }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      selectedPack: pack 
    }));
    
    try {
      const intent = await lunaAPI.createPaymentIntent(user.jwt, {
        user_id: user.id,
        pack,
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        currentIntent: intent 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Erreur création paiement: ${error}` 
      }));
    }
  };
  
  const confirmPayment = async () => {
    if (!stripe || !elements || !state.currentIntent || !user) {
      return;
    }
    
    setState(prev => ({ ...prev, processingPayment: true, error: null }));
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setState(prev => ({ 
        ...prev, 
        processingPayment: false, 
        error: 'Élément carte non trouvé' 
      }));
      return;
    }
    
    try {
      // Confirmation du paiement côté Stripe
      const { error: stripeError } = await stripe.confirmCardPayment(
        state.currentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.name || user.email,
              email: user.email,
            },
          },
        }
      );
      
      if (stripeError) {
        setState(prev => ({ 
          ...prev, 
          processingPayment: false, 
          error: `Erreur paiement: ${stripeError.message}` 
        }));
        return;
      }
      
      // Confirmation côté Luna Hub
      const confirmation = await lunaAPI.confirmPayment(user.jwt, {
        user_id: user.id,
        intent_id: state.currentIntent.intent_id,
      });
      
      if (confirmation.success) {
        setState(prev => ({ 
          ...prev, 
          processingPayment: false,
          success: `🎉 Paiement réussi ! ${confirmation.energy_added} unités ajoutées${
            confirmation.bonus_applied ? ` (bonus +${confirmation.bonus_units})` : ''
          }`,
          energyBalance: confirmation.new_energy_balance,
          currentIntent: null,
          selectedPack: null
        }));
        
        // Nettoyage de la carte
        cardElement.clear();
      } else {
        setState(prev => ({ 
          ...prev, 
          processingPayment: false, 
          error: 'Erreur confirmation paiement côté Luna Hub' 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        processingPayment: false, 
        error: `Erreur confirmation: ${error}` 
      }));
    }
  };
  
  const cancelPayment = () => {
    setState(prev => ({ 
      ...prev, 
      currentIntent: null, 
      selectedPack: null,
      error: null 
    }));
  };
  
  // Interface de connexion utilisateur (simplifié pour demo)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">🌙 Luna Energy</h2>
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
              className="w-full bg-purple-600 text-white rounded-lg p-3 hover:bg-purple-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            🌙 Acheter de l'énergie Luna
          </h1>
          <p className="text-lg opacity-75">
            Alimentez votre créativité avec nos packs d'énergie premium
          </p>
          
          {/* Solde actuel */}
          <div className="mt-6 inline-flex items-center bg-white/10 rounded-full px-6 py-3">
            <span className="text-sm opacity-75 mr-2">Solde actuel:</span>
            <span className="text-xl font-bold">{state.energyBalance} ⚡</span>
          </div>
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
        
        {/* Sélection des packs ou paiement */}
        {!state.currentIntent ? (
          <PackSelection 
            loading={state.loading}
            onSelectPack={selectPack}
          />
        ) : (
          <PaymentForm
            intent={state.currentIntent}
            pack={state.selectedPack!}
            processing={state.processingPayment}
            onConfirm={confirmPayment}
            onCancel={cancelPayment}
          />
        )}
        
        {/* Footer avec garantie */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">🛡️ Garantie Satisfaction</h3>
            <p className="text-sm opacity-75">
              Pas satisfait d'une action ? Demandez le remboursement sous 7 jours.
              <br />
              <a href="/energy/refund" className="underline hover:text-purple-300">
                Demander un remboursement →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant sélection des packs
const PackSelection: React.FC<{
  loading: boolean;
  onSelectPack: (pack: PackCode) => void;
}> = ({ loading, onSelectPack }) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {(Object.entries(PACK_INFO) as [PackCode, typeof PACK_INFO[PackCode]][]).map(
        ([code, info]) => (
          <div
            key={code}
            className={`bg-white/10 rounded-2xl p-6 border ${
              info.popular ? 'border-yellow-400 shadow-yellow-400/20' : 'border-white/20'
            } hover:bg-white/20 transition-all duration-300 relative`}
          >
            {info.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                POPULAIRE
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{info.name}</h3>
              <div className="text-3xl font-bold text-purple-300 mb-2">
                {info.price}
              </div>
              <div className="text-lg mb-4">
                {info.energy} unités ⚡
              </div>
              <p className="text-sm opacity-75 mb-4">
                {info.description}
              </p>
              
              {info.savings && (
                <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  Économie {info.savings} vs Café
                </div>
              )}
              
              <ul className="text-xs space-y-1 mb-6 opacity-75">
                {info.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              
              <button
                onClick={() => onSelectPack(code)}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Chargement...' : 'Choisir ce pack'}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

// Composant formulaire de paiement
const PaymentForm: React.FC<{
  intent: CreateIntentResponse;
  pack: PackCode;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ intent, pack, processing, onConfirm, onCancel }) => {
  const packInfo = PACK_INFO[pack];
  
  return (
    <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-center mb-6">
        Finaliser l'achat
      </h2>
      
      {/* Résumé commande */}
      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span>{packInfo.name}</span>
          <span className="font-bold">{packInfo.price}</span>
        </div>
        <div className="flex justify-between items-center text-sm opacity-75">
          <span>{packInfo.energy} unités d'énergie</span>
          <span>TVA incluse</span>
        </div>
        {pack === 'cafe_luna' && (
          <div className="mt-2 text-xs text-green-300">
            🎉 Bonus +10% pour votre premier café !
          </div>
        )}
      </div>
      
      {/* Formulaire carte */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Informations de carte bancaire
        </label>
        <div className="bg-white rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#000',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>
      
      {/* Boutons */}
      <div className="space-y-3">
        <button
          onClick={onConfirm}
          disabled={processing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {processing ? 'Traitement...' : `Payer ${formatCurrency(intent.amount)}`}
        </button>
        
        <button
          onClick={onCancel}
          disabled={processing}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white py-2 px-6 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
      
      {/* Sécurité */}
      <div className="mt-4 text-xs text-center opacity-75">
        🔒 Paiement sécurisé par Stripe • Aucune donnée stockée
      </div>
    </div>
  );
};

export default BillingPage;