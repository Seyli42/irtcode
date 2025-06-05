import React, { createContext, useContext, useState, useEffect } from 'react';
import { Intervention, ServiceProvider, ServiceType, User, ROLE_ACCESS, UserRole } from '../types';
import { getServicePrice } from '../constants/pricing';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

const MOCK_USERS = [
  { id: '1', name: 'Admin User', role: 'admin', email: 'admin@irt.fr', createdAt: new Date() },
  { id: '2', name: 'Entrepreneur User', role: 'auto-entrepreneur', email: 'entrepreneur@irt.fr', createdAt: new Date() },
  { id: '3', name: 'Employee User', role: 'employee', email: 'employee@irt.fr', createdAt: new Date() }
] as User[];

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
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockInterventions = generateMockInterventions(MOCK_USERS);
        setInterventions(mockInterventions);
      } catch (error) {
        console.error('Failed to load interventions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const addIntervention = (intervention: Omit<Intervention, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    const newIntervention: Intervention = {
      ...intervention,
      id: uuidv4(),
      userId: user.id,
      createdAt: new Date(),
    };
    
    setInterventions([...interventions, newIntervention]);
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

const generateMockInterventions = (users: User[]): Intervention[] => {
  const providers: ServiceProvider[] = ['FREE', 'SFR', 'ORANGE', 'ORANGE_PRO'];
  const serviceTypes: ServiceType[] = ['SAV', 'PLP', 'AERIAL', 'FACADE', 'BUILDING', 'UNDERGROUND'];
  const statuses: ('success' | 'failure')[] = ['success', 'failure'];
  
  return Array.from({ length: 20 }, (_, i) => {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const price = user.role === 'employee' ? 0 : getServicePrice(provider, serviceType);
    
    return {
      id: uuidv4(),
      userId: user.id,
      date,
      time: `${Math.floor(Math.random() * 12 + 8)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      ndNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
      provider,
      serviceType,
      price,
      status,
      createdAt: new Date(),
    };
  });
};

export const useInterventions = () => {
  const context = useContext(InterventionContext);
  if (context === undefined) {
    throw new Error('useInterventions must be used within an InterventionProvider');
  }
  return context;
};