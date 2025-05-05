// app/hospital/services/shift-types.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import { ShiftType, User, Prisma } from '@prisma/client';

@Injectable()
export class ShiftTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createShiftTypeDto: CreateShiftTypeDto, currentUser: User) {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: createShiftTypeDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${createShiftTypeDto.organizationId} not found`
      );
    }

    // Verify user has access to this organization
    if (currentUser.organizationId !== createShiftTypeDto.organizationId) {
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
          'You cannot create shift types for organizations you do not belong to'
        );
      }
    }

    try {
      // Parse time strings and create DateTime objects
      const startTime = this.parseTimeString(createShiftTypeDto.startTime);
      const endTime = this.parseTimeString(createShiftTypeDto.endTime);

      // Calculate hours count
      let hoursCount = this.calculateHours(
        startTime,
        endTime,
        createShiftTypeDto.isOvernight
      );

      // Create the shift type
      return await this.prisma.shiftType.create({
        data: {
          name: createShiftTypeDto.name,
          startTime,
          endTime,
          isOvernight: createShiftTypeDto.isOvernight || false,
          hoursCount,
          basePayMultiplier: createShiftTypeDto.basePayMultiplier || 1.0,
          description: createShiftTypeDto.description,
          organizationId: createShiftTypeDto.organizationId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Shift type with this name already exists in this organization'
          );
        }
      }

      throw new BadRequestException(
        `Failed to create shift type: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ShiftTypeWhereInput;
    orderBy?: Prisma.ShiftTypeOrderByWithRelationInput;
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
          organizationId: currentUser.organizationId,
        };
      }
    }

    try {
      const [shiftTypes, total] = await Promise.all([
        this.prisma.shiftType.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.shiftType.count({ where: finalWhere }),
      ]);

      return {
        shiftTypes,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch shift types: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const shiftType = await this.prisma.shiftType.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!shiftType) {
        throw new NotFoundException(`Shift type with ID ${id} not found`);
      }

      // If user is not system admin, restrict access to their organization
      if (currentUser.organizationId !== shiftType.organizationId) {
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
            'You cannot view shift types from other organizations'
          );
        }
      }

      return shiftType;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch shift type: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updateShiftTypeDto: UpdateShiftTypeDto,
    currentUser: User
  ) {
    try {
      // First check if shift type exists and user has permission
      const existingShiftType = await this.findOne(id, currentUser);

      const data: any = { ...updateShiftTypeDto };

      // Parse time strings if provided
      if (updateShiftTypeDto.startTime) {
        data.startTime = this.parseTimeString(updateShiftTypeDto.startTime);
      }

      if (updateShiftTypeDto.endTime) {
        data.endTime = this.parseTimeString(updateShiftTypeDto.endTime);
      }

      // Recalculate hours count if either time was updated
      if (
        updateShiftTypeDto.startTime ||
        updateShiftTypeDto.endTime ||
        updateShiftTypeDto.isOvernight !== undefined
      ) {
        const startTime = data.startTime || existingShiftType.startTime;
        const endTime = data.endTime || existingShiftType.endTime;
        const isOvernight =
          data.isOvernight !== undefined
            ? data.isOvernight
            : existingShiftType.isOvernight;

        data.hoursCount = this.calculateHours(startTime, endTime, isOvernight);
      }

      return await this.prisma.shiftType.update({
        where: { id },
        data,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
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
            'Shift type with this name already exists in this organization'
          );
        }
      }

      throw new BadRequestException(
        `Failed to update shift type: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if shift type exists and user has permission
      const existingShiftType = await this.findOne(id, currentUser);

      // Check if shift type is in use
      const shiftsCount = await this.prisma.shiftSchedule.count({
        where: { shiftTypeId: id },
      });

      if (shiftsCount > 0) {
        throw new BadRequestException(
          'Cannot delete shift type that is used in schedules'
        );
      }

      return await this.prisma.shiftType.delete({
        where: { id },
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
        `Failed to delete shift type: ${error.message}`
      );
    }
  }

  // Helper methods
  private parseTimeString(timeString: string): Date {
    // Parse time in format "HH:MM" into a Date object
    const [hours, minutes] = timeString.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new BadRequestException('Invalid time format. Use HH:MM format.');
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private calculateHours(
    startTime: Date,
    endTime: Date,
    isOvernight: boolean
  ): number {
    let hours = 0;

    if (isOvernight) {
      // For overnight shifts, calculate as if the end time is on the next day
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      // If end time is smaller than start time, it means it's the next day
      if (endMinutes < startMinutes) {
        hours = (24 * 60 - startMinutes + endMinutes) / 60;
      } else {
        hours = (endMinutes - startMinutes) / 60;
      }
    } else {
      // For regular shifts, simple calculation
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      hours = (endMinutes - startMinutes) / 60;
    }

    return parseFloat(hours.toFixed(2));
  }
}
