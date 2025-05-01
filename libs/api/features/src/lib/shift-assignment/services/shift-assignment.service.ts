// shift-assignment.service.ts
// libs/api/features/src/lib/shifts/services/shift-assignments.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
  ShiftStatus,
} from '@wyecare-monorepo/core';
import { CreateShiftAssignmentDto } from '../dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from '../dto/update-shift-assignment.dto';
import { RecordClockEventDto } from '../dto/clock-event.dto';
import {
  ShiftType,
  ShiftTypeDocument,
  ShiftPaymentConfig,
  ShiftPaymentConfigDocument,
} from '@wyecare-monorepo/core';
import * as luxon from 'luxon';
import { SchedulingRulesService } from '../../shift-types/services/scheduling-rules.service';

interface ShiftAssignmentQueryOptions {
  status?: string | string[];
  startDate?: Date;
  endDate?: Date;
  workerId?: string | string[];
  departmentId?: string;
  locationId?: string;
  shiftTypeId?: string | string[];
  isOvertime?: boolean;
  isHoliday?: boolean;
  isWeekend?: boolean;
  isNightShift?: boolean;
  search?: string;
  tags?: string[];
}

@Injectable()
export class ShiftAssignmentsService {
  private readonly logger = new Logger(ShiftAssignmentsService.name);

  constructor(
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,

    @InjectModel(ShiftType.name)
    private shiftTypeModel: Model<ShiftTypeDocument>,

    @InjectModel(ShiftPaymentConfig.name)
    private paymentConfigModel: Model<ShiftPaymentConfigDocument>,

    private schedulingRulesService: SchedulingRulesService
  ) {}

  /**
   * Create a new shift assignment
   */
  async create(
    createShiftAssignmentDto: CreateShiftAssignmentDto
  ): Promise<ShiftAssignmentDocument> {
    try {
      // Convert IDs to ObjectIds
      const assignmentData = {
        ...createShiftAssignmentDto,
        organizationId: new Types.ObjectId(
          createShiftAssignmentDto.organizationId
        ),
        workerId: new Types.ObjectId(createShiftAssignmentDto.workerId),
        shiftTypeId: new Types.ObjectId(createShiftAssignmentDto.shiftTypeId),
        departmentId: createShiftAssignmentDto.departmentId
          ? new Types.ObjectId(createShiftAssignmentDto.departmentId)
          : undefined,
        locationId: createShiftAssignmentDto.locationId
          ? new Types.ObjectId(createShiftAssignmentDto.locationId)
          : undefined,
        rotationPatternId: createShiftAssignmentDto.rotationPatternId
          ? new Types.ObjectId(createShiftAssignmentDto.rotationPatternId)
          : undefined,
        assignedBy: createShiftAssignmentDto.assignedBy
          ? new Types.ObjectId(createShiftAssignmentDto.assignedBy)
          : undefined,
      };

      // Calculate duration if not provided
      if (!assignmentData.scheduledDurationMinutes) {
        assignmentData.scheduledDurationMinutes = this.calculateDurationMinutes(
          assignmentData.scheduledStartTime,
          assignmentData.scheduledEndTime
        );
      }

      // Determine if it's weekend, holiday, or night shift
      assignmentData.isWeekend = this.isWeekend(
        assignmentData.scheduledStartTime
      );
      // Holiday detection would typically use a holiday service
      // assignmentData.isHoliday = await this.holidayService.isHoliday(assignmentData.scheduledStartTime);

      // Get shift type to determine if it's a night shift
      const shiftType = await this.shiftTypeModel.findById(
        assignmentData.shiftTypeId
      );
      if (shiftType?.defaultTiming?.isOvernight) {
        assignmentData.isNightShift = true;
      }

      // Set default status if not provided
      if (!assignmentData.status) {
        assignmentData.status = ShiftStatus.SCHEDULED;
      }

      // Create the assignment
      const newShiftAssignment = new this.shiftAssignmentModel(assignmentData);

      // Validate against scheduling rules
      await this.validateAssignmentAgainstRules(newShiftAssignment);

      // If payment details not provided, try to get default from payment config
      if (!assignmentData.paymentDetails) {
        const paymentConfig = await this.getPaymentConfigForShift(
          assignmentData.organizationId.toString(),
          assignmentData.shiftTypeId.toString()
        );

        if (paymentConfig) {
          newShiftAssignment.paymentDetails =
            this.createDefaultPaymentDetails(paymentConfig);
        }
      }

      return await newShiftAssignment.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Create multiple shift assignments in bulk
   */
  async createBulk(
    shifts: CreateShiftAssignmentDto[],
    organizationId: string
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      const createdShifts: ShiftAssignmentDocument[] = [];

      // Process each shift
      for (const shift of shifts) {
        // Apply organization ID if provided at bulk level
        if (organizationId && !shift.organizationId) {
          shift.organizationId = organizationId;
        }

        // Create the shift
        const createdShift = await this.create(shift);
        createdShifts.push(createdShift);
      }

      return createdShifts;
    } catch (error: any) {
      this.logger.error(
        `Error creating bulk shift assignments: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find all shift assignments with optional filtering
   */
  async findAll(
    organizationId: string,
    options: ShiftAssignmentQueryOptions = {}
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      const {
        status,
        startDate,
        endDate,
        workerId,
        departmentId,
        locationId,
        shiftTypeId,
        isOvertime,
        isHoliday,
        isWeekend,
        isNightShift,
        search,
        tags,
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

      if (startDate) {
        query.scheduledStartTime = {
          ...query.scheduledStartTime,
          $gte: startDate,
        };
      }

      if (endDate) {
        query.scheduledEndTime = { ...query.scheduledEndTime, $lte: endDate };
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

      if (locationId) {
        query.locationId = new Types.ObjectId(locationId);
      }

      if (shiftTypeId) {
        if (Array.isArray(shiftTypeId)) {
          query.shiftTypeId = {
            $in: shiftTypeId.map((id) => new Types.ObjectId(id)),
          };
        } else {
          query.shiftTypeId = new Types.ObjectId(shiftTypeId);
        }
      }

      if (isOvertime !== undefined) {
        query.isOvertime = isOvertime;
      }

      if (isHoliday !== undefined) {
        query.isHoliday = isHoliday;
      }

      if (isWeekend !== undefined) {
        query.isWeekend = isWeekend;
      }

      if (isNightShift !== undefined) {
        query.isNightShift = isNightShift;
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (search) {
        query.$or = [
          { label: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      return await this.shiftAssignmentModel
        .find(query)
        .sort({ scheduledStartTime: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding shift assignments: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find shift assignments for a specific worker
   */
  async findByWorker(
    organizationId: string,
    workerId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string[]
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      return await this.findAll(organizationId, {
        workerId,
        startDate,
        endDate,
        status: status || undefined,
      });
    } catch (error: any) {
      this.logger.error(
        `Error finding worker shifts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find a specific shift assignment
   */
  async findOne(
    id: string,
    organizationId: string
  ): Promise<ShiftAssignmentDocument> {
    try {
      const shiftAssignment = await this.shiftAssignmentModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!shiftAssignment) {
        throw new NotFoundException(`Shift assignment with ID ${id} not found`);
      }

      return shiftAssignment;
    } catch (error: any) {
      this.logger.error(
        `Error finding shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Update a shift assignment
   */
  async update(
    id: string,
    organizationId: string,
    updateShiftAssignmentDto: UpdateShiftAssignmentDto
  ): Promise<ShiftAssignmentDocument> {
    try {
      // Prepare update data with ObjectId conversions
      const updateData: any = { ...updateShiftAssignmentDto };

      if (updateData.workerId) {
        updateData.workerId = new Types.ObjectId(updateData.workerId);
      }

      if (updateData.shiftTypeId) {
        updateData.shiftTypeId = new Types.ObjectId(updateData.shiftTypeId);
      }

      if (updateData.departmentId) {
        updateData.departmentId = new Types.ObjectId(updateData.departmentId);
      }

      if (updateData.locationId) {
        updateData.locationId = new Types.ObjectId(updateData.locationId);
      }

      if (updateData.rotationPatternId) {
        updateData.rotationPatternId = new Types.ObjectId(
          updateData.rotationPatternId
        );
      }

      if (updateData.assignedBy) {
        updateData.assignedBy = new Types.ObjectId(updateData.assignedBy);
      }

      // Add updatedBy if provided
      if (updateData.updatedBy) {
        updateData.updatedBy = new Types.ObjectId(updateData.updatedBy);
      }

      // Calculate duration if start/end times are updated
      if (updateData.scheduledStartTime && updateData.scheduledEndTime) {
        updateData.scheduledDurationMinutes = this.calculateDurationMinutes(
          updateData.scheduledStartTime,
          updateData.scheduledEndTime
        );
      }

      // Update weekend flag if start time changes
      if (updateData.scheduledStartTime) {
        updateData.isWeekend = this.isWeekend(updateData.scheduledStartTime);
      }

      // Update actual duration if actual start/end times are provided
      if (updateData.actualStartTime && updateData.actualEndTime) {
        updateData.actualDurationMinutes = this.calculateDurationMinutes(
          updateData.actualStartTime,
          updateData.actualEndTime
        );
      }

      const updatedShiftAssignment = await this.shiftAssignmentModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: updateData },
          { new: true }
        )
        .exec();

      if (!updatedShiftAssignment) {
        throw new NotFoundException(`Shift assignment with ID ${id} not found`);
      }

      // Re-validate against scheduling rules
      await this.validateAssignmentAgainstRules(updatedShiftAssignment);

      return updatedShiftAssignment;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete a shift assignment
   */
  async remove(
    id: string,
    organizationId: string
  ): Promise<{ deleted: boolean }> {
    try {
      const result = await this.shiftAssignmentModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Shift assignment with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Update the status of a shift assignment
   */
  async updateStatus(
    id: string,
    organizationId: string,
    status: ShiftStatus,
    updatedBy?: string
  ): Promise<ShiftAssignmentDocument> {
    try {
      const updateData: any = {
        status,
        updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      };

      const updatedShiftAssignment = await this.shiftAssignmentModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: updateData },
          { new: true }
        )
        .exec();

      if (!updatedShiftAssignment) {
        throw new NotFoundException(`Shift assignment with ID ${id} not found`);
      }

      return updatedShiftAssignment;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift status: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Record a clock event (clock in, clock out, break start/end)
   */
  async recordClockEvent(
    organizationId: string,
    clockEventDto: RecordClockEventDto
  ): Promise<ShiftAssignmentDocument> {
    try {
      const { shiftAssignmentId, ...eventData } = clockEventDto;

      // Prepare event data with ObjectId conversions
      const preparedEventData = {
        ...eventData,
        verifiedBy: eventData.verifiedBy
          ? new Types.ObjectId(eventData.verifiedBy)
          : undefined,
      };

      // Find the shift assignment
      const shiftAssignment = await this.findOne(
        shiftAssignmentId,
        organizationId
      );

      // Handle specific event types
      let updateData: any = {};

      switch (eventData.type) {
        case 'clock_in':
          updateData.actualStartTime = eventData.timestamp;
          updateData.status = ShiftStatus.IN_PROGRESS;
          break;

        case 'clock_out':
          updateData.actualEndTime = eventData.timestamp;
          updateData.status = ShiftStatus.COMPLETED;

          // Calculate actual duration
          if (shiftAssignment.actualStartTime) {
            updateData.actualDurationMinutes = this.calculateDurationMinutes(
              shiftAssignment.actualStartTime,
              eventData.timestamp
            );
          }
          break;
      }

      // Add the clock event to the array
      const updatedShiftAssignment = await this.shiftAssignmentModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(shiftAssignmentId),
            organizationId: new Types.ObjectId(organizationId),
          },
          {
            $push: { clockEvents: preparedEventData },
            $set: updateData,
          },
          { new: true }
        )
        .exec();

      if (!updatedShiftAssignment) {
        throw new NotFoundException(
          `Shift assignment with ID ${shiftAssignmentId} not found`
        );
      }

      return updatedShiftAssignment;
    } catch (error: any) {
      this.logger.error(
        `Error recording clock event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Calculate shift payment details
   */
  async calculatePayment(
    id: string,
    organizationId: string
  ): Promise<ShiftAssignmentDocument> {
    try {
      // Get the shift assignment
      const shiftAssignment = await this.findOne(id, organizationId);

      // Ensure shift is completed
      if (shiftAssignment.status !== ShiftStatus.COMPLETED) {
        throw new BadRequestException(
          'Cannot calculate payment for incomplete shift'
        );
      }

      // Get payment configuration
      const paymentConfig = await this.getPaymentConfigForShift(
        organizationId,
        shiftAssignment.shiftTypeId.toString()
      );

      if (!paymentConfig) {
        throw new NotFoundException(
          'Payment configuration not found for this shift type'
        );
      }

      // Calculate payment based on configuration type
      let paymentDetails: any = {};

      switch (paymentConfig.paymentMethod) {
        case 'hourly':
          paymentDetails = this.calculateHourlyPayment(
            shiftAssignment,
            paymentConfig
          );
          break;

        case 'per_shift':
          paymentDetails = this.calculatePerShiftPayment(
            shiftAssignment,
            paymentConfig
          );
          break;

        // Add other calculation methods as needed

        default:
          throw new BadRequestException(
            `Unsupported payment method: ${paymentConfig.paymentMethod}`
          );
      }

      // Update the shift assignment with calculated payment
      const updatedShiftAssignment = await this.shiftAssignmentModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: { paymentDetails } },
          { new: true }
        )
        .exec();

      if (!updatedShiftAssignment) {
        throw new NotFoundException(`Shift assignment with ID ${id} not found`);
      }

      return updatedShiftAssignment;
    } catch (error: any) {
      this.logger.error(
        `Error calculating shift payment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get worker's total hours for a date range
   */
  async getWorkerHours(
    organizationId: string,
    workerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      // Get completed shifts for the worker in the date range
      const shifts = await this.findAll(organizationId, {
        workerId,
        startDate,
        endDate,
        status: ShiftStatus.COMPLETED,
      });

      // Calculate total hours
      const regularMinutes = shifts.reduce(
        (total, shift) => total + (shift.actualDurationMinutes || 0),
        0
      );

      const overtimeMinutes = shifts
        .filter((shift) => shift.isOvertime)
        .reduce(
          (total, shift) => total + (shift.actualDurationMinutes || 0),
          0
        );

      const weekendMinutes = shifts
        .filter((shift) => shift.isWeekend)
        .reduce(
          (total, shift) => total + (shift.actualDurationMinutes || 0),
          0
        );

      const holidayMinutes = shifts
        .filter((shift) => shift.isHoliday)
        .reduce(
          (total, shift) => total + (shift.actualDurationMinutes || 0),
          0
        );

      const nightMinutes = shifts
        .filter((shift) => shift.isNightShift)
        .reduce(
          (total, shift) => total + (shift.actualDurationMinutes || 0),
          0
        );

      return {
        totalShifts: shifts.length,
        regularHours: regularMinutes / 60,
        overtimeHours: overtimeMinutes / 60,
        weekendHours: weekendMinutes / 60,
        holidayHours: holidayMinutes / 60,
        nightHours: nightMinutes / 60,
        totalHours: regularMinutes / 60,
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting worker hours: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Helper methods

  /**
   * Calculate duration in minutes between two dates
   */
  private calculateDurationMinutes(startTime: Date, endTime: Date): number {
    const start = luxon.DateTime.fromJSDate(startTime);
    const end = luxon.DateTime.fromJSDate(endTime);
    const diff = end.diff(start, 'minutes');
    return Math.max(0, diff.minutes);
  }

  /**
   * Check if a date falls on a weekend
   */
  private isWeekend(date: Date): boolean {
    const day = luxon.DateTime.fromJSDate(date).weekday;
    return day === 6 || day === 7; // Saturday or Sunday
  }

  /**
   * Validate a shift assignment against scheduling rules
   */
  private async validateAssignmentAgainstRules(
    assignment: ShiftAssignmentDocument
  ): Promise<void> {
    try {
      // This would call the scheduling rules service to validate the assignment
      // For now, we'll just log that validation would happen here
      this.logger.log(
        `Validating shift assignment against rules: ${assignment._id}`
      );

      // In a real implementation, this would check things like:
      // - Rest periods between shifts
      // - Maximum consecutive shifts
      // - Maximum hours per period
      // - Required qualifications
      // - etc.
    } catch (error: any) {
      this.logger.error(
        `Error validating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get payment configuration for a shift type
   */
  private async getPaymentConfigForShift(
    organizationId: string,
    shiftTypeId: string
  ): Promise<ShiftPaymentConfigDocument | null> {
    try {
      return await this.paymentConfigModel
        .findOne({
          organizationId: new Types.ObjectId(organizationId),
          shiftTypeId: new Types.ObjectId(shiftTypeId),
          isActive: true,
        })
        .exec();
    } catch (error) {
      this.logger.error(`Error getting payment config: ${error.message}`);
      return null;
    }
  }

  /**
   * Create default payment details from a payment configuration
   */
  private createDefaultPaymentDetails(
    paymentConfig: ShiftPaymentConfigDocument
  ): any {
    const paymentDetails: any = {
      method: paymentConfig.paymentMethod,
      status: 'pending',
    };

    // Set rates based on payment method
    switch (paymentConfig.paymentMethod) {
      case 'hourly':
        if (paymentConfig.hourlyConfig) {
          paymentDetails.baseRate = paymentConfig.hourlyConfig.baseRate;
          paymentDetails.overtimeRate =
            paymentConfig.hourlyConfig.overtimeMultiplier || 1.5;
          paymentDetails.weekendRate = paymentConfig.hourlyConfig.weekendRate;
          paymentDetails.holidayRate = paymentConfig.hourlyConfig.holidayRate;
          paymentDetails.nightRate =
            paymentConfig.hourlyConfig.nightDifferential;
        }
        break;

      case 'per_shift':
        if (paymentConfig.fixedConfig) {
          paymentDetails.baseRate = paymentConfig.fixedConfig.baseAmount;
          paymentDetails.weekendRate = paymentConfig.fixedConfig.weekendBonus;
          paymentDetails.holidayRate = paymentConfig.fixedConfig.holidayBonus;
        }
        break;

      // Add other payment methods as needed
    }

    return paymentDetails;
  }

  /**
   * Calculate payment for hourly payment method
   */
  private calculateHourlyPayment(
    shiftAssignment: ShiftAssignmentDocument,
    paymentConfig: ShiftPaymentConfigDocument
  ): any {
    if (!shiftAssignment.actualDurationMinutes) {
      throw new BadRequestException(
        'Cannot calculate payment without actual duration'
      );
    }

    if (!paymentConfig.hourlyConfig) {
      throw new BadRequestException('Invalid hourly payment configuration');
    }

    // Calculate hours worked
    const hoursWorked = shiftAssignment.actualDurationMinutes / 60;

    // Get base rate
    const baseRate = paymentConfig.hourlyConfig.baseRate;

    // Initialize payment details
    const paymentDetails: any = {
      method: 'hourly',
      baseRate,
      hoursWorked,
      regularHours: hoursWorked,
      overtimeHours: 0,
      weekendHours: 0,
      holidayHours: 0,
      nightHours: 0,
      status: 'pending',
    };

    // Apply special rates if applicable
    if (shiftAssignment.isOvertime) {
      const overtimeMultiplier =
        paymentConfig.hourlyConfig.overtimeMultiplier || 1.5;
      paymentDetails.overtimeHours = hoursWorked;
      paymentDetails.regularHours = 0;
      paymentDetails.overtimeRate = baseRate * overtimeMultiplier;
    }

    if (shiftAssignment.isWeekend && paymentConfig.hourlyConfig.weekendRate) {
      paymentDetails.weekendHours = hoursWorked;
      paymentDetails.weekendRate = paymentConfig.hourlyConfig.weekendRate;
    }

    if (shiftAssignment.isHoliday && paymentConfig.hourlyConfig.holidayRate) {
      paymentDetails.holidayHours = hoursWorked;
      paymentDetails.holidayRate = paymentConfig.hourlyConfig.holidayRate;
    }

    if (
      shiftAssignment.isNightShift &&
      paymentConfig.hourlyConfig.nightDifferential
    ) {
      paymentDetails.nightHours = hoursWorked;
      paymentDetails.nightRate =
        baseRate * (1 + paymentConfig.hourlyConfig.nightDifferential);
    }

    // Calculate total amount
    let totalAmount = 0;

    if (paymentDetails.regularHours > 0) {
      totalAmount += paymentDetails.regularHours * baseRate;
    }

    if (paymentDetails.overtimeHours > 0) {
      totalAmount += paymentDetails.overtimeHours * paymentDetails.overtimeRate;
    }

    if (paymentDetails.weekendHours > 0 && paymentDetails.weekendRate) {
      totalAmount += paymentDetails.weekendHours * paymentDetails.weekendRate;
    } else if (paymentDetails.weekendHours > 0) {
      // Apply weekend premium if configured
      const weekendMultiplier = paymentConfig.hourlyConfig.weekendRate
        ? paymentConfig.hourlyConfig.weekendRate / baseRate
        : 1;
      totalAmount += paymentDetails.weekendHours * baseRate * weekendMultiplier;
    }

    if (paymentDetails.holidayHours > 0 && paymentDetails.holidayRate) {
      totalAmount += paymentDetails.holidayHours * paymentDetails.holidayRate;
    }

    if (paymentDetails.nightHours > 0 && paymentDetails.nightRate) {
      const nightDifferential =
        (paymentDetails.nightRate - baseRate) * paymentDetails.nightHours;
      totalAmount += nightDifferential;
    }

    paymentDetails.totalAmount = totalAmount;

    return paymentDetails;
  }

  /**
   * Calculate payment for per-shift payment method
   */
  private calculatePerShiftPayment(
    shiftAssignment: ShiftAssignmentDocument,
    paymentConfig: ShiftPaymentConfigDocument
  ): any {
    if (!paymentConfig.fixedConfig) {
      throw new BadRequestException('Invalid per-shift payment configuration');
    }

    // Get base amount
    const baseAmount = paymentConfig.fixedConfig.baseAmount;

    // Initialize payment details
    const paymentDetails: any = {
      method: 'per_shift',
      baseRate: baseAmount,
      totalAmount: baseAmount,
      status: 'pending',
    };

    // Apply bonuses if applicable
    if (shiftAssignment.isWeekend && paymentConfig.fixedConfig.weekendBonus) {
      paymentDetails.weekendRate = paymentConfig.fixedConfig.weekendBonus;
      paymentDetails.totalAmount += paymentConfig.fixedConfig.weekendBonus;
    }

    if (shiftAssignment.isHoliday && paymentConfig.fixedConfig.holidayBonus) {
      paymentDetails.holidayRate = paymentConfig.fixedConfig.holidayBonus;
      paymentDetails.totalAmount += paymentConfig.fixedConfig.holidayBonus;
    }

    return paymentDetails;
  }

  /**
   * Generate shifts based on a rotation pattern
   */
  async generateShiftsFromPattern(
    organizationId: string,
    patternId: string,
    startDate: Date,
    endDate: Date,
    workerId: string
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      // This would call a more complex service to generate shifts based on a rotation pattern
      // For the sake of this example, we'll implement a simplified version

      this.logger.log(
        `Generating shifts from pattern ${patternId} for worker ${workerId}`
      );

      // In a real implementation, this would:
      // 1. Get the rotation pattern
      // 2. Calculate the number of cycles needed to cover the date range
      // 3. Generate shifts for each day based on the pattern sequence
      // 4. Apply any customizations or exceptions

      // For now, return an empty array
      return [];
    } catch (error: any) {
      this.logger.error(
        `Error generating shifts from pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
