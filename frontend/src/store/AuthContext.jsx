import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'codetrail_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const requestId = useRef(0);

  useEffect(() => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : '';
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);
    let cancelled = false;

    api
      .get('/auth/me')
      .then((res) => {
        if (!cancelled && currentRequestId === requestId.current) {
          setUser(res.data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled && currentRequestId === requestId.current) {
          localStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setLoading(false);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Ignore network errors on logout.
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout, setUser }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);