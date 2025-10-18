import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem('admin_auth');
    if (storedAuth) {
      try {
        const { username: storedUsername, timestamp } = JSON.parse(storedAuth);
        const hoursSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60);

        if (hoursSinceLogin < 24) {
          setIsAuthenticated(true);
          setUsername(storedUsername);
        } else {
          localStorage.removeItem('admin_auth');
        }
      } catch (e) {
        localStorage.removeItem('admin_auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data) {
        setIsAuthenticated(true);
        setUsername(username);
        localStorage.setItem('admin_auth', JSON.stringify({
          username,
          timestamp: Date.now()
        }));

        await supabase.rpc('update_admin_last_login', {
          p_username: username
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('admin_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
