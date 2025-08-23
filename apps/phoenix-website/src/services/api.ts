/**
 * 🚀 Phoenix Website - API Service
 * Connexion aux services Phoenix ecosystem
 */

export interface PhoenixService {
  name: string;
  url: string;
  available: boolean;
}

export interface PhoenixServices {
  letters: PhoenixService;
  cv: PhoenixService;
  'luna-hub': PhoenixService;
}

// URLs des services Phoenix (Railway)
const PHOENIX_SERVICES: PhoenixServices = {
  letters: {
    name: "Phoenix Letters",
    url: "https://phoenix-letters-production.up.railway.app",
    available: true
  },
  cv: {
    name: "Phoenix CV", 
    url: "https://phoenix-cv-production.up.railway.app",
    available: true
  },
  'luna-hub': {
    name: "Luna Hub",
    url: "https://luna-hub-production.up.railway.app", 
    available: true
  }
};

/**
 * Redirige vers un service Phoenix
 */
export const redirectToService = (service: keyof PhoenixServices) => {
  const serviceConfig = PHOENIX_SERVICES[service];
  if (serviceConfig && serviceConfig.available) {
    // Ouvre dans un nouvel onglet pour garder Phoenix Website ouvert
    window.open(serviceConfig.url, '_blank');
  } else {
    console.error(`Service ${service} not available`);
  }
};

/**
 * Obtient les URLs de tous les services
 */
export const getServices = (): PhoenixServices => {
  return PHOENIX_SERVICES;
};

/**
 * Vérifie si un service est disponible
 */
export const isServiceAvailable = (service: keyof PhoenixServices): boolean => {
  return PHOENIX_SERVICES[service]?.available ?? false;
};