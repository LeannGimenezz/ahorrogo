// Auth context provider for app-wide auth state

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UseAuthReturn } from '../../hooks/useAuth';

interface AuthContextType extends UseAuthReturn {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      // Check if there's a stored token
      if (auth.isAuthenticated) {
        // Try to refresh user data
        await auth.refreshUser();
      }
      setIsInitialized(true);
    };
    
    init();
  }, []);
  
  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-on-surface-variant text-sm">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ ...auth, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;