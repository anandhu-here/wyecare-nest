import { OrganizationCategory } from '../types/organization.interface';
import {
  TerminologyConfiguration,
  TerminologyKey,
} from '../types/terminology.interface';

/**
 * Default terminology configuration
 * This defines how different terms are used based on organization category
 */
export const terminologyConfig: TerminologyConfiguration = {
  mappings: [
    // Subject-related terminology
    {
      key: TerminologyKey.SUBJECT,
      defaultTerm: 'Subject',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Patient',
        [OrganizationCategory.CARE_HOME]: 'Resident',
        [OrganizationCategory.EDUCATION]: 'Student',
        [OrganizationCategory.RETAIL]: 'Customer',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Client',
        [OrganizationCategory.FINANCIAL]: 'Client',
      },
    },
    {
      key: TerminologyKey.SUBJECTS,
      defaultTerm: 'Subjects',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Patients',
        [OrganizationCategory.CARE_HOME]: 'Residents',
        [OrganizationCategory.EDUCATION]: 'Students',
        [OrganizationCategory.RETAIL]: 'Customers',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Clients',
        [OrganizationCategory.FINANCIAL]: 'Clients',
      },
    },
    {
      key: TerminologyKey.SUBJECT_MANAGEMENT,
      defaultTerm: 'Subject Management',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Patient Management',
        [OrganizationCategory.CARE_HOME]: 'Resident Management',
        [OrganizationCategory.EDUCATION]: 'Student Management',
        [OrganizationCategory.RETAIL]: 'Customer Management',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Client Management',
        [OrganizationCategory.FINANCIAL]: 'Client Management',
      },
    },
    {
      key: TerminologyKey.SUBJECT_PROFILE,
      defaultTerm: 'Subject Profile',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Patient Profile',
        [OrganizationCategory.CARE_HOME]: 'Resident Profile',
        [OrganizationCategory.EDUCATION]: 'Student Profile',
        [OrganizationCategory.RETAIL]: 'Customer Profile',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Client Profile',
        [OrganizationCategory.FINANCIAL]: 'Client Profile',
      },
    },
    {
      key: TerminologyKey.SUBJECT_RECORDS,
      defaultTerm: 'Subject Records',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Patient Records',
        [OrganizationCategory.CARE_HOME]: 'Resident Records',
        [OrganizationCategory.EDUCATION]: 'Student Records',
        [OrganizationCategory.RETAIL]: 'Customer Records',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Client Records',
        [OrganizationCategory.FINANCIAL]: 'Client Records',
      },
    },

    // Service-related terminology
    {
      key: TerminologyKey.SERVICE_PLAN,
      defaultTerm: 'Service Plan',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Treatment Plan',
        [OrganizationCategory.CARE_HOME]: 'Care Plan',
        [OrganizationCategory.EDUCATION]: 'Learning Plan',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Service Agreement',
      },
    },
    {
      key: TerminologyKey.SERVICE_PLANS,
      defaultTerm: 'Service Plans',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Treatment Plans',
        [OrganizationCategory.CARE_HOME]: 'Care Plans',
        [OrganizationCategory.EDUCATION]: 'Learning Plans',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Service Agreements',
      },
    },
    {
      key: TerminologyKey.SERVICE_NOTE,
      defaultTerm: 'Service Note',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Note',
        [OrganizationCategory.CARE_HOME]: 'Care Note',
        [OrganizationCategory.EDUCATION]: 'Progress Note',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Service Note',
      },
    },
    {
      key: TerminologyKey.SERVICE_NOTES,
      defaultTerm: 'Service Notes',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Notes',
        [OrganizationCategory.CARE_HOME]: 'Care Notes',
        [OrganizationCategory.EDUCATION]: 'Progress Notes',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Service Notes',
      },
    },

    // Health-related terminology
    {
      key: TerminologyKey.HEALTH_RECORD,
      defaultTerm: 'Health Record',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Record',
        [OrganizationCategory.CARE_HOME]: 'Health Record',
      },
    },
    {
      key: TerminologyKey.HEALTH_RECORDS,
      defaultTerm: 'Health Records',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Records',
        [OrganizationCategory.CARE_HOME]: 'Health Records',
      },
    },
    {
      key: TerminologyKey.MEDICATION,
      defaultTerm: 'Medication',
      mappings: {},
    },
    {
      key: TerminologyKey.MEDICATIONS,
      defaultTerm: 'Medications',
      mappings: {},
    },

    // Location-related terminology
    {
      key: TerminologyKey.LOCATION,
      defaultTerm: 'Location',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Hospital',
        [OrganizationCategory.CARE_HOME]: 'Home',
        [OrganizationCategory.EDUCATION]: 'School',
        [OrganizationCategory.RETAIL]: 'Store',
      },
    },
    {
      key: TerminologyKey.LOCATIONS,
      defaultTerm: 'Locations',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Hospitals',
        [OrganizationCategory.CARE_HOME]: 'Homes',
        [OrganizationCategory.EDUCATION]: 'Schools',
        [OrganizationCategory.RETAIL]: 'Stores',
      },
    },

    // Provider-related terminology
    {
      key: TerminologyKey.PROVIDER,
      defaultTerm: 'Provider',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Provider',
        [OrganizationCategory.CARE_HOME]: 'Care Agency',
        [OrganizationCategory.EDUCATION]: 'Educational Provider',
        [OrganizationCategory.RETAIL]: 'Supplier',
      },
    },
    {
      key: TerminologyKey.PROVIDERS,
      defaultTerm: 'Providers',
      mappings: {
        [OrganizationCategory.HOSPITAL]: 'Medical Providers',
        [OrganizationCategory.CARE_HOME]: 'Care Agencies',
        [OrganizationCategory.EDUCATION]: 'Educational Providers',
        [OrganizationCategory.RETAIL]: 'Suppliers',
      },
    },

    // Task-related terminology
    {
      key: TerminologyKey.TASK,
      defaultTerm: 'Task',
      mappings: {},
    },
    {
      key: TerminologyKey.TASKS,
      defaultTerm: 'Tasks',
      mappings: {},
    },

    // Group-related terminology
    {
      key: TerminologyKey.GROUP,
      defaultTerm: 'Group',
      mappings: {},
    },
    {
      key: TerminologyKey.GROUPS,
      defaultTerm: 'Groups',
      mappings: {},
    },

    // Schedule-related terminology
    {
      key: TerminologyKey.SCHEDULE,
      defaultTerm: 'Schedule',
      mappings: {},
    },
    {
      key: TerminologyKey.SCHEDULES,
      defaultTerm: 'Schedules',
      mappings: {},
    },

    // Other common terms
    {
      key: TerminologyKey.DASHBOARD,
      defaultTerm: 'Dashboard',
      mappings: {},
    },
    {
      key: TerminologyKey.SETTINGS,
      defaultTerm: 'Settings',
      mappings: {},
    },
    {
      key: TerminologyKey.REPORTS,
      defaultTerm: 'Reports',
      mappings: {},
    },
  ],
};

export default terminologyConfig;
