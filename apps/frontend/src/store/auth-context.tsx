import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, logout as logoutRequest } from '../services/auth-service';
import { tokenStore } from '../services/api-client';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthenticatedUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('cityworkshop.user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [isLoading, setIsLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        sessionStorage.setItem('cityworkshop.user', JSON.stringify(currentUser));
      })
      .catch(() => {
        tokenStore.clear();
        sessionStorage.removeItem('cityworkshop.user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user && tokenStore.get()), setAuthenticatedUser: setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
