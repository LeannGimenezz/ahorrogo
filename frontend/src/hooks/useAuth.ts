// useAuth hook - Authentication state management with demo mode

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { UserResponse } from '../types/api';
import type { User } from '../types';

// Mock user for demo mode
const MOCK_USER_RESPONSE: UserResponse = {
  id: 'demo-user-1',
  address: '0xF5fae80a7165E8e998814aBc0F81027A33f94134',
  alias: 'demo.ahorrogo',
  xp: 350,
  level: 3,
  streak: 5,
  last_deposit_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

// Convert API response to internal User type
function toUser(response: UserResponse): User {
  return {
    id: response.id,
    address: response.address,
    alias: response.alias,
    xp: response.xp,
    level: response.level,
    streak: response.streak,
    lastDepositAt: response.last_deposit_at ?? undefined,
    last_deposit_at: response.last_deposit_at ?? undefined,
    createdAt: response.created_at,
    created_at: response.created_at,
  };
}

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  
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
  const { user, setUser } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-login with demo mode
  useEffect(() => {
    if (!user) {
      // Set mock user on first load
      setUser(toUser(MOCK_USER_RESPONSE));
    }
  }, [user, setUser]);
  
  // Login (demo mode - always succeeds)
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(toUser(MOCK_USER_RESPONSE));
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, navigate]);
  
  // Logout
  const logout = useCallback(() => {
    setUser(null);
    navigate('/');
  }, [setUser, navigate]);
  
  // Refresh user data (demo mode - returns mock)
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(toUser(MOCK_USER_RESPONSE));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(message);
      console.error('Refresh user error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);
  
  // Get balance (demo mode - returns mock)
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
  
  // Set private key (demo mode - no-op)
  const setPrivateKey = useCallback((_key: string) => {
    console.log('Demo mode: private key ignored');
  }, []);
  
  // Clear private key (demo mode - no-op)
  const clearPrivateKey = useCallback(() => {
    console.log('Demo mode: private key cleared');
  }, []);
  
  return {
    isAuthenticated: true, // Always authenticated in demo mode
    isLoading,
    error,
    user: user || toUser(MOCK_USER_RESPONSE),
    login,
    logout,
    refreshUser,
    getBalance,
    setPrivateKey,
    clearPrivateKey,
  };
}

export default useAuth;