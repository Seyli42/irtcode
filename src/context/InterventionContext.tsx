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

  console.log('🏗️ InterventionProvider initialized');

  useEffect(() => {
    const loadInterventions = async () => {
      console.log('📊 Loading interventions...');
      
      if (!user) {
        console.log('ℹ️ No user, skipping intervention load');
        setInterventions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Intervention loading timeout');
          setLoading(false);
        }, 8000);

        const { data: interventionsData, error } = await supabase
          .from('interventions')
          .select('*')
          .order('created_at', { ascending: false });

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Error loading interventions:', error);
          throw error;
        }

        const loadedInterventions = interventionsData?.map(intervention => ({
          id: intervention.id,
          userId: intervention.user_id,
          date: new Date(intervention.date),
          time: intervention.time,
          ndNumber: intervention.nd_number,
          provider: intervention.provider as ServiceProvider,
          serviceType: intervention.service_type as ServiceType,
          price: Number(intervention.price),
          status: intervention.status as 'success' | 'failure',
          createdAt: new Date(intervention.created_at)
        })) || [];

        console.log('✅ Loaded', loadedInterventions.length, 'interventions');
        setInterventions(loadedInterventions);
      } catch (error) {
        console.error('❌ Failed to load interventions:', error);
        setInterventions([]);
      } finally {
        setLoading(false);
      }
    };

    loadInterventions();
  }, [user]);

  const addIntervention = async (intervention: Omit<Intervention, 'id' | 'userId' | 'createdAt'>) => {
    console.log('➕ Adding intervention:', intervention.ndNumber);
    
    if (!user) {
      console.error('❌ Cannot add intervention: no user');
      return;
    }

    try {
      const newIntervention = {
        user_id: user.id,
        date: intervention.date.toISOString().split('T')[0],
        time: intervention.time,
        nd_number: intervention.ndNumber,
        provider: intervention.provider,
        service_type: intervention.serviceType,
        price: intervention.price,
        status: intervention.status
      };

      const { data, error } = await supabase
        .from('interventions')
        .insert(newIntervention)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to add intervention:', error);
        throw error;
      }

      const createdIntervention: Intervention = {
        id: data.id,
        userId: data.user_id,
        date: new Date(data.date),
        time: data.time,
        ndNumber: data.nd_number,
        provider: data.provider as ServiceProvider,
        serviceType: data.service_type as ServiceType,
        price: Number(data.price),
        status: data.status as 'success' | 'failure',
        createdAt: new Date(data.created_at)
      };

      setInterventions(prev => [createdIntervention, ...prev]);
      console.log('✅ Intervention added successfully');
    } catch (error) {
      console.error('❌ Error adding intervention:', error);
      throw error;
    }
  };

  const getUserInterventions = (userId?: string) => {
    if (!user) {
      console.log('ℹ️ No user for getUserInterventions');
      return [];
    }

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

  console.log('🎯 InterventionProvider render - Loading:', loading, 'Interventions:', interventions.length);

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