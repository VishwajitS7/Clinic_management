import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('clinic_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and hydrate user profile on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('clinic_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.data) {
          setUser(response.data.user);
          setDoctor(response.data.doctor || null);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        localStorage.removeItem('clinic_token');
        setUser(null);
        setDoctor(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.data) {
        const { token: receivedToken, user: receivedUser, doctor: receivedDoctor } = response.data;
        localStorage.setItem('clinic_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        setDoctor(receivedDoctor || null);
        return { success: true, user: receivedUser };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.message || 'Invalid email or password';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('clinic_token');
      setUser(null);
      setDoctor(null);
      setToken(null);
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctor,
        token,
        isAuthenticated: !!user,
        loading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
