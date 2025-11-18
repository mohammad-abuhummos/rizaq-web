import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getAuthToken, getAuthUser, clearAuth } from '~/lib/storage/auth-storage';
import { login as loginService } from '~/lib/services/auth';

interface AuthUser {
  userId?: number | string;
  id?: number | string;
  fullName?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const authUser = await getAuthUser<AuthUser>();
      
      if (token && authUser) {
        setIsAuthenticated(true);
        setUser(authUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (e.g., login/logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_user') {
        checkAuth();
      }
    };

    // Listen for custom auth events (same tab)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [checkAuth]);

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    try {
      const response = await loginService({ emailOrPhone, password });
      // Refresh auth state after login
      await checkAuth();
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('auth-change'));
      
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  }, [navigate]);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };
}

