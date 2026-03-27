// useVaults hook - Vaults data management

import { useState, useEffect, useCallback } from 'react';
import { vaultsService } from '../services';
import { useAppStore } from '../store/useAppStore';
import type { 
  VaultResponse, 
  VaultCreate, 
  VaultUpdate,
  WithdrawCheckResponse,
  YieldResponse 
} from '../types/api';
import type { Vault } from '../types';

// Convert API response to internal Vault type
function toVault(response: VaultResponse): Vault {
  return {
    id: response.id,
    user_id: response.user_id,
    name: response.name,
    icon: response.icon,
    target: response.target,
    current: response.current,
    vaultType: response.vault_type,
    vault_type: response.vault_type,
    beneficiary: response.beneficiary ?? undefined,
    locked: response.locked,
    unlockDate: response.unlock_date ?? undefined,
    unlock_date: response.unlock_date ?? undefined,
    status: response.status,
    progress: response.progress,
    on_chain_id: response.on_chain_id,
    createdAt: response.created_at,
    created_at: response.created_at,
    updatedAt: response.updated_at,
    updated_at: response.updated_at,
  };
}

export interface UseVaultsReturn {
  // State
  vaults: Vault[];
  totalSaved: number;
  totalTarget: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVaults: () => Promise<void>;
  getVault: (id: string) => Promise<Vault | null>;
  createVault: (vault: VaultCreate, withBlockchain?: boolean) => Promise<Vault | null>;
  updateVault: (id: string, updates: VaultUpdate) => Promise<Vault | null>;
  deleteVault: (id: string) => Promise<boolean>;
  deposit: (vaultId: string, amount: number, txHash?: string) => Promise<boolean>;
  withdraw: (vaultId: string, amount: number) => Promise<boolean>;
  checkWithdraw: (vaultId: string) => Promise<WithdrawCheckResponse | null>;
  getYield: (vaultId: string) => Promise<YieldResponse | null>;
  syncVault: (vaultId: string) => Promise<boolean>;
}

export function useVaults(): UseVaultsReturn {
  const { vaults, setVaults, addVault, updateVault } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all vaults
  const fetchVaults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await vaultsService.getVaults();
      const convertedVaults = response.vaults.map(toVault);
      setVaults(convertedVaults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vaults';
      setError(message);
      console.error('Fetch vaults error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setVaults]);
  
  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults();
  }, []);
  
  // Get single vault
  const getVault = useCallback(async (id: string): Promise<Vault | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const vault = await vaultsService.getVault(id);
      return toVault(vault);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get vault';
      setError(message);
      console.error('Get vault error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Create vault
  const createVaultFn = useCallback(async (
    vault: VaultCreate,
    withBlockchain: boolean = false
  ): Promise<Vault | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newVault = await vaultsService.createVault(vault, withBlockchain);
      const converted = toVault(newVault);
      addVault(converted);
      return converted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create vault';
      setError(message);
      console.error('Create vault error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addVault]);
  
  // Update vault
  const updateVaultById = useCallback(async (
    id: string,
    updates: VaultUpdate
  ): Promise<Vault | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedVault = await vaultsService.updateVault(id, updates);
      const converted = toVault(updatedVault);
      updateVault(id, converted);
      return converted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update vault';
      setError(message);
      console.error('Update vault error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateVault]);
  
  // Delete vault
  const deleteVault = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await vaultsService.deleteVault(id);
      setVaults(vaults.filter(v => v.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete vault';
      setError(message);
      console.error('Delete vault error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vaults, setVaults]);
  
  // Deposit to vault
  const deposit = useCallback(async (
    vaultId: string,
    amount: number,
    txHash?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await vaultsService.deposit(vaultId, {
        amount,
        tx_hash: txHash,
      });
      
      // Update vault with new balance
      const vault = vaults.find(v => v.id === vaultId);
      if (vault) {
        updateVault(vaultId, {
          current: response.new_balance,
          progress: response.vault_progress,
        });
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deposit';
      setError(message);
      console.error('Deposit error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vaults, updateVault]);
  
  // Withdraw from vault
  const withdraw = useCallback(async (
    vaultId: string,
    amount: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await vaultsService.withdraw(vaultId, { amount });
      
      // Update vault with new balance
      const vault = vaults.find(v => v.id === vaultId);
      if (vault) {
        updateVault(vaultId, { current: response.new_balance });
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw';
      setError(message);
      console.error('Withdraw error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vaults, updateVault]);
  
  // Check if can withdraw
  const checkWithdraw = useCallback(async (vaultId: string): Promise<WithdrawCheckResponse | null> => {
    try {
      return await vaultsService.checkWithdraw(vaultId);
    } catch (err) {
      console.error('Check withdraw error:', err);
      return null;
    }
  }, []);
  
  // Get yield
  const getYield = useCallback(async (vaultId: string): Promise<YieldResponse | null> => {
    try {
      return await vaultsService.getYield(vaultId);
    } catch (err) {
      console.error('Get yield error:', err);
      return null;
    }
  }, []);
  
  // Sync vault with blockchain
  const syncVault = useCallback(async (vaultId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await vaultsService.syncVault(vaultId);
      
      // Update vault if there were differences
      if (response.sync_status === 'updated' && response.differences) {
        await fetchVaults();
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync vault';
      setError(message);
      console.error('Sync vault error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVaults]);
  
  // Calculate totals
  const totalSaved = vaults.reduce((sum, v) => sum + v.current, 0);
  const totalTarget = vaults.reduce((sum, v) => sum + v.target, 0);
  
  return {
    vaults,
    totalSaved,
    totalTarget,
    isLoading,
    error,
    fetchVaults,
    getVault,
    createVault: createVaultFn,
    updateVault: updateVaultById,
    deleteVault,
    deposit,
    withdraw,
    checkWithdraw,
    getYield,
    syncVault,
  };
}

export default useVaults;