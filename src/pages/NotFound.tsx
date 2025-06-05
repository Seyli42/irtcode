import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-6">
          Page non trouvée
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button 
          icon={<Home size={20} />}
          onClick={() => navigate('/')}
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;