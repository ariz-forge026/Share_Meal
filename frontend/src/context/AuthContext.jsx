import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import api from '../services/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    localStorage.removeItem('sharemeal-token');
    localStorage.removeItem('sharemeal-user');
    async function restoreSession() {
      try {
        const { data: health } = await api.get('/health');
        if (!active) return;
        if (!health.database?.connected) {
          setAuthError('MongoDB is not configured. Public pages work, but accounts and donation records need a database connection.');
          return;
        }
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.user);
      } catch (error) {
        if (active && error.response?.status !== 401) {
          setAuthError('Could not restore your sign-in session. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setAuthError('');
    setUser(data.user);
  }, []);

  const signUp = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    setAuthError('');
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
      setAuthError('');
      setUser(null);
      return true;
    } catch {
      setAuthError('The server could not confirm sign-out. Your session may still be active; check your connection and try again.');
      return false;
    }
  }, []);

  const value = useMemo(() => ({ user, loading, authError, signIn, signUp, refreshUser, signOut }), [user, loading, authError, signIn, signUp, refreshUser, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
