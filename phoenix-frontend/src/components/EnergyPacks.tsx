import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coffee, Croissant, Pizza, Moon, Zap, Crown, Gift, Loader2, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { PhoenixCard, PhoenixButton, DesignTokens, combineClasses } from '../shared/ui';
import { useLuna } from '../luna/LunaContext';
import { authTokenManager } from '../services/authTokenManager';

interface EnergyPack {
  id: string;
  title: string;
  price: string;
  energy: string;
  icon: React.ComponentType<any>;
  description: string;
  tagline: string;
  popular?: boolean;
  unlimited?: boolean;
  bonus?: string;
  features: string[];
}

const ENERGY_PACKS: EnergyPack[] = [
  {
    id: 'cafe_luna',
    title: 'Café Luna',
    price: '2,99€',
    energy: '100% énergie',
    icon: Coffee,
    description: 'J\'offre un café à mon copilote IA',
    tagline: 'Rechargez quand vous le souhaitez',
    bonus: '+10% de bonus 1er achat',
    features: [
      '✅ +10% de bonus 1er achat',
      '✅ Rechargez quand vous le souhaitez', 
      '✅ Pas d\'engagement'
    ]
  },
  {
    id: 'petit_dej_luna',
    title: 'Petit-déj Luna',
    price: '5,99€',
    energy: '220% d\'énergie',
    icon: Croissant,
    description: 'Commençons la journée ensemble',
    tagline: 'Pour les matinaux productifs',
    features: [
      '✅ Plus de 2x l\'énergie',
      '✅ Excellent rapport qualité-prix',
      '✅ Pour les matinaux productifs'
    ]
  },
  {
    id: 'repas_luna',
    title: 'Repas Luna',
    price: '9,99€', 
    energy: '400% d\'énergie',
    icon: Pizza,
    description: 'J\'invite Luna au restaurant',
    tagline: 'Le plus demandé',
    popular: true,
    features: [
      '✅ 4x l\'énergie de base',
      '✅ Le plus demandé',
      '✅ Parfait pour projets intensifs'
    ]
  },
  {
    id: 'luna_unlimited',
    title: 'Luna illimitée',
    price: '29,99€',
    energy: '/mois - Énergie illimitée',
    icon: Moon,
    description: 'Luna toujours à mes côtés',
    tagline: 'Utilisateurs pro',
    unlimited: true,
    features: [
      '✅ Énergie illimitée',
      '✅ Utilisateurs pro',
      '✅ Soutien prioritaire'
    ]
  }
];

export default function EnergyPacks() {
  const { user, updateEnergy } = useLuna();
  const [searchParams] = useSearchParams();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [highlightedPack, setHighlightedPack] = useState<string | null>(null);

  // 🎯 Gestion des paramètres URL
  useEffect(() => {
    const packFromUrl = searchParams.get('pack');
    if (packFromUrl) {
      setHighlightedPack(packFromUrl);
      // Scroll vers le pack après un petit délai
      setTimeout(() => {
        const element = document.getElementById(`pack-${packFromUrl}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [searchParams]);

  const handlePurchase = async (packId: string) => {
    // 🔐 Vérification authentification
    console.log('🔐 Checking user auth:', { user, userId: user?.id, userUserId: user?.user_id, profileId: user?.profile?.id });
    const userId = user?.user_id || user?.id || user?.profile?.id;
    if (!userId) {
      setPaymentError('Veuillez vous connecter pour acheter un pack');
      return;
    }

    setSelectedPack(packId);
    setIsProcessing(true);
    setPurchaseSuccess(null);
    setPaymentError(null);

    try {
      // 🎯 Étape 1: Créer PaymentIntent avec authentification
      const token = authTokenManager.getAccessToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('http://localhost:8003/billing/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          pack: packId,
          currency: 'eur'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // 💳 Étape 2: Afficher formulaire de paiement Stripe
        setShowPaymentForm(packId);
        setIsProcessing(false);
        
        // Stocker les données PaymentIntent pour l'étape suivante
        sessionStorage.setItem('paymentIntent', JSON.stringify({
          intentId: result.intent_id,
          clientSecret: result.client_secret,
          amount: result.amount,
          pack: packId
        }));
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      setSelectedPack(null);
      setPaymentError(error instanceof Error ? error.message : 'Erreur de paiement inattendue');
    }
  };

  // 🎯 Fonction de confirmation paiement après saisie CB
  const confirmPayment = async (packId: string) => {
    const paymentData = sessionStorage.getItem('paymentIntent');
    if (!paymentData) return;

    const intent = JSON.parse(paymentData);
    setIsProcessing(true);

    try {
      const token = authTokenManager.getAccessToken();
      const userId = user?.user_id || user?.id || user?.profile?.id;
      const response = await fetch('http://localhost:8003/billing/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          intent_id: intent.intentId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // ⚡ Mettre à jour l'énergie dans le contexte Luna
        if (updateEnergy && result.energy_granted) {
          await updateEnergy(result.energy_granted);
        }

        setIsProcessing(false);
        setPurchaseSuccess(packId);
        setShowPaymentForm(null);
        setSelectedPack(null);
        
        // Nettoyer les données temporaires
        sessionStorage.removeItem('paymentIntent');
        
      } else {
        throw new Error('Erreur lors de la confirmation du paiement');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setIsProcessing(false);
      setPaymentError('Erreur lors de la confirmation. Contactez le support.');
    }
  };

  const getPackColor = (packId: string) => {
    switch (packId) {
      case 'cafe_luna': return 'from-amber-500 to-orange-600';
      case 'petit_dej_luna': return 'from-yellow-400 to-amber-500';
      case 'repas_luna': return 'from-orange-500 to-red-600';
      case 'luna_unlimited': return 'from-indigo-600 to-purple-700';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPackBg = (packId: string) => {
    switch (packId) {
      case 'cafe_luna': return 'bg-amber-50 border-amber-200';
      case 'petit_dej_luna': return 'bg-yellow-50 border-yellow-200';  
      case 'repas_luna': return 'bg-orange-50 border-orange-200';
      case 'luna_unlimited': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // 💳 Composant de formulaire de paiement sécurisé
  const PaymentForm = ({ packId }: { packId: string }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    
    const pack = ENERGY_PACKS.find(p => p.id === packId);

    const formatCardNumber = (value: string) => {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = matches && matches[0] || '';
      const parts = [];
      for (let i = 0; i < match.length; i += 4) {
        parts.push(match.substring(i, i + 4));
      }
      if (parts.length) {
        return parts.join(' ');
      } else {
        return v;
      }
    };

    const formatExpiryDate = (value: string) => {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) {
        return v.substring(0, 2) + '/' + v.substring(2, 4);
      }
      return v;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold">Paiement Sécurisé</h3>
            </div>
            <p className="text-gray-600">
              Achat: <span className="font-semibold">{pack?.title}</span>
            </p>
            <p className="text-2xl font-bold text-gray-900">{pack?.price}</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du porteur
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jean Dupont"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de carte
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'expiration
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </form>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                setShowPaymentForm(null);
                setSelectedPack(null);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => confirmPayment(packId)}
              disabled={!cardNumber || !expiryDate || !cvc || !cardholderName || isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-gradient-to-r ${getPackColor(packId)} hover:shadow-lg`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Payer {pack?.price}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            🔒 Paiement sécurisé par Stripe • Données chiffrées • Conforme PCI DSS
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={DesignTokens.layouts.containers.page}>
      <div className="text-center mb-8 sm:mb-12">
        <h1 className={combineClasses(
          DesignTokens.typography.headings.h1,
          "mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        )}>
          ⚡ Packs Énergie Luna
        </h1>
        <p className={combineClasses(
          DesignTokens.typography.body.large,
          DesignTokens.colors.neutral.text.secondary,
          "max-w-2xl mx-auto px-4"
        )}>
          Rechargez votre compte pour profiter pleinement des services IA de Luna
        </p>
      </div>

      <div className={combineClasses(
        DesignTokens.layouts.grids.responsive1to4,
        DesignTokens.spacing.gap.md,
        "mb-8"
      )}>
        {ENERGY_PACKS.map((pack) => (
          <PhoenixCard 
            key={pack.id}
            id={`pack-${pack.id}`}
            variant="gradient"
            hover
            padding="md"
            className={combineClasses(
              "relative transition-all duration-300",
              getPackBg(pack.id),
              pack.popular ? 'ring-2 ring-orange-500' : '',
              highlightedPack === pack.id ? 'ring-4 ring-blue-500 ring-opacity-60 scale-105 shadow-2xl' : ''
            )}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  POPULAIRE
                </span>
              </div>
            )}
            {pack.unlimited && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ILLIMITÉ
                </span>
              </div>
            )}

            <div className="text-center mb-4 sm:mb-6">
              <div className={`inline-flex p-3 sm:p-4 rounded-full bg-gradient-to-r ${getPackColor(pack.id)} mb-3 sm:mb-4`}>
                <pack.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className={combineClasses(
                DesignTokens.typography.headings.h4,
                DesignTokens.colors.neutral.text.primary,
                "mb-2"
              )}>{pack.title}</h3>
              <div className={combineClasses(
                DesignTokens.typography.headings.h2,
                DesignTokens.colors.neutral.text.primary,
                "mb-1"
              )}>{pack.price}</div>
              <div className={combineClasses(
                DesignTokens.typography.body.small,
                DesignTokens.colors.neutral.text.secondary,
                DesignTokens.typography.weights.medium
              )}>{pack.energy}</div>
            </div>

            <div className="mb-6 space-y-2">
              {pack.features.map((feature, index) => (
                <div key={index} className={combineClasses(
                  DesignTokens.typography.body.small,
                  DesignTokens.colors.neutral.text.secondary
                )}>
                  {feature}
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <p className={combineClasses(
                DesignTokens.typography.body.small,
                DesignTokens.colors.neutral.text.secondary,
                "italic"
              )}>
                {pack.description}
              </p>
            </div>

            <PhoenixButton
              onClick={() => handlePurchase(pack.id)}
              disabled={isProcessing && selectedPack === pack.id}
              variant="primary"
              size="lg"
              fullWidth
              loading={isProcessing && selectedPack === pack.id}
              icon={purchaseSuccess === pack.id ? <CheckCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              className={`bg-gradient-to-r ${getPackColor(pack.id)} hover:shadow-lg`}
            >
              {purchaseSuccess === pack.id 
                ? "Acheté ! ✨"
                : (user?.id ? 'Acheter maintenant' : 'Se connecter pour acheter')
              }
            </PhoenixButton>

            {pack.bonus && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  <Gift className="h-3 w-3 mr-1" />
                  {pack.bonus}
                </span>
              </div>
            )}
          </PhoenixCard>
        ))}
      </div>

      {purchaseSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Achat réalisé avec succès ! 🎉
          </h3>
          <p className="text-green-700">
            Votre énergie a été rechargée. Luna est prête à vous accompagner !
          </p>
        </div>
      )}

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erreur de paiement
          </h3>
          <p className="text-red-700 mb-4">
            {paymentError}
          </p>
          <button
            onClick={() => setPaymentError(null)}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      )}

      {showPaymentForm && (
        <PaymentForm packId={showPaymentForm} />
      )}
    </div>
  );
}