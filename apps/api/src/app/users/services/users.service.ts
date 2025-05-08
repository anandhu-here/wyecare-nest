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
    if (createUserDto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: createUserDto.organizationId },
      });
      if (!organization) {
        throw new NotFoundException(
          `Organization with ID ${createUserDto.organizationId} not found`
        );
      }
      if (
        currentUser &&
        currentUser.organizationId !== createUserDto.organizationId
      ) {
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
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const { roles, departments, ...userData } = createUserDto;
      return await this.prisma.$transaction(async (prisma) => {
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
        if (roles && roles.length > 0) {
          for (const roleId of roles) {
            const role = await prisma.role.findUnique({
              where: { id: roleId },
            });
            if (!role) {
              throw new NotFoundException(`Role with ID ${roleId} not found`);
            }
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
        if (departments && departments.length > 0) {
          for (const dept of departments) {
            const department = await prisma.department.findUnique({
              where: { id: dept.departmentId },
            });
            if (!department) {
              throw new NotFoundException(
                `Department with ID ${dept.departmentId} not found`
              );
            }
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
    let finalWhere = where;
    if (currentUser && currentUser.organizationId) {
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
      if (currentUser && currentUser.organizationId !== user.organizationId) {
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
      const existingUser = await this.findOne(id, currentUser);
      const { password, address, ...updateData } = updateUserDto;
      const data: any = { ...updateData };
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }
      if (address) {
        const existingAddress = await this.prisma.address.findUnique({
          where: {
            userId: id,
          },
        });
        if (existingAddress) {
          data.address = {
            update: address,
          };
        } else {
          data.address = {
            create: address,
          };
        }
      }
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
          address: true,
        },
      });
      return this.findOne(updatedUser.id);
    } catch (error) {
      console.log(error);
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
      if (user.organizationId !== currentUser.organizationId) {
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
      const userIsSuperAdmin = user.roles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );
      if (userIsSuperAdmin) {
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
      return await this.prisma.$transaction(async (tx) => {
        await tx.userPermission.deleteMany({
          where: { userId: id },
        });
        await tx.userRole.deleteMany({
          where: { userId: id },
        });
        await tx.userDepartment.deleteMany({
          where: { userId: id },
        });
        await tx.staffProfile.deleteMany({
          where: { userId: id },
        });
        await tx.invitation.updateMany({
          where: { createdById: id, status: 'PENDING' },
          data: {
            status: 'REVOKED',
            revokedById: currentUser.id,
            revokedAt: new Date(),
          },
        });
        await tx.invitation.updateMany({
          where: { acceptedById: id },
          data: { acceptedById: null },
        });
        await tx.invitation.updateMany({
          where: { revokedById: id },
          data: { revokedById: null },
        });
        await tx.shiftAttendance.updateMany({
          where: { approvedById: id },
          data: { approvedById: null },
        });
        await tx.user.delete({
          where: { id },
        });
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
  async assignRole(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUser?: User
  ) {
    try {
      const user = await this.findOne(userId, currentUser);
      const role = await this.prisma.role.findUnique({
        where: { id: assignRoleDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${assignRoleDto.roleId} not found`
        );
      }
      if (role.organizationId && role.organizationId !== user.organizationId) {
        throw new BadRequestException(
          `Role with ID ${assignRoleDto.roleId} does not belong to user's organization`
        );
      }
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
      const user = await this.findOne(userId, currentUser);
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
  async updateDepartment(
    userId: string,
    departmentDto: UpdateUserDepartmentDto,
    currentUser?: User
  ) {
    try {
      const user = await this.findOne(userId, currentUser);
      const department = await this.prisma.department.findUnique({
        where: { id: departmentDto.departmentId },
      });
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentDto.departmentId} not found`
        );
      }
      if (department.organizationId !== user.organizationId) {
        throw new BadRequestException(
          `Department with ID ${departmentDto.departmentId} does not belong to user's organization`
        );
      }
      const existingDept = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: departmentDto.departmentId,
        },
      });
      if (existingDept) {
        await this.prisma.userDepartment.update({
          where: { id: existingDept.id },
          data: {
            position: departmentDto.position,
            isHead: departmentDto.isHead || false,
          },
        });
      } else {
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
      const user = await this.findOne(userId, currentUser);
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
      const user = await this.findOne(userId, currentUser);
      const permission = await this.prisma.permission.findUnique({
        where: { id: assignUserPermissionDto.permissionId },
      });
      if (!permission) {
        throw new NotFoundException(
          `Permission with ID ${assignUserPermissionDto.permissionId} not found`
        );
      }
      if (currentUser && user.organizationId !== currentUser.organizationId) {
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
      const existingPermission = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId: assignUserPermissionDto.permissionId,
          },
        },
      });
      if (existingPermission) {
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
      const user = await this.findOne(userId, currentUser);
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
      const user = await this.findOne(userId, currentUser);
      const directPermissions = await this.prisma.userPermission.findMany({
        where: { userId },
        include: {
          permission: true,
        },
      });
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
