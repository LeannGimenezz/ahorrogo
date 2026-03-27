// useAuth hook - Authentication state management with XOConnect + demo fallback

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { authService, isBeexoAvailable, userService } from '../services/auth';
import type { User } from '../types';

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isBeexo: boolean;
  
  // Actions
  login: () => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getBalance: () => Promise<{ total: number; available: number; locked: number; yield_this_month: number; yield_percentage: number } | null>;
  setPrivateKey: (key: string) => void;
  clearPrivateKey: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beexoAvailable = isBeexoAvailable();
  
  // Login — real XOConnect flow
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, navigate]);
  
  // Demo login (without wallet — uses backend verify with mock sig)
  const loginDemo = useCallback(() => {
    setUser({
      id: 'demo-user-1',
      address: '0xF5fae80a7165E8e998814aBc0F81027A33f94134',
      alias: 'demo.ahorrogo',
      xp: 0,
      level: 1,
      streak: 0,
      createdAt: new Date().toISOString(),
    });
    navigate('/');
  }, [setUser, navigate]);
  
  // Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    useAppStore.getState().reset();
    navigate('/');
  }, [setUser, navigate]);
  
  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUser = await userService.getCurrentUser();
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(message);
      console.error('Refresh user error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);
  
  // Get balance from backend
  const getBalance = useCallback(async () => {
    try {
      const balance = await userService.getBalance();
      return balance;
    } catch (err) {
      console.error('Get balance error:', err);
      // Fallback: compute from store vaults
      const vaults = useAppStore.getState().vaults;
      const total = vaults.reduce((sum, v) => sum + v.current, 0);
      return {
        total,
        available: total,
        locked: 0,
        yield_this_month: 0,
        yield_percentage: 0.052,
      };
    }
  }, []);
  
  // Private key management
  const setPrivateKey = useCallback((key: string) => {
    authService.setPrivateKey(key);
  }, []);
  
  const clearPrivateKey = useCallback(() => {
    authService.clearPrivateKey();
  }, []);
  
  return {
    isAuthenticated: !!user,
    isLoading,
    error,
    user,
    isBeexo: beexoAvailable,
    login,
    loginDemo,
    logout,
    refreshUser,
    getBalance,
    setPrivateKey,
    clearPrivateKey,
  };
}

export default useAuth;