import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInterventions } from '../context/InterventionContext';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { ServiceProvider, ROLE_ACCESS } from '../types';
import { PROVIDERS } from '../constants/pricing';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { getUserInterventions, loading } = useInterventions();
  const navigate = useNavigate();

  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInterventions, setFilteredInterventions] = useState(getUserInterventions());

  useEffect(() => {
    const interventions = getUserInterventions();
    setFilteredInterventions(
      interventions.filter(
        (intervention) =>
          (selectedProvider === 'all' || intervention.provider === selectedProvider) &&
          (searchQuery === '' || intervention.ndNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [getUserInterventions, selectedProvider, searchQuery]);

  const totalAmount = filteredInterventions.reduce((sum, item) => sum + item.price, 0);
  const avgDuration = "0min";
  const canViewBilling = user && ROLE_ACCESS[user.role].viewInvoices;

  return (
    <div className="py-6">
      {user && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={<Clock size={24} />}
              value={avgDuration}
              label="Durée moyenne"
              className="col-span-1"
            />
            {canViewBilling && (
              <StatCard
                icon={<TrendingUp size={24} />}
                value={`${totalAmount}€`}
                label="À facturer"
                trend="up"
                className="col-span-1"
              />
            )}
          </div>

          {canViewBilling && (
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Performance par Opérateur</h2>
              {loading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PROVIDERS.map(provider => {
                    const providerInterventions = filteredInterventions.filter(i => i.provider === provider.id);
                    const count = providerInterventions.length;
                    const amount = providerInterventions.reduce((sum, item) => sum + item.price, 0);
                    
                    return (
                      <div 
                        key={provider.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center"
                      >
                        <div className="text-sm font-medium mb-1">{provider.label}</div>
                        <div className="text-lg font-semibold">{amount}€</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{count} interventions</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Activité Récente</h2>
            </div>

            <div className="mb-4 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="form-input pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <select
                className="form-select"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="all">Tous les opérateurs</option>
                {PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredInterventions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredInterventions
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((intervention) => (
                    <div
                      key={intervention.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">ND: {intervention.ndNumber}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {format(intervention.date, 'dd/MM/yyyy', { locale: fr })} · {intervention.time}
                          </div>
                        </div>
                        {canViewBilling && (
                          <div className="text-right">
                            <div className="font-semibold">
                              {intervention.price}€
                            </div>
                            <div className={`text-sm ${
                              intervention.status === 'success' 
                                ? 'text-success-500' 
                                : 'text-error-500'
                            }`}>
                              {intervention.status === 'success' ? 'Succès' : 'Échec'}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs py-0.5 px-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {PROVIDERS.find(p => p.id === intervention.provider)?.label}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Filter size={40} className="mx-auto mb-2 opacity-20" />
                <p>Aucune entrée trouvée. Commencez par ajouter une intervention.</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => navigate('/new')}
                >
                  Ajouter une intervention
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Home;