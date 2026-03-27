import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { HomePage } from './pages/HomePage';
import { VaultsPage } from './pages/VaultsPage';
import { CreateVaultPage } from './pages/CreateVaultPage';
import { MovementsPage } from './pages/MovementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SendPage } from './pages/SendPage';
import { LoginPage } from './pages/LoginPage';
import { Onboarding, isOnboardingCompleted } from './components/penguin/Onboarding';

function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const onboardingDone = isOnboardingCompleted();
    setShowOnboarding(!onboardingDone);
    setIsReady(true);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  
  if (!isReady) {
    return null;
  }
  
  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );
  }
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vaults" element={<VaultsPage />} />
          <Route path="/create" element={<CreateVaultPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;