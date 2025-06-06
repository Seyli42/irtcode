import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import InputField from '../components/form/InputField';
import Card from '../components/ui/Card';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Veuillez remplir tous les champs.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🔐 Starting login process...');
      await login(trimmedEmail, trimmedPassword);
      console.log('✅ Login successful, navigating to home...');
      
      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'Une erreur est survenue lors de la connexion.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img 
            src="/images/logo.svg" 
            alt="IRT Logo" 
            className="h-20 w-auto mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            Bienvenue sur IRT
          </h1>
          <p className="text-gray-600">
            Application de gestion des interventions
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Connexion</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              required
              icon={<Mail size={18} />}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <InputField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={<Lock size={18} />}
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                icon={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              >
                {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;