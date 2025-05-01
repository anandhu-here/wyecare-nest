/**
 * Organization category types
 * These represent the different types of organizations supported by the platform
 */
export enum OrganizationCategory {
  HOSPITAL = 'hospital',
  CARE_HOME = 'care_home',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  SOCIAL_SERVICES = 'social_services',
  RETAIL = 'retail',
  SERVICE_PROVIDER = 'service_provider',
  SOFTWARE_COMPANY = 'software_company',
  MANUFACTURING = 'manufacturing',
  LOGISTICS = 'logistics',
  CONSTRUCTION = 'construction',
  FINANCIAL = 'financial',
  HOSPITALITY = 'hospitality',
  OTHER = 'other',
  PROFESSIONAL_SERVICES = 'professional_services',
}

/**
 * Legacy organization type (being phased out)
 */
export enum OrganizationType {
  AGENCY = 'agency',
  HOME = 'home',
  OTHER = 'other',
}

/**
 * Organization category features that determine available functionality
 */
export enum OrganizationFeature {
  // Subject management features
  SUBJECT_MANAGEMENT = 'subject_management',
  HEALTH_RECORDS = 'health_records',
  MEDICATION_MANAGEMENT = 'medication_management',
  SERVICE_PLANS = 'service_plans',

  // Staff management features
  SHIFT_MANAGEMENT = 'shift_management',
  LEAVE_MANAGEMENT = 'leave_management',
  TIMESHEET_MANAGEMENT = 'timesheet_management',

  // Business features
  INVENTORY_MANAGEMENT = 'inventory_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  SUPPLIER_MANAGEMENT = 'supplier_management',

  // Communication features
  CHAT = 'chat',
  NOTIFICATIONS = 'notifications',

  // Administrative features
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  REPORT_GENERATION = 'report_generation',
}

/**
 * Map of organization categories to their default features
 */
export const DEFAULT_ORGANIZATION_FEATURES: Record<
  OrganizationCategory,
  OrganizationFeature[]
> = {
  [OrganizationCategory.HOSPITAL]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.HEALTH_RECORDS,
    OrganizationFeature.MEDICATION_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.CARE_HOME]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.HEALTH_RECORDS,
    OrganizationFeature.MEDICATION_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.EDUCATION]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.HEALTHCARE]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.HEALTH_RECORDS,
    OrganizationFeature.MEDICATION_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.SOCIAL_SERVICES]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.RETAIL]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.INVENTORY_MANAGEMENT,
    OrganizationFeature.FINANCIAL_MANAGEMENT,
    OrganizationFeature.SUPPLIER_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.SERVICE_PROVIDER]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.SOFTWARE_COMPANY]: [
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.MANUFACTURING]: [
    OrganizationFeature.INVENTORY_MANAGEMENT,
    OrganizationFeature.SUPPLIER_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.LOGISTICS]: [
    OrganizationFeature.INVENTORY_MANAGEMENT,
    OrganizationFeature.SUPPLIER_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.CONSTRUCTION]: [
    OrganizationFeature.INVENTORY_MANAGEMENT,
    OrganizationFeature.SUPPLIER_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.FINANCIAL]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.FINANCIAL_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.HOSPITALITY]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.INVENTORY_MANAGEMENT,
    OrganizationFeature.SUPPLIER_MANAGEMENT,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
  [OrganizationCategory.OTHER]: [
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],

  [OrganizationCategory.PROFESSIONAL_SERVICES]: [
    OrganizationFeature.SUBJECT_MANAGEMENT,
    OrganizationFeature.SERVICE_PLANS,
    OrganizationFeature.SHIFT_MANAGEMENT,
    OrganizationFeature.LEAVE_MANAGEMENT,
    OrganizationFeature.TIMESHEET_MANAGEMENT,
    OrganizationFeature.USER_MANAGEMENT,
    OrganizationFeature.ROLE_MANAGEMENT,
    OrganizationFeature.REPORT_GENERATION,
    OrganizationFeature.CHAT,
    OrganizationFeature.NOTIFICATIONS,
  ],
};
