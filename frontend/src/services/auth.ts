// Authentication service - XOConnect (Beexo) wallet integration

import api, { tokenManager } from './api';
import type { AuthVerifyRequest, AuthVerifyResponse, UserResponse, UserBalanceResponse } from '../types/api';
import config from '../config/env';

// Auth message for XOConnect signature
const AUTH_MESSAGE = 'Sign this to authenticate with AhorroGO';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  signature: string | null;
}

// Client Types based on XO Connect API
export interface XOClient {
  _id: string;
  alias: string;
  image: string;
  currencies: Array<{
    id: string;
    address: string;
    chainId?: string;
  }>;
}

// Check if XOConnect is available
export function isBeexoAvailable(): boolean {
  if (typeof window !== 'undefined') {
    // Check for XOConnect global
    const win = window as any;
    return !!win.XOConnect || !!win.XOConnectProvider;
  }
  return false;
}

// Get the provider instance (creates it if needed)
let providerInstance: any = null;
function getProvider() {
  const win = window as any;
  if (!providerInstance && win.XOConnectProvider) {
    const hexChainId = `0x${config.rsk.chainId.toString(16)}`; // "0x1f" for testnet (31)
    providerInstance = new win.XOConnectProvider({
      defaultChainId: hexChainId,
    });
  }
  return providerInstance;
}

// Connect to XOConnect wallet
export async function connectWallet(): Promise<string> {
  const win = window as any;
  
  if (isBeexoAvailable()) {
    try {
      const provider = getProvider();
      if (provider) {
        // EIP-1193 flow
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) return accounts[0];
      } else if (win.XOConnect) {
        // Direct XOConnect flow
        const result = await win.XOConnect.connect();
        if (result && result.client && result.client.currencies.length > 0) {
          // Find the eth compat currency
          const ethCurrency = result.client.currencies.find((c: any) => c.address.startsWith('0x'));
          if (ethCurrency) return ethCurrency.address;
          return result.client.currencies[0].address;
        }
      }
    } catch (error) {
      console.error("XOConnect connection error:", error);
    }
  }
  
  // Development fallback
  const address = prompt('Enter your wallet address (Dev Mode):');
  if (!address) throw new Error('No address provided');
  return address;
}

// Sign message with wallet
export async function signMessage(message: string, address: string): Promise<string> {
  const win = window as any;
  
  if (isBeexoAvailable()) {
    try {
      const provider = getProvider();
      if (provider) {
        // EIP-1193 flow
        return await provider.request({
          method: 'personal_sign',
          params: [message, address],
        });
      } else if (win.XOConnect) {
        // Direct XOConnect flow via Promise wrapper
        return new Promise((resolve, reject) => {
          win.XOConnect.sendRequest({
            method: 'personalSign',
            data: { message, address },
            onSuccess: (res: any) => resolve(res.signature || res.result),
            onCancel: () => reject(new Error('User cancelled signature')),
          });
        });
      }
    } catch (error) {
      console.error("XOConnect sign error:", error);
    }
  }
  
  console.warn('Mock signature used for development');
  return `mock_signature_${address}_${Date.now()}`;
}

// Auth service
export const authService = {
  // Login with XOConnect wallet
  async login(): Promise<{ user: UserResponse; token: string }> {
    const address = await connectWallet();
    const message = AUTH_MESSAGE;
    const signature = await signMessage(message, address);
    
    const request: AuthVerifyRequest = {
      address,
      signature,
      message,
    };
    
    const response = await api.post<AuthVerifyResponse>('/users/verify', request);
    tokenManager.setToken(response.token);
    
    return {
      user: response.user,
      token: response.token,
    };
  },
  
  logout(): void {
    const win = window as any;
    if (win.XOConnect) {
      try {
        win.XOConnect.disconnect();
      } catch (e) {}
    }
    tokenManager.removeToken();
    tokenManager.removePrivateKey();
  },
  
  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },
  
  getToken(): string | null {
    return tokenManager.getToken();
  },
  
  setPrivateKey(privateKey: string): void {
    tokenManager.setPrivateKey(privateKey);
  },
  
  getPrivateKey(): string | null {
    return tokenManager.getPrivateKey();
  },
  
  clearPrivateKey(): void {
    tokenManager.removePrivateKey();
  },
};

// User service
export const userService = {
  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>('/users/me');
  },
  
  async getBalance(): Promise<UserBalanceResponse> {
    return api.get<UserBalanceResponse>('/users/me/balance');
  },
  
  async getUserByAddress(address: string): Promise<{ address: string; alias: string; has_active_guarantee: boolean }> {
    return api.get(`/users/${address}`);
  },
};

export default authService;