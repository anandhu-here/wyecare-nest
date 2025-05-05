// apps/api/prisma/seed.ts
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:microfarad@localhost:5432/ethakka?schema=public',
    },
  },
});

const hospitalPermissions = [
  // ShiftType permissions
  { action: 'create', subject: 'ShiftType', description: 'Create shift types' },
  { action: 'read', subject: 'ShiftType', description: 'View shift types' },
  { action: 'update', subject: 'ShiftType', description: 'Update shift types' },
  { action: 'delete', subject: 'ShiftType', description: 'Delete shift types' },

  // StaffProfile permissions
  {
    action: 'create',
    subject: 'StaffProfile',
    description: 'Create staff profiles',
  },
  {
    action: 'read',
    subject: 'StaffProfile',
    description: 'View staff profiles',
  },
  {
    action: 'update',
    subject: 'StaffProfile',
    description: 'Update staff profiles',
  },
  {
    action: 'delete',
    subject: 'StaffProfile',
    description: 'Delete staff profiles',
  },

  // ShiftSchedule permissions
  {
    action: 'create',
    subject: 'ShiftSchedule',
    description: 'Create shift schedules',
  },
  {
    action: 'read',
    subject: 'ShiftSchedule',
    description: 'View shift schedules',
  },
  {
    action: 'update',
    subject: 'ShiftSchedule',
    description: 'Update shift schedules',
  },
  {
    action: 'delete',
    subject: 'ShiftSchedule',
    description: 'Delete shift schedules',
  },

  // ShiftAttendance permissions
  {
    action: 'create',
    subject: 'ShiftAttendance',
    description: 'Create shift attendance records',
  },
  {
    action: 'read',
    subject: 'ShiftAttendance',
    description: 'View shift attendance records',
  },
  {
    action: 'update',
    subject: 'ShiftAttendance',
    description: 'Update shift attendance records',
  },
  {
    action: 'delete',
    subject: 'ShiftAttendance',
    description: 'Delete shift attendance records',
  },

  // PayPeriod permissions
  { action: 'create', subject: 'PayPeriod', description: 'Create pay periods' },
  { action: 'read', subject: 'PayPeriod', description: 'View pay periods' },
  { action: 'update', subject: 'PayPeriod', description: 'Update pay periods' },
  { action: 'delete', subject: 'PayPeriod', description: 'Delete pay periods' },

  // StaffPayment permissions
  {
    action: 'create',
    subject: 'StaffPayment',
    description: 'Create staff payments',
  },
  {
    action: 'read',
    subject: 'StaffPayment',
    description: 'View staff payments',
  },
  {
    action: 'update',
    subject: 'StaffPayment',
    description: 'Update staff payments',
  },
  {
    action: 'delete',
    subject: 'StaffPayment',
    description: 'Delete staff payments',
  },
];

async function seedHospitalData(prisma: any) {
  // Create standard shift types for the hospital organization
  const hospitalOrg = await prisma.organization.findFirst({
    where: { category: 'HEALTHCARE' },
  });

  if (hospitalOrg) {
    // Morning shift
    await prisma.shiftType.upsert({
      where: {
        name_organizationId: {
          name: 'Morning Shift',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Morning Shift',
        startTime: new Date('2000-01-01T07:00:00Z'),
        endTime: new Date('2000-01-01T15:00:00Z'),
        isOvernight: false,
        hoursCount: 8,
        basePayMultiplier: 1.0,
        description: 'Standard morning shift from 7 AM to 3 PM',
        organizationId: hospitalOrg.id,
      },
    });

    // Evening shift
    await prisma.shiftType.upsert({
      where: {
        name_organizationId: {
          name: 'Evening Shift',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Evening Shift',
        startTime: new Date('2000-01-01T15:00:00Z'),
        endTime: new Date('2000-01-01T23:00:00Z'),
        isOvernight: false,
        hoursCount: 8,
        basePayMultiplier: 1.15,
        description: 'Standard evening shift from 3 PM to 11 PM',
        organizationId: hospitalOrg.id,
      },
    });

    // Night shift
    await prisma.shiftType.upsert({
      where: {
        name_organizationId: {
          name: 'Night Shift',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Night Shift',
        startTime: new Date('2000-01-01T23:00:00Z'),
        endTime: new Date('2000-01-01T07:00:00Z'),
        isOvernight: true,
        hoursCount: 8,
        basePayMultiplier: 1.25,
        description: 'Standard night shift from 11 PM to 7 AM',
        organizationId: hospitalOrg.id,
      },
    });

    // On-call shift
    await prisma.shiftType.upsert({
      where: {
        name_organizationId: {
          name: 'On-Call',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'On-Call',
        startTime: new Date('2000-01-01T00:00:00Z'),
        endTime: new Date('2000-01-01T00:00:00Z'),
        isOvernight: false,
        hoursCount: 24,
        basePayMultiplier: 0.5,
        description: 'On-call duty for 24 hours',
        organizationId: hospitalOrg.id,
      },
    });

    // Create hospital roles
    // Doctor role
    const doctorRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Doctor',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Doctor',
        description: 'Medical doctor with patient care responsibilities',
        isSystemRole: false,
        organizationId: hospitalOrg.id,
      },
    });

    // Nurse role
    const nurseRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Nurse',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Nurse',
        description: 'Registered nurse providing patient care',
        isSystemRole: false,
        organizationId: hospitalOrg.id,
      },
    });

    // Department Head role
    const deptHeadRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Department Head',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Department Head',
        description: 'Leads a clinical department and manages staff',
        isSystemRole: false,
        organizationId: hospitalOrg.id,
      },
    });

    // Scheduler role
    const schedulerRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Scheduler',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Scheduler',
        description: 'Manages staff scheduling and shift assignments',
        isSystemRole: false,
        organizationId: hospitalOrg.id,
      },
    });

    // Hospital Admin role
    const hospitalAdminRole = await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: 'Hospital Admin',
          organizationId: hospitalOrg.id,
        },
      },
      update: {},
      create: {
        name: 'Hospital Admin',
        description: 'Hospital administrator with full system access',
        isSystemRole: false,
        organizationId: hospitalOrg.id,
      },
    });
  }
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create default permissions
  const permissions = await Promise.all([
    // Organization permissions
    prisma.permission.create({
      data: {
        action: 'create',
        subject: 'Organization',
        description: 'Create organizations',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'read',
        subject: 'Organization',
        description: 'Read organizations',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'update',
        subject: 'Organization',
        description: 'Update organizations',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'delete',
        subject: 'Organization',
        description: 'Delete organizations',
      },
    }),

    // User permissions
    prisma.permission.create({
      data: { action: 'create', subject: 'User', description: 'Create users' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'User', description: 'Read users' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'User', description: 'Update users' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'User', description: 'Delete users' },
    }),

    // Role permissions
    prisma.permission.create({
      data: { action: 'create', subject: 'Role', description: 'Create roles' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'Role', description: 'Read roles' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'Role', description: 'Update roles' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'Role', description: 'Delete roles' },
    }),

    // Hospital-specific permissions
    prisma.permission.create({
      data: {
        action: 'create',
        subject: 'Patient',
        description: 'Create patients',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'read',
        subject: 'Patient',
        description: 'Read patients',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'update',
        subject: 'Patient',
        description: 'Update patients',
      },
    }),
    prisma.permission.create({
      data: {
        action: 'delete',
        subject: 'Patient',
        description: 'Delete patients',
      },
    }),
  ]);

  console.log(`Created ${permissions.length} permissions`);

  // Create default roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'System-wide administrator with all permissions',
      isSystemRole: true,
    },
  });

  const orgAdminRole = await prisma.role.create({
    data: {
      name: 'Organization Admin',
      description: 'Administrator for a specific organization',
      isSystemRole: true,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'Staff',
      description: 'Basic staff role',
      isSystemRole: true,
    },
  });

  console.log(`Created default roles`);

  // Assign permissions to roles
  // Assign all permissions to admin role
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign organization and user permissions to org admin
  const orgAdminPermissions = permissions.filter(
    (p) =>
      (p.subject === 'Organization' ||
        p.subject === 'User' ||
        p.subject === 'Role') &&
      p.action !== 'delete'
  );

  for (const permission of orgAdminPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: orgAdminRole.id,
        permissionId: permission.id,
        conditions: { organizationId: { $eq: '$user.organizationId' } },
      },
    });
  }

  // Assign read permissions to staff
  const staffPermissions = permissions.filter((p) => p.action === 'read');

  for (const permission of staffPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: staffRole.id,
        permissionId: permission.id,
        conditions:
          permission.subject !== 'Organization'
            ? { organizationId: { $eq: '$user.organizationId' } }
            : undefined,
      },
    });
  }

  for (const perm of hospitalPermissions) {
    await prisma.permission.upsert({
      where: {
        action_subject: {
          action: perm.action,
          subject: perm.subject,
        },
      },
      update: {
        description: perm.description,
      },
      create: {
        action: perm.action,
        subject: perm.subject,
        description: perm.description,
      },
    });
  }

  console.log(`Assigned permissions to roles`);

  // Create a default organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Hospital',
      category: 'HOSPITAL',
      description: 'Demo hospital for testing',
      email: 'admin@demohospital.com',
      phone: '123-456-7890',
    },
  });

  console.log(`Created demo organization`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      organizationId: organization.id,
    },
  });

  // Assign super admin role to admin user
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await seedHospitalData(prisma);

  console.log(`Created admin user`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
