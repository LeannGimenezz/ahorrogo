// useBalance hook - User balance management

import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services';
import { useAppStore } from '../store/useAppStore';
import type { UserBalanceResponse } from '../types/api';

export interface UseBalanceReturn {
  // State
  balance: UserBalanceResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  total: number;
  available: number;
  locked: number;
  yieldThisMonth: number;
  yieldPercentage: number;
  
  // Actions
  refresh: () => Promise<void>;
}

export function useBalance(): UseBalanceReturn {
  const { penguin } = useAppStore();
  
  const [balance, setBalance] = useState<UserBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch balance on mount
  useEffect(() => {
    refresh();
  }, []);
  
  // Refresh balance
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await userService.getBalance();
      setBalance(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      console.error('Fetch balance error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Computed values with fallback
  const total = balance?.total ?? penguin.totalSaved ?? 0;
  const available = balance?.available ?? 0;
  const locked = balance?.locked ?? 0;
  const yieldThisMonth = balance?.yield_this_month ?? penguin.yieldEarned ?? 0;
  const yieldPercentage = balance?.yield_percentage ?? 0.052; // Default 5.2%
  
  return {
    balance,
    isLoading,
    error,
    total,
    available,
    locked,
    yieldThisMonth,
    yieldPercentage,
    refresh,
  };
}

export default useBalance;