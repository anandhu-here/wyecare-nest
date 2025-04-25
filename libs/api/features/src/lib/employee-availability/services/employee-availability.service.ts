// employee-availability.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  EmployeeAvailability,
  EmployeeAvailabilityDocument,
  Organization,
  User,
} from 'libs/api/core/src/lib/schemas';
import { Model, Types } from 'mongoose';
import { AvailabilityPeriod } from '../dto/employee-availability.dto';

@Injectable()
export class EmployeeAvailabilityService {
  constructor(
    @InjectModel(EmployeeAvailability.name)
    private employeeAvailabilityModel: Model<EmployeeAvailabilityDocument>,
    @InjectModel(User.name)
    private userModel: Model<any>,
    @InjectModel(Organization.name)
    private organizationModel: Model<any>
  ) {}

  /**
   * Create or update employee availability
   */
  async createOrUpdateAvailability(data: {
    userId: string;
    organizationId: string;
    availabilityEntries: Array<{
      date: Date;
      period: AvailabilityPeriod;
    }>;
    effectiveFrom: Date;
    effectiveTo?: Date;
    isRecurring?: boolean;
  }): Promise<EmployeeAvailabilityDocument> {
    // Validate user exists
    const userExists = await this.userModel.exists({
      _id: new Types.ObjectId(data.userId),
    });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Validate organization exists
    const orgExists = await this.organizationModel.exists({
      _id: new Types.ObjectId(data.organizationId),
    });
    if (!orgExists) {
      throw new NotFoundException('Organization not found');
    }

    // Find existing availability
    let availability = await this.employeeAvailabilityModel.findOne({
      user: new Types.ObjectId(data.userId),
      organization: new Types.ObjectId(data.organizationId),
      isActive: true,
      // If this is a recurring availability, we should find it regardless of dates
      // For non-recurring, we look for overlapping entries
      ...(data.isRecurring
        ? {}
        : {
            $or: [
              {
                effectiveFrom: { $lte: data.effectiveTo || data.effectiveFrom },
                $or: [
                  { effectiveTo: null },
                  { effectiveTo: { $gte: data.effectiveFrom } },
                ],
              },
            ],
          }),
    });

    if (availability) {
      // Update existing availability
      availability.availabilityEntries = data.availabilityEntries;
      availability.effectiveFrom = data.effectiveFrom;
      availability.effectiveTo = data.effectiveTo;
      availability.isRecurring = data.isRecurring || false;
      availability.updatedBy = data.userId as any;
    } else {
      // Create new availability
      availability = new this.employeeAvailabilityModel({
        user: new Types.ObjectId(data.userId),
        organization: new Types.ObjectId(data.organizationId),
        availabilityEntries: data.availabilityEntries,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isRecurring: data.isRecurring || false,
        createdBy: new Types.ObjectId(data.userId),
        updatedBy: new Types.ObjectId(data.userId),
      });
    }

    await availability.save();
    return availability;
  }

  /**
   * Get employee availability for a specific date range
   */
  async getAvailability(params: {
    userId?: string;
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<EmployeeAvailabilityDocument[]> {
    const query: any = {
      organization: new Types.ObjectId(params.organizationId),
      isActive: true,
      $or: [
        // Regular availability within date range
        {
          effectiveFrom: { $lte: params.endDate },
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gte: params.startDate } },
          ],
        },
        // Recurring availability
        { isRecurring: true },
      ],
    };

    // Only add user to query if specified
    if (params.userId) {
      query.user = new Types.ObjectId(params.userId);
    }

    const availabilities = await this.employeeAvailabilityModel
      .find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('organization', 'name type')
      .sort({ user: 1, effectiveFrom: 1 });

    // Filter availabilityEntries to only include entries within the date range
    // We're returning the documents as is, but with filtered entries
    return availabilities.map((avail) => {
      // If this is non-recurring, filter entries by date range
      if (!avail.isRecurring) {
        const filteredEntries = avail.availabilityEntries.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= params.startDate && entryDate <= params.endDate;
        });

        // Create a shallow copy with filtered entries
        const filteredAvail = new this.employeeAvailabilityModel({
          ...avail.toObject(),
          availabilityEntries: filteredEntries,
        });

        return filteredAvail;
      }

      return avail;
    });
  }

  /**
   * Get availability for a specific employee in an organization
   */
  async getEmployeeAvailability(
    userId: string,
    organizationId: string
  ): Promise<EmployeeAvailabilityDocument[]> {
    return this.employeeAvailabilityModel
      .find({
        user: new Types.ObjectId(userId),
        organization: new Types.ObjectId(organizationId),
        isActive: true,
      })
      .populate('user', 'firstName lastName email phone')
      .sort({ effectiveFrom: -1 });
  }

  /**
   * Delete an availability record
   */
  async deleteAvailability(id: string, userId: string): Promise<void> {
    const availability = await this.employeeAvailabilityModel.findById(id);

    if (!availability) {
      throw new NotFoundException('Availability record not found');
    }

    // Instead of hard delete, mark as inactive
    availability.isActive = false;
    availability.updatedBy = userId as any;
    await availability.save();
  }

  /**
   * Get available employees for a specific date and period
   */
  async getAvailableEmployees(params: {
    organizationId: string;
    date: Date;
    period: AvailabilityPeriod;
  }): Promise<any[]> {
    const { organizationId, date, period } = params;

    // Format the date to just keep the date part (no time)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Find employees with availability for the specified date and period
    const availableEmployees = await this.employeeAvailabilityModel
      .find({
        organization: new Types.ObjectId(organizationId),
        isActive: true,
        $or: [
          // Match exact date for non-recurring availability
          {
            'availabilityEntries.date': {
              $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
            },
            'availabilityEntries.period': {
              $in: [period, AvailabilityPeriod.BOTH],
            },
          },
          // For recurring availability, check if today matches the pattern
          { isRecurring: true },
        ],
      })
      .populate('user', 'firstName lastName email phone avatarUrl');

    // Return just the user information
    return availableEmployees.map((avail) => avail.user);
  }

  /**
   * Update full availability data
   */
  async updateAvailability(params: {
    userId: string;
    organizationId: string;
    availabilityEntries: Array<{
      date: Date;
      period: AvailabilityPeriod;
    }>;
    effectiveFrom: Date;
    effectiveTo?: Date;
    isRecurring?: boolean;
  }): Promise<EmployeeAvailabilityDocument> {
    const {
      userId,
      organizationId,
      availabilityEntries,
      effectiveFrom,
      effectiveTo,
      isRecurring,
    } = params;

    // Find existing active availability record for this user/organization
    let availability = await this.employeeAvailabilityModel.findOne({
      user: new Types.ObjectId(userId),
      organization: new Types.ObjectId(organizationId),
      isActive: true,
    });

    if (availability) {
      // IMPORTANT: replace existing entries instead of merging
      availability.availabilityEntries = availabilityEntries;
      availability.effectiveFrom = effectiveFrom;
      availability.effectiveTo = effectiveTo;
      availability.isRecurring = isRecurring || false;
      availability.updatedBy = userId as any;

      await availability.save();
    } else if (availabilityEntries.length > 0) {
      // Create new record if none exists and there are entries
      availability = new this.employeeAvailabilityModel({
        user: new Types.ObjectId(userId),
        organization: new Types.ObjectId(organizationId),
        availabilityEntries,
        effectiveFrom,
        effectiveTo,
        isRecurring: isRecurring || false,
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
        isActive: true,
      });

      await availability.save();
    } else {
      // If no entries provided and no existing record, return empty availability
      availability = new this.employeeAvailabilityModel({
        user: new Types.ObjectId(userId),
        organization: new Types.ObjectId(organizationId),
        availabilityEntries: [],
        effectiveFrom: new Date(),
        isRecurring: false,
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
        isActive: true,
      });
    }

    return availability;
  }

  /**
   * Update single date availability
   */
  async updateSingleDateAvailability(params: {
    userId: string;
    organizationId: string;
    date: Date;
    period?: AvailabilityPeriod | null;
  }): Promise<EmployeeAvailabilityDocument> {
    const { userId, organizationId, date, period } = params;

    // Find existing active availability record
    let availability = await this.employeeAvailabilityModel.findOne({
      user: new Types.ObjectId(userId),
      organization: new Types.ObjectId(organizationId),
      isActive: true,
    });

    if (!availability) {
      // Create new record if none exists
      availability = new this.employeeAvailabilityModel({
        user: new Types.ObjectId(userId),
        organization: new Types.ObjectId(organizationId),
        availabilityEntries: [],
        effectiveFrom: new Date(),
        isRecurring: false,
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
        isActive: true,
      });
    }

    // Format date for comparison (YYYY-MM-DD)
    const formattedDate = date.toISOString().split('T')[0];

    // Check if there's an existing entry for this date
    const existingEntryIndex = availability.availabilityEntries.findIndex(
      (entry) => entry.date.toISOString().split('T')[0] === formattedDate
    );

    // If period is null or undefined, remove the entry (clear availability)
    if (period === null || period === undefined) {
      if (existingEntryIndex !== -1) {
        // Remove the entry
        availability.availabilityEntries.splice(existingEntryIndex, 1);
      }
    } else {
      // Update or add entry
      if (existingEntryIndex !== -1) {
        // Update existing entry
        availability.availabilityEntries[existingEntryIndex].period = period;
      } else {
        // Add new entry
        availability.availabilityEntries.push({
          date,
          period,
        });
      }
    }

    availability.updatedBy = userId as any;
    await availability.save();

    return availability;
  }
}
