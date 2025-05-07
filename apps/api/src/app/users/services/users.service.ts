// app/users/services/users.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { UpdateUserDepartmentDto } from '../dto/update-user-department.dto';
import { AssignUserPermissionDto } from '../dto/assign-user-permission.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser?: User) {
    // Check if organization exists
    if (createUserDto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: createUserDto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID ${createUserDto.organizationId} not found`
        );
      }

      // If user is creating another user in an org, verify they belong to that org or are system admin
      if (
        currentUser &&
        currentUser.organizationId !== createUserDto.organizationId
      ) {
        // Verify if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You cannot create users for organizations you do not belong to'
          );
        }
      }
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user with provided roles if any
      const { roles, departments, ...userData } = createUserDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Create the user
        const newUser = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Assign roles if provided
        if (roles && roles.length > 0) {
          for (const roleId of roles) {
            // Verify role exists
            const role = await prisma.role.findUnique({
              where: { id: roleId },
            });

            if (!role) {
              throw new NotFoundException(`Role with ID ${roleId} not found`);
            }

            // Check if role belongs to user's organization or is a system role
            if (
              role.organizationId &&
              role.organizationId !== newUser.organizationId
            ) {
              throw new BadRequestException(
                `Role with ID ${roleId} does not belong to user's organization`
              );
            }

            await prisma.userRole.create({
              data: {
                userId: newUser.id,
                roleId: roleId,
              },
            });
          }
        } else {
          // Assign default Staff role if no roles are specified
          const staffRole = await prisma.role.findFirst({
            where: {
              name: 'Staff',
              isSystemRole: true,
            },
          });

          if (staffRole) {
            await prisma.userRole.create({
              data: {
                userId: newUser.id,
                roleId: staffRole.id,
              },
            });
          }
        }

        // Assign departments if provided
        if (departments && departments.length > 0) {
          for (const dept of departments) {
            // Verify department exists
            const department = await prisma.department.findUnique({
              where: { id: dept.departmentId },
            });

            if (!department) {
              throw new NotFoundException(
                `Department with ID ${dept.departmentId} not found`
              );
            }

            // Check if department belongs to user's organization
            if (department.organizationId !== newUser.organizationId) {
              throw new BadRequestException(
                `Department with ID ${dept.departmentId} does not belong to user's organization`
              );
            }

            await prisma.userDepartment.create({
              data: {
                userId: newUser.id,
                departmentId: dept.departmentId,
                position: dept.position,
                isHead: dept.isHead || false,
              },
            });
          }
        }

        // Return user with roles and departments
        return this.findOne(newUser.id);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    currentUser?: User;
  }) {
    const { skip, take, where, orderBy, currentUser } = params;

    // If user is not system admin, restrict to their organization
    let finalWhere = where;
    if (currentUser && currentUser.organizationId) {
      // Verify if user has super admin permissions
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      if (!isSuperAdmin) {
        finalWhere = {
          ...where,
          organizationId: currentUser.organizationId,
        };
      }
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            roles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
            departments: {
              select: {
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                position: true,
                isHead: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where: finalWhere }),
      ]);

      // Transform the result to flatten the structure
      const transformedUsers = users.map((user) => ({
        ...user,
        roles: user.roles.map((r) => r.role),
        departments: user.departments.map((d) => ({
          ...d.department,
          position: d.position,
          isHead: d.isHead,
        })),
      }));

      return {
        users: transformedUsers,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }
  }

  async findOne(id: string, currentUser?: User) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          organizationId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          sectorProfile: true,
          organization: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  isSystemRole: true,
                },
              },
            },
          },
          departments: {
            select: {
              department: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
              position: true,
              isHead: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // If user is not system admin, restrict access to their organization
      if (currentUser && currentUser.organizationId !== user.organizationId) {
        // Verify if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You cannot view users from other organizations'
          );
        }
      }

      // Transform the result to flatten the structure
      return {
        ...user,
        roles: user.roles.map((r) => r.role),
        departments: user.departments.map((d) => ({
          ...d.department,
          position: d.position,
          isHead: d.isHead,
        })),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User) {
    try {
      // First check if user exists
      const existingUser = await this.findOne(id, currentUser);

      // Handle password separately if it's being updated
      const { password, ...updateData } = updateUserDto;

      const data: any = { ...updateData };

      // If password is provided, hash it
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.findOne(updatedUser.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }

      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: { role: true },
          },
          departments: true,
          permissions: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if user is in the same organization or current user is super admin
      if (user.organizationId !== currentUser.organizationId) {
        // Verify if current user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You can only delete users in your organization'
          );
        }
      }

      // Check if user is a super admin and if they are the last one
      const userIsSuperAdmin = user.roles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      if (userIsSuperAdmin) {
        // Count super admins
        const superAdminCount = await this.prisma.userRole.count({
          where: {
            role: {
              isSystemRole: true,
              name: 'Super Admin',
            },
          },
        });

        if (superAdminCount <= 1) {
          throw new BadRequestException(
            'Cannot delete the last Super Admin user'
          );
        }
      }

      // Execute the deletion in a transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete user permissions
        await tx.userPermission.deleteMany({
          where: { userId: id },
        });

        // 2. Delete user roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // 3. Delete user departments
        await tx.userDepartment.deleteMany({
          where: { userId: id },
        });

        // 4. Delete staff profile if exists
        await tx.staffProfile.deleteMany({
          where: { userId: id },
        });

        // 5. Handle invitations
        // Revoke pending invitations created by this user
        await tx.invitation.updateMany({
          where: { createdById: id, status: 'PENDING' },
          data: {
            status: 'REVOKED',
            revokedById: currentUser.id,
            revokedAt: new Date(),
          },
        });

        // Clear references to this user in accepted invitations
        await tx.invitation.updateMany({
          where: { acceptedById: id },
          data: { acceptedById: null },
        });

        // Clear references to this user in revoked invitations
        await tx.invitation.updateMany({
          where: { revokedById: id },
          data: { revokedById: null },
        });

        // 6. Handle shift attendance approvals
        await tx.shiftAttendance.updateMany({
          where: { approvedById: id },
          data: { approvedById: null },
        });

        // 7. Finally delete the user
        await tx.user.delete({
          where: { id },
        });

        // Return nothing for a successful deletion (HTTP 204 No Content)
        return;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  // Role management
  async assignRole(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUser?: User
  ) {
    try {
      // Check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: assignRoleDto.roleId },
      });

      if (!role) {
        throw new NotFoundException(
          `Role with ID ${assignRoleDto.roleId} not found`
        );
      }

      // Check if role belongs to user's organization or is a system role
      if (role.organizationId && role.organizationId !== user.organizationId) {
        throw new BadRequestException(
          `Role with ID ${assignRoleDto.roleId} does not belong to user's organization`
        );
      }

      // Check if user already has this role
      const existingRole = await this.prisma.userRole.findFirst({
        where: {
          userId,
          roleId: assignRoleDto.roleId,
        },
      });

      if (existingRole) {
        throw new ConflictException(
          `User already has role with ID ${assignRoleDto.roleId}`
        );
      }

      // Assign role
      await this.prisma.userRole.create({
        data: {
          userId,
          roleId: assignRoleDto.roleId,
        },
      });

      return this.findOne(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to assign role: ${error.message}`);
    }
  }

  async removeRole(userId: string, roleId: string, currentUser?: User) {
    try {
      // Check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if user has this role
      const userRole = await this.prisma.userRole.findFirst({
        where: {
          userId,
          roleId,
        },
      });

      if (!userRole) {
        throw new NotFoundException(
          `User does not have role with ID ${roleId}`
        );
      }

      // Remove role
      await this.prisma.userRole.delete({
        where: {
          id: userRole.id,
        },
      });

      return this.findOne(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove role: ${error.message}`);
    }
  }

  // Department management
  async updateDepartment(
    userId: string,
    departmentDto: UpdateUserDepartmentDto,
    currentUser?: User
  ) {
    try {
      // Check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if department exists
      const department = await this.prisma.department.findUnique({
        where: { id: departmentDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentDto.departmentId} not found`
        );
      }

      // Check if department belongs to user's organization
      if (department.organizationId !== user.organizationId) {
        throw new BadRequestException(
          `Department with ID ${departmentDto.departmentId} does not belong to user's organization`
        );
      }

      // Check if user is already in this department
      const existingDept = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: departmentDto.departmentId,
        },
      });

      if (existingDept) {
        // Update existing department association
        await this.prisma.userDepartment.update({
          where: { id: existingDept.id },
          data: {
            position: departmentDto.position,
            isHead: departmentDto.isHead || false,
          },
        });
      } else {
        // Create new department association
        await this.prisma.userDepartment.create({
          data: {
            userId,
            departmentId: departmentDto.departmentId,
            position: departmentDto.position,
            isHead: departmentDto.isHead || false,
          },
        });
      }

      return this.findOne(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update department: ${error.message}`
      );
    }
  }

  async removeDepartment(
    userId: string,
    departmentId: string,
    currentUser?: User
  ) {
    try {
      // Check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if user is in this department
      const userDept = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId,
        },
      });

      if (!userDept) {
        throw new NotFoundException(
          `User is not in department with ID ${departmentId}`
        );
      }

      // Remove department association
      await this.prisma.userDepartment.delete({
        where: {
          id: userDept.id,
        },
      });

      return this.findOne(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove department: ${error.message}`
      );
    }
  }

  //permissions
  async assignPermission(
    userId: string,
    assignUserPermissionDto: AssignUserPermissionDto,
    currentUser?: User
  ) {
    try {
      // First check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if permission exists
      const permission = await this.prisma.permission.findUnique({
        where: { id: assignUserPermissionDto.permissionId },
      });

      if (!permission) {
        throw new NotFoundException(
          `Permission with ID ${assignUserPermissionDto.permissionId} not found`
        );
      }

      // If user belongs to different organization, only super admin can assign permissions
      if (currentUser && user.organizationId !== currentUser.organizationId) {
        // Verify if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You cannot assign permissions to users from other organizations'
          );
        }
      }

      // Check if user already has this permission directly
      const existingPermission = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId: assignUserPermissionDto.permissionId,
          },
        },
      });

      if (existingPermission) {
        // Update existing permission
        return await this.prisma.userPermission.update({
          where: { id: existingPermission.id },
          data: {
            conditions: assignUserPermissionDto.conditions,
            validUntil: assignUserPermissionDto.validUntil,
            updatedAt: new Date(),
          },
          include: {
            permission: true,
          },
        });
      }

      // Assign permission
      return await this.prisma.userPermission.create({
        data: {
          userId,
          permissionId: assignUserPermissionDto.permissionId,
          conditions: assignUserPermissionDto.conditions,
          validUntil: assignUserPermissionDto.validUntil,
        },
        include: {
          permission: true,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to assign permission: ${error.message}`
      );
    }
  }

  async removeUserPermission(
    userId: string,
    permissionId: string,
    currentUser?: User
  ) {
    try {
      // First check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Check if user has this permission directly
      const userPermission = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId,
          },
        },
      });

      if (!userPermission) {
        throw new NotFoundException(
          `User does not have direct permission with ID ${permissionId}`
        );
      }

      // Remove permission
      await this.prisma.userPermission.delete({
        where: {
          id: userPermission.id,
        },
      });

      return { message: 'Permission removed successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove permission: ${error.message}`
      );
    }
  }

  async getUserPermissions(userId: string, currentUser?: User) {
    try {
      // First check if user exists and current user has permission
      const user = await this.findOne(userId, currentUser);

      // Get direct permissions
      const directPermissions = await this.prisma.userPermission.findMany({
        where: { userId },
        include: {
          permission: true,
        },
      });

      // Get role-based permissions
      const rolePermissions = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Transform data for better presentation
      const transformedDirectPermissions = directPermissions.map((up) => ({
        id: up.id,
        permission: up.permission,
        conditions: up.conditions,
        validUntil: up.validUntil,
        isTemporary: !!up.validUntil,
        source: 'direct',
      }));

      const transformedRolePermissions = rolePermissions.flatMap((ur) =>
        ur.role.permissions.map((rp) => ({
          id: rp.id,
          permission: rp.permission,
          conditions: rp.conditions,
          role: {
            id: ur.role.id,
            name: ur.role.name,
          },
          source: 'role',
        }))
      );

      return {
        directPermissions: transformedDirectPermissions,
        rolePermissions: transformedRolePermissions,
        allPermissions: [
          ...transformedDirectPermissions,
          ...transformedRolePermissions,
        ],
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch user permissions: ${error.message}`
      );
    }
  }
}
