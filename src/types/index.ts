export type UserRole = 'admin' | 'auto-entrepreneur' | 'employee';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
};

export type ServiceProvider = 'FREE' | 'SFR' | 'ORANGE' | 'ORANGE_PRO';

export type ServiceType = 
  | 'SAV' 
  | 'PLP' 
  | 'AERIAL' 
  | 'FACADE' 
  | 'BUILDING' 
  | 'UNDERGROUND' 
  | 'PSER1' 
  | 'PRE_VISIT';

export type ServicePricing = {
  [key in ServiceProvider]: {
    [key in ServiceType]?: number;
  };
};

export type Intervention = {
  id: string;
  userId: string;
  date: Date;
  time: string;
  ndNumber: string;
  provider: ServiceProvider;
  serviceType: ServiceType;
  price: number;
  status: 'success' | 'failure';
  createdAt: Date;
};

export type Statistics = {
  period: 'day' | 'week' | 'month' | 'all';
  success: number;
  failure: number;
  successRate: number;
  totalAmount: number;
  averageDuration: number;
  byProvider: {
    provider: ServiceProvider;
    count: number;
    amount: number;
  }[];
};

export type ThemeMode = 'light' | 'dark' | 'system';

export interface RoleAccess {
  viewAllData: boolean;
  viewInvoices: boolean;
  manageUsers: boolean;
}

export const ROLE_ACCESS: Record<UserRole, RoleAccess> = {
  admin: {
    viewAllData: true,
    viewInvoices: true,
    manageUsers: true
  },
  'auto-entrepreneur': {
    viewAllData: false,
    viewInvoices: true,
    manageUsers: false
  },
  employee: {
    viewAllData: false,
    viewInvoices: false,
    manageUsers: false
  }
};