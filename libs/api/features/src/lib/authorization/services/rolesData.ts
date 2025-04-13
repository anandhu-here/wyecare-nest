export const rolesData = [
  // Management roles
  {
    id: 'owner',
    name: 'Owner',
    description: 'Organization owner with full access',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 1, // Highest authority
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Organization administrator with broad access',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 2,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Department or team manager',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 3,
  },

  // Clinical roles
  {
    id: 'nurse',
    name: 'Nurse',
    description: 'Registered nurse with clinical responsibilities',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 3,
  },
  {
    id: 'senior_carer',
    name: 'Senior Carer',
    description: 'Senior care staff with supervisory duties',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 4,
  },
  {
    id: 'carer',
    name: 'Carer',
    description: 'Care staff providing direct resident care',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 5,
  },

  // Administrative roles
  {
    id: 'admin_staff',
    name: 'Administrative Staff',
    description: 'General administrative personnel',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 4,
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Human resources manager',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 3,
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Financial management staff',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 3,
  },

  // Specialized roles
  {
    id: 'quality_assurance',
    name: 'Quality Assurance',
    description: 'Staff responsible for quality standards',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 3,
  },
  {
    id: 'procurement_officer',
    name: 'Procurement Officer',
    description: 'Staff responsible for purchasing and suppliers',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 4,
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'General staff member',
    contextType: 'ORGANIZATION',
    isSystem: true,
    hierarchyLevel: 6,
  },
  {
    id: 'system_admin',
    name: 'System Administrator',
    description:
      'Top-level system administrator with access to all system functions',
    contextType: 'SYSTEM',
    isSystem: true,
    hierarchyLevel: 0, // Higher than owner (which is 1)
  },
];
