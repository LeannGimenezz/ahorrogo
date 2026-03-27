// Login Page - XOConnect wallet authentication

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../components/auth/AuthProvider';
import { config } from '../config/env';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, isLoading, error } = useAuthContext();
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const handleBeexoLogin = async () => {
    try {
      await login();
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  
  const handleManualLogin = async () => {
    if (!manualAddress) return;
    
    try {
      // For development: use mock auth with manual address
      await login();
      navigate('/');
    } catch (err) {
      console.error('Manual login failed:', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      <button
        onClick={() => navigate(-1)}
        aria-label="Volver"
        className="absolute top-6 left-6 w-10 h-10 rounded-xl surface-card flex items-center justify-center text-primary active:scale-95 transition"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-headline font-extrabold text-white mb-2">
          AhorroGO
        </h1>
        <p className="text-on-surface-variant/60 text-sm">
          Tu patrimonio digital en RSK
        </p>
      </motion.div>
      
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10"
      >
        {/* Beexo Button */}
        <button
          onClick={handleBeexoLogin}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-headline font-bold text-sm uppercase active:scale-[0.98] transition-transform flex items-center justify-center gap-3 mb-4"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: 'FILL 1' }}>
                account_balance_wallet
              </span>
              <span>Conectar con Beexo</span>
            </>
          )}
        </button>
        
        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-on-surface-variant/40 text-xs uppercase tracking-wider">o</span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>
        
        {/* Manual Address Input (Development) */}
        {config.features.mockData && (
          <div className="space-y-3">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="w-full text-on-surface-variant/60 text-xs hover:text-on-surface-variant transition-colors"
            >
              {showManualInput ? 'Ocultar' : 'Ingresar dirección manual'}
            </button>
            
            {showManualInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-surface-container rounded-xl px-4 py-3 text-white text-sm placeholder-on-surface-variant/30 border border-outline-variant/20 focus:border-primary focus:outline-none transition-colors"
                />
                
                <button
                  onClick={handleManualLogin}
                  disabled={!manualAddress || isLoading}
                  className="w-full py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant font-semibold text-sm disabled:opacity-50 hover:bg-surface-container transition-colors"
                >
                  Continuar
                </button>
              </motion.div>
            )}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20"
          >
            <p className="text-error text-sm text-center">{error}</p>
          </motion.div>
        )}
      </motion.div>
      
      {/* Network Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-center gap-2 text-on-surface-variant/40 text-xs"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>
          LAN
        </span>
        <span>{config.rsk.networkName}</span>
        <span className="text-on-surface-variant/20">•</span>
        <span>Chain ID: {config.rsk.chainId}</span>
      </motion.div>
      
      {/* Demo Mode */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4"
      >
        <button
          onClick={() => {
            if (loginDemo) {
              loginDemo();
            }
          }}
          className="text-on-surface-variant/40 text-xs hover:text-primary transition-colors"
        >
          Demo sin wallet →
        </button>
      </motion.div>
    </div>
  );
}

export default LoginPage;