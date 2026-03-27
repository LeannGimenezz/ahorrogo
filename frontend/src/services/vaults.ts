// Vaults service - All vault-related API calls

import api from './api';
import type { 
  VaultsListResponse, 
  VaultResponse, 
  VaultWithActivities,
  VaultCreate,
  VaultUpdate,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  WithdrawCheckResponse,
  YieldResponse
} from '../types/api';

export const vaultsService = {
  // Get all vaults for current user
  async getVaults(): Promise<VaultsListResponse> {
    return api.get<VaultsListResponse>('/vaults');
  },
  
  // Get single vault by ID
  async getVault(vaultId: string): Promise<VaultWithActivities> {
    return api.get<VaultWithActivities>(`/vaults/${vaultId}`);
  },
  
  // Create new vault
  async createVault(vault: VaultCreate, includeBlockchain: boolean = false): Promise<VaultResponse> {
    return api.post<VaultResponse>('/vaults', vault, includeBlockchain);
  },
  
  // Update vault
  async updateVault(vaultId: string, updates: VaultUpdate): Promise<VaultResponse> {
    return api.put<VaultResponse>(`/vaults/${vaultId}`, updates);
  },
  
  // Delete vault
  async deleteVault(vaultId: string): Promise<void> {
    return api.delete(`/vaults/${vaultId}`);
  },
  
  // Deposit to vault
  async deposit(vaultId: string, deposit: DepositRequest): Promise<DepositResponse> {
    return api.post<DepositResponse>(`/vaults/${vaultId}/deposit`, deposit);
  },
  
  // Deposit on-chain (requires private key)
  async depositOnchain(vaultId: string, deposit: DepositRequest): Promise<DepositResponse> {
    return api.post<DepositResponse>(`/vaults/${vaultId}/deposit-onchain`, deposit, true);
  },
  
  // Check if can withdraw
  async checkWithdraw(vaultId: string): Promise<WithdrawCheckResponse> {
    return api.get<WithdrawCheckResponse>(`/vaults/${vaultId}/withdraw/check`);
  },
  
  // Withdraw from vault
  async withdraw(vaultId: string, withdraw: WithdrawRequest): Promise<WithdrawResponse> {
    return api.post<WithdrawResponse>(`/vaults/${vaultId}/withdraw`, withdraw, true);
  },
  
  // Get yield for vault
  async getYield(vaultId: string): Promise<YieldResponse> {
    return api.get<YieldResponse>(`/vaults/${vaultId}/yield`);
  },
  
  // Sync vault with blockchain
  async syncVault(vaultId: string): Promise<{
    db_vault: VaultResponse;
    on_chain_vault: unknown | null;
    sync_status: string;
    differences: Record<string, unknown> | null;
  }> {
    return api.post(`/vaults/${vaultId}/sync`);
  },
};

export default vaultsService;