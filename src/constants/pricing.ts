import { ServicePricing, ServiceProvider, ServiceType } from '../types';

export const SERVICE_PRICES: ServicePricing = {
  FREE: {
    SAV: 30,
  },
  ORANGE: {
    PLP: 30,
    AERIAL: 160,
    FACADE: 160,
    BUILDING: 45,
    UNDERGROUND: 88,
    PSER1: 11,
  },
  ORANGE_PRO: {
    PLP: 35,
    AERIAL: 176,
    FACADE: 176,
    BUILDING: 50,
    UNDERGROUND: 95,
    PSER1: 15,
    PRE_VISIT: 25,
  },
  SFR: {
    SAV: 0,
    PLP: 30,
    BUILDING: 55,
    UNDERGROUND: 110,
    FACADE: 110,
    AERIAL: 110,
  },
};

export const PROVIDERS: { id: ServiceProvider; label: string }[] = [
  { id: 'FREE', label: 'Free' },
  { id: 'SFR', label: 'SFR' },
  { id: 'ORANGE', label: 'Orange' },
  { id: 'ORANGE_PRO', label: 'Orange Pro' },
];

export const SERVICE_TYPES: { id: ServiceType; label: string; providers: ServiceProvider[] }[] = [
  { id: 'SAV', label: 'SAV', providers: ['FREE', 'SFR'] },
  { id: 'PLP', label: 'PLP', providers: ['ORANGE', 'ORANGE_PRO', 'SFR'] },
  { id: 'AERIAL', label: 'Aérien', providers: ['ORANGE', 'ORANGE_PRO', 'SFR'] },
  { id: 'FACADE', label: 'Façade', providers: ['ORANGE', 'ORANGE_PRO', 'SFR'] },
  { id: 'BUILDING', label: 'Immeuble', providers: ['ORANGE', 'ORANGE_PRO', 'SFR'] },
  { id: 'UNDERGROUND', label: 'Souterrain', providers: ['ORANGE', 'ORANGE_PRO', 'SFR'] },
  { id: 'PSER1', label: 'PSER1', providers: ['ORANGE', 'ORANGE_PRO'] },
  { id: 'PRE_VISIT', label: 'Pré-visite', providers: ['ORANGE_PRO'] },
];

export const getServicePrice = (provider: ServiceProvider, serviceType: ServiceType): number => {
  return SERVICE_PRICES[provider]?.[serviceType] || 0;
};

export const getAvailableServices = (provider: ServiceProvider): ServiceType[] => {
  return SERVICE_TYPES
    .filter(service => service.providers.includes(provider))
    .map(service => service.id);
};