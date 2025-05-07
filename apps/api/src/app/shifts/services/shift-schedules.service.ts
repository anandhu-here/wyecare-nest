// apps/api/src/app/shifts/services/shift-schedules.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftScheduleDto } from '../dto/create-shift-schedule.dto';
import { UpdateShiftScheduleDto } from '../dto/update-shift-schedule.dto';
import { FindShiftScheduleDto } from '../dto/find-shift-schedule.dto';
import { ShiftSchedule, Prisma } from '@prisma/client';

@Injectable()
export class ShiftSchedulesService {
  constructor(private prisma: PrismaService) {}

  create(
    createShiftScheduleDto: CreateShiftScheduleDto
  ): Promise<ShiftSchedule> {
    return this.prisma.shiftSchedule.create({
      data: createShiftScheduleDto,
    });
  }

  async bulkCreate(shifts: CreateShiftScheduleDto[]): Promise<ShiftSchedule[]> {
    const results: ShiftSchedule[] = [];

    // Use transaction to ensure all-or-nothing creation
    await this.prisma.$transaction(async (tx) => {
      for (const shift of shifts) {
        const result = await tx.shiftSchedule.create({
          data: shift,
        });
        results.push(result);
      }
    });

    return results;
  }

  findAll(query: FindShiftScheduleDto): Promise<ShiftSchedule[]> {
    const { skip, take, startDateTimeFrom, startDateTimeTo, ...filters } =
      query;

    const where: Prisma.ShiftScheduleWhereInput = {
      ...filters,
    };

    // Handle date range if provided
    if (startDateTimeFrom || startDateTimeTo) {
      where.startDateTime = {};

      if (startDateTimeFrom) {
        where.startDateTime.gte = startDateTimeFrom;
      }

      if (startDateTimeTo) {
        where.startDateTime.lte = startDateTimeTo;
      }
    }

    return this.prisma.shiftSchedule.findMany({
      where,
      skip,
      take,
      include: {
        staffProfile: true,
        shiftType: true,
        department: true,
        attendance: true,
      },
    });
  }

  async findOne(id: string): Promise<ShiftSchedule> {
    const shiftSchedule = await this.prisma.shiftSchedule.findUnique({
      where: { id },
      include: {
        staffProfile: true,
        shiftType: true,
        department: true,
        attendance: true,
      },
    });

    if (!shiftSchedule) {
      throw new NotFoundException(`Shift schedule with ID ${id} not found`);
    }

    return shiftSchedule;
  }

  async update(
    id: string,
    updateShiftScheduleDto: UpdateShiftScheduleDto
  ): Promise<ShiftSchedule> {
    await this.findOne(id);

    return this.prisma.shiftSchedule.update({
      where: { id },
      data: updateShiftScheduleDto,
      include: {
        staffProfile: true,
        shiftType: true,
        department: true,
        attendance: true,
      },
    });
  }

  async remove(id: string): Promise<ShiftSchedule> {
    await this.findOne(id);

    return this.prisma.shiftSchedule.delete({
      where: { id },
    });
  }

  findByStaff(
    staffProfileId: string,
    query: Omit<FindShiftScheduleDto, 'staffProfileId'>
  ): Promise<ShiftSchedule[]> {
    const { skip, take, startDateTimeFrom, startDateTimeTo, ...filters } =
      query;

    const where: Prisma.ShiftScheduleWhereInput = {
      ...filters,
      staffProfileId,
    };

    // Handle date range if provided
    if (startDateTimeFrom || startDateTimeTo) {
      where.startDateTime = {};

      if (startDateTimeFrom) {
        where.startDateTime.gte = startDateTimeFrom;
      }

      if (startDateTimeTo) {
        where.startDateTime.lte = startDateTimeTo;
      }
    }

    return this.prisma.shiftSchedule.findMany({
      where,
      skip,
      take,
      include: {
        staffProfile: true,
        shiftType: true,
        department: true,
        attendance: true,
      },
    });
  }

  findByDepartment(
    departmentId: string,
    query: Omit<FindShiftScheduleDto, 'departmentId'>
  ): Promise<ShiftSchedule[]> {
    const { skip, take, startDateTimeFrom, startDateTimeTo, ...filters } =
      query;

    const where: Prisma.ShiftScheduleWhereInput = {
      ...filters,
      departmentId,
    };

    // Handle date range if provided
    if (startDateTimeFrom || startDateTimeTo) {
      where.startDateTime = {};

      if (startDateTimeFrom) {
        where.startDateTime.gte = startDateTimeFrom;
      }

      if (startDateTimeTo) {
        where.startDateTime.lte = startDateTimeTo;
      }
    }

    return this.prisma.shiftSchedule.findMany({
      where,
      skip,
      take,
      include: {
        staffProfile: true,
        shiftType: true,
        department: true,
        attendance: true,
      },
    });
  }

  async swapShifts(
    sourceShiftId: string,
    targetShiftId: string,
    reason?: string
  ): Promise<{ source: ShiftSchedule; target: ShiftSchedule }> {
    const sourceShift = await this.findOne(sourceShiftId);
    const targetShift = await this.findOne(targetShiftId);

    // Validate the swaps (same department, not completed, etc.)
    if (sourceShift.departmentId !== targetShift.departmentId) {
      throw new BadRequestException(
        'Cannot swap shifts from different departments'
      );
    }

    if (
      sourceShift.status === 'COMPLETED' ||
      targetShift.status === 'COMPLETED'
    ) {
      throw new BadRequestException('Cannot swap completed shifts');
    }

    const notesUpdate = reason ? ` (Swapped: ${reason})` : ' (Swapped)';

    // Perform the swap in a transaction
    const [updatedSource, updatedTarget] = await this.prisma.$transaction([
      this.prisma.shiftSchedule.update({
        where: { id: sourceShiftId },
        data: {
          staffProfileId: targetShift.staffProfileId,
          notes: (sourceShift.notes || '') + notesUpdate,
        },
        include: {
          staffProfile: true,
          shiftType: true,
          department: true,
          attendance: true,
        },
      }),
      this.prisma.shiftSchedule.update({
        where: { id: targetShiftId },
        data: {
          staffProfileId: sourceShift.staffProfileId,
          notes: (targetShift.notes || '') + notesUpdate,
        },
        include: {
          staffProfile: true,
          shiftType: true,
          department: true,
          attendance: true,
        },
      }),
    ]);

    return {
      source: updatedSource,
      target: updatedTarget,
    };
  }
}
