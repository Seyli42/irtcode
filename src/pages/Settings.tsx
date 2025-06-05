import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, Users, Sun, Moon, Computer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const { user, logout, isAllowed } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to login page as the user state has been cleared
      navigate('/login');
    }
  };
  
  return (
    <div className="py-6">
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Sécurité</h2>
        <Button
          variant="primary"
          icon={<Lock size={18} />}
          onClick={() => alert('Fonctionnalité à implémenter')}
          fullWidth
          className="mb-2"
        >
          Changer le mot de passe
        </Button>
        
        {isAllowed(['admin']) && (
          <Button
            variant="secondary"
            icon={<Users size={18} />}
            onClick={() => navigate('/users')}
            fullWidth
          >
            Gérer les utilisateurs
          </Button>
        )}
      </Card>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Apparence</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sun size={20} className="text-amber-500 mr-2" />
            <span>Mode sombre</span>
          </div>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative inline-flex items-center h-6 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-gray-200 dark:bg-primary-600"
            role="switch"
            aria-checked={isDark}
          >
            <span className="sr-only">Activer le mode sombre</span>
            <motion.span
              layout
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30
              }}
              className={`${
                isDark ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
              } inline-block w-4 h-4 transform rounded-full transition-transform`}
            />
          </button>
        </div>
        <div className="flex flex-col space-y-3">
          <Button
            variant="secondary"
            className={theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
            onClick={() => setTheme('light')}
          >
            <Sun size={18} className="mr-2 text-amber-500" /> Mode clair
          </Button>
          <Button
            variant="secondary"
            className={theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
            onClick={() => setTheme('dark')}
          >
            <Moon size={18} className="mr-2 text-indigo-400" /> Mode sombre
          </Button>
          <Button
            variant="secondary"
            className={theme === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
            onClick={() => setTheme('system')}
          >
            <Computer size={18} className="mr-2 text-gray-500 dark:text-gray-400" /> Système
          </Button>
        </div>
      </Card>
      
      <Card className="mb-6">
        <Button
          variant="error"
          icon={<LogOut size={18} />}
          onClick={handleLogout}
          fullWidth
        >
          Se déconnecter
        </Button>
      </Card>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">À propos</h2>
        <p className="text-lg font-medium mb-1">IRT</p>
        <p className="text-gray-600 dark:text-gray-400 mb-1">5 rue fenelon</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">33000 BORDEAUX</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">© 2025 IRT</p>
      </Card>
    </div>
  );
};

export default Settings;