import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const data = response.data;
    if (data.success) {
      const { token: newToken, user: userData } = data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: data.error || 'Error al iniciar sesión' };
  };

  const register = async (username, email, password) => {
    const response = await api.post('/api/auth/register', { username, email, password });
    const data = response.data;
    if (data.success) {
      const { token: newToken, user: userData } = data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: data.error || 'Error al registrarse' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUserSaldo = useCallback((newSaldo) => {
    setUser((prev) => prev ? { ...prev, saldo: newSaldo } : prev);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserSaldo,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
