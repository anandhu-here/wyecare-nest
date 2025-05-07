// apps/api/src/app/shifts/services/shift-utils.service.ts
import { Injectable } from '@nestjs/common';
import { ShiftSchedule, ShiftType, ShiftAttendance } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface ShiftWithMetadata extends ShiftSchedule {
  shiftType: ShiftType;
  attendance?: ShiftAttendance;
}

@Injectable()
export class ShiftUtilsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate worked hours for a shift
   */
  calculateWorkedHours(shift: ShiftWithMetadata): number {
    if (
      !shift.attendance ||
      !shift.attendance.actualStartTime ||
      !shift.attendance.actualEndTime
    ) {
      return 0;
    }

    const startTime = shift.attendance.actualStartTime.getTime();
    const endTime = shift.attendance.actualEndTime.getTime();

    return (endTime - startTime) / (1000 * 60 * 60); // Convert ms to hours
  }

  /**
   * Calculate worked hours with overtime for payment calculations
   */
  calculateTotalPayableHours(shift: ShiftWithMetadata): {
    regularHours: number;
    overtimeHours: number;
  } {
    if (
      !shift.attendance ||
      !shift.attendance.actualStartTime ||
      !shift.attendance.actualEndTime
    ) {
      return { regularHours: 0, overtimeHours: 0 };
    }

    const workedHours = this.calculateWorkedHours(shift);
    const regularHours = shift.shiftType.hoursCount;

    // Check if there's overtime
    if (workedHours > regularHours) {
      return {
        regularHours,
        overtimeHours: workedHours - regularHours,
      };
    }

    return {
      regularHours: workedHours,
      overtimeHours: 0,
    };
  }

  /**
   * Check if two shifts overlap
   */
  shiftsOverlap(shift1: ShiftSchedule, shift2: ShiftSchedule): boolean {
    return (
      (shift1.startDateTime <= shift2.startDateTime &&
        shift2.startDateTime < shift1.endDateTime) ||
      (shift2.startDateTime <= shift1.startDateTime &&
        shift1.startDateTime < shift2.endDateTime)
    );
  }

  /**
   * Generate dates for a recurring shift pattern
   */
  generateRecurringShiftDates(
    startDate: Date,
    endDate: Date,
    daysOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  ): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    // Set time to midnight to work with just the date
    currentDate.setHours(0, 0, 0, 0);

    // Loop through each day until we reach the end date
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0-6

      // If this day of the week is in our target list, add it
      if (daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(currentDate));
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Calculate late arrival in minutes
   */
  calculateLateMinutes(shift: ShiftWithMetadata): number {
    if (!shift.attendance || !shift.attendance.actualStartTime) {
      return 0;
    }

    const scheduledStart = shift.startDateTime.getTime();
    const actualStart = shift.attendance.actualStartTime.getTime();

    if (actualStart > scheduledStart) {
      return Math.round((actualStart - scheduledStart) / 60000); // Convert ms to minutes
    }

    return 0;
  }

  /**
   * Determine the attendance status based on start/end times
   */
  determineAttendanceStatus(shift: ShiftWithMetadata): string {
    if (!shift.attendance) {
      return 'PENDING';
    }

    if (!shift.attendance.actualStartTime) {
      return 'PENDING';
    }

    if (!shift.attendance.actualEndTime) {
      return 'ACTIVE';
    }

    const lateMinutes = this.calculateLateMinutes(shift);

    // More than 15 minutes late is considered LATE
    if (lateMinutes > 15) {
      return 'LATE';
    }

    // If they worked less than 90% of scheduled hours, mark as PARTIALLY_COMPLETE
    const workedHours = this.calculateWorkedHours(shift);
    const scheduledHours = shift.shiftType.hoursCount;

    if (workedHours < scheduledHours * 0.9) {
      return 'PARTIALLY_COMPLETE';
    }

    return 'COMPLETED';
  }
}
