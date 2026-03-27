# AhorroGO Frontend - Backend Integration Guide

## Overview

This frontend is fully integrated with the AhorroGO backend API. All API calls go through a centralized service layer with proper authentication and error handling.

## Architecture

```
src/
├── config/
│   └── env.ts              # Environment configuration
├── services/
│   ├── api.ts              # Base API client (auth headers, error handling)
│   ├── auth.ts             # Beexo wallet auth + user service
│   ├── vaults.ts           # Vault CRUD operations
│   └── blockchain.ts       # RSK/Topykus blockchain operations
├── hooks/
│   ├── useAuth.ts          # Authentication state management
│   ├── useVaults.ts        # Vault data management
│   └── useBalance.ts       # User balance management
├── components/auth/
│   ├── AuthProvider.tsx    # Auth context provider
│   └── ProtectedRoute.tsx  # Route guard for authenticated routes
├── store/
│   └── useAppStore.ts      # Zustand store with persist middleware
└── types/
    └── api.ts              # API response types (matching backend)
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your backend URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

## Authentication Flow

### Beexo Wallet Login

```typescript
import { useAuth } from './hooks';

function MyComponent() {
  const { login, user, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    await login(); // Opens Beexo wallet for signature
  };
}
```

### Manual Login (Development)

For development without Beexo wallet, use the demo mode:

```typescript
import { useAppStore } from './store';

// Enable mock data mode
useAppStore.getState().initMockData();
```

## API Services

### Vaults Service

```typescript
import { useVaults } from './hooks';

function VaultsList() {
  const { 
    vaults, 
    isLoading, 
    createVault, 
    deposit, 
    withdraw 
  } = useVaults();
  
  // Create vault (optionally with blockchain)
  await createVault({
    name: 'My Savings',
    icon: '💰',
    target: 1000,
    vault_type: 'savings',
  }, true); // true = create on-chain
  
  // Deposit to vault
  await deposit(vaultId, 100, 'tx_hash_optional');
  
  // Withdraw from vault
  await withdraw(vaultId, 50);
}
```

### Blockchain Service

```typescript
import { blockchainService } from './services';

// Get network info
const network = await blockchainService.getNetworkInfo();

// Get Topykus markets
const markets = await blockchainService.getMarkets();

// Create vault on-chain (requires private key)
auth.setPrivateKey('0x...');
await blockchainService.createVault({ ... });
```

## Protected Routes

Wrap authenticated routes with `ProtectedRoute`:

```tsx
import { ProtectedRoute } from './components/auth';

<Route path="/vaults" element={
  <ProtectedRoute>
    <VaultsPage />
  </ProtectedRoute>
} />
```

## State Management

### Zustand Store

```typescript
import { useAppStore } from './store';

function MyComponent() {
  const { 
    user,         // Current user
    vaults,       // User's vaults
    penguin,      // Gamification state
    setUser,      // Update user
    setVaults,    // Update vaults
    addVault,     // Add vault
    updateVault,  // Update vault
  } = useAppStore();
}
```

## API Endpoints Used

### Authentication
- `POST /users/verify` - Wallet signature verification

### Users
- `GET /users/me` - Get current user
- `GET /users/me/balance` - Get user balance

### Vaults
- `GET /vaults` - List user vaults
- `POST /vaults` - Create vault
- `GET /vaults/:id` - Get vault details
- `PUT /vaults/:id` - Update vault
- `DELETE /vaults/:id` - Delete vault
- `POST /vaults/:id/deposit` - Deposit
- `POST /vaults/:id/deposit-onchain` - Deposit on-chain
- `POST /vaults/:id/withdraw` - Withdraw
- `GET /vaults/:id/withdraw/check` - Check withdrawal eligibility
- `GET /vaults/:id/yield` - Get yield

### Blockchain
- `GET /blockchain/network` - Network info
- `GET /blockchain/markets` - Topykus markets
- `POST /blockchain/vault/create` - Create vault on-chain
- `POST /blockchain/vault/deposit` - Deposit on-chain
- `POST /blockchain/vault/withdraw` - Withdraw on-chain

## Error Handling

All API errors are caught and surfaced through the hooks:

```typescript
const { error } = useVaults();

if (error) {
  // Show error to user
  console.error(error);
}
```

## Testing

### Run in Demo Mode

Set `VITE_MOCK_DATA=true` to use mock data without backend.

### Test with Backend

1. Start backend: `cd ../backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173

## File Structure

```
frontend/
├── src/
│   ├── App.tsx                  # Main app with routing
│   ├── config/
│   │   └── env.ts               # Environment config
│   ├── services/
│   │   ├── api.ts               # Base API client
│   │   ├── auth.ts              # Auth service
│   │   ├── vaults.ts            # Vaults service
│   │   ├── blockchain.ts        # Blockchain service
│   │   └── index.ts             # Exports
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook
│   │   ├── useVaults.ts         # Vaults hook
│   │   ├── useBalance.ts        # Balance hook
│   │   └── index.ts             # Exports
│   ├── components/auth/
│   │   ├── AuthProvider.tsx     # Auth context
│   │   ├── ProtectedRoute.tsx   # Route guard
│   │   └── index.ts             # Exports
│   ├── pages/
│   │   └── LoginPage.tsx        # Login page
│   ├── store/
│   │   └── useAppStore.ts       # Zustand store
│   ├── types/
│   │   ├── index.ts             # Frontend types
│   │   └── api.ts               # API response types
│   └── main.tsx                 # Entry point
├── .env.example                 # Environment template
├── .env.local                   # Local config (gitignored)
└── INTEGRATION.md               # This file
```

## Next Steps

1. **Implement Beexo SDK integration** for production wallet connection
2. **Add error boundaries** for graceful error handling
3. **Add loading skeletons** for better UX
4. **Implement optimistic updates** for better perceived performance
5. **Add React Query** for advanced caching and invalidation