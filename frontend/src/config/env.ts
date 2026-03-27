// Environment configuration for AhorroGO frontend

export const config = {
  // API Base URL
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  
  // RSK Network Configuration
  rsk: {
    rpcUrl: import.meta.env.VITE_RSK_RPC_URL || 'https://public-node.testnet.rsk.co',
    chainId: parseInt(import.meta.env.VITE_RSK_CHAIN_ID || '31'),
    networkName: import.meta.env.VITE_RSK_NETWORK_NAME || 'RSK Testnet',
    explorerUrl: import.meta.env.VITE_RSK_EXPLORER_URL || 'https://explorer.testnet.rsk.co',
  },
  
  // Beexo Wallet Configuration
  beexo: {
    deepLink: import.meta.env.VITE_BEEXO_DEEPLINK || 'beexo://',
    packageName: import.meta.env.VITE_BEEXO_PACKAGE || 'com.beexo.wallet',
  },
  
  // Topykus Protocol
  tropykus: {
    comptroller: import.meta.env.VITE_TROPYKUS_COMPTROLLER || '0x7de1ade...',
  },
  
  // App Configuration
  app: {
    name: 'AhorroGO',
    version: '0.1.0',
    defaultLocale: 'es-AR',
  },
  
  // Feature flags
  features: {
    mockData: import.meta.env.VITE_MOCK_DATA === 'true',
    enableBlockchain: import.meta.env.VITE_ENABLE_BLOCKCHAIN !== 'false',
  },
} as const;

// Validate required config
export function validateConfig(): void {
  if (!config.apiUrl) {
    console.warn('VITE_API_URL not set, using default:',config.apiUrl);
  }
}

export default config;