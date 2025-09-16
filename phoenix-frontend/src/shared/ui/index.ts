/**
 * 🎨 Phoenix UI Components - Barrel Export
 * Import unifié pour tous les composants du design system
 */

export * from './PhoenixCard';
export * from './PhoenixButton';
export * from '../design-tokens';

// Re-export des composants existants pour compatibilité
export { default as EnergyPacks } from '../../components/EnergyPacks';
export { default as PricingCard } from '../../components/PricingCard';
export { default as LunaEnergyGauge } from '../../components/LunaEnergyGauge';
export { default as FlammesCounter } from '../../components/FlammesCounter';