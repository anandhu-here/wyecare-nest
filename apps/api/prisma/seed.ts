const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:microfarad@localhost:5432/ethakka?schema=public',
    },
  },
});

/**
 * Comprehensive seed file for roles and permissions
 * Only creates roles and permissions, no users or organizations
 */
async function main() {
  console.log('Starting database seeding process...');

  try {
    console.log('Creating permissions...');

    // Define core permissions
    const corePermissions = [
      // Organization permissions
      {
        action: 'create',
        subject: 'Organization',
        description: 'Create organizations',
      },
      {
        action: 'read',
        subject: 'Organization',
        description: 'View organizations',
      },
      {
        action: 'update',
        subject: 'Organization',
        description: 'Update organizations',
      },
      {
        action: 'delete',
        subject: 'Organization',
        description: 'Delete organizations',
      },
      {
        action: 'manage',
        subject: 'Organization',
        description: 'Full control over organizations',
      },

      // User permissions
      { action: 'create', subject: 'User', description: 'Create users' },
      { action: 'read', subject: 'User', description: 'View users' },
      { action: 'update', subject: 'User', description: 'Update users' },
      { action: 'delete', subject: 'User', description: 'Delete users' },
      {
        action: 'manage',
        subject: 'User',
        description: 'Full control over users',
      },

      // Role permissions
      { action: 'create', subject: 'Role', description: 'Create roles' },
      { action: 'read', subject: 'Role', description: 'View roles' },
      { action: 'update', subject: 'Role', description: 'Update roles' },
      { action: 'delete', subject: 'Role', description: 'Delete roles' },
      {
        action: 'manage',
        subject: 'Role',
        description: 'Full control over roles',
      },

      // Permission management
      {
        action: 'create',
        subject: 'Permission',
        description: 'Create permissions',
      },
      {
        action: 'read',
        subject: 'Permission',
        description: 'View permissions',
      },
      {
        action: 'update',
        subject: 'Permission',
        description: 'Update permissions',
      },
      {
        action: 'delete',
        subject: 'Permission',
        description: 'Delete permissions',
      },
      {
        action: 'manage',
        subject: 'Permission',
        description: 'Full control over permissions',
      },

      // Department permissions
      {
        action: 'create',
        subject: 'Department',
        description: 'Create departments',
      },
      {
        action: 'read',
        subject: 'Department',
        description: 'View departments',
      },
      {
        action: 'update',
        subject: 'Department',
        description: 'Update departments',
      },
      {
        action: 'delete',
        subject: 'Department',
        description: 'Delete departments',
      },
      {
        action: 'manage',
        subject: 'Department',
        description: 'Full control over departments',
      },

      // Invitation permissions
      {
        action: 'create',
        subject: 'Invitation',
        description: 'Create invitations',
      },
      {
        action: 'read',
        subject: 'Invitation',
        description: 'View invitations',
      },
      {
        action: 'update',
        subject: 'Invitation',
        description: 'Update invitations',
      },
      {
        action: 'delete',
        subject: 'Invitation',
        description: 'Delete invitations',
      },
      {
        action: 'manage',
        subject: 'Invitation',
        description: 'Full control over invitations',
      },
    ];

    // Define healthcare-specific permissions
    const healthcarePermissions = [
      // Patient permissions
      { action: 'create', subject: 'Patient', description: 'Create patients' },
      { action: 'read', subject: 'Patient', description: 'View patients' },
      { action: 'update', subject: 'Patient', description: 'Update patients' },
      { action: 'delete', subject: 'Patient', description: 'Delete patients' },
      {
        action: 'manage',
        subject: 'Patient',
        description: 'Full control over patients',
      },

      // Medical Record permissions
      {
        action: 'create',
        subject: 'MedicalRecord',
        description: 'Create medical records',
      },
      {
        action: 'read',
        subject: 'MedicalRecord',
        description: 'View medical records',
      },
      {
        action: 'update',
        subject: 'MedicalRecord',
        description: 'Update medical records',
      },
      {
        action: 'delete',
        subject: 'MedicalRecord',
        description: 'Delete medical records',
      },
      {
        action: 'manage',
        subject: 'MedicalRecord',
        description: 'Full control over medical records',
      },

      // Appointment permissions
      {
        action: 'create',
        subject: 'Appointment',
        description: 'Create appointments',
      },
      {
        action: 'read',
        subject: 'Appointment',
        description: 'View appointments',
      },
      {
        action: 'update',
        subject: 'Appointment',
        description: 'Update appointments',
      },
      {
        action: 'delete',
        subject: 'Appointment',
        description: 'Delete appointments',
      },
      {
        action: 'manage',
        subject: 'Appointment',
        description: 'Full control over appointments',
      },

      // ShiftType permissions
      {
        action: 'create',
        subject: 'ShiftType',
        description: 'Create shift types',
      },
      { action: 'read', subject: 'ShiftType', description: 'View shift types' },
      {
        action: 'update',
        subject: 'ShiftType',
        description: 'Update shift types',
      },
      {
        action: 'delete',
        subject: 'ShiftType',
        description: 'Delete shift types',
      },
      {
        action: 'manage',
        subject: 'ShiftType',
        description: 'Full control over shift types',
      },

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
      {
        action: 'manage',
        subject: 'StaffProfile',
        description: 'Full control over staff profiles',
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
      {
        action: 'manage',
        subject: 'ShiftSchedule',
        description: 'Full control over shift schedules',
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
      {
        action: 'manage',
        subject: 'ShiftAttendance',
        description: 'Full control over shift attendance',
      },

      // PayPeriod permissions
      {
        action: 'create',
        subject: 'PayPeriod',
        description: 'Create pay periods',
      },
      { action: 'read', subject: 'PayPeriod', description: 'View pay periods' },
      {
        action: 'update',
        subject: 'PayPeriod',
        description: 'Update pay periods',
      },
      {
        action: 'delete',
        subject: 'PayPeriod',
        description: 'Delete pay periods',
      },
      {
        action: 'manage',
        subject: 'PayPeriod',
        description: 'Full control over pay periods',
      },

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
      {
        action: 'manage',
        subject: 'StaffPayment',
        description: 'Full control over staff payments',
      },
    ];

    // Combine all permissions
    const allPermissions = [...corePermissions, ...healthcarePermissions];

    // Create or update permissions
    const permissionMap = new Map();
    for (const permission of allPermissions) {
      const existingPermission = await prisma.permission.findUnique({
        where: {
          action_subject: {
            action: permission.action,
            subject: permission.subject,
          },
        },
      });

      let permissionRecord;
      if (existingPermission) {
        // Update existing permission
        permissionRecord = await prisma.permission.update({
          where: {
            id: existingPermission.id,
          },
          data: {
            description: permission.description,
          },
        });
        console.log(
          `Updated permission: ${permission.action} ${permission.subject}`
        );
      } else {
        // Create new permission
        permissionRecord = await prisma.permission.create({
          data: {
            action: permission.action,
            subject: permission.subject,
            description: permission.description,
          },
        });
        console.log(
          `Created permission: ${permission.action} ${permission.subject}`
        );
      }

      // Store the permission for later use when assigning to roles
      const key = `${permission.action}_${permission.subject}`;
      permissionMap.set(key, permissionRecord);
    }

    console.log(`Processed ${allPermissions.length} permissions`);

    // Create or update system roles
    console.log('Creating or updating system roles...');

    // Super Admin role with all permissions
    let superAdminRole = await prisma.role.findFirst({
      where: {
        name: 'Super Admin',
        isSystemRole: true,
      },
    });

    if (superAdminRole) {
      console.log('Super Admin role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: superAdminRole.id,
        },
      });
    } else {
      superAdminRole = await prisma.role.create({
        data: {
          name: 'Super Admin',
          description: 'System-wide administrator with all permissions',
          isSystemRole: true,
        },
      });
      console.log('Created Super Admin role');
    }

    // Organization Admin role
    let orgAdminRole = await prisma.role.findFirst({
      where: {
        name: 'Organization Admin',
        isSystemRole: true,
      },
    });

    if (orgAdminRole) {
      console.log('Organization Admin role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: orgAdminRole.id,
        },
      });
    } else {
      orgAdminRole = await prisma.role.create({
        data: {
          name: 'Organization Admin',
          description: 'Administrator for a specific organization',
          isSystemRole: true,
        },
      });
      console.log('Created Organization Admin role');
    }

    // Staff Member role
    let staffRole = await prisma.role.findFirst({
      where: {
        name: 'Staff Member',
        isSystemRole: true,
      },
    });

    if (staffRole) {
      console.log('Staff Member role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: staffRole.id,
        },
      });
    } else {
      staffRole = await prisma.role.create({
        data: {
          name: 'Staff Member',
          description: 'Basic staff role with limited permissions',
          isSystemRole: true,
        },
      });
      console.log('Created Staff Member role');
    }

    // Doctor role
    let doctorRole = await prisma.role.findFirst({
      where: {
        name: 'Doctor',
        isSystemRole: true,
      },
    });

    if (doctorRole) {
      console.log('Doctor role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: doctorRole.id,
        },
      });
    } else {
      doctorRole = await prisma.role.create({
        data: {
          name: 'Doctor',
          description: 'Medical doctor with patient care responsibilities',
          isSystemRole: true,
        },
      });
      console.log('Created Doctor role');
    }

    // Nurse role
    let nurseRole = await prisma.role.findFirst({
      where: {
        name: 'Nurse',
        isSystemRole: true,
      },
    });

    if (nurseRole) {
      console.log('Nurse role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: nurseRole.id,
        },
      });
    } else {
      nurseRole = await prisma.role.create({
        data: {
          name: 'Nurse',
          description: 'Registered nurse providing patient care',
          isSystemRole: true,
        },
      });
      console.log('Created Nurse role');
    }

    // Receptionist role
    let receptionistRole = await prisma.role.findFirst({
      where: {
        name: 'Receptionist',
        isSystemRole: true,
      },
    });

    if (receptionistRole) {
      console.log('Receptionist role already exists');
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: receptionistRole.id,
        },
      });
    } else {
      receptionistRole = await prisma.role.create({
        data: {
          name: 'Receptionist',
          description: 'Front desk staff for patient management',
          isSystemRole: true,
        },
      });
      console.log('Created Receptionist role');
    }

    console.log('Assigning permissions to roles...');

    // Assign all permissions to Super Admin
    for (const permission of permissionMap.values()) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log('Assigned all permissions to Super Admin role');

    // Assign organization management permissions to Organization Admin
    const orgAdminPermissions = [
      // Basic organization management
      'read_Organization',
      'update_Organization',

      // User management within organization
      'create_User',
      'read_User',
      'update_User',
      'delete_User',

      // Role management within organization
      'create_Role',
      'read_Role',
      'update_Role',
      'delete_Role',

      // Department management
      'create_Department',
      'read_Department',
      'update_Department',
      'delete_Department',

      // Invitation management
      'create_Invitation',
      'read_Invitation',
      'update_Invitation',
      'delete_Invitation',

      // Staff profile management
      'create_StaffProfile',
      'read_StaffProfile',
      'update_StaffProfile',
      'delete_StaffProfile',

      // Shift management
      'create_ShiftType',
      'read_ShiftType',
      'update_ShiftType',
      'delete_ShiftType',
      'create_ShiftSchedule',
      'read_ShiftSchedule',
      'update_ShiftSchedule',
      'delete_ShiftSchedule',
      'read_ShiftAttendance',
      'update_ShiftAttendance',

      // Payment management
      'create_PayPeriod',
      'read_PayPeriod',
      'update_PayPeriod',
      'delete_PayPeriod',
      'create_StaffPayment',
      'read_StaffPayment',
      'update_StaffPayment',
    ];

    for (const permKey of orgAdminPermissions) {
      const permission = permissionMap.get(permKey);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: orgAdminRole.id,
            permissionId: permission.id,
            // Apply organization-specific conditions to limit scope
            conditions: { organizationId: { $eq: '$user.organizationId' } },
          },
        });
      }
    }
    console.log(
      'Assigned organization management permissions to Organization Admin role'
    );

    // Assign basic read permissions to Staff Member
    const staffPermissions = [
      'read_Organization',
      'read_User',
      'read_Role',
      'read_Department',
      'read_ShiftType',
      'read_ShiftSchedule',
      'read_StaffProfile',
    ];

    for (const permKey of staffPermissions) {
      const permission = permissionMap.get(permKey);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: staffRole.id,
            permissionId: permission.id,
            // Apply organization and user-specific conditions
            conditions: { organizationId: { $eq: '$user.organizationId' } },
          },
        });
      }
    }
    console.log('Assigned basic read permissions to Staff Member role');

    // Doctor permissions
    const doctorPermissions = [
      'read_Organization',
      'read_Department',
      'read_Patient',
      'create_Patient',
      'update_Patient',
      'read_MedicalRecord',
      'create_MedicalRecord',
      'update_MedicalRecord',
      'read_Appointment',
      'create_Appointment',
      'update_Appointment',
      'delete_Appointment',
      'read_ShiftSchedule',
      'read_ShiftType',
      'read_StaffProfile',
    ];

    for (const permKey of doctorPermissions) {
      const permission = permissionMap.get(permKey);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: doctorRole.id,
            permissionId: permission.id,
            conditions: { organizationId: { $eq: '$user.organizationId' } },
          },
        });
      }
    }
    console.log('Assigned patient care permissions to Doctor role');

    // Nurse permissions
    const nursePermissions = [
      'read_Organization',
      'read_Department',
      'read_Patient',
      'update_Patient',
      'read_MedicalRecord',
      'update_MedicalRecord',
      'read_Appointment',
      'update_Appointment',
      'read_ShiftSchedule',
      'read_ShiftType',
      'read_StaffProfile',
      'create_ShiftAttendance',
      'read_ShiftAttendance',
      'update_ShiftAttendance',
    ];

    for (const permKey of nursePermissions) {
      const permission = permissionMap.get(permKey);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: nurseRole.id,
            permissionId: permission.id,
            conditions: { organizationId: { $eq: '$user.organizationId' } },
          },
        });
      }
    }
    console.log('Assigned patient care permissions to Nurse role');

    // Receptionist permissions
    const receptionistPermissions = [
      'read_Organization',
      'read_Department',
      'read_Patient',
      'create_Patient',
      'update_Patient',
      'read_Appointment',
      'create_Appointment',
      'update_Appointment',
      'read_ShiftSchedule',
    ];

    for (const permKey of receptionistPermissions) {
      const permission = permissionMap.get(permKey);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: receptionistRole.id,
            permissionId: permission.id,
            conditions: { organizationId: { $eq: '$user.organizationId' } },
          },
        });
      }
    }
    console.log('Assigned front desk permissions to Receptionist role');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}

// Execute the seed function
main()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection when done
    await prisma.$disconnect();
  });
