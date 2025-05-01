import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  MenuConfiguration,
  MenuItem,
  OrganizationCategory,
  TerminologyKey,
  createTerminologyResolver,
  filterMenuItems,
  menuConfig,
  terminologyConfig,
} from '@wyecare-monorepo/web-ui';
import { selectCurrentOrganization, selectPermissions } from '@/app/features/auth/AuthSlice';

// Context interface
interface MenuContextType {
  // The user's organization category
  organizationCategory: OrganizationCategory;

  // The filtered menu items based on user's permissions and organization category
  menuItems: MenuItem[];

  // Function to resolve terminology based on organization category
  getTerminology: (key: TerminologyKey) => string;

  // Function to check if a user has a specific permission
  hasPermission: (permission: string) => boolean;

  // Function to check if a route is accessible to the user
  isRouteAccessible: (path: string) => boolean;
}

// Create the context
const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Props for the provider
interface MenuProviderProps {
  children: React.ReactNode;
  customMenuConfig?: MenuConfiguration;
}

/**
 * Menu Provider component
 * This provides menu-related functionality to all child components
 */
export const MenuProvider: React.FC<MenuProviderProps> = ({
  children,
  customMenuConfig,
}) => {
  // Get the current organization from Redux
  const currentOrganization = useSelector(selectCurrentOrganization);

  // Get the user's permissions from Redux
  const permissions = useSelector(selectPermissions);

  // Determine the organization category
  const organizationCategory = useMemo(() => {
    return currentOrganization?.category || OrganizationCategory.OTHER;
  }, [currentOrganization]);

  // Create a terminology resolver
  const terminologyResolver = useMemo(() => {
    return createTerminologyResolver(terminologyConfig);
  }, []);

  // Filter menu items based on permissions and organization category
  const menuItems = useMemo(() => {
    const config = customMenuConfig || menuConfig;
    return filterMenuItems(config, organizationCategory as any, permissions);
  }, [customMenuConfig, organizationCategory, permissions]);

  // Function to resolve terminology
  const getTerminology = (key: TerminologyKey): string => {
    return terminologyResolver(key, organizationCategory as any);
  };

  // Function to check if a user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Function to check if a route is accessible
  const isRouteAccessible = (path: string): boolean => {
    // Find the menu item that matches the path
    const findItemByPath = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.path === path) {
          return true;
        }

        if (item.children && findItemByPath(item.children)) {
          return true;
        }
      }

      return false;
    };

    return findItemByPath(menuItems);
  };

  // Create the context value
  const contextValue = useMemo(
    () => ({
      organizationCategory,
      menuItems,
      getTerminology,
      hasPermission,
      isRouteAccessible,
    }),
    [organizationCategory, menuItems, permissions]
  );

  return (
    <MenuContext.Provider value={contextValue as any}>{children}</MenuContext.Provider>
  );
};

/**
 * Hook to use the menu context
 * @returns Menu context
 * @throws Error if used outside of a MenuProvider
 */
export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);

  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }

  return context;
};
