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
          totalSaved: state.penguin.totalSaved, // Keep total in sync
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
            address: '0x1234...abcd',
            alias: 'tunombre.bexo',
            xp: 350,
            level: 3,
            streak: 5,
            lastDepositAt: '2025-03-15T10:30:00Z',
            createdAt: '2025-01-01T00:00:00Z',
          },
          vaults: [
            {
              id: '1',
              name: 'MacBook Pro',
              icon: '💻',
              target: 2500,
              current: 750,
              vaultType: 'savings',
              locked: true,
              unlockDate: '2025-10-15T00:00:00Z',
              status: 'active',
              createdAt: '2025-01-01T00:00:00Z',
            },
            {
              id: '2',
              name: 'Vacation Fund',
              icon: '✈️',
              target: 5000,
              current: 2000,
              vaultType: 'savings',
              locked: false,
              status: 'active',
              createdAt: '2025-02-01T00:00:00Z',
            },
          ],
          penguin: {
            xp: 350,
            level: 3,
            mood: 'happy',
            streak: 5,
            accessories: ['beanie', 'scarf'],
            totalSaved: 2750,
            yieldEarned: 45.5,
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