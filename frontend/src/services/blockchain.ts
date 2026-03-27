// Blockchain service - RSK and Topykus integration

import api from './api';
import type { NetworkInfoResponse, MarketInfoResponse, VaultTxResponse } from '../types/api';

// blockchain service
export const blockchainService = {
  // Network info
  async getNetworkInfo(): Promise<NetworkInfoResponse> {
    return api.get<NetworkInfoResponse>('/blockchain/network');
  },
  
  // Get all Topykus markets
  async getMarkets(): Promise<MarketInfoResponse[]> {
    return api.get<MarketInfoResponse[]>('/blockchain/markets');
  },
  
  // Get specific market info
  async getMarket(market: 'krbtc' | 'kdoc' | 'krdoc'): Promise<MarketInfoResponse> {
    return api.get<MarketInfoResponse>(`/blockchain/markets/${market}`);
  },
  
  // Get vault counter (total vaults on-chain)
  async getVaultCounter(): Promise<{ total_vaults: number }> {
    return api.get('/blockchain/vault/counter');
  },
  
  // Get vault info from blockchain
  async getVault(vaultId: number): Promise<{
    vault_id: number;
    owner: string;
    name: string;
    icon: string;
    target_rbtc: number;
    current_rbtc: number;
    vault_type: string;
    beneficiary: string;
    locked: boolean;
    unlock_date: number;
    status: string;
    progress_percent: number;
    is_unlocked: boolean;
    time_remaining_seconds: number;
    created_at: number;
    updated_at: number;
  }> {
    return api.get(`/blockchain/vault/${vaultId}`);
  },
  
  // Get user's vault IDs from blockchain
  async getUserVaults(address: string): Promise<{ address: string; vault_ids: number[] }> {
    return api.get(`/blockchain/vaults/user/${address}`);
  },
  
  // Create vault on-chain (requires private key)
  async createVault(request: {
    name: string;
    icon: string;
    target: number;
    vault_type: number; // 0=Savings, 1=Rental, 2=P2P
    beneficiary?: string;
    locked?: boolean;
    unlock_date?: number;
  }): Promise<VaultTxResponse> {
    return api.post<VaultTxResponse>('/blockchain/vault/create', request, true);
  },
  
  // Deposit to vault on-chain (requires private key)
  async deposit(request: {
    vault_id: number;
    amount: number;
  }): Promise<VaultTxResponse> {
    return api.post<VaultTxResponse>('/blockchain/vault/deposit', request, true);
  },
  
  // Withdraw from vault on-chain (requires private key)
  async withdraw(request: {
    vault_id: number;
    amount: number;
  }): Promise<VaultTxResponse> {
    return api.post<VaultTxResponse>('/blockchain/vault/withdraw', request, true);
  },
  
  // Set beneficiary for rental vault (requires private key)
  async setBeneficiary(vaultId: number, beneficiary: string): Promise<{
    success: boolean;
    tx_hash: string | null;
    vault_id: string;
    beneficiary: string;
  }> {
    return api.post(`/blockchain/vault/${vaultId}/set-beneficiary`, { beneficiary }, true);
  },
  
  // Get RBTC balance for address
  async getBalance(address: string): Promise<{
    address: string;
    balance_rbtc: number;
    balance_wei: number;
    formatted: string;
  }> {
    return api.get(`/blockchain/balance/${address}`);
  },
  
  // Get transaction status
  async getTransaction(txHash: string): Promise<{
    hash: string;
    block_number: number | null;
    status: number | null;
    confirmations: number | null;
    gas_used: number | null;
    from_address: string | null;
    to_address: string | null;
    explorer_url: string;
  }> {
    return api.get(`/blockchain/tx/${txHash}`);
  },
  
  // Health check
  async healthCheck(): Promise<{
    rsk_node: boolean;
    tropykus: boolean;
    vault_contract: boolean;
    chain_id: number;
    is_testnet: boolean;
    contract_address: string;
    timestamp: string;
  }> {
    return api.get('/blockchain/health');
  },
};

export default blockchainService;