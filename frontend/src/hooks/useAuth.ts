// useAuth hook - Authentication state management with Beexo + demo fallback

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { authService, isBeexoAvailable } from '../services/auth';
import type { User } from '../types';

// Demo user for fallback when Beexo is not available
const DEMO_USER: User = {
  id: 'demo-user-1',
  address: '0xF5fae80a7165E8e998814aBc0F81027A33f94134',
  alias: 'demo.ahorrogo',
  xp: 350,
  level: 3,
  streak: 5,
  lastDepositAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isBeexo: boolean;
  
  // Actions
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getBalance: () => Promise<{ total: number; available: number; locked: number; yield_this_month: number; yield_percentage: number } | null>;
  setPrivateKey: (key: string) => void;
  clearPrivateKey: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { user, setUser, initMockData } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beexoAvailable = isBeexoAvailable();
  
  // Auto-login: if Beexo is available, prompt connection. Otherwise, demo mode.
  useEffect(() => {
    if (!user) {
      if (!beexoAvailable) {
        // No Beexo → auto-login with demo user
        setUser(DEMO_USER);
        initMockData();
      }
    }
  }, [user, setUser, beexoAvailable, initMockData]);
  
  // Login — tries Beexo first, falls back to demo
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (beexoAvailable) {
        // Real Beexo flow: connect → sign → verify → JWT
        const { user: apiUser } = await authService.login();
        setUser({
          id: apiUser.id,
          address: apiUser.address,
          alias: apiUser.alias,
          xp: apiUser.xp,
          level: apiUser.level,
          streak: apiUser.streak,
          lastDepositAt: apiUser.last_deposit_at ?? undefined,
          createdAt: apiUser.created_at,
        });
      } else {
        // Demo fallback
        await new Promise(resolve => setTimeout(resolve, 400));
        setUser(DEMO_USER);
        initMockData();
      }
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, navigate, beexoAvailable, initMockData]);
  
  // Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    navigate('/');
  }, [setUser, navigate]);
  
  // Refresh user data
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (beexoAvailable && authService.isAuthenticated()) {
        // TODO: call userService.getCurrentUser() when backend is live
      }
      // For now, keep current user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [beexoAvailable]);
  
  // Get balance (demo returns mock, real calls backend)
  const getBalance = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        total: 12450.00,
        available: 8500.00,
        locked: 3950.00,
        yield_this_month: 245.50,
        yield_percentage: 0.052,
      };
    } catch (err) {
      console.error('Get balance error:', err);
      return null;
    }
  }, []);
  
  // Private key management
  const setPrivateKey = useCallback((key: string) => {
    if (beexoAvailable) {
      authService.setPrivateKey(key);
    }
  }, [beexoAvailable]);
  
  const clearPrivateKey = useCallback(() => {
    authService.clearPrivateKey();
  }, []);
  
  return {
    isAuthenticated: !!user,
    isLoading,
    error,
    user: user || DEMO_USER,
    isBeexo: beexoAvailable,
    login,
    logout,
    refreshUser,
    getBalance,
    setPrivateKey,
    clearPrivateKey,
  };
}

export default useAuth;