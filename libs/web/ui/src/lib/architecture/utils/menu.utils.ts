import {
  CategoryChecker,
  MenuConfiguration,
  MenuItem,
  MenuSection,
  PermissionChecker,
} from '../types/layout-menu.interface';
import { OrganizationCategory } from '../types/organization.interface';

/**
 * Checks if a menu item or section is available for the given organization category
 * @param itemCategories Categories the item is available for
 * @param userCategory The user's organization category
 * @returns Whether the item is available for the category
 */
export const isCategoryMatch: CategoryChecker = (
  itemCategories: OrganizationCategory[] | ['*'],
  userCategory: OrganizationCategory
): boolean => {
  // If the item is available for all categories, return true
  if (itemCategories.includes('*' as never)) {
    return true;
  }

  // Otherwise, check if the user's category is in the list
  return (itemCategories as OrganizationCategory[]).includes(userCategory);
};

/**
 * Checks if a user has the permissions required to see a menu item
 * @param requiredPermissions Permissions required to see the item
 * @param userPermissions Permissions the user has
 * @returns Whether the user has the required permissions
 */
export const hasRequiredPermissions: PermissionChecker = (
  requiredPermissions: string[],
  userPermissions: string[]
): boolean => {
  // If no permissions are required, allow access
  if (requiredPermissions.length === 0) {
    return true;
  }

  // Check if the user has at least one of the required permissions
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

/**
 * Resolves the label for a menu item based on the organization category
 * @param item The menu item
 * @param category The organization category
 * @returns The resolved label
 */
export const resolveMenuItemLabel = (
  item: MenuItem,
  category: OrganizationCategory
): string => {
  // If the item has a category-specific label, use it
  if (item.categoryLabels && item.categoryLabels[category]) {
    return item.categoryLabels[category]!;
  }

  // Otherwise, use the default label
  return item.label;
};

/**
 * Resolves the label for a menu section based on the organization category
 * @param section The menu section
 * @param category The organization category
 * @returns The resolved label
 */
export const resolveMenuSectionLabel = (
  section: MenuSection,
  category: OrganizationCategory
): string => {
  // If the section has a category-specific label, use it
  if (section.categoryLabels && section.categoryLabels[category]) {
    return section.categoryLabels[category]!;
  }

  // Otherwise, use the default label
  return section.label;
};

/**
 * Filters a menu configuration based on organization category and user permissions
 * @param config The menu configuration
 * @param category The organization category
 * @param permissions The user's permissions
 * @returns Filtered menu items
 */
export const filterMenuItems = (
  config: MenuConfiguration,
  category: OrganizationCategory,
  permissions: string[]
): MenuItem[] => {
  // Filter sections that match the organization category
  const filteredSections = config.sections
    .filter((section: any) =>
      isCategoryMatch(section.organizationCategories, category)
    )
    .map((section: any) => ({
      ...section,
      // Resolve the section label
      label: resolveMenuSectionLabel(section, category),
      // Filter items that match the organization category and permissions
      items: section.items
        .filter(
          (item: any) =>
            isCategoryMatch(item.organizationCategories, category) &&
            hasRequiredPermissions(item.requiredPermissions, permissions)
        )
        .map((item: any) => ({
          ...item,
          // Resolve the item label
          label: resolveMenuItemLabel(item, category),
          // Recursively filter children if they exist
          children: item.children
            ? item.children
                .filter(
                  (child: any) =>
                    isCategoryMatch(child.organizationCategories, category) &&
                    hasRequiredPermissions(
                      child.requiredPermissions,
                      permissions
                    )
                )
                .map((child: any) => ({
                  ...child,
                  label: resolveMenuItemLabel(child, category),
                }))
                .sort((a: any, b: any) => a.order - b.order)
            : undefined,
        }))
        .sort((a: any, b: any) => a.order - b.order),
    }))
    .filter((section: any) => section.items.length > 0) // Remove empty sections
    .sort((a: any, b: any) => a.order - b.order);

  // Flatten sections into a single list of menu items
  return filteredSections.flatMap((section: any) => section.items);
};

/**
 * Checks if a route is accessible to a user
 * @param path The route path
 * @param category The organization category
 * @param permissions The user's permissions
 * @param menuItems All menu items
 * @returns Whether the route is accessible
 */
export const isRouteAccessible = (
  path: string,
  category: OrganizationCategory,
  permissions: string[],
  menuItems: MenuItem[]
): boolean => {
  // Flatten all menu items (including children) into a single list
  const flattenedItems: MenuItem[] = [];

  const flattenItems = (items: MenuItem[]) => {
    items.forEach((item) => {
      flattenedItems.push(item);
      if (item.children) {
        flattenItems(item.children);
      }
    });
  };

  flattenItems(menuItems);

  // Find the item that matches the path
  const matchingItem = flattenedItems.find((item) => item.path === path);

  // If no matching item is found, allow access (it's not a menu-controlled route)
  if (!matchingItem) {
    return true;
  }

  // Check if the item is accessible
  return (
    isCategoryMatch(matchingItem.organizationCategories, category) &&
    hasRequiredPermissions(matchingItem.requiredPermissions, permissions)
  );
};

/**
 * Creates a breadcrumb trail for a route
 * @param path The current route path
 * @param menuItems All menu items
 * @param category The organization category
 * @returns An array of breadcrumb items
 */
export const createBreadcrumbs = (
  path: string,
  menuItems: MenuItem[],
  category: OrganizationCategory
): { label: string; path: string }[] => {
  const breadcrumbs: { label: string; path: string }[] = [];
  const pathSegments = path.split('/').filter(Boolean);

  let currentPath = '';
  let currentItems = menuItems;

  // Build breadcrumbs for each path segment
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;

    // Find matching item at current level
    const matchingItem = currentItems.find(
      (item) => item.path === currentPath || item.path.endsWith(`/${segment}`)
    );

    if (matchingItem) {
      breadcrumbs.push({
        label: resolveMenuItemLabel(matchingItem, category),
        path: matchingItem.path,
      });

      // Move to next level of children
      currentItems = matchingItem.children || [];
    }
  }

  return breadcrumbs;
};

/**
 * Extracts all route permissions from the menu configuration
 * @param config The menu configuration
 * @returns An array of route permissions
 */
export const extractRoutePermissions = (
  config: MenuConfiguration
): {
  path: string;
  requiredPermissions: string[];
  organizationCategories: OrganizationCategory[] | ['*'];
}[] => {
  const routePermissions: {
    path: string;
    requiredPermissions: string[];
    organizationCategories: OrganizationCategory[] | ['*'];
  }[] = [];

  // Extract permissions from all menu items
  const extractFromItems = (items: MenuItem[]) => {
    items.forEach((item) => {
      routePermissions.push({
        path: item.path,
        requiredPermissions: item.requiredPermissions,
        organizationCategories: item.organizationCategories,
      });

      if (item.children) {
        extractFromItems(item.children);
      }
    });
  };

  // Process all sections
  config.sections.forEach((section: any) => {
    extractFromItems(section.items);
  });

  return routePermissions;
};

/**
 * Finds the menu item that matches a given path
 * @param path The route path
 * @param menuItems All menu items
 * @returns The matching menu item, or undefined if not found
 */
export const findMenuItemByPath = (
  path: string,
  menuItems: MenuItem[]
): MenuItem | undefined => {
  // Check top level items
  for (const item of menuItems) {
    if (item.path === path) {
      return item;
    }

    // Check children if they exist
    if (item.children) {
      const childMatch = findMenuItemByPath(path, item.children);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return undefined;
};
