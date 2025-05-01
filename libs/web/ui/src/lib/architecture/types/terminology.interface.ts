import { OrganizationCategory } from './organization.interface';

/**
 * Terminology key enum
 * These are the standard terminology keys used across the system
 */
export enum TerminologyKey {
  // Subject-related terminology
  SUBJECT = 'subject',
  SUBJECTS = 'subjects',
  SUBJECT_MANAGEMENT = 'subject_management',
  SUBJECT_PROFILE = 'subject_profile',
  SUBJECT_RECORDS = 'subject_records',

  // Service-related terminology
  SERVICE_PLAN = 'service_plan',
  SERVICE_PLANS = 'service_plans',
  SERVICE_NOTE = 'service_note',
  SERVICE_NOTES = 'service_notes',

  // Health-related terminology
  HEALTH_RECORD = 'health_record',
  HEALTH_RECORDS = 'health_records',
  MEDICATION = 'medication',
  MEDICATIONS = 'medications',

  // Location-related terminology
  LOCATION = 'location',
  LOCATIONS = 'locations',

  // Provider-related terminology
  PROVIDER = 'provider',
  PROVIDERS = 'providers',

  // Task-related terminology
  TASK = 'task',
  TASKS = 'tasks',

  // Group-related terminology
  GROUP = 'group',
  GROUPS = 'groups',

  // Schedule-related terminology
  SCHEDULE = 'schedule',
  SCHEDULES = 'schedules',

  // Other common terms
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  REPORTS = 'reports',
}

/**
 * Terminology mapping interface
 * Maps a standard terminology key to category-specific terms
 */
export interface TerminologyMapping {
  // The standard terminology key
  key: TerminologyKey;

  // The default term to use when no category-specific mapping exists
  defaultTerm: string;

  // Category-specific term mappings
  mappings: Partial<Record<OrganizationCategory, string>>;
}

/**
 * Complete terminology configuration
 */
export interface TerminologyConfiguration {
  mappings: TerminologyMapping[];
}

/**
 * Type for a function that resolves the correct term based on organization category
 */
export type TerminologyResolver = (
  key: TerminologyKey,
  category: OrganizationCategory
) => string;

/**
 * Helper interface for dynamic field labels
 */
export interface DynamicFieldLabel {
  key: string;
  defaultLabel: string;
  categoryLabels: Partial<Record<OrganizationCategory, string>>;
}
