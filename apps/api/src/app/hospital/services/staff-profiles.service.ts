// app/hospital/services/staff-profiles.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';
import { User, Prisma, StaffType, SalaryType } from '@prisma/client';
import { CreateCompensationRateDto } from '../dto/create-compensation-rate.dto';

@Injectable()
export class StaffProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createStaffProfileDto: CreateStaffProfileDto,
    currentUser: User
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createStaffProfileDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createStaffProfileDto.userId} not found`
      );
    }

    // Check if user already has a staff profile
    const existingProfile = await this.prisma.staffProfile.findUnique({
      where: { userId: createStaffProfileDto.userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `User with ID ${createStaffProfileDto.userId} already has a staff profile`
      );
    }

    // Verify current user has permission (same organization or super admin)
    if (currentUser.organizationId !== user.organizationId) {
      // Check if user has super admin permissions
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      if (!isSuperAdmin) {
        throw new UnauthorizedException(
          'You cannot create staff profiles for users from other organizations'
        );
      }
    }

    try {
      // Extract compensation rates if provided
      const { compensationRates, ...profileData } = createStaffProfileDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Create the staff profile
        const staffProfile = await prisma.staffProfile.create({
          data: {
            userId: profileData.userId,
            staffType: profileData.staffType,
            specialty: profileData.specialty,
            experienceYears: profileData.experienceYears || 0,
            educationLevel: profileData.educationLevel,
            certifications: profileData.certifications,
            baseSalaryType: profileData.baseSalaryType || SalaryType.MONTHLY,
            baseSalaryAmount: profileData.baseSalaryAmount || 0,
            dateJoined: profileData.dateJoined || new Date(),
            status: profileData.status || 'ACTIVE',
          },
        });

        // Create compensation rates if provided
        if (compensationRates && compensationRates.length > 0) {
          for (const rate of compensationRates) {
            // Verify department exists and belongs to user's organization
            const department = await prisma.department.findUnique({
              where: { id: rate.departmentId },
            });

            if (!department) {
              throw new NotFoundException(
                `Department with ID ${rate.departmentId} not found`
              );
            }

            if (department.organizationId !== user.organizationId) {
              throw new BadRequestException(
                `Department with ID ${rate.departmentId} does not belong to user's organization`
              );
            }

            await prisma.staffCompensationRate.create({
              data: {
                staffProfileId: staffProfile.id,
                departmentId: rate.departmentId,
                baseRate: rate.baseRate,
                specialtyBonus: rate.specialtyBonus || 0,
                experienceMultiplier: rate.experienceMultiplier || 1.0,
                effectiveDate: rate.effectiveDate || new Date(),
                endDate: rate.endDate,
              },
            });
          }
        }

        return this.findOne(staffProfile.id, currentUser);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Staff profile already exists for this user'
          );
        }
      }

      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to create staff profile: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StaffProfileWhereInput;
    orderBy?: Prisma.StaffProfileOrderByWithRelationInput;
    currentUser: User;
  }) {
    const { skip, take, where, orderBy, currentUser } = params;

    // If user is not system admin, restrict to their organization
    let finalWhere = where;
    if (currentUser.organizationId) {
      // Check if user has super admin permissions
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
          user: {
            organizationId: currentUser.organizationId,
          },
        };
      }
    }

    try {
      const [staffProfiles, total] = await Promise.all([
        this.prisma.staffProfile.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                organizationId: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            compensationRates: {
              include: {
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            shiftSchedules: {
              take: 5,
              orderBy: {
                startDateTime: 'desc',
              },
              include: {
                shiftType: true,
                department: true,
              },
            },
          },
        }),
        this.prisma.staffProfile.count({ where: finalWhere }),
      ]);

      return {
        staffProfiles,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch staff profiles: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          compensationRates: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          shiftSchedules: {
            take: 10,
            orderBy: {
              startDateTime: 'desc',
            },
            include: {
              shiftType: true,
              department: true,
              attendance: true,
            },
          },
          payments: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              payPeriod: true,
            },
          },
        },
      });

      if (!staffProfile) {
        throw new NotFoundException(`Staff profile with ID ${id} not found`);
      }

      // If user is not system admin, restrict access to their organization
      if (currentUser.organizationId !== staffProfile.user.organizationId) {
        // Check if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You cannot view staff profiles from other organizations'
          );
        }
      }

      return staffProfile;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff profile: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updateStaffProfileDto: UpdateStaffProfileDto,
    currentUser: User
  ) {
    try {
      // First check if staff profile exists and user has permission
      const existingProfile = await this.findOne(id, currentUser);

      // Extract compensation rates if provided
      const { compensationRates, ...profileData } = updateStaffProfileDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Update the staff profile
        const updatedProfile = await prisma.staffProfile.update({
          where: { id },
          data: profileData,
        });

        // Handle compensation rates if provided
        if (compensationRates && compensationRates.length > 0) {
          for (const rate of compensationRates) {
            // Verify department exists and belongs to user's organization
            const department = await prisma.department.findUnique({
              where: { id: rate.departmentId },
            });

            if (!department) {
              throw new NotFoundException(
                `Department with ID ${rate.departmentId} not found`
              );
            }

            if (
              department.organizationId !== existingProfile.user.organizationId
            ) {
              throw new BadRequestException(
                `Department with ID ${rate.departmentId} does not belong to user's organization`
              );
            }

            // Check if compensation rate already exists
            const existingRate = await prisma.staffCompensationRate.findFirst({
              where: {
                staffProfileId: id,
                departmentId: rate.departmentId,
                effectiveDate: rate.effectiveDate || new Date(),
              },
            });

            if (existingRate) {
              // Update existing rate
              await prisma.staffCompensationRate.update({
                where: { id: existingRate.id },
                data: {
                  baseRate: rate.baseRate,
                  specialtyBonus:
                    rate.specialtyBonus || existingRate.specialtyBonus,
                  experienceMultiplier:
                    rate.experienceMultiplier ||
                    existingRate.experienceMultiplier,
                  endDate: rate.endDate,
                },
              });
            } else {
              // Create new rate
              await prisma.staffCompensationRate.create({
                data: {
                  staffProfileId: id,
                  departmentId: rate.departmentId,
                  baseRate: rate.baseRate,
                  specialtyBonus: rate.specialtyBonus || 0,
                  experienceMultiplier: rate.experienceMultiplier || 1.0,
                  effectiveDate: rate.effectiveDate || new Date(),
                  endDate: rate.endDate,
                },
              });
            }
          }
        }

        return this.findOne(id, currentUser);
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update staff profile: ${error.message}`
      );
    }
  }

  async addCompensationRate(
    id: string,
    compensationRateDto: CreateCompensationRateDto,
    currentUser: User
  ) {
    try {
      // First check if staff profile exists and user has permission
      const staffProfile = await this.findOne(id, currentUser);

      // Verify department exists and belongs to user's organization
      const department = await this.prisma.department.findUnique({
        where: { id: compensationRateDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${compensationRateDto.departmentId} not found`
        );
      }

      if (department.organizationId !== staffProfile.user.organizationId) {
        throw new BadRequestException(
          `Department with ID ${compensationRateDto.departmentId} does not belong to user's organization`
        );
      }

      // Check if compensation rate already exists
      const existingRate = await this.prisma.staffCompensationRate.findFirst({
        where: {
          staffProfileId: id,
          departmentId: compensationRateDto.departmentId,
          effectiveDate: compensationRateDto.effectiveDate || new Date(),
        },
      });

      if (existingRate) {
        throw new ConflictException(
          `Compensation rate for this department and effective date already exists`
        );
      }

      // Create new compensation rate
      await this.prisma.staffCompensationRate.create({
        data: {
          staffProfileId: id,
          departmentId: compensationRateDto.departmentId,
          baseRate: compensationRateDto.baseRate,
          specialtyBonus: compensationRateDto.specialtyBonus || 0,
          experienceMultiplier: compensationRateDto.experienceMultiplier || 1.0,
          effectiveDate: compensationRateDto.effectiveDate || new Date(),
          endDate: compensationRateDto.endDate,
        },
      });

      return this.findOne(id, currentUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add compensation rate: ${error.message}`
      );
    }
  }

  async removeCompensationRate(id: string, rateId: string, currentUser: User) {
    try {
      // First check if staff profile exists and user has permission
      const staffProfile = await this.findOne(id, currentUser);

      // Check if compensation rate exists and belongs to this staff profile
      const rate = await this.prisma.staffCompensationRate.findUnique({
        where: { id: rateId },
      });

      if (!rate) {
        throw new NotFoundException(
          `Compensation rate with ID ${rateId} not found`
        );
      }

      if (rate.staffProfileId !== id) {
        throw new BadRequestException(
          `Compensation rate with ID ${rateId} does not belong to this staff profile`
        );
      }

      // Delete compensation rate
      await this.prisma.staffCompensationRate.delete({
        where: { id: rateId },
      });

      return this.findOne(id, currentUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove compensation rate: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if staff profile exists and user has permission
      const staffProfile = await this.findOne(id, currentUser);

      // Check if staff profile has any associated shifts or payments
      const shiftsCount = await this.prisma.shiftSchedule.count({
        where: { staffProfileId: id },
      });

      const paymentsCount = await this.prisma.staffPayment.count({
        where: { staffProfileId: id },
      });

      if (shiftsCount > 0 || paymentsCount > 0) {
        throw new BadRequestException(
          'Cannot delete staff profile with associated shifts or payments. Archive the profile instead.'
        );
      }

      // Delete compensation rates first
      await this.prisma.staffCompensationRate.deleteMany({
        where: { staffProfileId: id },
      });

      // Delete staff profile
      await this.prisma.staffProfile.delete({
        where: { id },
      });

      return { message: 'Staff profile deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete staff profile: ${error.message}`
      );
    }
  }
}
