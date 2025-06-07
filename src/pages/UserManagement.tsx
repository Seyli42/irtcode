import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Trash, Edit, Loader2, User, Users, Search, CheckCircle, Save, X } from 'lucide-react';
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
  const { isAllowed, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Erreur base de données:', usersError);
        throw new Error('Échec du chargement des utilisateurs');
      }

      if (!users) {
        throw new Error('Aucune donnée utilisateur reçue');
      }

      const mappedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      }));

      console.log('Utilisateurs chargés:', mappedUsers);
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Échec du chargement des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string, excludeUserId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase());
      
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking email:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        throw new Error('Cette adresse email est déjà utilisée. Veuillez choisir une autre adresse.');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Cette adresse email est déjà utilisée. Veuillez choisir une autre adresse.');
        }
        throw signUpError;
      }
      
      if (!authData.user) throw new Error('Échec de la création du compte');

      // Remove the manual insert - AuthContext will handle user synchronization automatically
      
      setShowForm(false);
      setFormData({
        email: '',
        name: '',
        role: 'employee',
        password: '',
      });
      
      setSuccessMessage('Utilisateur créé avec succès');
      
      // Wait a moment for AuthContext to sync the user, then reload
      setTimeout(async () => {
        await loadUsers();
      }, 1000);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Échec de l\'ajout de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Check if email already exists (excluding current user)
      if (formData.email !== editingUser.email) {
        const emailExists = await checkEmailExists(formData.email, editingUser.id);
        if (emailExists) {
          throw new Error('Cette adresse email est déjà utilisée. Veuillez choisir une autre adresse.');
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: formData.email.trim().toLowerCase(),
          name: formData.name,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Cette adresse email est déjà utilisée. Veuillez choisir une autre adresse.');
        }
        throw updateError;
      }

      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        role: 'employee',
        password: '',
      });
      
      setSuccessMessage('Utilisateur modifié avec succès');
      await loadUsers();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Échec de la modification de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la modification de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) throw deleteError;

      // Note: User will be removed from the application's user list.
      // Complete deletion from Supabase Auth would require a backend function with service role privileges.

      await loadUsers();
      setSuccessMessage('Utilisateur supprimé avec succès');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Échec de la suppression de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const startEditUser = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '', // Don't pre-fill password
    });
    setShowForm(false); // Close add form if open
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      role: 'employee',
      password: '',
    });
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

  const canEditUser = (user: UserType) => {
    return currentUser?.role === 'admin' || currentUser?.id === user.id;
  };
  
  return (
    <div className="py-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Gestion des Utilisateurs</h1>
          
          {!showForm && !editingUser && (
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
            {error}
          </div>
        )}
        
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Nouvel Utilisateur</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={() => setShowForm(false)}
              />
            </div>
            
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

        {editingUser && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Modifier l'utilisateur</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={cancelEdit}
              />
            </div>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="form-label">Nom complet</label>
                <input
                  type="text"
                  id="edit-name"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-email" className="form-label">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              {currentUser?.role === 'admin' && (
                <div>
                  <label htmlFor="edit-role" className="form-label">Rôle</label>
                  <select
                    id="edit-role"
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
              )}
              
              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                >
                  {isSubmitting ? 'Modification...' : 'Sauvegarder'}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
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
                    {canEditUser(user) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => startEditUser(user)}
                        aria-label="Modifier"
                      />
                    )}
                    
                    {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash size={16} className="text-error-500" />}
                        onClick={() => handleDeleteUser(user.id)}
                        aria-label="Supprimer"
                      />
                    )}
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