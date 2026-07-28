import { createContext, useContext, useState, useEffect } from 'react';
import { api, saveToken, clearToken, hasToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasToken()) { setLoading(false); return; }
    api.auth.me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.auth.login({ email, password });
    saveToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const data = await api.auth.register({ name, email, password });
    saveToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
