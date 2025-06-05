import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Hash, Grid, Tag, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InputField from '../components/form/InputField';
import SelectField from '../components/form/SelectField';
import { useInterventions } from '../context/InterventionContext';
import { useAuth } from '../context/AuthContext';
import { ServiceProvider, ServiceType, ROLE_ACCESS } from '../types';
import { PROVIDERS, SERVICE_TYPES, getAvailableServices } from '../constants/pricing';
import { motion, AnimatePresence } from 'framer-motion';

const NewIntervention: React.FC = () => {
  const navigate = useNavigate();
  const { addIntervention, calculatePrice } = useInterventions();
  const { user } = useAuth();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [ndNumber, setNdNumber] = useState('');
  const [provider, setProvider] = useState<ServiceProvider | ''>('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [status, setStatus] = useState<'success' | 'failure'>('success');
  const [price, setPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const canViewPrice = user && ROLE_ACCESS[user.role].viewInvoices;
  
  useEffect(() => {
    setServiceType('');
    if (provider && serviceType) {
      setPrice(calculatePrice(provider as ServiceProvider, serviceType as ServiceType));
    } else {
      setPrice(0);
    }
  }, [provider, calculatePrice]);
  
  useEffect(() => {
    if (provider && serviceType) {
      setPrice(calculatePrice(provider as ServiceProvider, serviceType as ServiceType));
    } else {
      setPrice(0);
    }
  }, [serviceType, provider, calculatePrice]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!date) newErrors.date = 'La date est requise';
    if (!time) newErrors.time = 'L\'heure est requise';
    if (!ndNumber) newErrors.ndNumber = 'Le numéro ND est requis';
    if (!provider) newErrors.provider = 'L\'opérateur est requis';
    if (!serviceType) newErrors.serviceType = 'Le type de service est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      addIntervention({
        date: new Date(date),
        time,
        ndNumber,
        provider: provider as ServiceProvider,
        serviceType: serviceType as ServiceType,
        price,
        status,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Failed to add intervention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const availableServiceTypes = provider 
    ? getAvailableServices(provider as ServiceProvider).map(id => {
        const serviceType = SERVICE_TYPES.find(s => s.id === id);
        return serviceType 
          ? { value: serviceType.id, label: serviceType.label }
          : { value: '', label: '' };
      })
    : [];
  
  return (
    <div className="py-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setStatus('failure')}
                className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 flex-1 text-center ${
                  status === 'failure'
                    ? 'text-white z-10'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {status === 'failure' && (
                  <motion.div
                    layoutId="statusBg"
                    className="absolute inset-0 bg-error-500 rounded-md"
                    initial={false}
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <XCircle size={16} className="mr-1.5" />
                  Échec
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setStatus('success')}
                className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 flex-1 text-center ${
                  status === 'success'
                    ? 'text-white z-10'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {status === 'success' && (
                  <motion.div
                    layoutId="statusBg"
                    className="absolute inset-0 bg-success-500 rounded-md"
                    initial={false}
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <CheckCircle size={16} className="mr-1.5" />
                  Succès
                </span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              icon={<Calendar size={18} />}
              error={errors.date}
              required
            />
            
            <InputField
              label="Heure"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              icon={<Clock size={18} />}
              error={errors.time}
              required
            />
          </div>
          
          <InputField
            label="ND"
            type="text"
            placeholder="Ex: 14801445"
            value={ndNumber}
            onChange={(e) => setNdNumber(e.target.value)}
            icon={<Hash size={18} />}
            error={errors.ndNumber}
            required
          />
          
          <SelectField
            label="Opérateur"
            value={provider}
            onChange={(e) => setProvider(e.target.value as ServiceProvider)}
            icon={<Grid size={18} />}
            options={PROVIDERS.map(p => ({ value: p.id, label: p.label }))}
            error={errors.provider}
            required
          />
          
          <SelectField
            label="Code Article"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            icon={<Tag size={18} />}
            options={availableServiceTypes}
            disabled={!provider}
            error={errors.serviceType}
            required
          />
          
          <AnimatePresence>
            {canViewPrice && provider && serviceType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 mt-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tarif</div>
                  <div className="text-2xl font-bold">{price}€</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'intervention'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default NewIntervention;