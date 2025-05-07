// apps/api/src/app/shifts/services/shift-reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShiftUtilsService } from './shift-utils.service';
import {
  ShiftSchedule,
  ShiftAttendance,
  ShiftType,
  Department,
  StaffProfile,
} from '@prisma/client';

interface ShiftWithRelations extends ShiftSchedule {
  shiftType: ShiftType;
  department: Department;
  staffProfile: StaffProfile;
  attendance?: ShiftAttendance;
}

interface StaffHoursReport {
  staffProfileId: string;
  staffName: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  shifts: number;
  absences: number;
  lateArrivals: number;
}

interface DepartmentHoursReport {
  departmentId: string;
  departmentName: string;
  staffCount: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalShifts: number;
  totalAbsences: number;
  staffReports: StaffHoursReport[];
}

@Injectable()
export class ShiftReportsService {
  constructor(
    private prisma: PrismaService,
    private shiftUtilsService: ShiftUtilsService
  ) {}

  /**
   * Generate a staff hours report for a date range
   */
  async generateStaffHoursReport(
    staffProfileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StaffHoursReport> {
    // Fetch the staff profile
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
      include: {
        user: true,
      },
    });

    if (!staffProfile) {
      throw new Error(`Staff profile with ID ${staffProfileId} not found`);
    }

    // Fetch all shifts for this staff in the date range
    const shifts = await this.prisma.shiftSchedule.findMany({
      where: {
        staffProfileId,
        startDateTime: {
          gte: startDate,
        },
        endDateTime: {
          lte: endDate,
        },
      },
      include: {
        shiftType: true,
        department: true,
        attendance: true,
      },
    });

    // Calculate statistics
    let regularHours = 0;
    let overtimeHours = 0;
    let absences = 0;
    let lateArrivals = 0;

    for (const shift of shifts) {
      const shiftWithMeta = shift as unknown as ShiftWithRelations;

      // Check attendance status
      if (!shift.attendance) {
        absences++;
        continue;
      }

      if (shift.attendance.status === 'ABSENT') {
        absences++;
        continue;
      }

      if (shift.attendance.status === 'LATE') {
        lateArrivals++;
      }

      // Calculate hours if shift was worked
      if (shift.attendance.actualStartTime && shift.attendance.actualEndTime) {
        const hours =
          this.shiftUtilsService.calculateTotalPayableHours(shiftWithMeta);
        regularHours += hours.regularHours;
        overtimeHours += hours.overtimeHours;
      }
    }

    const staffName = `${staffProfile.user.firstName} ${staffProfile.user.lastName}`;

    return {
      staffProfileId,
      staffName,
      regularHours,
      overtimeHours,
      totalHours: regularHours + overtimeHours,
      shifts: shifts.length,
      absences,
      lateArrivals,
    };
  }

  /**
   * Generate a department hours report for a date range
   */
  async generateDepartmentHoursReport(
    departmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DepartmentHoursReport> {
    // Fetch the department
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    // Fetch all shifts for this department in the date range
    const shifts = await this.prisma.shiftSchedule.findMany({
      where: {
        departmentId,
        startDateTime: {
          gte: startDate,
        },
        endDateTime: {
          lte: endDate,
        },
      },
      include: {
        shiftType: true,
        department: true,
        staffProfile: {
          include: {
            user: true,
          },
        },
        attendance: true,
      },
    });

    // Group shifts by staff
    const staffShifts: Record<string, ShiftWithRelations[]> = {};

    for (const shift of shifts) {
      const shiftWithMeta = shift as unknown as ShiftWithRelations;

      if (!staffShifts[shift.staffProfileId]) {
        staffShifts[shift.staffProfileId] = [];
      }

      staffShifts[shift.staffProfileId].push(shiftWithMeta);
    }

    // Generate report for each staff
    const staffReports: StaffHoursReport[] = [];
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalAbsences = 0;

    for (const [staffProfileId, staffShiftList] of Object.entries(
      staffShifts
    )) {
      const staffReport = await this.generateStaffHoursReport(
        staffProfileId,
        startDate,
        endDate
      );

      staffReports.push(staffReport);
      totalRegularHours += staffReport.regularHours;
      totalOvertimeHours += staffReport.overtimeHours;
      totalAbsences += staffReport.absences;
    }

    return {
      departmentId,
      departmentName: department.name,
      staffCount: staffReports.length,
      totalRegularHours,
      totalOvertimeHours,
      totalShifts: shifts.length,
      totalAbsences,
      staffReports,
    };
  }

  /**
   * Generate an organization-wide shift coverage report
   */
  async generateOrganizationCoverageReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalScheduledShifts: number;
    totalCompletedShifts: number;
    coverageRate: number;
    departmentsWithLowCoverage: Array<{
      departmentId: string;
      departmentName: string;
      coverageRate: number;
    }>;
  }> {
    // Fetch all departments in the organization
    const departments = await this.prisma.department.findMany({
      where: { organizationId },
    });

    let totalScheduledShifts = 0;
    let totalCompletedShifts = 0;
    const departmentCoverage: Array<{
      departmentId: string;
      departmentName: string;
      coverageRate: number;
    }> = [];

    for (const department of departments) {
      // Get all shifts for this department in the date range
      const shifts = await this.prisma.shiftSchedule.findMany({
        where: {
          departmentId: department.id,
          startDateTime: {
            gte: startDate,
          },
          endDateTime: {
            lte: endDate,
          },
        },
        include: {
          attendance: true,
        },
      });

      const scheduledCount = shifts.length;
      const completedCount = shifts.filter(
        (s) =>
          s.attendance &&
          (s.attendance.status === 'COMPLETED' ||
            s.attendance.status === 'APPROVED')
      ).length;

      const deptCoverageRate =
        scheduledCount > 0 ? completedCount / scheduledCount : 1;

      departmentCoverage.push({
        departmentId: department.id,
        departmentName: department.name,
        coverageRate: deptCoverageRate,
      });

      totalScheduledShifts += scheduledCount;
      totalCompletedShifts += completedCount;
    }

    // Calculate overall coverage rate
    const overallCoverageRate =
      totalScheduledShifts > 0
        ? totalCompletedShifts / totalScheduledShifts
        : 1;

    // Find departments with low coverage (below 80%)
    const departmentsWithLowCoverage = departmentCoverage
      .filter((d) => d.coverageRate < 0.8)
      .sort((a, b) => a.coverageRate - b.coverageRate);

    return {
      totalScheduledShifts,
      totalCompletedShifts,
      coverageRate: overallCoverageRate,
      departmentsWithLowCoverage,
    };
  }

  /**
   * Generate overtime report by staff
   */
  async generateOvertimeReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      staffProfileId: string;
      staffName: string;
      departmentName: string;
      totalOvertimeHours: number;
      totalOvertimeMinutes: number;
      costImpact: number;
    }>
  > {
    // Get all staff in the organization
    const staffProfiles = await this.prisma.staffProfile.findMany({
      where: {
        user: {
          organizationId,
        },
      },
      include: {
        user: true,
      },
    });

    const result: Array<{
      staffProfileId: string;
      staffName: string;
      departmentName: string;
      totalOvertimeHours: number;
      totalOvertimeMinutes: number;
      costImpact: number;
    }> = [];

    for (const staffProfile of staffProfiles) {
      // Get all shifts for this staff in the date range
      const shifts = await this.prisma.shiftSchedule.findMany({
        where: {
          staffProfileId: staffProfile.id,
          startDateTime: {
            gte: startDate,
          },
          endDateTime: {
            lte: endDate,
          },
        },
        include: {
          shiftType: true,
          department: true,
          attendance: true,
        },
      });

      // Calculate overtime
      let totalOvertimeMinutes = 0;

      for (const shift of shifts) {
        if (shift.attendance && shift.attendance.overtimeMinutes) {
          totalOvertimeMinutes += shift.attendance.overtimeMinutes;
        }
      }

      if (totalOvertimeMinutes > 0) {
        // Find the department the staff works in most
        const departmentCounts: Record<string, number> = {};

        for (const shift of shifts) {
          departmentCounts[shift.departmentId] =
            (departmentCounts[shift.departmentId] || 0) + 1;
        }

        let primaryDepartmentId = '';
        let maxCount = 0;

        for (const [deptId, count] of Object.entries(departmentCounts)) {
          if (count > maxCount) {
            maxCount = count;
            primaryDepartmentId = deptId;
          }
        }

        // Get department name
        const department = await this.prisma.department.findUnique({
          where: { id: primaryDepartmentId },
        });

        // Calculate cost impact (basic estimate)
        const hourlyRate = Number(staffProfile.baseSalaryAmount);
        const overtimeHourlyRate = hourlyRate * 1.5; // Assuming 1.5x for overtime
        const overtimeHours = totalOvertimeMinutes / 60;
        const costImpact = overtimeHours * overtimeHourlyRate;

        result.push({
          staffProfileId: staffProfile.id,
          staffName: `${staffProfile.user.firstName} ${staffProfile.user.lastName}`,
          departmentName: department ? department.name : 'Unknown',
          totalOvertimeHours: totalOvertimeMinutes / 60,
          totalOvertimeMinutes,
          costImpact,
        });
      }
    }

    // Sort by overtime hours (descending)
    return result.sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
  }
}
