// apps/api/src/app/shifts/services/shift-attendances.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftAttendanceDto } from '../dto/create-shift-attendance.dto';
import { UpdateShiftAttendanceDto } from '../dto/update-shift-attendance.dto';
import { FindShiftAttendanceDto } from '../dto/find-shift-attendance.dto';
import { ShiftAttendance } from '@prisma/client';

@Injectable()
export class ShiftAttendancesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createShiftAttendanceDto: CreateShiftAttendanceDto
  ): Promise<ShiftAttendance> {
    // Check if an attendance record already exists for this shift
    const existing = await this.prisma.shiftAttendance.findUnique({
      where: { shiftScheduleId: createShiftAttendanceDto.shiftScheduleId },
    });

    if (existing) {
      throw new BadRequestException(
        `Attendance already exists for shift ${createShiftAttendanceDto.shiftScheduleId}`
      );
    }

    return this.prisma.shiftAttendance.create({
      data: createShiftAttendanceDto,
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }

  findAll(query: FindShiftAttendanceDto): Promise<ShiftAttendance[]> {
    const { skip, take, ...filters } = query;

    return this.prisma.shiftAttendance.findMany({
      where: filters,
      skip,
      take,
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }

  async findOne(id: string): Promise<ShiftAttendance> {
    const shiftAttendance = await this.prisma.shiftAttendance.findUnique({
      where: { id },
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });

    if (!shiftAttendance) {
      throw new NotFoundException(`Shift attendance with ID ${id} not found`);
    }

    return shiftAttendance;
  }

  async update(
    id: string,
    updateShiftAttendanceDto: UpdateShiftAttendanceDto
  ): Promise<ShiftAttendance> {
    await this.findOne(id);

    return this.prisma.shiftAttendance.update({
      where: { id },
      data: updateShiftAttendanceDto,
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }

  async remove(id: string): Promise<ShiftAttendance> {
    await this.findOne(id);

    return this.prisma.shiftAttendance.delete({
      where: { id },
    });
  }

  async findByShiftSchedule(
    shiftScheduleId: string
  ): Promise<ShiftAttendance | null> {
    return this.prisma.shiftAttendance.findUnique({
      where: { shiftScheduleId },
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }

  async approve(
    id: string,
    approvedById: string,
    notes?: string
  ): Promise<ShiftAttendance> {
    const attendance = await this.findOne(id);

    if (attendance.status === 'APPROVED') {
      throw new BadRequestException('Attendance record is already approved');
    }

    return this.prisma.shiftAttendance.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        notes: notes
          ? `${attendance.notes ? attendance.notes + ' | ' : ''}${notes}`
          : attendance.notes,
      },
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }

  async clockIn(shiftScheduleId: string): Promise<ShiftAttendance> {
    // Check if shift exists
    const shift = await this.prisma.shiftSchedule.findUnique({
      where: { id: shiftScheduleId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftScheduleId} not found`);
    }

    // Check if attendance already exists
    const existing = await this.prisma.shiftAttendance.findUnique({
      where: { shiftScheduleId },
    });

    const now = new Date();

    if (existing) {
      // Update existing record if already clocked in
      if (existing.actualStartTime) {
        throw new BadRequestException('Already clocked in for this shift');
      }

      return this.prisma.shiftAttendance.update({
        where: { id: existing.id },
        data: {
          actualStartTime: now,
          status: 'ACTIVE',
        },
        include: {
          shiftSchedule: {
            include: {
              staffProfile: true,
              shiftType: true,
              department: true,
            },
          },
          approvedBy: true,
        },
      });
    } else {
      // Create new attendance record
      return this.prisma.shiftAttendance.create({
        data: {
          shiftScheduleId,
          actualStartTime: now,
          status: 'ACTIVE',
        },
        include: {
          shiftSchedule: {
            include: {
              staffProfile: true,
              shiftType: true,
              department: true,
            },
          },
          approvedBy: true,
        },
      });
    }
  }

  async clockOut(shiftScheduleId: string): Promise<ShiftAttendance> {
    // Check if attendance exists
    const attendance = await this.prisma.shiftAttendance.findUnique({
      where: { shiftScheduleId },
      include: {
        shiftSchedule: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        `No clock-in record found for shift ${shiftScheduleId}`
      );
    }

    if (!attendance.actualStartTime) {
      throw new BadRequestException('Cannot clock out before clocking in');
    }

    if (attendance.actualEndTime) {
      throw new BadRequestException('Already clocked out for this shift');
    }

    const now = new Date();

    // Calculate overtime if any
    let overtimeMinutes = 0;
    const shiftEndTime = attendance.shiftSchedule.endDateTime;

    if (now > shiftEndTime) {
      const diffMs = now.getTime() - shiftEndTime.getTime();
      overtimeMinutes = Math.round(diffMs / 60000); // Convert ms to minutes
    }

    return this.prisma.shiftAttendance.update({
      where: { id: attendance.id },
      data: {
        actualEndTime: now,
        status: 'COMPLETED',
        overtimeMinutes,
      },
      include: {
        shiftSchedule: {
          include: {
            staffProfile: true,
            shiftType: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    });
  }
}
