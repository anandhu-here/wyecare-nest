import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { useAppSelector } from './hooks';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { AbilityProvider } from '../lib/casl/AbilityContext';
import store from './store';
import AppRoutes from '@/routes/AppRoutes';
import { useAuthControllerGetProfileQuery } from '@/features/generatedApi';

// AppContent component to handle auth state and user data fetching
const AppContent: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Fetch the user profile if authenticated
  const { isLoading: isLoadingProfile } = useAuthControllerGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  return (
    <AbilityProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AbilityProvider>
  );
};

// Main App component
export function App() {
  return (
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
}

export default App;