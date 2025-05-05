// app/hospital/services/shift-schedules.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftScheduleDto } from '../dto/create-shift-schedule.dto';
import { UpdateShiftScheduleDto } from '../dto/update-shift-schedule.dto';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class ShiftSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createShiftScheduleDto: CreateShiftScheduleDto,
    currentUser: User
  ) {
    try {
      // Verify staff profile exists
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { id: createShiftScheduleDto.staffProfileId },
        include: { user: true },
      });

      if (!staffProfile) {
        throw new NotFoundException(
          `Staff profile with ID ${createShiftScheduleDto.staffProfileId} not found`
        );
      }

      // Verify shift type exists
      const shiftType = await this.prisma.shiftType.findUnique({
        where: { id: createShiftScheduleDto.shiftTypeId },
      });

      if (!shiftType) {
        throw new NotFoundException(
          `Shift type with ID ${createShiftScheduleDto.shiftTypeId} not found`
        );
      }

      // Verify department exists
      const department = await this.prisma.department.findUnique({
        where: { id: createShiftScheduleDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${createShiftScheduleDto.departmentId} not found`
        );
      }

      // Check for schedule conflicts
      const conflictingShift = await this.prisma.shiftSchedule.findFirst({
        where: {
          staffProfileId: createShiftScheduleDto.staffProfileId,
          OR: [
            {
              // New shift starts during existing shift
              startDateTime: {
                lte: createShiftScheduleDto.endDateTime,
              },
              endDateTime: {
                gte: createShiftScheduleDto.startDateTime,
              },
            },
          ],
          status: { notIn: ['CANCELED'] },
        },
      });

      if (conflictingShift) {
        throw new ConflictException(
          'This staff member already has a shift scheduled during this time'
        );
      }

      // Verify user has access to this organization
      if (
        currentUser.organizationId !== staffProfile.user.organizationId &&
        currentUser.organizationId !== department.organizationId
      ) {
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
            'You cannot create shifts for staff from other organizations'
          );
        }
      }

      // Create shift schedule
      const shiftSchedule = await this.prisma.shiftSchedule.create({
        data: {
          staffProfileId: createShiftScheduleDto.staffProfileId,
          shiftTypeId: createShiftScheduleDto.shiftTypeId,
          departmentId: createShiftScheduleDto.departmentId,
          startDateTime: createShiftScheduleDto.startDateTime,
          endDateTime: createShiftScheduleDto.endDateTime,
          status: createShiftScheduleDto.status || 'SCHEDULED',
          isConfirmed: createShiftScheduleDto.isConfirmed || false,
          notes: createShiftScheduleDto.notes,
        },
        include: {
          staffProfile: {
            include: {
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
          shiftType: true,
          department: true,
        },
      });

      return shiftSchedule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create shift schedule: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ShiftScheduleWhereInput;
    orderBy?: Prisma.ShiftScheduleOrderByWithRelationInput;
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
        // Get staff profile for user
        const staffProfile = await this.prisma.staffProfile.findUnique({
          where: { userId: currentUser.id },
        });

        // Check if user has department head role
        const isDepartmentHead = await this.prisma.userDepartment.findFirst({
          where: {
            userId: currentUser.id,
            isHead: true,
          },
        });

        if (isDepartmentHead) {
          // Department heads can see all shifts in their department
          const headDepartments = await this.prisma.userDepartment.findMany({
            where: {
              userId: currentUser.id,
              isHead: true,
            },
          });

          const departmentIds = headDepartments.map((d) => d.departmentId);

          finalWhere = {
            ...where,
            OR: [
              { departmentId: { in: departmentIds } },
              ...(staffProfile ? [{ staffProfileId: staffProfile.id }] : []),
            ],
          };
        } else if (staffProfile) {
          // Regular staff can only see their own shifts
          finalWhere = {
            ...where,
            staffProfileId: staffProfile.id,
          };
        } else {
          // Admin users that don't have staff profiles can see all shifts in their org
          finalWhere = {
            ...where,
            department: {
              organizationId: currentUser.organizationId,
            },
          };
        }
      }
    }

    try {
      const [shiftSchedules, total] = await Promise.all([
        this.prisma.shiftSchedule.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            staffProfile: {
              include: {
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
            shiftType: true,
            department: true,
            attendance: true,
          },
        }),
        this.prisma.shiftSchedule.count({ where: finalWhere }),
      ]);

      return {
        shiftSchedules,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch shift schedules: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const shiftSchedule = await this.prisma.shiftSchedule.findUnique({
        where: { id },
        include: {
          staffProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  organizationId: true,
                },
              },
            },
          },
          shiftType: true,
          department: {
            include: {
              organization: true,
            },
          },
          attendance: true,
        },
      });

      if (!shiftSchedule) {
        throw new NotFoundException(`Shift schedule with ID ${id} not found`);
      }

      // Check if user has permission to view this shift
      if (
        currentUser.organizationId !== shiftSchedule.department.organizationId
      ) {
        // Check if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        // Check if user is the staff member assigned to this shift
        const isAssignedStaff =
          shiftSchedule.staffProfile.userId === currentUser.id;

        if (!isSuperAdmin && !isAssignedStaff) {
          throw new UnauthorizedException(
            'You do not have permission to view this shift schedule'
          );
        }
      }

      return shiftSchedule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch shift schedule: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updateShiftScheduleDto: UpdateShiftScheduleDto,
    currentUser: User
  ) {
    try {
      // First check if shift schedule exists and user has permission
      const existingShift = await this.findOne(id, currentUser);

      // Check for conflicts if changing dates
      if (
        updateShiftScheduleDto.startDateTime ||
        updateShiftScheduleDto.endDateTime
      ) {
        const startDateTime =
          updateShiftScheduleDto.startDateTime || existingShift.startDateTime;
        const endDateTime =
          updateShiftScheduleDto.endDateTime || existingShift.endDateTime;

        const conflictingShift = await this.prisma.shiftSchedule.findFirst({
          where: {
            id: { not: id },
            staffProfileId: existingShift.staffProfileId,
            OR: [
              {
                // New shift starts during existing shift
                startDateTime: {
                  lte: endDateTime,
                },
                endDateTime: {
                  gte: startDateTime,
                },
              },
            ],
            status: { notIn: ['CANCELED'] },
          },
        });

        if (conflictingShift) {
          throw new ConflictException(
            'This staff member already has a shift scheduled during this time'
          );
        }
      }

      // Update shift schedule
      const updatedShift = await this.prisma.shiftSchedule.update({
        where: { id },
        data: updateShiftScheduleDto,
        include: {
          staffProfile: {
            include: {
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
          shiftType: true,
          department: true,
          attendance: true,
        },
      });

      return updatedShift;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update shift schedule: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if shift schedule exists and user has permission
      const existingShift = await this.findOne(id, currentUser);

      // Check if shift has attendance records
      if (existingShift.attendance) {
        throw new BadRequestException(
          'Cannot delete shift with attendance records. Cancel the shift instead.'
        );
      }

      // Delete shift schedule
      await this.prisma.shiftSchedule.delete({
        where: { id },
      });

      return { message: 'Shift schedule deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete shift schedule: ${error.message}`
      );
    }
  }
}
