// libs/api/features/src/lib/timesheets/services/timesheets.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Timesheet,
  TimesheetDocument,
  TimesheetStatus,
  TimesheetPeriod,
} from '@wyecare-monorepo/core';
import { CreateTimesheetDto } from '../dto/create-timesheet.dto';
import { UpdateTimesheetDto } from '../dto/update-timesheet.dto';
import { GenerateTimesheetDto } from '../dto/generate-timesheet.dto';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
  ShiftStatus,
} from '@wyecare-monorepo/core';
import { TimesheetAction } from '../dto/timesheet-approval.dto';
import * as luxon from 'luxon';

interface TimesheetQueryOptions {
  status?: string | string[];
  periodStart?: Date;
  periodEnd?: Date;
  workerId?: string | string[];
  departmentId?: string;
  year?: number;
  month?: number;
  week?: number;
  search?: string;
}

@Injectable()
export class TimesheetsService {
  private readonly logger = new Logger(TimesheetsService.name);

  constructor(
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<TimesheetDocument>,

    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>
  ) {}

  /**
   * Create a new timesheet
   */
  async create(
    createTimesheetDto: CreateTimesheetDto
  ): Promise<TimesheetDocument> {
    try {
      // Convert IDs to ObjectIds
      const timesheetData = {
        ...createTimesheetDto,
        organizationId: new Types.ObjectId(createTimesheetDto.organizationId),
        workerId: new Types.ObjectId(createTimesheetDto.workerId),
        departmentId: createTimesheetDto.departmentId
          ? new Types.ObjectId(createTimesheetDto.departmentId)
          : undefined,
        shiftAssignments: createTimesheetDto.shiftAssignments
          ? createTimesheetDto.shiftAssignments.map(
              (id) => new Types.ObjectId(id)
            )
          : [],
      };

      // Set default status if not provided
      if (!timesheetData.status) {
        timesheetData.status = TimesheetStatus.DRAFT;
      }

      // Calculate year, month, week if not provided
      if (!timesheetData.year) {
        timesheetData.year = luxon.DateTime.fromJSDate(
          timesheetData.periodStart
        ).year;
      }

      if (
        !timesheetData.monthNumber &&
        timesheetData.periodType === TimesheetPeriod.MONTHLY
      ) {
        timesheetData.monthNumber = luxon.DateTime.fromJSDate(
          timesheetData.periodStart
        ).month;
      }

      if (
        !timesheetData.weekNumber &&
        (timesheetData.periodType === TimesheetPeriod.WEEKLY ||
          timesheetData.periodType === TimesheetPeriod.BI_WEEKLY)
      ) {
        timesheetData.weekNumber = luxon.DateTime.fromJSDate(
          timesheetData.periodStart
        ).weekNumber;
      }

      // Check if timesheet already exists for this period and worker
      const existingTimesheet = await this.timesheetModel.findOne({
        organizationId: timesheetData.organizationId,
        workerId: timesheetData.workerId,
        periodStart: timesheetData.periodStart,
        periodEnd: timesheetData.periodEnd,
      });

      if (existingTimesheet) {
        throw new BadRequestException(
          `Timesheet already exists for this worker and period (ID: ${existingTimesheet._id})`
        );
      }

      // Create and save the timesheet
      const newTimesheet = new this.timesheetModel(timesheetData);

      // Calculate totals if shifts are provided
      if (
        timesheetData.shiftAssignments &&
        timesheetData.shiftAssignments.length > 0
      ) {
        await this.calculateTimesheetSummary(newTimesheet);
      }

      return await newTimesheet.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate a timesheet for a worker based on completed shifts
   */
  async generateTimesheet(
    generateTimesheetDto: GenerateTimesheetDto
  ): Promise<TimesheetDocument> {
    try {
      const {
        workerId,
        organizationId,
        periodStart,
        periodEnd,
        periodType,
        departmentId,
      } = generateTimesheetDto;

      // Check if timesheet already exists
      const existingTimesheet = await this.timesheetModel.findOne({
        organizationId: new Types.ObjectId(organizationId),
        workerId: new Types.ObjectId(workerId),
        periodStart,
        periodEnd,
      });

      if (existingTimesheet) {
        throw new BadRequestException(
          `Timesheet already exists for this worker and period (ID: ${existingTimesheet._id})`
        );
      }

      // Find completed shifts for this worker and period
      const shifts = await this.shiftAssignmentModel
        .find({
          organizationId: new Types.ObjectId(organizationId),
          workerId: new Types.ObjectId(workerId),
          scheduledStartTime: { $gte: periodStart },
          scheduledEndTime: { $lte: periodEnd },
          status: { $in: [ShiftStatus.COMPLETED, ShiftStatus.CONFIRMED] },
        })
        .exec();

      if (shifts.length === 0) {
        throw new BadRequestException(
          'No completed shifts found for this period'
        );
      }

      // Create timesheet DTO
      const createTimesheetDto: CreateTimesheetDto = {
        workerId,
        organizationId,
        periodStart,
        periodEnd,
        periodType,
        departmentId,
        status: TimesheetStatus.DRAFT,
        shiftAssignments: shifts.map((shift: ShiftAssignment & { _id: any }) =>
          shift._id.toString()
        ),
      };

      // Create the timesheet
      return await this.create(createTimesheetDto);
    } catch (error: any) {
      this.logger.error(
        `Error generating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate timesheets in bulk for multiple workers
   */
  async generateTimesheetsBulk(
    organizationId: string,
    workerIds: string[],
    periodStart: Date,
    periodEnd: Date,
    periodType: TimesheetPeriod,
    departmentId?: string
  ): Promise<TimesheetDocument[]> {
    try {
      const timesheets: TimesheetDocument[] = [];

      // Generate timesheet for each worker
      for (const workerId of workerIds) {
        try {
          const timesheet = await this.generateTimesheet({
            workerId,
            organizationId,
            periodStart,
            periodEnd,
            periodType,
            departmentId,
          });

          timesheets.push(timesheet);
        } catch (error) {
          // Log error but continue with other workers
          this.logger.warn(
            `Failed to generate timesheet for worker ${workerId}: ${error.message}`
          );
        }
      }

      return timesheets;
    } catch (error: any) {
      this.logger.error(
        `Error generating bulk timesheets: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find all timesheets with optional filtering
   */
  async findAll(
    organizationId: string,
    options: TimesheetQueryOptions = {}
  ): Promise<TimesheetDocument[]> {
    try {
      const {
        status,
        periodStart,
        periodEnd,
        workerId,
        departmentId,
        year,
        month,
        week,
        search,
      } = options;

      // Build query
      const query: any = { organizationId: new Types.ObjectId(organizationId) };

      // Add filters based on options
      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }

      if (periodStart) {
        query.periodStart = { ...query.periodStart, $gte: periodStart };
      }

      if (periodEnd) {
        query.periodEnd = { ...query.periodEnd, $lte: periodEnd };
      }

      if (workerId) {
        if (Array.isArray(workerId)) {
          query.workerId = {
            $in: workerId.map((id) => new Types.ObjectId(id)),
          };
        } else {
          query.workerId = new Types.ObjectId(workerId);
        }
      }

      if (departmentId) {
        query.departmentId = new Types.ObjectId(departmentId);
      }

      if (year !== undefined) {
        query.year = year;
      }

      if (month !== undefined) {
        query.monthNumber = month;
      }

      if (week !== undefined) {
        query.weekNumber = week;
      }

      if (search) {
        query.$or = [{ notes: { $regex: search, $options: 'i' } }];
      }

      return await this.timesheetModel
        .find(query)
        .sort({ periodStart: -1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding timesheets: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find timesheets for a specific worker
   */
  async findByWorker(
    organizationId: string,
    workerId: string,
    year?: number,
    month?: number,
    status?: string[]
  ): Promise<TimesheetDocument[]> {
    try {
      return await this.findAll(organizationId, {
        workerId,
        year,
        month,
        status: status || undefined,
      });
    } catch (error: any) {
      this.logger.error(
        `Error finding worker timesheets: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find a specific timesheet
   */
  async findOne(
    id: string,
    organizationId: string
  ): Promise<TimesheetDocument> {
    try {
      const timesheet = await this.timesheetModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!timesheet) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      return timesheet;
    } catch (error: any) {
      this.logger.error(
        `Error finding timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Update a timesheet
   */
  async update(
    id: string,
    organizationId: string,
    updateTimesheetDto: UpdateTimesheetDto
  ): Promise<TimesheetDocument> {
    try {
      // Prepare update data with ObjectId conversions
      const updateData: any = { ...updateTimesheetDto };

      if (updateData.departmentId) {
        updateData.departmentId = new Types.ObjectId(updateData.departmentId);
      }

      if (updateData.shiftAssignments) {
        updateData.shiftAssignments = updateData.shiftAssignments.map(
          (id: any) => new Types.ObjectId(id)
        );
      }

      const timesheet = await this.timesheetModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!timesheet) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      // Prevent updating submitted or approved timesheets
      if (
        (timesheet.status === TimesheetStatus.SUBMITTED ||
          timesheet.status === TimesheetStatus.APPROVED ||
          timesheet.status === TimesheetStatus.PAID) &&
        !updateData.status
      ) {
        throw new BadRequestException(
          `Cannot update timesheet with status ${timesheet.status}`
        );
      }

      // Update the timesheet
      Object.assign(timesheet, updateData);

      // Recalculate summary if shifts were updated
      if (updateData.shiftAssignments) {
        await this.calculateTimesheetSummary(timesheet);
      }

      return await timesheet.save();
    } catch (error: any) {
      this.logger.error(
        `Error updating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Process a timesheet action (submit, approve, reject, etc.)
   */
  async processAction(
    id: string,
    organizationId: string,
    action: TimesheetAction,
    userId: string,
    comments?: string
  ): Promise<TimesheetDocument> {
    try {
      const timesheet = await this.findOne(id, organizationId);

      // Create approval history entry
      const historyEntry = {
        status: action,
        userId: new Types.ObjectId(userId),
        timestamp: new Date(),
        comments,
      };

      // Update timesheet based on action
      let updateData: any = {
        $push: { approvalHistory: historyEntry },
      };

      switch (action) {
        case TimesheetAction.SUBMIT:
          if (timesheet.status !== TimesheetStatus.DRAFT) {
            throw new BadRequestException(
              'Only draft timesheets can be submitted'
            );
          }
          updateData.$set = {
            status: TimesheetStatus.SUBMITTED,
            submittedAt: new Date(),
            submittedBy: new Types.ObjectId(userId),
          };
          break;

        case TimesheetAction.APPROVE:
          if (
            timesheet.status !== TimesheetStatus.SUBMITTED &&
            timesheet.status !== TimesheetStatus.UNDER_REVIEW
          ) {
            throw new BadRequestException(
              'Only submitted timesheets can be approved'
            );
          }
          updateData.$set = {
            status: TimesheetStatus.APPROVED,
            approvedAt: new Date(),
            approvedBy: new Types.ObjectId(userId),
          };
          break;

        case TimesheetAction.REJECT:
          if (
            timesheet.status !== TimesheetStatus.SUBMITTED &&
            timesheet.status !== TimesheetStatus.UNDER_REVIEW
          ) {
            throw new BadRequestException(
              'Only submitted timesheets can be rejected'
            );
          }
          updateData.$set = { status: TimesheetStatus.DRAFT };
          break;

        case TimesheetAction.REOPEN:
          if (timesheet.status !== TimesheetStatus.APPROVED) {
            throw new BadRequestException(
              'Only approved timesheets can be reopened'
            );
          }
          updateData.$set = { status: TimesheetStatus.DRAFT };
          break;

        case TimesheetAction.MARK_PAID:
          if (timesheet.status !== TimesheetStatus.APPROVED) {
            throw new BadRequestException(
              'Only approved timesheets can be marked as paid'
            );
          }
          updateData.$set = {
            status: TimesheetStatus.PAID,
            paidAt: new Date(),
          };
          break;

        default:
          throw new BadRequestException(`Invalid action: ${action}`);
      }

      const updatedTimesheet = await this.timesheetModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          updateData,
          { new: true }
        )
        .exec();

      if (!updatedTimesheet) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      return updatedTimesheet;
    } catch (error: any) {
      this.logger.error(
        `Error processing timesheet action: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete a timesheet
   */
  async remove(
    id: string,
    organizationId: string
  ): Promise<{ deleted: boolean }> {
    try {
      // Check timesheet status first
      const timesheet = await this.findOne(id, organizationId);

      if (timesheet.status !== TimesheetStatus.DRAFT) {
        throw new BadRequestException(
          `Cannot delete timesheet with status ${timesheet.status}`
        );
      }

      const result = await this.timesheetModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Calculate timesheet summary from shifts
   */
  private async calculateTimesheetSummary(
    timesheet: TimesheetDocument
  ): Promise<void> {
    try {
      if (
        !timesheet.shiftAssignments ||
        timesheet.shiftAssignments.length === 0
      ) {
        throw new BadRequestException('No shifts assigned to this timesheet');
      }

      // Get all shifts
      const shifts = await this.shiftAssignmentModel
        .find({
          _id: { $in: timesheet.shiftAssignments },
        })
        .exec();

      if (shifts.length === 0) {
        throw new BadRequestException(
          'No valid shifts found for this timesheet'
        );
      }

      // Calculate summary
      const summary = {
        totalShifts: shifts.length,
        scheduledMinutes: 0,
        actualMinutes: 0,
        regularMinutes: 0,
        overtimeMinutes: 0,
        weekendMinutes: 0,
        holidayMinutes: 0,
        nightMinutes: 0,
        breakMinutes: 0,
        paidBreakMinutes: 0,
        unpaidBreakMinutes: 0,
      };

      // Calculate payment summary
      const paymentSummary = {
        baseAmount: 0,
        overtimeAmount: 0,
        weekendAmount: 0,
        holidayAmount: 0,
        nightAmount: 0,
        bonusAmount: 0,
        deductionAmount: 0,
        totalAmount: 0,
        currency: 'default',
      };

      // Process each shift
      for (const shift of shifts) {
        // Calculate time summary
        summary.scheduledMinutes += shift.scheduledDurationMinutes || 0;
        summary.actualMinutes += shift.actualDurationMinutes || 0;

        // Categorize minutes based on shift type
        const minutes =
          shift.actualDurationMinutes || shift.scheduledDurationMinutes || 0;

        if (shift.isOvertime) {
          summary.overtimeMinutes += minutes;
        } else {
          summary.regularMinutes += minutes;
        }

        if (shift.isWeekend) {
          summary.weekendMinutes += minutes;
        }

        if (shift.isHoliday) {
          summary.holidayMinutes += minutes;
        }

        if (shift.isNightShift) {
          summary.nightMinutes += minutes;
        }

        // Calculate break minutes
        if (shift.breaks && shift.breaks.length > 0) {
          for (const breakPeriod of shift.breaks) {
            const breakMinutes = breakPeriod.durationMinutes || 0;
            summary.breakMinutes += breakMinutes;

            if (breakPeriod.isPaid) {
              summary.paidBreakMinutes += breakMinutes;
            } else {
              summary.unpaidBreakMinutes += breakMinutes;
            }
          }
        }

        // Add payment details if available
        if (shift.paymentDetails) {
          paymentSummary.baseAmount += shift.paymentDetails.totalAmount || 0;

          // Additional payment breakdowns if available
          if (shift.paymentDetails.method === 'hourly') {
            const regularHours = shift.paymentDetails.regularHours || 0;
            const overtimeHours = shift.paymentDetails.overtimeHours || 0;
            const baseRate = shift.paymentDetails.baseRate || 0;
            const overtimeRate =
              shift.paymentDetails.overtimeRate || baseRate * 1.5;

            if (regularHours > 0) {
              paymentSummary.baseAmount += regularHours * baseRate;
            }

            if (overtimeHours > 0) {
              paymentSummary.overtimeAmount += overtimeHours * overtimeRate;
            }

            if (
              shift.paymentDetails.weekendHours &&
              shift.paymentDetails.weekendRate
            ) {
              const additionalWeekend =
                shift.paymentDetails.weekendHours *
                (shift.paymentDetails.weekendRate - baseRate);
              paymentSummary.weekendAmount +=
                additionalWeekend > 0 ? additionalWeekend : 0;
            }

            if (
              shift.paymentDetails.holidayHours &&
              shift.paymentDetails.holidayRate
            ) {
              const additionalHoliday =
                shift.paymentDetails.holidayHours *
                (shift.paymentDetails.holidayRate - baseRate);
              paymentSummary.holidayAmount +=
                additionalHoliday > 0 ? additionalHoliday : 0;
            }

            if (
              shift.paymentDetails.nightHours &&
              shift.paymentDetails.nightRate
            ) {
              const additionalNight =
                shift.paymentDetails.nightHours *
                (shift.paymentDetails.nightRate - baseRate);
              paymentSummary.nightAmount +=
                additionalNight > 0 ? additionalNight : 0;
            }
          } else if (shift.paymentDetails.method === 'per_shift') {
            // For per-shift payment, the base amount already includes the shift payment
            // Additional amounts for weekend/holiday would be in specific fields
            if (shift.paymentDetails.weekendRate) {
              paymentSummary.weekendAmount += shift.paymentDetails.weekendRate;
            }

            if (shift.paymentDetails.holidayRate) {
              paymentSummary.holidayAmount += shift.paymentDetails.holidayRate;
            }
          }

          // Add any additional payments
          if (shift.paymentDetails.additionalPayments) {
            for (const [key, value] of Object.entries(
              shift.paymentDetails.additionalPayments
            )) {
              if (key.toLowerCase().includes('bonus')) {
                paymentSummary.bonusAmount +=
                  typeof value === 'number' ? value : 0;
              } else if (key.toLowerCase().includes('deduction')) {
                paymentSummary.deductionAmount +=
                  typeof value === 'number' ? value : 0;
              }
            }
          }

          // Set currency if not already set
          if (shift.paymentDetails.currency) {
            paymentSummary.currency = shift.paymentDetails.currency;
          }
        }
      }

      // Calculate total payment amount
      paymentSummary.totalAmount =
        paymentSummary.baseAmount +
        paymentSummary.overtimeAmount +
        paymentSummary.weekendAmount +
        paymentSummary.holidayAmount +
        paymentSummary.nightAmount +
        paymentSummary.bonusAmount -
        paymentSummary.deductionAmount;

      // Update the timesheet
      timesheet.summary = summary;
      timesheet.paymentSummary = paymentSummary;
    } catch (error: any) {
      this.logger.error(
        `Error calculating timesheet summary: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all timesheets for a specific period
   */
  async getTimeSheetsByPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    status?: string[]
  ): Promise<TimesheetDocument[]> {
    try {
      return await this.findAll(organizationId, {
        periodStart,
        periodEnd,
        status,
      });
    } catch (error: any) {
      this.logger.error(
        `Error getting timesheets by period: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get summary statistics for timesheets
   */
  async getTimesheetStats(
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    try {
      // Build query
      const query: any = { organizationId: new Types.ObjectId(organizationId) };

      if (periodStart) {
        query.periodStart = { $gte: periodStart };
      }

      if (periodEnd) {
        query.periodEnd = { $lte: periodEnd };
      }

      // Get all relevant timesheets
      const timesheets = await this.timesheetModel.find(query).lean().exec();

      // Calculate statistics
      const stats = {
        totalTimesheets: timesheets.length,
        statusCounts: {
          draft: 0,
          submitted: 0,
          underReview: 0,
          approved: 0,
          rejected: 0,
          paid: 0,
        },
        totalMinutes: 0,
        totalShifts: 0,
        totalAmount: 0,
      };

      // Process each timesheet
      for (const timesheet of timesheets) {
        // Count by status
        switch (timesheet.status) {
          case TimesheetStatus.DRAFT:
            stats.statusCounts.draft++;
            break;
          case TimesheetStatus.SUBMITTED:
            stats.statusCounts.submitted++;
            break;
          case TimesheetStatus.UNDER_REVIEW:
            stats.statusCounts.underReview++;
            break;
          case TimesheetStatus.APPROVED:
            stats.statusCounts.approved++;
            break;
          case TimesheetStatus.REJECTED:
            stats.statusCounts.rejected++;
            break;
          case TimesheetStatus.PAID:
            stats.statusCounts.paid++;
            break;
        }

        // Sum up totals
        if (timesheet.summary) {
          stats.totalMinutes += timesheet.summary.actualMinutes || 0;
          stats.totalShifts += timesheet.summary.totalShifts || 0;
        }

        if (timesheet.paymentSummary) {
          stats.totalAmount += timesheet.paymentSummary.totalAmount || 0;
        }
      }

      return stats;
    } catch (error: any) {
      this.logger.error(
        `Error getting timesheet stats: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Export timesheets for payroll
   */
  async exportForPayroll(
    organizationId: string,
    timesheetIds: string[],
    payrollReference: string
  ): Promise<any> {
    try {
      // Get all requested timesheets
      const timesheets = await this.timesheetModel
        .find({
          _id: { $in: timesheetIds.map((id) => new Types.ObjectId(id)) },
          organizationId: new Types.ObjectId(organizationId),
          status: TimesheetStatus.APPROVED,
        })
        .lean()
        .exec();

      if (timesheets.length === 0) {
        throw new BadRequestException(
          'No approved timesheets found with the provided IDs'
        );
      }

      // Mark all as paid
      await this.timesheetModel.updateMany(
        {
          _id: { $in: timesheetIds.map((id) => new Types.ObjectId(id)) },
          organizationId: new Types.ObjectId(organizationId),
          status: TimesheetStatus.APPROVED,
        },
        {
          $set: {
            status: TimesheetStatus.PAID,
            paidAt: new Date(),
            payrollReference,
          },
        }
      );

      // Prepare export data
      const exportData = timesheets.map((timesheet) => ({
        id: timesheet._id.toString(),
        workerId: timesheet.workerId.toString(),
        periodStart: timesheet.periodStart,
        periodEnd: timesheet.periodEnd,
        totalHours: (timesheet.summary?.actualMinutes || 0) / 60,
        totalAmount: timesheet.paymentSummary?.totalAmount || 0,
        currency: timesheet.paymentSummary?.currency || 'default',
      }));

      return {
        payrollReference,
        exportDate: new Date(),
        timesheetCount: timesheets.length,
        totalAmount: timesheets.reduce(
          (sum, t) => sum + (t.paymentSummary?.totalAmount || 0),
          0
        ),
        items: exportData,
      };
    } catch (error: any) {
      this.logger.error(
        `Error exporting timesheets for payroll: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
