

// MenuProvider.tsx
import { menuConfig, MenuItem, OrganizationCategory, terminologyConfig, TerminologyKey } from '@wyecare-monorepo/web-ui';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentOrganization, selectPermissions, selectUser } from '../features/auth/AuthSlice';

// Function to check if a menu item is available for a category
const isCategoryMatch = (
    itemCategories: OrganizationCategory[] | ['*'] | undefined,
    userCategory: OrganizationCategory
): boolean => {
    if (!itemCategories || itemCategories.includes('*' as never)) {
        return true;
    }

    return (itemCategories as OrganizationCategory[]).includes(userCategory);
};

// Function to check if a user has the required permissions
const hasRequiredPermissions = (
    requiredPermissions: string[] | undefined,
    userPermissions: string[]
): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Function to resolve terminology
const resolveTerminology = (
    key: TerminologyKey,
    category: OrganizationCategory
): string => {
    const mapping = terminologyConfig.mappings.find(m => m.key === key);

    if (!mapping) {
        return key.toString();
    }

    if (mapping.mappings[category]) {
        return mapping.mappings[category]!;
    }

    return mapping.defaultTerm;
};

// Context interface
interface MenuContextType {
    organizationCategory: OrganizationCategory;
    menuItems: MenuItem[];
    getTerminology: (key: TerminologyKey) => string;
    hasPermission: (permission: string) => boolean;
}

// Create the context
const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Hard-coded fallback menu items that match your existing structure
const fallbackMenuItems = [
    {
        id: 'home',
        label: 'Home',
        icon: 'material-symbols-light:home-outline',
        link: '/dashboard',
    },
    {
        id: 'invitations',
        label: 'Invitations',
        icon: 'fluent:mail-20-regular',
        link: '/dashboard/invitations',
    },
    {
        id: 'residents',
        label: 'Residents',
        icon: 'healthicons:elderly-outline',
        link: '/dashboard/residents',
    },
    {
        id: 'timesheets',
        label: 'Timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/org-timesheets',
    }
];

// Props for the provider
interface MenuProviderProps {
    children: React.ReactNode;
}

/**
 * Menu Provider component
 * This provides menu-related functionality to all child components
 */
export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
    // Get the current user and organization from Redux
    const user = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);

    // For debugging: log the current user and organization
    useEffect(() => {
        console.log("MenuProvider - User:", user);
        console.log("MenuProvider - Current Organization:", currentOrganization);
    }, [user, currentOrganization]);

    // Determine the organization category
    const organizationCategory = useMemo(() => {
        if (currentOrganization?.category) {
            return currentOrganization.category as OrganizationCategory;
        }

        // Legacy support - map from type to category
        if (currentOrganization?.type === 'agency') {
            return OrganizationCategory.SERVICE_PROVIDER;
        } else if (currentOrganization?.type === 'home') {
            return OrganizationCategory.CARE_HOME;
        }

        return OrganizationCategory.OTHER;
    }, [currentOrganization]);

    // Filter menu items - with debug fallback if something fails
    const menuItems = useMemo(() => {
        try {
            console.log("MenuProvider - Organization Category:", organizationCategory);
            console.log("MenuProvider - User Role:", user?.role);

            // For simplicity, we'll convert directly from the menu config
            // This is where you would normally do complex filtering
            const items: MenuItem[] = [];

            // Process each section
            menuConfig.sections.forEach(section => {
                if (!section.organizationCategories.includes("*" as never) &&
                    !section.organizationCategories.includes(organizationCategory as never)) {
                    return; // Skip sections that don't apply to this org category
                }

                // Add items from this section that match the user's role
                section.items.forEach((item: any) => {
                    // Only include items for this user's role
                    if (item.roles && !item.roles.includes(user?.role)) {
                        return;
                    }

                    // Simple org category check
                    if (item.organizationCategories &&
                        !item.organizationCategories.includes("*" as any) &&
                        !item.organizationCategories.includes(organizationCategory)) {
                        return;
                    }

                    // Add the item - make sure to include the link property!
                    items.push({
                        id: item.id,
                        label: item.categoryLabels?.[organizationCategory] || item.label,
                        icon: item.icon,
                        link: item.path, // This is the critical property
                        badgeContent: item.badgeContent,
                        order: item.order || 0
                    });
                });
            });

            // Sort by order
            const sortedItems = items.sort((a, b) => (a.order || 0) - (b.order || 0));

            console.log("MenuProvider - Generated Menu Items:", sortedItems);
            return sortedItems;
        } catch (error) {
            console.error("Error generating menu items:", error);
            // In case of error, return fallback items
            return fallbackMenuItems;
        }
    }, [organizationCategory, user?.role]);

    // Function to resolve terminology
    const getTerminology = (key: TerminologyKey): string => {
        const mapping = terminologyConfig.mappings.find(m => m.key === key);

        if (!mapping) {
            return key.toString();
        }

        if (mapping.mappings[organizationCategory]) {
            return mapping.mappings[organizationCategory]!;
        }

        return mapping.defaultTerm;
    };

    // Simple function to check permissions - replace with your actual logic
    const hasPermission = (permission: string): boolean => {
        // For admin/owner, allow everything
        if (user?.role === 'admin' || user?.role === 'owner') {
            return true;
        }

        // Add your actual permission checking logic here
        return false;
    };

    // Create the context value
    const contextValue = useMemo(() => ({
        organizationCategory,
        menuItems,
        getTerminology,
        hasPermission,
    }), [organizationCategory, menuItems]);

    return (
        <MenuContext.Provider value={contextValue}>
            {children}
        </MenuContext.Provider>
    );
};

/**
 * Hook to use the menu context
 */
export const useMenu = (): MenuContextType => {
    const context = useContext(MenuContext);

    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }

    return context;
};