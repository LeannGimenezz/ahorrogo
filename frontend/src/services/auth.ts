// Authentication service - Beexo wallet integration

import api, { tokenManager } from './api';
import type { AuthVerifyRequest, AuthVerifyResponse, UserResponse, UserBalanceResponse } from '../types/api';

// Auth message for Beexo signature
const AUTH_MESSAGE = 'Sign this to authenticate with AhorroGO';

// Wallet connection status
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  signature: string | null;
}

// Check if Beexo wallet is available
export function isBeexoAvailable(): boolean {
  // Check for Beexo wallet injection
  if (typeof window !== 'undefined') {
    const win = window as unknown as { beexo?: { isBeexo: boolean } };
    return !!win.beexo?.isBeexo;
  }
  return false;
}

// Connect to Beexo wallet
export async function connectWallet(): Promise<string> {
  // In production, use Beexo SDK
  // For development, we'll use a mock or manual input
  
  if (isBeexoAvailable()) {
    // Use Beexo SDK to connect
    const win = window as unknown as { 
      beexo?: { 
        request: (args: { method: string }) => Promise<{ result: string }> 
      } 
    };
    
    if (win.beexo) {
      const result = await win.beexo.request({ method: 'eth_requestAccounts' });
      return result.result;
    }
  }
  
  // Development fallback: prompt for address
  const address = prompt('Enter your wallet address:');
  if (!address) {
    throw new Error('No address provided');
  }
  return address;
}

// Sign message with wallet
export async function signMessage(message: string, address: string): Promise<string> {
  if (isBeexoAvailable()) {
    const win = window as unknown as { 
      beexo?: { 
        request: (args: { method: string; params: unknown[] }) => Promise<{ result: string }> 
      } 
    };
    
    if (win.beexo) {
      const result = await win.beexo.request({
        method: 'personal_sign',
        params: [message, address],
      });
      return result.result;
    }
  }
  
  // Development fallback: return mock signature
  console.warn('Mock signature used for development');
  return `mock_signature_${address}_${Date.now()}`;
}

// Auth service
export const authService = {
  // Login with Beexo wallet
  async login(): Promise<{ user: UserResponse; token: string }> {
    // Step1: Get wallet address
    const address = await connectWallet();
    
    // Step 2: Create message to sign
    const message = AUTH_MESSAGE;
    
    // Step 3: Request signature
    const signature = await signMessage(message, address);
    
    // Step 4: Verify with backend
    const request: AuthVerifyRequest = {
      address,
      signature,
      message,
    };
    
    const response = await api.post<AuthVerifyResponse>('/users/verify', request);
    
    // Step 5: Store token
    tokenManager.setToken(response.token);
    
    return {
      user: response.user,
      token: response.token,
    };
  },
  
  // Logout
  logout(): void {
    tokenManager.removeToken();
    tokenManager.removePrivateKey();
  },
  
  // Check if authenticated
  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },
  
  // Get current token
  getToken(): string | null {
    return tokenManager.getToken();
  },
  
  // Store private key for blockchain operations
  setPrivateKey(privateKey: string): void {
    tokenManager.setPrivateKey(privateKey);
  },
  
  // Get private key
  getPrivateKey(): string | null {
    return tokenManager.getPrivateKey();
  },
  
  // Clear private key
  clearPrivateKey(): void {
    tokenManager.removePrivateKey();
  },
};

// User service
export const userService = {
  // Get current user info
  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>('/users/me');
  },
  
  // Get user balance
  async getBalance(): Promise<UserBalanceResponse> {
    return api.get<UserBalanceResponse>('/users/me/balance');
  },
  
  // Get user by address
  async getUserByAddress(address: string): Promise<{ address: string; alias: string; has_active_guarantee: boolean }> {
    return api.get(`/users/${address}`);
  },
};

export default authService;