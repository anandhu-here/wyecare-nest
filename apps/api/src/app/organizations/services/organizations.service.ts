// Improved organizations.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { Organization, Prisma } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    try {
      return await this.prisma.organization.create({
        data: {
          ...createOrganizationDto,
          // If address is provided, create it
          ...(createOrganizationDto.address && {
            address: {
              create: createOrganizationDto.address,
            },
          }),
        },
        include: {
          address: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Organization with this name already exists'
          );
        }
      }
      throw new BadRequestException('Failed to create organization');
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    try {
      const [organizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          skip,
          take,
          where,
          orderBy,
          include: {
            address: true,
            departments: {
              where: {
                parentId: null, // Only top-level departments
              },
            },
            _count: {
              select: {
                users: true,
                departments: true,
              },
            },
          },
        }),
        this.prisma.organization.count({ where }),
      ]);

      return {
        organizations,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch organizations');
    }
  }

  async findOne(id: string) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          address: true,
          departments: {
            include: {
              children: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!organization) {
        throw new NotFoundException(`Organization with ID ${id} not found`);
      }

      // The organization is returned with the address included (even if null)
      return organization;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to find organization: ${error.message}`
      );
    }
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    try {
      // First check if organization exists
      const existingOrg = await this.prisma.organization.findUnique({
        where: { id },
        include: { address: true },
      });

      if (!existingOrg) {
        throw new NotFoundException(`Organization with ID ${id} not found`);
      }

      // Extract address data if provided
      const { address, ...orgData } = updateOrganizationDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Update organization
        const updatedOrg = await prisma.organization.update({
          where: { id },
          data: orgData,
          include: {
            address: true,
            departments: true,
          },
        });

        // Update address if provided
        if (address) {
          if (existingOrg.address) {
            await prisma.address.update({
              where: { organizationId: id },
              data: address,
            });
          } else {
            await prisma.address.create({
              data: {
                ...address,
                organizationId: id,
              },
            });
          }
        }

        return updatedOrg;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update organization: ${error.message}`
      );
    }
  }

  async remove(id: string) {
    try {
      // First check if organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              departments: true,
            },
          },
        },
      });

      if (!organization) {
        throw new NotFoundException(`Organization with ID ${id} not found`);
      }

      // Check if organization has users or departments
      if (
        organization._count.users > 0 ||
        organization._count.departments > 0
      ) {
        throw new BadRequestException(
          'Cannot delete organization with existing users or departments. ' +
            'Please remove all users and departments first.'
        );
      }

      // Delete organization and its address in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Delete address if exists
        await prisma.address.deleteMany({
          where: { organizationId: id },
        });

        // Delete organization
        return prisma.organization.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete organization: ${error.message}`
      );
    }
  }

  // Department management methods
  async createDepartment(orgId: string, departmentData: any) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (!organization) {
        throw new NotFoundException(`Organization with ID ${orgId} not found`);
      }

      return this.prisma.department.create({
        data: {
          ...departmentData,
          organizationId: orgId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create department: ${error.message}`
      );
    }
  }

  async getDepartments(orgId: string) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (!organization) {
        throw new NotFoundException(`Organization with ID ${orgId} not found`);
      }

      return this.prisma.department.findMany({
        where: {
          organizationId: orgId,
          parentId: null, // Only top-level departments
        },
        include: {
          children: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch departments: ${error.message}`
      );
    }
  }
}
