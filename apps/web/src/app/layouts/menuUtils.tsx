import {
    OrganizationCategory,
    MenuConfiguration,
    MenuItem
} from '@wyecare-monorepo/web-ui';

/**
 * Enhanced filter function for menu items
 * Handles organization categories, permissions, roles, and feature flags
 */
export const filterMenuItems = (
    config: MenuConfiguration,
    category: OrganizationCategory,
    permissions: string[] = [],
    user: any = null,
    settings: any = null,
    legacyType?: string
): MenuItem[] => {
    // Get the user's role
    const userRole = user?.role;

    // Start with all menu items
    const filteredItems: any[] = [];

    // Process each section
    config.sections.forEach((section: any) => {
        // Check if the section applies to the user's organization category
        const sectionCategoryMatch = isCategoryMatch(section.organizationCategories, category);

        // For backward compatibility: check legacy type if specified
        const sectionLegacyTypeMatch = !section.legacyTypes ||
            !legacyType ||
            section.legacyTypes.includes(legacyType);

        if (sectionCategoryMatch && sectionLegacyTypeMatch) {
            // Process items in this section
            section.items.forEach((item: any) => {
                // Check if the item applies to the user's organization category
                const itemCategoryMatch = isCategoryMatch(item.organizationCategories || ['*'], category);

                // Check if the user has the required permissions
                const hasPermission = hasRequiredPermissions(item.requiredPermissions || [], permissions);

                // Check if the item applies to the user's role
                const roleMatch = !item.roles || !userRole || item.roles.includes(userRole);

                // Check if any conditional display logic is satisfied
                const conditionalDisplay = !item.showIf || item.showIf(settings);

                // Add the item if all conditions are met
                if (itemCategoryMatch && hasPermission && roleMatch && conditionalDisplay) {
                    // Resolve the item label based on organization category
                    const label = item.categoryLabels?.[category] || item.label;

                    // Add the item with resolved label
                    filteredItems.push({
                        ...item,
                        label
                    });
                }
            });
        }
    });

    // Sort by order
    return filteredItems.sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Checks if a menu item or section is available for the given organization category
 */
export const isCategoryMatch = (
    itemCategories: OrganizationCategory[] | ['*'],
    userCategory: OrganizationCategory
): boolean => {
    if (itemCategories.includes('*' as never)) {
        return true;
    }

    return (itemCategories as OrganizationCategory[]).includes(userCategory);
};

/**
 * Checks if a user has the permissions required to see a menu item
 */
export const hasRequiredPermissions = (
    requiredPermissions: string[],
    userPermissions: string[]
): boolean => {
    // If no permissions are required, allow access
    if (requiredPermissions.length === 0) {
        return true;
    }

    // Check if the user has at least one of the required permissions
    return requiredPermissions.some(permission => userPermissions.includes(permission));
};

/**
 * Gets the appropriate organization category
 * Handles both new category system and legacy type system
 */
export const getOrganizationCategory = (
    organization: any
): OrganizationCategory => {
    // If the organization has a category, use it
    if (organization?.category) {
        return organization.category as OrganizationCategory;
    }

    // If the organization has a type but no category, map the type to a category
    if (organization?.type) {
        // Map legacy types to categories
        switch (organization.type) {
            case 'agency':
                return OrganizationCategory.SERVICE_PROVIDER;
            case 'home':
                return OrganizationCategory.CARE_HOME;
            default:
                return OrganizationCategory.OTHER;
        }
    }

    // Default to OTHER if neither category nor type is available
    return OrganizationCategory.OTHER;
};

/**
 * Gets the legacy organization type
 * Used for backward compatibility during transition period
 */
export const getOrganizationType = (
    organization: any
): string | undefined => {
    return organization?.type;
};

/**
 * Temporary function to get permissions based on role
 * Replace this with your actual permission logic
 */
export const getUserPermissions = (role?: string): string[] => {
    switch (role) {
        case 'admin':
        case 'owner':
            return [
                'view_dashboard', 'invite_staff', 'view_invoices', 'view_settings',
                'view_staff', 'view_timesheets', 'view_leave_requests',
                'view_subjects', 'edit_subjects'
            ];
        case 'carer':
        case 'nurse':
        case 'senior_carer':
            return [
                'view_dashboard', 'view_subjects', 'view_timesheets'
            ];
        default:
            return [];
    }
};