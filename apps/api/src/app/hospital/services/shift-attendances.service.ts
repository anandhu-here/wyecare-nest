// app/hospital/services/shift-attendances.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftAttendanceDto } from '../dto/create-shift-attendance.dto';
import { UpdateShiftAttendanceDto } from '../dto/update-shift-attendance.dto';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class ShiftAttendancesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createShiftAttendanceDto: CreateShiftAttendanceDto,
    currentUser: User
  ) {
    try {
      // Verify shift schedule exists
      const shiftSchedule = await this.prisma.shiftSchedule.findUnique({
        where: { id: createShiftAttendanceDto.shiftScheduleId },
        include: {
          staffProfile: {
            include: {
              user: true,
            },
          },
          department: true,
          attendance: true,
        },
      });

      if (!shiftSchedule) {
        throw new NotFoundException(
          `Shift schedule with ID ${createShiftAttendanceDto.shiftScheduleId} not found`
        );
      }

      // Check if attendance record already exists
      if (shiftSchedule.attendance) {
        throw new ConflictException(
          `Attendance record already exists for this shift`
        );
      }

      // Verify user has permission (same organization, or is the staff member, or is department head)
      const hasPermission =
        currentUser.organizationId ===
          shiftSchedule.department.organizationId ||
        currentUser.id === shiftSchedule.staffProfile.userId;

      if (!hasPermission) {
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
            'You do not have permission to create attendance records for this shift'
          );
        }
      }

      // Calculate overtime minutes if both start and end times are provided
      let overtimeMinutes = createShiftAttendanceDto.overtimeMinutes || 0;

      if (
        createShiftAttendanceDto.actualStartTime &&
        createShiftAttendanceDto.actualEndTime
      ) {
        const actualStartTime = new Date(
          createShiftAttendanceDto.actualStartTime
        );
        const actualEndTime = new Date(createShiftAttendanceDto.actualEndTime);
        const scheduledStartTime = new Date(shiftSchedule.startDateTime);
        const scheduledEndTime = new Date(shiftSchedule.endDateTime);

        // Calculate actual duration in minutes
        const actualDuration =
          (actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60);

        // Calculate scheduled duration in minutes
        const scheduledDuration =
          (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
          (1000 * 60);

        // If actual duration is greater than scheduled, calculate overtime
        if (actualDuration > scheduledDuration) {
          overtimeMinutes = Math.round(actualDuration - scheduledDuration);
        }
      }

      // Create attendance record
      const attendance = await this.prisma.shiftAttendance.create({
        data: {
          shiftScheduleId: createShiftAttendanceDto.shiftScheduleId,
          actualStartTime: createShiftAttendanceDto.actualStartTime,
          actualEndTime: createShiftAttendanceDto.actualEndTime,
          status: createShiftAttendanceDto.status || 'PENDING',
          overtimeMinutes,
          notes: createShiftAttendanceDto.notes,
          ...(createShiftAttendanceDto.status === 'PRESENT' && {
            approvedById: currentUser.id,
          }),
        },
        include: {
          shiftSchedule: {
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
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If shift is completed, update shift schedule status
      if (
        createShiftAttendanceDto.status === 'PRESENT' ||
        createShiftAttendanceDto.status === 'PARTIALLY_COMPLETE'
      ) {
        await this.prisma.shiftSchedule.update({
          where: { id: shiftSchedule.id },
          data: { status: 'COMPLETED' },
        });
      }

      return attendance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create shift attendance: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ShiftAttendanceWhereInput;
    orderBy?: Prisma.ShiftAttendanceOrderByWithRelationInput;
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
          // Department heads can see all attendance in their department
          const headDepartments = await this.prisma.userDepartment.findMany({
            where: {
              userId: currentUser.id,
              isHead: true,
            },
          });

          const departmentIds = headDepartments.map((d) => d.departmentId);

          finalWhere = {
            ...where,
            shiftSchedule: {
              OR: [
                { departmentId: { in: departmentIds } },
                ...(staffProfile ? [{ staffProfileId: staffProfile.id }] : []),
              ],
            },
          };
        } else if (staffProfile) {
          // Regular staff can only see their own attendance
          finalWhere = {
            ...where,
            shiftSchedule: {
              staffProfileId: staffProfile.id,
            },
          };
        } else {
          // Admin users that don't have staff profiles can see all attendance in their org
          finalWhere = {
            ...where,
            shiftSchedule: {
              department: {
                organizationId: currentUser.organizationId,
              },
            },
          };
        }
      }
    }

    try {
      const [attendances, total] = await Promise.all([
        this.prisma.shiftAttendance.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            shiftSchedule: {
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
            },
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.shiftAttendance.count({ where: finalWhere }),
      ]);

      return {
        attendances,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch shift attendances: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const attendance = await this.prisma.shiftAttendance.findUnique({
        where: { id },
        include: {
          shiftSchedule: {
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
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!attendance) {
        throw new NotFoundException(`Shift attendance with ID ${id} not found`);
      }

      // Check if user has permission to view this attendance
      const hasPermission =
        currentUser.organizationId ===
          attendance.shiftSchedule.department.organization.id ||
        currentUser.id === attendance.shiftSchedule.staffProfile.userId;

      if (!hasPermission) {
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
            'You do not have permission to view this attendance record'
          );
        }
      }

      return attendance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch shift attendance: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updateShiftAttendanceDto: UpdateShiftAttendanceDto,
    currentUser: User
  ) {
    try {
      // First check if attendance exists and user has permission
      const existingAttendance = await this.findOne(id, currentUser);

      // Check if user has permission to update this attendance
      const isAssignedStaff =
        currentUser.id === existingAttendance.shiftSchedule.staffProfile.userId;

      // Staff can only update their own attendance if not approved yet
      if (isAssignedStaff && existingAttendance.approvedById) {
        throw new UnauthorizedException(
          'Cannot modify attendance after it has been approved'
        );
      }

      // Non-staff users need department admin rights or above
      if (!isAssignedStaff) {
        // Check if user is department head or has admin rights
        const userDepartment = await this.prisma.userDepartment.findFirst({
          where: {
            userId: currentUser.id,
            departmentId: existingAttendance.shiftSchedule.departmentId,
            isHead: true,
          },
        });

        const isAdmin = await this.prisma.userRole.findFirst({
          where: {
            userId: currentUser.id,
            role: {
              OR: [
                { name: 'Admin', organizationId: currentUser.organizationId },
                {
                  name: 'Hospital Admin',
                  organizationId: currentUser.organizationId,
                },
              ],
            },
          },
        });

        const isSuperAdmin = await this.prisma.userRole.findFirst({
          where: {
            userId: currentUser.id,
            role: {
              name: 'Super Admin',
              isSystemRole: true,
            },
          },
        });

        if (!userDepartment && !isAdmin && !isSuperAdmin) {
          throw new UnauthorizedException(
            'You do not have permission to update this attendance record'
          );
        }
      }

      // Calculate overtime minutes if both start and end times are provided
      let overtimeMinutes =
        updateShiftAttendanceDto.overtimeMinutes !== undefined
          ? updateShiftAttendanceDto.overtimeMinutes
          : existingAttendance.overtimeMinutes;

      const actualStartTime =
        updateShiftAttendanceDto.actualStartTime ||
        existingAttendance.actualStartTime;
      const actualEndTime =
        updateShiftAttendanceDto.actualEndTime ||
        existingAttendance.actualEndTime;

      if (
        actualStartTime &&
        actualEndTime &&
        (updateShiftAttendanceDto.actualStartTime ||
          updateShiftAttendanceDto.actualEndTime)
      ) {
        const scheduledStartTime = new Date(
          existingAttendance.shiftSchedule.startDateTime
        );
        const scheduledEndTime = new Date(
          existingAttendance.shiftSchedule.endDateTime
        );

        // Calculate actual duration in minutes
        const actualDuration =
          (new Date(actualEndTime).getTime() -
            new Date(actualStartTime).getTime()) /
          (1000 * 60);

        // Calculate scheduled duration in minutes
        const scheduledDuration =
          (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
          (1000 * 60);

        // If actual duration is greater than scheduled, calculate overtime
        if (actualDuration > scheduledDuration) {
          overtimeMinutes = Math.round(actualDuration - scheduledDuration);
        } else {
          overtimeMinutes = 0;
        }
      }

      // Set approved by if status is changing to approved
      let approvedById = existingAttendance.approvedById;
      if (
        updateShiftAttendanceDto.status === 'PRESENT' &&
        existingAttendance.status !== 'PRESENT'
      ) {
        approvedById = currentUser.id;
      }

      // Update attendance record
      const updatedAttendance = await this.prisma.shiftAttendance.update({
        where: { id },
        data: {
          actualStartTime: updateShiftAttendanceDto.actualStartTime,
          actualEndTime: updateShiftAttendanceDto.actualEndTime,
          status: updateShiftAttendanceDto.status,
          overtimeMinutes,
          approvedById,
          notes: updateShiftAttendanceDto.notes,
        },
        include: {
          shiftSchedule: {
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
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If shift is completed, update shift schedule status
      if (
        updateShiftAttendanceDto.status === 'PRESENT' ||
        updateShiftAttendanceDto.status === 'PARTIALLY_COMPLETE'
      ) {
        await this.prisma.shiftSchedule.update({
          where: { id: existingAttendance.shiftSchedule.id },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedAttendance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update shift attendance: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if attendance exists and user has permission
      const existingAttendance = await this.findOne(id, currentUser);

      // Only admin users can delete attendance records
      const isAdmin = await this.prisma.userRole.findFirst({
        where: {
          userId: currentUser.id,
          role: {
            OR: [
              { name: 'Admin', organizationId: currentUser.organizationId },
              {
                name: 'Hospital Admin',
                organizationId: currentUser.organizationId,
              },
              { name: 'Super Admin', isSystemRole: true },
            ],
          },
        },
      });

      if (!isAdmin) {
        throw new UnauthorizedException(
          'Only administrators can delete attendance records'
        );
      }

      // Delete attendance record
      await this.prisma.shiftAttendance.delete({
        where: { id },
      });

      return { message: 'Shift attendance deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete shift attendance: ${error.message}`
      );
    }
  }
}
