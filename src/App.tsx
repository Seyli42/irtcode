import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NewIntervention from './pages/NewIntervention';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    document.title = 'IRT - Gestion des Interventions';
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewIntervention />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Layout>
                <Statistics />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;