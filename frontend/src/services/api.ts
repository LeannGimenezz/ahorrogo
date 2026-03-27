// Base API service with authentication and error handling

import config from '../config/env';

// Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

// Storage keys
const TOKEN_KEY = 'ahorrogo_token';
const PRIVATE_KEY_KEY = 'ahorrogo_private_key';

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  
  getPrivateKey: (): string | null => {
    return localStorage.getItem(PRIVATE_KEY_KEY);
  },
  
  setPrivateKey: (privateKey: string): void => {
    localStorage.setItem(PRIVATE_KEY_KEY, privateKey);
  },
  
  removePrivateKey: (): void => {
    localStorage.removeItem(PRIVATE_KEY_KEY);
  },
};

// Request headers
function getHeaders(includeAuth: boolean = true, includePrivateKey: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  if (includePrivateKey) {
    const privateKey = tokenManager.getPrivateKey();
    if (privateKey) {
      headers['x-private-key'] = privateKey;
    }
  }
  
  return headers;
}

// Base fetch wrapper
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  includePrivateKey: boolean = false
): Promise<T> {
  const url = `${config.apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(true, includePrivateKey),
      ...options.headers,
    },
  });
  
  // Handle errors
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    // Handle401 - Unauthorized
    if (response.status === 401) {
      tokenManager.removeToken();
      tokenManager.removePrivateKey();
      window.location.href = '/';
    }
    
    throw new Error(errorMessage);
  }
  
  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string, includePrivateKey: boolean = false): Promise<T> => {
    return request<T>(endpoint, { method: 'GET' }, includePrivateKey);
  },
  
  post: <T>(endpoint: string, data?: unknown, includePrivateKey: boolean = false): Promise<T> => {
    return request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includePrivateKey
    );
  },
  
  put: <T>(endpoint: string, data?: unknown, includePrivateKey: boolean = false): Promise<T> => {
    return request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includePrivateKey
    );
  },
  
  delete: <T>(endpoint: string, includePrivateKey: boolean = false): Promise<T> => {
    return request<T>(endpoint, { method: 'DELETE' }, includePrivateKey);
  },
};

export default api;