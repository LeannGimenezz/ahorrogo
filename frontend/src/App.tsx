import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { HomePage } from './pages/HomePage';
import { VaultsPage } from './pages/VaultsPage';
import { CreateVaultPage } from './pages/CreateVaultPage';
import { MovementsPage } from './pages/MovementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SendPage } from './pages/SendPage';
import { Onboarding, isOnboardingCompleted } from './components/penguin/Onboarding';

// Demo mode - Auto-login with mock data
function App() {
  const initMockData = useAppStore((state) => state.initMockData);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize with mock data for demo
    initMockData();
    // Check if onboarding was completed
    const onboardingDone = isOnboardingCompleted();
    setShowOnboarding(!onboardingDone);
    setIsReady(true);
  }, [initMockData]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  
  if (!isReady) {
    return null; // Or a loading spinner
  }
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Show onboarding for first-time users */}
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