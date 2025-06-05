import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, BarChart3, Settings } from 'lucide-react';
import Header from './Header';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return <div className="container mx-auto px-4">{children}</div>;
  }

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Accueil' },
    { path: '/new', icon: <PlusCircle size={24} />, label: 'Ajouter' },
    { path: '/stats', icon: <BarChart3 size={24} />, label: 'Stats' },
    { path: '/settings', icon: <Settings size={24} />, label: 'Réglages' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={getPageTitle(location.pathname)} />
      
      <main className="flex-1 container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-4 h-16">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center transition-colors h-full
                  ${location.pathname === item.path
                    ? 'text-primary-500 bg-primary-50/50 dark:bg-gray-700/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400'
                  }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

function getPageTitle(path: string): string {
  switch (path) {
    case '/':
      return 'Tableau de bord';
    case '/new':
      return 'Nouvelle entrée';
    case '/stats':
      return 'Statistiques';
    case '/settings':
      return 'Paramètres';
    case '/login':
      return 'Connexion';
    case '/users':
      return 'Gestion Utilisateurs';
    default:
      return 'IRT';
  }
}

export default Layout;