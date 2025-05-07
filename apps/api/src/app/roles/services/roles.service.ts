// app/roles/services/roles.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRolesDto } from '../dto/create-roles.dto';
import { UpdateRolesDto } from '../dto/update-roles.dto';
import { Role, Prisma, User } from '@prisma/client';
import { AssignPermissionDto } from '../dto/assign-permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRolesDto: CreateRolesDto, currentUser?: User) {
    // Check if organization exists if organizationId is provided
    if (createRolesDto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: createRolesDto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID ${createRolesDto.organizationId} not found`
        );
      }

      // If user is creating a role for an org, verify they belong to that org or are system admin
      if (
        currentUser &&
        currentUser.organizationId !== createRolesDto.organizationId
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
            'You cannot create roles for organizations you do not belong to'
          );
        }
      }
    }

    try {
      // Extract permissions from DTO
      const { permissions, ...roleData } = createRolesDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Create the role
        const role = await prisma.role.create({
          data: roleData,
        });

        // Assign permissions if provided
        if (permissions && permissions.length > 0) {
          for (const permissionId of permissions) {
            // Verify permission exists
            const permission = await prisma.permission.findUnique({
              where: { id: permissionId },
            });

            if (!permission) {
              throw new NotFoundException(
                `Permission with ID ${permissionId} not found`
              );
            }

            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId,
                // For organization-specific roles, add condition to limit access to the organization
                ...(role.organizationId && {
                  conditions: {
                    organizationId: { $eq: '$user.organizationId' },
                  },
                }),
              },
            });
          }
        }

        return this.findOne(role.id, currentUser);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Role with this name already exists in this organization'
          );
        }
      }

      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
    currentUser?: User;
  }) {
    const { skip, take, where, orderBy, currentUser } = params;

    console.log('Initial where condition:', JSON.stringify(where));
    console.log('Current user:', currentUser?.id, currentUser?.email);

    // If user is not system admin, restrict to their organization and system roles
    let finalWhere = where;
    if (currentUser && currentUser.organizationId) {
      // Verify if user has super admin permissions
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      console.log(
        'User roles:',
        userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          isSystemRole: ur.role.isSystemRole,
        }))
      );

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      console.log('Is super admin:', isSuperAdmin);

      if (!isSuperAdmin) {
        finalWhere = {
          ...where,
          OR: [
            { organizationId: currentUser.organizationId },
            { isSystemRole: true },
          ],
        };
      }
    }

    console.log('Final where condition:', JSON.stringify(finalWhere));

    try {
      // For debugging, check the total count without any filters
      const totalRolesInDb = await this.prisma.role.count();
      console.log('Total roles in database:', totalRolesInDb);

      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    action: true,
                    subject: true,
                    description: true,
                  },
                },
              },
            },
            _count: {
              select: {
                users: true,
              },
            },
          },
        }),
        this.prisma.role.count({ where: finalWhere }),
      ]);

      console.log('Roles found with filter:', roles.length);

      // Transform the result to flatten the structure
      const transformedRoles = roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((p) => ({
          ...p.permission,
          conditions: p.conditions,
        })),
        userCount: role._count.users,
        _count: undefined,
      }));

      return {
        roles: transformedRoles,
        total,
        skip,
        take,
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw new BadRequestException(`Failed to fetch roles: ${error.message}`);
    }
  }

  async findOne(id: string, currentUser?: User) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  action: true,
                  subject: true,
                  description: true,
                },
              },
            },
          },
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // If user is not system admin, restrict access to their organization's roles and system roles
      if (
        currentUser &&
        role.organizationId &&
        currentUser.organizationId !== role.organizationId
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
            'You cannot view roles from other organizations'
          );
        }
      }

      // Transform the result to flatten the structure
      return {
        ...role,
        permissions: role.permissions.map((p) => ({
          ...p.permission,
          conditions: p.conditions,
        })),
        users: role.users.map((u) => u.user),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch role: ${error.message}`);
    }
  }

  async update(id: string, updateRolesDto: UpdateRolesDto, currentUser?: User) {
    try {
      // First check if role exists and user has permission
      const existingRole = await this.findOne(id, currentUser);

      // Extract permissions from DTO
      const { permissions, ...roleData } = updateRolesDto;

      // Update role
      const updatedRole = await this.prisma.role.update({
        where: { id },
        data: roleData,
      });

      // Update permissions if provided
      if (permissions && permissions.length > 0) {
        // Remove existing permissions
        await this.prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        for (const permissionId of permissions) {
          // Verify permission exists
          const permission = await this.prisma.permission.findUnique({
            where: { id: permissionId },
          });

          if (!permission) {
            throw new NotFoundException(
              `Permission with ID ${permissionId} not found`
            );
          }

          await this.prisma.rolePermission.create({
            data: {
              roleId: id,
              permissionId,
              // For organization-specific roles, add condition to limit access to the organization
              ...(updatedRole.organizationId && {
                conditions: { organizationId: { $eq: '$user.organizationId' } },
              }),
            },
          });
        }
      }

      return this.findOne(id, currentUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Role with this name already exists in this organization'
          );
        }
      }

      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  async remove(id: string, currentUser?: User) {
    try {
      // First check if role exists and user has permission
      const existingRole = await this.findOne(id, currentUser);

      // Check if role is a system role
      if (existingRole.isSystemRole) {
        throw new BadRequestException('Cannot delete system roles');
      }

      // Check if role has users
      if (existingRole.users.length > 0) {
        throw new BadRequestException(
          'Cannot delete role with assigned users. Remove all user assignments first.'
        );
      }

      // Delete role and its permissions in a transaction
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        this.prisma.role.delete({ where: { id } }),
      ]);

      return { message: 'Role deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }

  // Permission management
  async assignPermission(
    roleId: string,
    assignPermissionDto: AssignPermissionDto,
    currentUser?: User
  ) {
    try {
      // Check if role exists and user has permission
      const role = await this.findOne(roleId, currentUser);

      // Check if permission exists
      const permission = await this.prisma.permission.findUnique({
        where: { id: assignPermissionDto.permissionId },
      });

      if (!permission) {
        throw new NotFoundException(
          `Permission with ID ${assignPermissionDto.permissionId} not found`
        );
      }

      // Check if role already has this permission
      const existingPermission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId,
          permissionId: assignPermissionDto.permissionId,
        },
      });

      if (existingPermission) {
        // If conditions are different, update them
        if (
          JSON.stringify(existingPermission.conditions) !==
          JSON.stringify(assignPermissionDto.conditions)
        ) {
          await this.prisma.rolePermission.update({
            where: { id: existingPermission.id },
            data: { conditions: assignPermissionDto.conditions },
          });
        } else {
          throw new ConflictException(
            `Role already has permission with ID ${assignPermissionDto.permissionId}`
          );
        }
      } else {
        // Assign permission
        await this.prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: assignPermissionDto.permissionId,
            conditions: assignPermissionDto.conditions,
          },
        });
      }

      return this.findOne(roleId, currentUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to assign permission: ${error.message}`
      );
    }
  }

  async removePermission(
    roleId: string,
    permissionId: string,
    currentUser?: User
  ) {
    try {
      // Check if role exists and user has permission
      const role = await this.findOne(roleId, currentUser);

      // Check if role has this permission
      const rolePermission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId,
          permissionId,
        },
      });

      if (!rolePermission) {
        throw new NotFoundException(
          `Role does not have permission with ID ${permissionId}`
        );
      }

      // Remove permission
      await this.prisma.rolePermission.delete({
        where: {
          id: rolePermission.id,
        },
      });

      return this.findOne(roleId, currentUser);
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

  // List all available permissions
  async findAllPermissions() {
    try {
      return await this.prisma.permission.findMany({
        orderBy: { subject: 'asc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch permissions: ${error.message}`
      );
    }
  }
}
