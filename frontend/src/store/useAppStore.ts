// Global app store with Zustand

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Vault, User, PenguinState, PenguinMood } from '../types';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Vaults
  vaults: Vault[];
  setVaults: (vaults: Vault[]) => void;
  addVault: (vault: Vault) => void;
  updateVault: (id: string, updates: Partial<Vault>) => void;
  removeVault: (id: string) => void;
  
  // Penguin (Gamification)
  penguin: PenguinState;
  setPenguin: (penguin: PenguinState) => void;
  setPenguinMood: (mood: PenguinMood) => void;
  addXp: (xp: number) => void;
  updateStreak: (streak: number) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Mock data initializer (for development)
  initMockData: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  vaults: [],
  penguin: {
    xp: 0,
    level: 1,
    mood: 'idle' as PenguinMood,
    streak: 0,
    accessories: [],
    totalSaved: 0,
    yieldEarned: 0,
  },
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Auth actions
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      // Vault actions
      setVaults: (vaults) => set({ vaults }),
      addVault: (vault) => set((state) => ({ 
        vaults: [...state.vaults, vault] 
      })),
      updateVault: (id, updates) => set((state) => ({
        vaults: state.vaults.map((v) => 
          v.id === id ? { ...v, ...updates } : v
        )
      })),
      removeVault: (id) => set((state) => ({
        vaults: state.vaults.filter((v) => v.id !== id)
      })),
      
      // Penguin actions
      setPenguin: (penguin) => set({ penguin }),
      setPenguinMood: (mood) => set((state) => ({
        penguin: { ...state.penguin, mood }
      })),
      addXp: (xp) => set((state) => ({
        penguin: { 
          ...state.penguin, 
          xp: state.penguin.xp + xp,
        }
      })),
      updateStreak: (streak) => set((state) => ({
        penguin: { ...state.penguin, streak }
      })),
      
      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Mock data for development
      initMockData: () => {
        set({
          user: {
            id: '1',
            address: '0x7a3B8cD5...9F1A2B3C',
            alias: 'tunombre.bexo',
            xp: 350,
            level: 3,
            streak: 5,
            lastDepositAt: '2026-03-15T10:30:00Z',
            createdAt: '2026-01-01T00:00:00Z',
          },
          vaults: [
            {
              id: '1',
              name: 'Compra Consola PS5',
              icon: '🎮',
              target: 2200,
              current: 1850,
              vaultType: 'savings',
              locked: true,
              unlockDate: '2026-06-15T00:00:00Z',
              status: 'active',
              useCase: 'compra-p2p',
              investedCoin: 'DOC',
              apy: '4.8%',
              contractAddress: '0x3d8A54bA8AB5089cd8a1862Fc4aBf3703aD7E60e',
              createdAt: '2026-01-15T00:00:00Z',
            },
            {
              id: '2',
              name: 'Garantía Depto Palermo',
              icon: '🏠',
              target: 5000,
              current: 5000,
              vaultType: 'rental',
              locked: true,
              unlockDate: '2027-01-01T00:00:00Z',
              status: 'active',
              useCase: 'garantia-alquiler',
              investedCoin: 'DOC',
              apy: '3.7%',
              ownerAddress: '0x8a2B...cD3e',
              guaranteeMonths: 12,
              beneficiary: 'propietario.bexo',
              contractAddress: '0x9f2C34dE5F6789AB0123456789ABCDEF01234567',
              createdAt: '2026-01-01T00:00:00Z',
            },
            {
              id: '3',
              name: 'Meta MacBook Pro 2026',
              icon: '💻',
              target: 4200,
              current: 2100,
              vaultType: 'savings',
              locked: true,
              unlockDate: '2026-10-15T00:00:00Z',
              status: 'active',
              useCase: 'metas-candado',
              investedCoin: 'USDRIF',
              apy: '5.2%',
              createdAt: '2026-02-01T00:00:00Z',
            },
            {
              id: '4',
              name: 'Fondo Emergencia',
              icon: '🛟',
              target: 4000,
              current: 3200,
              vaultType: 'finance',
              locked: true,
              unlockDate: '2026-12-31T00:00:00Z',
              status: 'active',
              useCase: 'finanzas-personales',
              investedCoin: 'DOC',
              apy: '4.6%',
              releaseSchedule: [
                { id: 'r1', percentage: 25, amount: 1000, date: '2026-06-01', released: false, label: 'Primer tramo' },
                { id: 'r2', percentage: 25, amount: 1000, date: '2026-09-01', released: false, label: 'Segundo tramo' },
                { id: 'r3', percentage: 50, amount: 2000, date: '2026-12-31', released: false, label: 'Tramo final' },
              ],
              createdAt: '2026-03-01T00:00:00Z',
            },
            {
              id: '5',
              name: 'Venta Bici Usada',
              icon: '🚲',
              target: 800,
              current: 800,
              vaultType: 'p2p',
              locked: true,
              unlockDate: '2026-04-15T00:00:00Z',
              status: 'active',
              useCase: 'venta-protegida',
              investedCoin: 'DOC',
              apy: '4.0%',
              sellerAddress: '0x5f7A...e9B2',
              releaseCondition: 'Entrega confirmada por ambas partes',
              createdAt: '2026-03-10T00:00:00Z',
            },
          ],
          penguin: {
            xp: 350,
            level: 3,
            mood: 'happy',
            streak: 5,
            accessories: ['beanie', 'scarf'],
            totalSaved: 12950,
            yieldEarned: 245.50,
          },
          isAuthenticated: true,
        });
      },
      
      // Reset to initial state
      reset: () => set(initialState),
    }),
    {
      name: 'ahorrogo-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAppStore;