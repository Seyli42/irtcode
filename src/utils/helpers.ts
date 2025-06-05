import { ServiceProvider, ServiceType, Statistics } from '../types';
import { PROVIDERS, SERVICE_TYPES } from '../constants/pricing';

export const getProviderLabel = (providerId: ServiceProvider): string => {
  const provider = PROVIDERS.find(p => p.id === providerId);
  return provider ? provider.label : 'Inconnu';
};

export const getServiceTypeLabel = (serviceId: ServiceType): string => {
  const service = SERVICE_TYPES.find(s => s.id === serviceId);
  return service ? service.label : 'Inconnu';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};