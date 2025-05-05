import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppAbility, defineAbilityFor } from './ability';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';

// Create context for ability
const AbilityContext = createContext<AppAbility | undefined>(undefined);

/**
 * Provider component that makes the ability instance available
 * throughout the component tree
 */
export const AbilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [ability, setAbility] = useState<AppAbility>(() => defineAbilityFor(null));

  useEffect(() => {
    // Update abilities when user changes
    setAbility(defineAbilityFor(currentUser));
  }, [currentUser]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};

/**
 * Hook to use the ability instance
 * Must be used within an AbilityProvider
 */
export const useAbility = (): AppAbility => {
  const ability = useContext(AbilityContext);

  if (!ability) {
    throw new Error('useAbility must be used within an AbilityProvider');
  }

  return ability;
};