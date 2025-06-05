import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInterventions } from '../context/InterventionContext';
import Card from '../components/ui/Card';
import StatsFilter from '../components/stats/StatsFilter';
import Button from '../components/ui/Button';
import { Download, FileText, CheckCircle, XCircle, Percent, Calendar, Users } from 'lucide-react';
import { ServiceProvider, User, ROLE_ACCESS } from '../types';
import { PROVIDERS } from '../constants/pricing';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { generateCSV, downloadCSV, generatePDF, downloadPDF } from '../utils/export';
import { supabase } from '../lib/supabase';

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const { getUserInterventions, loading } = useInterventions();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showDateRange, setShowDateRange] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const interventions = getUserInterventions();
  const isAdmin = user?.role === 'admin';
  const canExport = user && ROLE_ACCESS[user.role].viewInvoices;
  
  useEffect(() => {
    if (isAdmin) {
      const loadUsers = async () => {
        setLoadingUsers(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('No session');

          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
            
          if (error) throw error;
          
          setUsers(data.map(user => ({
            ...user,
            createdAt: new Date(user.created_at)
          })));
        } catch (error) {
          console.error('Error loading users:', error);
        } finally {
          setLoadingUsers(false);
        }
      };
      
      loadUsers();
    }
  }, [isAdmin]);
  
  const getFilteredInterventions = () => {
    let filtered = selectedUser
      ? interventions.filter(i => i.userId === selectedUser.id)
      : interventions;
    
    if (showDateRange) {
      return filtered.filter(i => {
        const interventionDate = new Date(i.date);
        return isWithinInterval(interventionDate, {
          start: new Date(startDate),
          end: new Date(endDate)
        });
      });
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    if (period === 'day') {
      cutoffDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      return filtered.filter(i => {
        const interventionDate = new Date(i.date);
        return isWithinInterval(interventionDate, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
      });
    }
    
    return filtered.filter(i => i.date >= cutoffDate);
  };
  
  const filteredInterventions = getFilteredInterventions();
  
  const handleExportCSV = () => {
    const csv = generateCSV(filteredInterventions, selectedUser);
    const filename = `interventions_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
    setShowExportMenu(false);
  };
  
  const handleExportPDF = () => {
    const doc = generatePDF(filteredInterventions, selectedUser);
    const filename = `interventions_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPDF(doc, filename);
    setShowExportMenu(false);
  };
  
  const success = filteredInterventions.filter(i => i.status === 'success').length;
  const failure = filteredInterventions.filter(i => i.status === 'failure').length;
  const successRate = filteredInterventions.length > 0
    ? (success / filteredInterventions.length * 100).toFixed(1)
    : '0.0';
  
  const totalSuccess = interventions.filter(i => i.status === 'success').length;
  const totalFailure = interventions.filter(i => i.status === 'failure').length;
  const totalSuccessRate = interventions.length > 0
    ? (totalSuccess / interventions.length * 100).toFixed(1)
    : '0.0';
    
  const providerStats = PROVIDERS.map(provider => {
    const providerInterventions = filteredInterventions.filter(
      i => i.provider === provider.id
    );
    const count = providerInterventions.length;
    const amount = providerInterventions.reduce((sum, item) => sum + item.price, 0);
    const successRate = count > 0
      ? (providerInterventions.filter(i => i.status === 'success').length / count * 100).toFixed(1)
      : '0.0';
    
    return {
      provider,
      count,
      amount,
      successRate
    };
  });
  
  return (
    <div className="py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <StatsFilter period={period} onChange={setPeriod} />
          
          <div className="flex flex-wrap gap-2">
            {isAdmin && !loadingUsers && (
              <select
                className="form-select"
                value={selectedUser?.id || ''}
                onChange={(e) => {
                  const selected = users.find(u => u.id === e.target.value);
                  setSelectedUser(selected || null);
                }}
              >
                <option value="">Tous les utilisateurs</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar size={16} />}
              onClick={() => setShowDateRange(!showDateRange)}
              className={showDateRange ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/20' : ''}
            >
              Période personnalisée
            </Button>
            
            {canExport && (
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full md:w-auto"
                >
                  Exporter
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Download size={16} />
                      <span>Exporter en CSV</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FileText size={16} />
                      <span>Exporter en PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showDateRange && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Période actuelle</h2>
        
        {loading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center">
              <div className="mr-3 text-success-500">
                <CheckCircle size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-2xl font-bold">{success}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Succès</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 text-error-500">
                <XCircle size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-2xl font-bold">{failure}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Échecs</span>
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Percent size={16} className="mr-1.5 text-primary-500" />
                  <span className="text-sm font-medium">Taux de succès</span>
                </div>
                <span className="text-lg font-bold text-amber-500">{successRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${successRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Total</h2>
        
        {loading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center">
              <div className="mr-3 text-success-500">
                <CheckCircle size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-2xl font-bold">{totalSuccess}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Succès</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 text-error-500">
                <XCircle size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-2xl font-bold">{totalFailure}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Échecs</span>
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Percent size={16} className="mr-1.5 text-primary-500" />
                  <span className="text-sm font-medium">Taux de succès</span>
                </div>
                <span className="text-lg font-bold text-amber-500">{totalSuccessRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${totalSuccessRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Par opérateur</h2>
        
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : providerStats.some(s => s.count > 0) ? (
          <div className="space-y-4">
            {providerStats
              .filter(s => s.count > 0)
              .map(stat => (
                <div key={stat.provider.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{stat.provider.label}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.count} intervention{stat.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Montant:</span> {stat.amount}€
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Taux de succès:</span> {stat.successRate}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Aucune donnée disponible pour la période sélectionnée</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Statistics;