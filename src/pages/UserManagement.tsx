import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Trash, Edit, Loader2, User, Users, Search, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User as UserType, UserRole } from '../types';

interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

const UserManagement: React.FC = () => {
  const { isAllowed } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'employee',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    console.log('🔄 Début du chargement des utilisateurs...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Tentative de connexion à Supabase...');
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Réponse Supabase:', { users, usersError });

      if (usersError) {
        console.error('❌ Erreur base de données:', usersError);
        throw new Error(`Erreur DB: ${usersError.message}`);
      }

      if (!users) {
        console.warn('⚠️ Aucune donnée utilisateur reçue');
        setUsers([]);
        return;
      }

      const mappedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      }));

      console.log('✅ Utilisateurs chargés avec succès:', mappedUsers.length);
      setUsers(mappedUsers);
      
    } catch (error: any) {
      console.error('💥 Erreur lors du chargement:', error);
      setError(`Erreur: ${error.message}`);
      setUsers([]); // Important : éviter les états undefined
    } finally {
      console.log('🏁 Fin du chargement - setLoading(false)');
      setLoading(false); // CRITIQUE : toujours exécuté
    }
  };

  // Test de connexion simple
  const testConnection = async () => {
    console.log('🧪 Test de connexion...');
    try {
      const { data, error } = await supabase.from('users').select('count');
      console.log('🧪 Test connection result:', { data, error });
    } catch (err) {
      console.error('🧪 Test connection error:', err);
    }
  };

  // Exécuter le test au montage du composant
  useEffect(() => {
    testConnection();
  }, []);
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('👤 Création d\'un nouvel utilisateur...');
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (signUpError) {
        console.error('❌ Erreur signup:', signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error('Échec de la création du compte');
      }

      console.log('✅ Compte auth créé, insertion en base...');

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role
        });

      if (insertError) {
        console.error('❌ Erreur insertion:', insertError);
        throw insertError;
      }

      console.log('✅ Utilisateur créé avec succès');

      setShowForm(false);
      setFormData({
        email: '',
        name: '',
        role: 'employee',
        password: '',
      });
      
      setSuccessMessage('Utilisateur créé avec succès');
      await loadUsers();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('💥 Erreur création utilisateur:', error);
      setError(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    setError(null);
    try {
      console.log('🗑️ Suppression utilisateur:', userId);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError);
        throw deleteError;
      }

      console.log('✅ Utilisateur supprimé de la base');

      await loadUsers();
      setSuccessMessage('Utilisateur supprimé avec succès');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('💥 Erreur suppression:', error);
      setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };
  
  if (!isAllowed(['admin'])) {
    return <Navigate to="/" />;
  }
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300';
      case 'auto-entrepreneur':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300';
      case 'employee':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'auto-entrepreneur':
        return 'Auto-Entrepreneur';
      case 'employee':
        return 'Employé';
      default:
        return role;
    }
  };
  
  return (
    <div className="py-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Gestion des Utilisateurs</h1>
          
          {!showForm && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter
            </Button>
          )}
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-success-50 border border-success-200 text-success-700 rounded-md flex items-center">
            <CheckCircle size={16} className="mr-2" />
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            <strong>Erreur:</strong> {error}
          </div>
        )}
        
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-medium mb-4">
              Nouvel Utilisateur
            </h2>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">Nom complet</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <label htmlFor="role" className="form-label">Rôle</label>
                <select
                  id="role"
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  required
                >
                  <option value="admin">Administrateur</option>
                  <option value="auto-entrepreneur">Auto-Entrepreneur</option>
                  <option value="employee">Employé</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <User size={16} />}
                >
                  {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="form-input pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 size={24} className="animate-spin text-primary-500" />
              <span>Chargement des utilisateurs...</span>
            </div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map(user => (
              <div key={user.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-base">{user.name}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => alert('Fonctionnalité à implémenter')}
                      aria-label="Modifier"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash size={16} className="text-error-500" />}
                      onClick={() => handleDeleteUser(user.id)}
                      aria-label="Supprimer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users size={40} className="mx-auto mb-2 opacity-20" />
            <p>Aucun utilisateur trouvé.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagement;