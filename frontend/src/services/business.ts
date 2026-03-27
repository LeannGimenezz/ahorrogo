import api from './api';

export interface DepositFlowResponse {
  success: boolean;
  xp_earned: number;
  new_xp: number;
  new_level: number;
  streak: number;
  streak_incremented: boolean;
  vault_progress: number;
  mood: string;
  tx_hash?: string;
  new_balance: number;
}

export interface ReceiveInfoResponse {
  beexo_alias: string;
  wallet_address: string;
  cvu?: string;
  qr_payload: string;
}

export interface SwapQuoteResponse {
  from_token: string;
  to_token: string;
  amount: number;
  rate: number;
  estimated_received: number;
  slippage: number;
}

export interface SwapExecuteResponse {
  success: boolean;
  swap_id: string;
  tx_hash?: string;
  status: string;
  estimated_received: number;
}

export interface SendFundsResponse {
  success: boolean;
  transfer_id: string;
  status: string;
  amount: number;
  recipient: string;
}

export interface MotivationResponse {
  message: string;
  days_saved: number;
  new_eta_days?: number | null;
}

export const businessService = {
  depositToVault: async (payload: { vault_id: string; amount: number; payment_method: 'beexo' | 'bank' | 'card' | 'crypto' }): Promise<DepositFlowResponse> => {
    return api.post('/business/deposit', payload, true);
  },

  getReceiveInfo: async (): Promise<ReceiveInfoResponse> => {
    return api.get('/business/receive');
  },

  getSwapQuote: async (payload: { from_token: string; to_token: string; amount: number }): Promise<SwapQuoteResponse> => {
    return api.post('/business/swap/quote', payload);
  },

  executeSwap: async (payload: {
    from_token: string;
    to_token: string;
    amount: number;
    accept_slippage?: boolean;
  }): Promise<SwapExecuteResponse> => {
    return api.post('/business/swap/execute', { accept_slippage: true, ...payload }, true);
  },

  sendFunds: async (payload: {
    vault_id: string;
    recipient_alias?: string;
    recipient_address?: string;
    amount: number;
    note?: string;
  }): Promise<SendFundsResponse> => {
    return api.post('/business/send', payload);
  },

  getVaultMotivation: async (vaultId: string, weeklyExtra: number): Promise<MotivationResponse> => {
    return api.get(`/business/vaults/${vaultId}/motivation?weekly_extra=${weeklyExtra}`);
  },
};
