// app/users/services/user-roles.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserRolesService {
  constructor(private prisma: PrismaService) {}

  async assignRole(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUser: User
  ) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: assignRoleDto.roleId },
      });

      if (!role) {
        throw new NotFoundException(
          `Role with ID ${assignRoleDto.roleId} not found`
        );
      }

      // Check if user is in the same organization or current user is super admin
      if (user.organizationId !== currentUser.organizationId) {
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
            'You can only assign roles to users in your organization'
          );
        }
      }

      // Check if role belongs to the organization or is a system role
      if (!role.isSystemRole && role.organizationId !== user.organizationId) {
        throw new BadRequestException(
          'Cannot assign a role from another organization'
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
        // If validUntil is different, update it
        if (
          existingRole.validUntil?.getTime() !==
          assignRoleDto.validUntil?.getTime()
        ) {
          return await this.prisma.userRole.update({
            where: { id: existingRole.id },
            data: { validUntil: assignRoleDto.validUntil },
            include: {
              role: true,
            },
          });
        }

        throw new ConflictException('User already has this role');
      }

      // Assign role
      const userRole = await this.prisma.userRole.create({
        data: {
          userId,
          roleId: assignRoleDto.roleId,
          validUntil: assignRoleDto.validUntil,
        },
        include: {
          role: true,
        },
      });

      return userRole;
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

  async removeRole(userId: string, roleId: string, currentUser: User) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is in the same organization or current user is super admin
      if (user.organizationId !== currentUser.organizationId) {
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
            'You can only remove roles from users in your organization'
          );
        }
      }

      // Check if user has this role
      const userRole = await this.prisma.userRole.findFirst({
        where: {
          userId,
          roleId,
        },
        include: {
          role: true,
        },
      });

      if (!userRole) {
        throw new NotFoundException(`User does not have this role`);
      }

      // Check if we're trying to remove a super admin role
      if (userRole.role.isSystemRole && userRole.role.name === 'Super Admin') {
        // Verify there is at least one other super admin
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
            'Cannot remove the last Super Admin role'
          );
        }
      }

      // Remove role
      await this.prisma.userRole.delete({
        where: {
          id: userRole.id,
        },
      });

      return { message: 'Role removed successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(`Failed to remove role: ${error.message}`);
    }
  }

  async findUsersByRole(roleId: string, currentUser: User) {
    try {
      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // If role is not system role and belongs to different organization, restrict access
      if (
        !role.isSystemRole &&
        role.organizationId !== currentUser.organizationId
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
            'You cannot view users for roles from other organizations'
          );
        }
      }

      // Find users with this role
      const users = await this.prisma.userRole.findMany({
        where: {
          roleId,
          ...(role.organizationId && {
            user: {
              organizationId: role.organizationId,
            },
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              isActive: true,
            },
          },
        },
      });

      return {
        role,
        users: users.map((ur) => ur.user),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to fetch users by role: ${error.message}`
      );
    }
  }

  async findRolesByUser(userId: string, currentUser: User) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user belongs to the same organization or current user is super admin
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
            'You can only view roles for users in your organization'
          );
        }
      }

      // Find roles for this user
      const roles = await this.prisma.userRole.findMany({
        where: {
          userId,
        },
        include: {
          role: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
        },
        roles: roles.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          isSystemRole: ur.role.isSystemRole,
          organization: ur.role.organization,
          validUntil: ur.validUntil,
        })),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to fetch roles by user: ${error.message}`
      );
    }
  }
}
