import React, { createContext, useContext, useState, useEffect } from 'react';
import { Intervention, ServiceProvider, ServiceType, User, ROLE_ACCESS, UserRole } from '../types';
import { getServicePrice } from '../constants/pricing';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface InterventionContextType {
  interventions: Intervention[];
  addIntervention: (intervention: Omit<Intervention, 'id' | 'userId' | 'createdAt'>) => void;
  getUserInterventions: (userId?: string) => Intervention[];
  calculatePrice: (provider: ServiceProvider, serviceType: ServiceType, userRole?: UserRole) => number;
  loading: boolean;
}

const InterventionContext = createContext<InterventionContextType | undefined>(undefined);

export const InterventionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadInterventions = async () => {
      if (!user) {
        setInterventions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: interventionsData, error } = await supabase
          .from('interventions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const loadedInterventions = interventionsData.map(intervention => ({
          ...intervention,
          date: new Date(intervention.date),
          createdAt: new Date(intervention.created_at)
        }));

        setInterventions(loadedInterventions);
      } catch (error) {
        console.error('Erreur chargement interventions:', error);
        setInterventions([]);
      } finally {
        setLoading(false);
      }
    };

    loadInterventions();
  }, [user]);

  const addIntervention = async (intervention: Omit<Intervention, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;

    const newIntervention: Intervention = {
      ...intervention,
      id: uuidv4(),
      userId: user.id,
      createdAt: new Date(),
    };

    try {
      const { error } = await supabase
        .from('interventions')
        .insert({
          id: newIntervention.id,
          user_id: newIntervention.userId,
          date: newIntervention.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          time: newIntervention.time,
          nd_number: newIntervention.ndNumber,
          provider: newIntervention.provider,
          service_type: newIntervention.serviceType,
          price: newIntervention.price,
          status: newIntervention.status,
          created_at: newIntervention.createdAt.toISOString()
        });

      if (error) throw error;

      setInterventions(prev => [newIntervention, ...prev]);
    } catch (error) {
      console.error('Erreur ajout intervention:', error);
    }
  };

  const getUserInterventions = (userId?: string) => {
    if (!user) return [];

    const roleAccess = ROLE_ACCESS[user.role];

    if (roleAccess.viewAllData) {
      return userId ? interventions.filter(i => i.userId === userId) : interventions;
    }

    return interventions.filter(i => i.userId === user.id);
  };

  const calculatePrice = (provider: ServiceProvider, serviceType: ServiceType, userRole: UserRole = user?.role || 'employee') => {
    if (userRole === 'employee') {
      return 0;
    }
    return getServicePrice(provider, serviceType);
  };

  return (
    <InterventionContext.Provider value={{
      interventions,
      addIntervention,
      getUserInterventions,
      calculatePrice,
      loading
    }}>
      {children}
    </InterventionContext.Provider>
  );
};

export const useInterventions = () => {
  const context = useContext(InterventionContext);
  if (context === undefined) {
    throw new Error('useInterventions must be used within an InterventionProvider');
  }
  return context;
};