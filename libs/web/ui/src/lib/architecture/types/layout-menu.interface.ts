import { OrganizationCategory } from './organization.interface';

/**
 * Menu item interface
 * Represents a single menu item in the navigation structure
 */
export interface MenuItem {
  // Unique identifier for the menu item
  id: string;

  // Display label for the menu item
  label: string;

  // Icon identifier (corresponds to icon library being used)
  icon?: string;

  // Route path for navigation
  path: string;

  // Permissions required to see this menu item
  requiredPermissions: string[];

  // Organization categories this menu item applies to
  // Use ['*'] for all categories
  organizationCategories: OrganizationCategory[] | ['*'];

  // Custom labels by organization category
  categoryLabels?: Partial<Record<OrganizationCategory, string>>;

  // Children for nested menus
  children?: MenuItem[];

  // Order for sorting (lower numbers appear first)
  order: number;

  // Whether this item is visible in the main navigation
  // Set to false for items that should only be accessible programmatically
  visibleInNav?: boolean;

  // Whether this is a pro/premium feature
  isPremium?: boolean;

  // Additional metadata for the menu item
  metadata?: Record<string, any>;
}

/**
 * Menu section interface
 * Used for grouping menu items into logical sections
 */
export interface MenuSection {
  // Unique identifier for the section
  id: string;

  // Display label for the section
  label: string;

  // Icon identifier (corresponds to icon library being used)
  icon?: string;

  // Menu items within this section
  items: MenuItem[];

  // Organization categories this section applies to
  // Use ['*'] for all categories
  organizationCategories: OrganizationCategory[] | ['*'];

  // Custom labels by organization category
  categoryLabels?: Partial<Record<OrganizationCategory, string>>;

  // Order for sorting (lower numbers appear first)
  order: number;

  // Whether this section is collapsible
  collapsible?: boolean;

  // Whether this section is expanded by default
  defaultExpanded?: boolean;

  // Whether this is a pro/premium section
  isPremium?: boolean;
}

/**
 * Complete menu configuration
 */
export interface MenuConfiguration {
  sections: MenuSection[];
}

/**
 * Helper type for route guards
 */
export interface RoutePermission {
  path: string;
  requiredPermissions: string[];
  organizationCategories: OrganizationCategory[] | ['*'];
}

/**
 * Menu resolver function type
 * Used to filter menu items based on permissions and org category
 */
export type MenuResolver = (
  config: MenuConfiguration,
  category: OrganizationCategory,
  permissions: string[]
) => MenuItem[];

/**
 * Type for a function that checks if a permission is available
 */
export type PermissionChecker = (
  requiredPermissions: string[],
  userPermissions: string[]
) => boolean;

/**
 * Type for a function that checks if a menu item is available for a category
 */
export type CategoryChecker = (
  itemCategories: OrganizationCategory[] | ['*'],
  userCategory: OrganizationCategory
) => boolean;
