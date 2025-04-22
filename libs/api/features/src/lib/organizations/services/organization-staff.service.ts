import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../authorization/schemas/organization-role.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Role, RoleDocument } from '../../authorization/schemas/role.schema';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { AuthorizationService } from '../../authorization/services/authorization.service';
import { AddUserToOrganizationDto } from '../dto/add-user-to-organization.dto';
import { RemoveUserFromOrganizationDto } from '../dto/remove-user-from-organization.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';
import { CreateStaffInvitationDto } from '../dto/create-staff-invitation.dto';
import {
  StaffInvitation,
  StaffInvitationDocument,
} from '../schemas/staff-invitation.schema';
import {
  EmployeeAvailability,
  EmployeeAvailabilityDocument,
} from '../schemas/employee.schema';
import {
  ShiftPattern,
  ShiftPatternDocument,
} from '../../shift-patterns/schemas/shift-pattern.schema';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
} from '../../shifts/schemas/shift-assignment.schema';

@Injectable()
export class OrganizationStaffService {
  private readonly logger = new Logger(OrganizationStaffService.name);

  constructor(
    @InjectModel(EmployeeAvailability.name)
    private employeeAvailabilityModel: Model<EmployeeAvailabilityDocument>,

    @InjectModel(ShiftPattern.name)
    private shiftPatternModel: Model<ShiftPatternDocument>,

    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,

    @InjectModel(StaffInvitation.name)
    private staffInvitationModel: Model<StaffInvitationDocument>,

    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,

    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,

    private emailService: EmailService,

    private notificationService: NotificationService,

    private authorizationService: AuthorizationService
  ) {}

  /**
   * Get organization staff with pagination and filtering
   */
  async getStaffPaginated(
    organizationId: Types.ObjectId,
    page = 1,
    limit = 10,
    staffType?: string,
    role?: string,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ staff: any[]; total: number }> {
    try {
      this.logger.log('Getting paginated staff', {
        organizationId,
        page,
        limit,
        staffType,
        role,
        search,
      });

      // Build base query
      const query: any = {
        organizationId,
        isActive: true,
      };

      // Add filters
      if (staffType) {
        query.staffType = staffType;
      }

      if (role && role !== 'all') {
        query.roleId = role;
      }

      // Get organization roles with pagination
      const skip = (page - 1) * limit;

      // Create aggregation pipeline for search and sorting
      const pipeline: any[] = [
        { $match: query },
        // Lookup user details
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        // Unwind user array to object
        { $unwind: '$user' },
      ];

      // Add search if provided
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { 'user.firstName': { $regex: search, $options: 'i' } },
              { 'user.lastName': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } },
              { 'user.phone': { $regex: search, $options: 'i' } },
            ],
          },
        });
      }

      // Add sort
      let sortField: any = sortBy;
      if (sortBy === 'name') {
        sortField = 'user.firstName';
      }

      const sortStage: any = {};
      sortStage[sortField] = sortOrder === 'asc' ? 1 : -1;
      pipeline.push({ $sort: sortStage });

      // Get total count (using the same pipeline without pagination)
      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'total' });

      // Add pagination to main pipeline
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute both queries in parallel
      const [staffResult, countResult] = await Promise.all([
        this.organizationRoleModel.aggregate(pipeline).exec(),
        this.organizationRoleModel.aggregate(countPipeline).exec(),
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;

      return {
        staff: staffResult,
        total,
      };
    } catch (error: any) {
      this.logger.error('Error getting paginated staff:', error);
      throw error;
    }
  }

  /**
   * Get available staff for a specific shift
   */
  async getAvailableStaffForShift(
    organizationId: string,
    shiftPatternId: string,
    shiftDate: string,
    careHomeId: string
  ): Promise<{
    data: any[];
    meta: { total: number; availableCount: number };
  }> {
    try {
      this.logger.log('Getting available staff for shift', {
        organizationId,
        shiftPatternId,
        shiftDate,
        careHomeId,
      });

      // Validate organization and shift pattern
      await this.validateOrganization(organizationId);
      const { pattern, timing } = await this.validateShiftPattern(
        shiftPatternId,
        careHomeId
      );

      // Get all care staff
      const careStaff = await this.organizationRoleModel
        .find({
          organizationId: new Types.ObjectId(organizationId),
          staffType: 'care',
        })
        .populate('userId', 'firstName lastName avatarUrl');

      // Check availability for each staff member
      const staffAvailabilityPromises = careStaff.map(async (staff) => {
        const [availability, metadata, isNotOnLeave] = await Promise.all([
          this.checkCarerAvailability(
            (staff.userId as any)._id.toString(),
            shiftDate,
            timing.startTime,
            timing.endTime
          ),
          this.getCarerMetadata(
            (staff.userId as any)._id.toString(),
            shiftDate
          ),
          this.checkStaffLeave(
            (staff.userId as any)._id.toString(),
            shiftDate,
            timing.startTime,
            timing.endTime
          ),
        ]);

        return {
          _id: staff._id,
          user: staff.userId,
          role: staff.roleId,
          organization: staff.organizationId,
          availability: {
            ...availability,
            isAvailable: availability.isAvailable && isNotOnLeave,
            isOnLeave: !isNotOnLeave,
            unavailabilityReason: !isNotOnLeave ? 'On approved leave' : 'N/A',
          },
          metadata,
        };
      });

      const staffWithAvailability = await Promise.all(
        staffAvailabilityPromises
      );

      const availableCount = staffWithAvailability.filter(
        (staff) => staff.availability.isAvailable
      ).length;

      this.logger.log('Successfully retrieved available staff', {
        total: staffWithAvailability.length,
        available: availableCount,
      });

      return {
        data: staffWithAvailability,
        meta: {
          total: staffWithAvailability.length,
          availableCount,
        },
      };
    } catch (error: any) {
      this.logger.error('Error getting available staff:', error);
      throw error;
    }
  }

  /**
   * Validate organization existence
   */
  private async validateOrganization(organizationId: string): Promise<void> {
    const organizationExists = await this.organizationModel.exists({
      _id: new Types.ObjectId(organizationId),
    });

    if (!organizationExists) {
      this.logger.error(`Organization not found: ${organizationId}`);
      throw new NotFoundException('Organization not found');
    }
  }

  /**
   * Validate shift pattern and get timing information
   */
  private async validateShiftPattern(
    shiftPatternId: string,
    careHomeId: string
  ): Promise<{ pattern: any; timing: any }> {
    const shiftPattern = await this.shiftPatternModel.findById(shiftPatternId);

    if (!shiftPattern) {
      this.logger.error(`Shift pattern not found: ${shiftPatternId}`);
      throw new NotFoundException('Shift pattern not found');
    }

    const timing = shiftPattern?.timings?.find(
      (t) => t.careHomeId === careHomeId
    );

    if (!timing) {
      this.logger.error(
        `No timing found for care home ${careHomeId} in pattern ${shiftPatternId}`
      );
      throw new NotFoundException('No timing found for this care home');
    }

    return { pattern: shiftPattern, timing };
  }

  /**
   * Check staff availability for a specific shift
   */
  private async checkCarerAvailability(
    carerId: string,
    shiftDate: string,
    startTime: string,
    endTime: string
  ): Promise<any> {
    try {
      this.logger.log(
        `Checking availability for carer ${carerId} on ${shiftDate}`
      );

      // Check existing assignments first
      const assignmentCheck = await this.checkExistingAssignments(
        carerId,
        shiftDate
      );

      if (assignmentCheck.hasAssignment) {
        return {
          isAvailable: false,
          reason: `Already assigned to ${assignmentCheck.existingShift?.pattern} at ${assignmentCheck.existingShift?.time}`,
          existingShift: assignmentCheck.existingShift,
          conflicts: {
            type: 'assignment',
            details: `Has ${assignmentCheck.conflicts?.length} assignment(s) on this day`,
          },
        };
      }

      // Check availability in the employee availability system
      const shiftPeriod = this.getShiftPeriod(startTime, endTime);
      const dayAvailability = await this.checkEmployeeAvailabilitySystem(
        carerId,
        shiftDate,
        shiftPeriod
      );

      if (!dayAvailability.isAvailable) {
        return {
          isAvailable: false,
          reason: dayAvailability.reason || 'Not available for this shift',
          conflicts: {
            type: 'preference',
            details:
              dayAvailability.details ||
              'Employee has not marked availability for this shift',
          },
        };
      }

      return {
        isAvailable: true,
      };
    } catch (error: any) {
      this.logger.error(
        `Error checking availability for carer ${carerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get carer metadata like last assignment and total assignments
   */
  private async getCarerMetadata(
    carerId: string,
    shiftDate: string
  ): Promise<any> {
    try {
      const [lastAssignment, totalAssignments]: any = await Promise.all([
        this.shiftAssignmentModel
          .findOne({ user: carerId })
          .sort({ createdAt: -1 })
          .select('createdAt'),
        this.shiftAssignmentModel.countDocuments({ user: carerId }),
      ]);

      return {
        lastAssignment: lastAssignment?.createdAt,
        totalAssignments,
      };
    } catch (error: any) {
      this.logger.warn(`Error fetching carer metadata for ${carerId}:`, error);
      return {};
    }
  }

  /**
   * Check if staff member is on leave during shift time
   */
  private async checkStaffLeave(
    userId: string,
    shiftDate: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    // Note: This is commented out as per instructions since leave management isn't implemented yet
    /*
  const shiftDateTime = new Date(shiftDate);
  const shiftStart = new Date(`${shiftDate}T${startTime}`);
  const shiftEnd = new Date(`${shiftDate}T${endTime}`);

  // Find any approved leave that overlaps with the shift date
  const leave = await this.leaveRequestModel.findOne({
    user: new Types.ObjectId(userId),
    status: 'approved',
    startDate: { $lte: shiftEnd },
    endDate: { $gte: shiftStart },
  });

  return !leave; // Return true if no leave found (staff is available)
  */

    // Temporarily return true until leave management is implemented
    return true;
  }

  /**
   * Check existing shift assignments for a staff member on a specific date
   */
  private async checkExistingAssignments(
    userId: string,
    date: string
  ): Promise<any> {
    try {
      this.logger.log(
        `Checking existing assignments for user ${userId} on ${date}`
      );

      const existingAssignments = await this.shiftAssignmentModel.aggregate([
        {
          $lookup: {
            from: 'shifts',
            localField: 'shift',
            foreignField: '_id',
            as: 'shift',
          },
        },
        {
          $unwind: '$shift',
        },
        {
          $match: {
            user: new Types.ObjectId(userId),
            'shift.date': date,
          },
        },
        {
          $lookup: {
            from: 'shiftpatterns',
            localField: 'shift.shiftPattern',
            foreignField: '_id',
            as: 'shiftPattern',
          },
        },
        {
          $unwind: {
            path: '$shiftPattern',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            shift: {
              _id: '$shift._id',
              date: '$shift.date',
            },
            shiftPattern: {
              _id: '$shiftPattern._id',
              name: '$shiftPattern.name',
              timings: '$shiftPattern.timings',
            },
          },
        },
      ]);

      if (existingAssignments.length === 0) {
        return { hasAssignment: false };
      }

      // Get timing information safely
      const getShiftTiming = (assignment: any): string => {
        if (!assignment?.shiftPattern?.timings) return 'N/A';

        const timings = assignment.shiftPattern.timings;
        if (!Array.isArray(timings) || timings.length === 0) return 'N/A';

        return timings[0]?.startTime || 'N/A';
      };

      // Get details of all conflicts with safe access
      const conflicts = existingAssignments.map((assignment) => ({
        shiftId: assignment.shift?._id?.toString() || '',
        type: assignment.shiftPattern?.name || 'Unknown',
        time: getShiftTiming(assignment),
      }));

      const primaryAssignment = existingAssignments[0];
      if (!primaryAssignment) {
        return { hasAssignment: false };
      }

      return {
        hasAssignment: true,
        existingShift: {
          _id: primaryAssignment.shift?._id?.toString() || '',
          pattern: primaryAssignment.shiftPattern?.name || 'Unknown',
          time: getShiftTiming(primaryAssignment),
        },
        conflicts,
      };
    } catch (error: any) {
      this.logger.error(
        `Error checking existing assignments for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Map shift times to period categories
   */
  private getShiftPeriod(
    startTime: string,
    endTime: string
  ): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = parseInt(startTime.split(':')[0]);

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Check employee availability in the system
   */
  private async checkEmployeeAvailabilitySystem(
    userId: string,
    shiftDate: string,
    shiftPeriod: 'morning' | 'afternoon' | 'evening' | 'night'
  ): Promise<{ isAvailable: boolean; reason?: string; details?: string }> {
    // Map our shift periods to the day/night periods in our availability model
    let period: 'day' | 'night';
    if (shiftPeriod === 'morning' || shiftPeriod === 'afternoon') {
      period = 'day';
    } else {
      period = 'night';
    }

    // Format date to match what's stored in the availability model
    const formattedDate = new Date(shiftDate);

    // Query for availability entries that match this date and period
    const availability = await this.employeeAvailabilityModel.findOne({
      user: new Types.ObjectId(userId),
      isActive: true,
      $or: [
        // Normal availability
        {
          availabilityEntries: {
            $elemMatch: {
              date: {
                $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
                $lt: new Date(formattedDate.setHours(23, 59, 59, 999)),
              },
              period: { $in: [period, 'both'] },
            },
          },
        },
        // Recurring availability
        {
          isRecurring: true,
          availabilityEntries: {
            $elemMatch: {
              period: { $in: [period, 'both'] },
            },
          },
        },
      ],
    });

    if (!availability) {
      return {
        isAvailable: false,
        reason: `Not available on ${new Date(shiftDate).toLocaleDateString()}`,
        details: `No availability set for this date`,
      };
    }

    return {
      isAvailable: true,
    };
  }

  /**
   * Get staff availability for a date range
   */
  async getStaffAvailabilityForDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, any[]>> {
    try {
      const careStaff = await this.organizationRoleModel
        .find({
          organizationId: new Types.ObjectId(organizationId),
          staffType: 'care',
        })
        .populate('userId', 'firstName lastName');

      // Create date range array
      const dateRange = [];
      let currentDate = new Date(startDate);
      const lastDate = new Date(endDate);

      while (currentDate <= lastDate) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const availabilityMap: Record<string, any[]> = {};

      // Check each staff member's availability for each date
      for (const date of dateRange) {
        const dayAvailability = await Promise.all(
          careStaff.map(async (staff) => {
            const userId = (staff.userId as any)._id.toString();

            // Check both day and night availability for the date
            const dayAvailability = await this.checkEmployeeAvailabilitySystem(
              userId,
              date,
              'morning'
            );

            const nightAvailability =
              await this.checkEmployeeAvailabilitySystem(userId, date, 'night');

            return {
              _id: staff._id,
              user: staff.userId,
              role: staff.roleId,
              organization: staff.organizationId,
              availability: {
                isAvailable:
                  dayAvailability.isAvailable || nightAvailability.isAvailable,
                periods: {
                  day: dayAvailability.isAvailable,
                  night: nightAvailability.isAvailable,
                },
              },
            };
          })
        );

        availabilityMap[date] = dayAvailability;
      }

      return availabilityMap;
    } catch (error: any) {
      this.logger.error(
        'Error getting staff availability for date range:',
        error
      );
      throw error;
    }
  }

  /**
   * Add staff to favorites
   */
  async addFavoriteStaff(
    organizationId: string,
    staffId: string
  ): Promise<any> {
    try {
      // Verify organization is a home organization
      const organization = await this.organizationModel.findById(
        organizationId
      );
      if (!organization || organization.type !== 'home') {
        throw new BadRequestException(
          'Only home organizations can add favorite staff'
        );
      }

      // Verify staff exists and is a care staff
      const staffRole = await this.organizationRoleModel.findOne({
        userId: new Types.ObjectId(staffId),
        staffType: 'care',
      });

      if (!staffRole) {
        throw new NotFoundException(
          'Staff member not found or is not a care staff'
        );
      }

      // const result = await this.favoriteStaffModel.findOneAndUpdate(
      //   { homeOrganization: new Types.ObjectId(organizationId) },
      //   {
      //     $addToSet: { favoriteStaff: new Types.ObjectId(staffId) },
      //   },
      //   {
      //     upsert: true,
      //     new: true,
      //   }
      // );

      return {};
    } catch (error: any) {
      this.logger.error('Error adding staff to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove staff from favorites
   */
  async removeFavoriteStaff(
    organizationId: string,
    staffId: string
  ): Promise<any> {
    try {
      // const result = await this.favoriteStaffModel.findOneAndUpdate(
      //   { homeOrganization: new Types.ObjectId(organizationId) },
      //   {
      //     $pull: { favoriteStaff: new Types.ObjectId(staffId) },
      //   },
      //   {
      //     new: true,
      //   }
      // );

      // if (!result) {
      //   throw new NotFoundException('Staff member not found in favorites');
      // }

      // this.logger.log('Staff removed from favorites', {
      //   organizationId,
      //   staffId,
      //   result,
      // });

      return {};
    } catch (error: any) {
      this.logger.error('Error removing staff from favorites:', error);
      throw error;
    }
  }

  /**
   * Get favorite staff for an organization
   */
  async getFavoriteStaff(organizationId: string): Promise<any> {
    try {
      // const favorites = await this.favoriteStaffModel
      //   .findOne({
      //     homeOrganization: new Types.ObjectId(organizationId),
      //   })
      //   .populate('favoriteStaff', 'firstName lastName email phone avatarUrl');

      // if (!favorites) {
      //   return {
      //     favoriteStaff: [],
      //     notes: [],
      //   };
      // }

      // // Get full staff details for each favorite
      // const staffDetails = await this.organizationRoleModel
      //   .find({
      //     userId: { $in: favorites.favoriteStaff },
      //   })
      //   .populate('userId', 'firstName lastName email phone avatarUrl');

      // this.logger.log('Retrieved favorite staff', {
      //   organizationId,
      //   count: staffDetails.length,
      // });

      return {
        // favoriteStaff: staffDetails,
        // notes: favorites.notes,
      };
    } catch (error: any) {
      this.logger.error('Error getting favorite staff:', error);
      throw error;
    }
  }

  /**
   * Add note to favorite staff
   */
  async addFavoriteStaffNote(
    organizationId: string,
    staffId: string,
    note: string
  ): Promise<any> {
    try {
      // Verify staff is in favorites
      // const isFavorite = await this.favoriteStaffModel.findOne({
      //   homeOrganization: new Types.ObjectId(organizationId),
      //   favoriteStaff: new Types.ObjectId(staffId),
      // });

      // if (!isFavorite) {
      //   throw new BadRequestException(
      //     'Staff member must be a favorite to add notes'
      //   );
      // }

      // const result = await this.favoriteStaffModel.findOneAndUpdate(
      //   {
      //     homeOrganization: new Types.ObjectId(organizationId),
      //     favoriteStaff: new Types.ObjectId(staffId),
      //   },
      //   {
      //     $push: {
      //       notes: {
      //         staffId: new Types.ObjectId(staffId),
      //         note,
      //         createdAt: new Date(),
      //       },
      //     },
      //   },
      //   {
      //     new: true,
      //   }
      // );

      // this.logger.log('Added note to favorite staff', {
      //   organizationId,
      //   staffId,
      //   result,
      // });

      return {};
    } catch (error: any) {
      this.logger.error('Error adding note to favorite staff:', error);
      throw error;
    }
  }

  /**
   * Check if staff is a favorite
   */
  async isFavoriteStaff(
    organizationId: string,
    staffId: string
  ): Promise<boolean> {
    try {
      // return !!(await this.favoriteStaffModel.findOne({
      //   homeOrganization: new Types.ObjectId(organizationId),
      //   favoriteStaff: new Types.ObjectId(staffId),
      // }));
      return true;
    } catch (error: any) {
      this.logger.error('Error checking favorite staff status:', error);
      throw error;
    }
  }

  /**
   * Calculate staff payments
   */
  async calculateStaffPayments(
    startDate: string,
    endDate: string,
    staffIds: string[]
  ): Promise<any> {
    try {
      this.logger.log('Calculating staff payments', {
        startDate,
        endDate,
        staffCount: staffIds.length,
      });

      // This is a stub method - actual implementation would be complex and requires
      // timesheets, shifts, rates, etc. which aren't fully covered in your provided code
      // Would need more specific requirements to implement completely

      return {
        success: true,
        data: [],
        message: 'Staff payment calculation not fully implemented yet',
        staffIds,
        dateRange: {
          from: startDate,
          to: endDate,
        },
      };
    } catch (error: any) {
      this.logger.error('Error calculating staff payments:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({
        email,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Verify token and return invitation details
  async verifyStaffInvitationToken(token: string): Promise<any> {
    const invitation: any = await this.staffInvitationModel
      .findOne({ token, status: 'pending' })
      .populate('organizationId', 'name')
      .populate({
        path: 'role',
        select: 'name',
        model: this.roleModel,
      });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new BadRequestException('Invitation has expired');
    }

    return {
      organizationName: invitation.organizationId.name,
      roleName: invitation.role.name,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  // Accept invitation for existing users
  async acceptStaffInvitation(
    token: string,
    userId: Types.ObjectId
  ): Promise<any> {
    // Verify token first
    const invitation: any = await this.staffInvitationModel
      .findOne({ token, status: 'pending' })
      .populate('organizationId');

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new BadRequestException('Invitation has expired');
    }

    // Verify user email matches invitation email
    const user = await this.userModel.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new BadRequestException(
        'User email does not match invitation email'
      );
    }

    // Create organization role
    const organizationRole = new this.organizationRoleModel({
      userId,
      organizationId: invitation.organizationId._id,
      roleId: invitation.role,
      isActive: true,
      assignedById: invitation.invitedBy,
      assignedAt: new Date(),
    });

    await organizationRole.save();

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedBy = userId as any;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Return organization details
    return {
      organization: invitation.organizationId,
    };
  }

  /**
   * Create a new staff invitation
   */
  async createStaffInvitation(
    organizationId: Types.ObjectId,
    createInvitationDto: CreateStaffInvitationDto,
    invitedById: Types.ObjectId
  ): Promise<StaffInvitation> {
    // Check if there's already a pending invitation for this email in this org
    const existingInvitation = await this.staffInvitationModel.findOne({
      email: createInvitationDto.email,
      organizationId,
      status: 'pending',
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'There is already a pending invitation for this email in this organization'
      );
    }

    // Check if user is already a member of this organization
    const existingUser = await this.userModel.findOne({
      email: createInvitationDto.email,
    });

    if (existingUser) {
      const existingRole = await this.organizationRoleModel.findOne({
        userId: existingUser._id,
        organizationId,
        isActive: true,
      });

      if (existingRole) {
        throw new BadRequestException(
          'This user is already a member of this organization'
        );
      }
    }

    // Generate token
    const token = this.generateToken();

    // Set expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invitation
    const invitation = new this.staffInvitationModel({
      ...createInvitationDto,
      organizationId,
      token,
      invitedBy: invitedById,
      expiresAt,
      status: 'pending',
    });

    const savedInvitation = await invitation.save();

    // Send invitation email
    await this.sendStaffInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  /**
   * Get all staff invitations for an organization
   */
  async getStaffInvitations(
    organizationId: Types.ObjectId,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<{ invitations: StaffInvitation[]; total: number }> {
    const query: any = { organizationId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.staffInvitationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'firstName lastName email')
        .populate('acceptedBy', 'firstName lastName email')
        .exec(),
      this.staffInvitationModel.countDocuments(query).exec(),
    ]);

    return { invitations, total };
  }

  /**
   * Get a staff invitation by token
   */
  async getStaffInvitationByToken(token: string): Promise<StaffInvitation> {
    const invitation = await this.staffInvitationModel
      .findOne({ token })
      .populate('invitedBy', 'firstName lastName email')
      .populate('organizationId', 'name type')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is expired
    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      if (invitation.status !== 'expired') {
        invitation.status = 'expired';
        await invitation.save();
      }
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  /**
   * Cancel/delete a staff invitation
   */
  async cancelStaffInvitation(
    organizationId: Types.ObjectId,
    invitationId: Types.ObjectId
  ): Promise<void> {
    const result = await this.staffInvitationModel.deleteOne({
      _id: invitationId,
      organizationId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invitation not found');
    }
  }

  /**
   * Resend a staff invitation
   */
  async resendStaffInvitation(
    organizationId: Types.ObjectId,
    invitationId: Types.ObjectId
  ): Promise<StaffInvitation> {
    const invitation = await this.staffInvitationModel.findOne({
      _id: invitationId,
      organizationId,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Generate new token and update expiration
    invitation.token = this.generateToken();
    invitation.expiresAt = new Date();
    invitation.expiresAt.setHours(invitation.expiresAt.getHours() + 48);
    invitation.status = 'pending';

    const updatedInvitation = await invitation.save();

    // Send invitation email
    await this.sendStaffInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  /**
   * Process a staff invitation when a user registers or logs in
   */
  async processStaffInvitation(
    token: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const invitation: any = await this.getStaffInvitationByToken(token);

    // Create an organization role for this user
    await this.organizationRoleModel.create({
      userId,
      organizationId: invitation.organizationId,
      roleId: invitation.role,
      isActive: true,
      assignedById: invitation.invitedBy,
      assignedAt: new Date(),
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedBy = userId as any;
    invitation.acceptedAt = new Date();
    await invitation.save();

    this.logger.log(
      `User ${userId} has accepted staff invitation to organization ${invitation.organizationId}`
    );
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    );
  }

  /**
   * Send staff invitation email
   */
  private async sendStaffInvitationEmail(
    invitation: StaffInvitation
  ): Promise<void> {
    const inviter = await this.userModel.findById(invitation.invitedBy);
    const organization = await this.organizationModel.findById(
      invitation.organizationId
    );
    const existingUser = await this.userModel.findOne({
      email: invitation.email,
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subject = `Invitation to join ${organization.name}`;

    // Create URL based on user existence
    const invitationUrl = existingUser
      ? `${process.env['FRONTEND_URL']}/auth/accept-invitation?token=${invitation.token}&type=staff`
      : `${process.env['FRONTEND_URL']}/auth/register-with-invitation?token=${invitation.token}&type=staff`;

    const actionText = existingUser
      ? 'Accept Invitation'
      : 'Accept Invitation & Register';

    const html = `
    <h2>You've been invited to join ${organization.name}!</h2>
    <p>Hello ${invitation.firstName || ''},</p>
    <p>${inviter?.firstName || 'An administrator'} has invited you to join ${
      organization.name
    } as ${invitation.role}.</p>
    ${invitation.message ? `<p>Message: "${invitation.message}"</p>` : ''}
    <p>To accept this invitation, please click the link below:</p>
    <p><a href="${invitationUrl}">${actionText}</a></p>
    <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
    <p>Thank you,<br>The Team</p>
  `;

    await this.emailService.sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  }

  /**
   * Add a user to an organization
   */
  async addUserToOrganization(
    addUserDto: AddUserToOrganizationDto,
    adminUserId: Types.ObjectId
  ): Promise<OrganizationRole> {
    // Check if user exists by email or ID
    const user = addUserDto.userId
      ? await this.userModel.findById(addUserDto.userId).exec()
      : await this.userModel.findOne({ email: addUserDto.email }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if organization exists
    const organization = await this.organizationModel
      .findById(addUserDto.organizationId)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already in the organization
    const existingRole = await this.organizationRoleModel
      .findOne({
        userId: user._id as any,
        organizationId: addUserDto.organizationId,
      })
      .exec();

    if (existingRole) {
      throw new BadRequestException(
        'User is already a member of this organization'
      );
    }

    // Get role from database
    const role = await this.roleModel.findOne({ id: addUserDto.role }).exec();

    if (!role) {
      throw new NotFoundException(`Role '${addUserDto.role}' not found`);
    }

    // Create organization role for user
    const orgRole = new this.organizationRoleModel({
      userId: user._id as any,
      organizationId: addUserDto.organizationId,
      roleId: addUserDto.role,
      isPrimary: false,
      isActive: true,
      assignedById: adminUserId,
      assignedAt: new Date(),
    });

    // Execute operations in parallel
    await Promise.all([
      // Save the organization role
      orgRole.save(),

      // Add user to organization staff list
      this.organizationModel.findByIdAndUpdate(addUserDto.organizationId, {
        $push: { staff: user._id },
      }),
    ]);

    // Send notifications
    try {
      // Notify organization admins
      await this.notifyAdmins(
        addUserDto.organizationId,
        'New User Added',
        `${user.firstName} ${user.lastName} has been added to the organization with the role of ${role.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Added to Organization',
        `You have been added to ${organization.name} with the role of ${role.name}.`,
        organization.name
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }

    return orgRole;
  }

  /**
   * Get all staff members of an organization
   */
  async getOrganizationStaff(organizationId: Types.ObjectId): Promise<User[]> {
    const organization = await this.organizationModel
      .findById(organizationId)
      .populate('staff')
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization.staff as any[];
  }

  /**
   * Get all organizations for a user
   */
  async getOrganizationsByUser(
    userId: Types.ObjectId
  ): Promise<Organization[]> {
    // Find all organization roles for this user
    const organizationRoles = await this.organizationRoleModel
      .find({
        userId,
        isActive: true,
      })
      .exec();

    if (!organizationRoles || organizationRoles.length === 0) {
      return [];
    }

    // Get all organization IDs
    const organizationIds = organizationRoles.map(
      (role) => role.organizationId
    );

    // Fetch all organizations
    const organizations = await this.organizationModel
      .find({ _id: { $in: organizationIds } })
      .exec();

    return organizations;
  }

  /**
   * Get a user's role in an organization
   */
  async getOrganizationRole(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole> {
    const role = await this.organizationRoleModel
      .findOne({
        userId,
        organizationId,
        isActive: true,
      })
      .exec();

    if (!role) {
      throw new NotFoundException(
        'User does not have a role in this organization'
      );
    }

    return role;
  }

  /**
   * Update a user's role in an organization
   */
  async updateUserRole(
    updateRoleDto: UpdateUserRoleDto,
    adminUserId: Types.ObjectId
  ): Promise<OrganizationRole> {
    // Check if user and organization exist
    const [user, organization, role] = await Promise.all([
      this.userModel.findById(updateRoleDto.userId).exec(),
      this.organizationModel.findById(updateRoleDto.organizationId).exec(),
      this.roleModel.findOne({ id: updateRoleDto.role }).exec(),
    ]);

    if (!user || !organization) {
      throw new NotFoundException('User or organization not found');
    }

    if (!role) {
      throw new NotFoundException(`Role '${updateRoleDto.role}' not found`);
    }

    // Update the role
    const updatedRole = await this.organizationRoleModel
      .findOneAndUpdate(
        {
          userId: updateRoleDto.userId,
          organizationId: updateRoleDto.organizationId,
          isActive: true,
        },
        {
          roleId: updateRoleDto.role,
        },
        { new: true }
      )
      .exec();

    if (!updatedRole) {
      throw new NotFoundException('User role in organization not found');
    }

    // Notify about the role change
    try {
      // Notify organization admins
      await this.notifyAdmins(
        updateRoleDto.organizationId,
        'User Role Updated',
        `${user.firstName} ${user.lastName}'s role has been updated to ${role.name} in ${organization.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Your Role Updated',
        `Your role in ${organization.name} has been updated to ${role.name}.`
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }

    return updatedRole;
  }

  /**
   * Remove a user from an organization
   */
  async removeUserFromOrganization(
    removeUserDto: RemoveUserFromOrganizationDto,
    adminUserId: Types.ObjectId
  ): Promise<void> {
    // Check if user and organization exist
    const [user, organization] = await Promise.all([
      this.userModel.findById(removeUserDto.userId).exec(),
      this.organizationModel.findById(removeUserDto.organizationId).exec(),
    ]);

    if (!user || !organization) {
      throw new NotFoundException('User or organization not found');
    }

    // Get organization role
    const orgRole = await this.organizationRoleModel
      .findOne({
        userId: removeUserDto.userId,
        organizationId: removeUserDto.organizationId,
        isActive: true,
      })
      .exec();

    if (!orgRole) {
      throw new NotFoundException('User is not a member of this organization');
    }

    // Execute operations in parallel
    await Promise.all([
      // Deactivate the organization role instead of deleting it
      this.organizationRoleModel.findByIdAndUpdate(orgRole._id, {
        isActive: false,
        activeTo: new Date(),
      }),

      // Remove user from organization staff list
      this.organizationModel.findByIdAndUpdate(removeUserDto.organizationId, {
        $pull: { staff: removeUserDto.userId },
      }),
    ]);

    // Notify about the removal
    try {
      // Notify organization admins
      await this.notifyAdmins(
        removeUserDto.organizationId,
        'User Removed',
        `${user.firstName} ${user.lastName} has been removed from ${organization.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Removed from Organization',
        `You have been removed from ${organization.name}.`
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get care staff for an organization
   */
  async getCareStaff(
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole[]> {
    // Get roles that are considered "care" roles
    const careRoles = await this.roleModel
      .find({
        contextType: 'ORGANIZATION',
        hierarchyLevel: { $gte: 4 }, // Assuming care roles have a hierarchy level of 4 or greater
      })
      .exec();

    const careRoleIds = careRoles.map((role) => role.id);

    return this.organizationRoleModel
      .find({
        organizationId,
        roleId: { $in: careRoleIds },
        isActive: true,
      })
      .populate('userId')
      .exec();
  }

  /**
   * Get admin staff for an organization
   */
  async getAdminStaff(
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole[]> {
    // Get roles that are considered "admin" roles
    const adminRoles = await this.roleModel
      .find({
        contextType: 'ORGANIZATION',
        hierarchyLevel: { $lte: 3 }, // Assuming admin roles have a hierarchy level of 3 or less
      })
      .exec();

    const adminRoleIds = adminRoles.map((role) => role.id);

    return this.organizationRoleModel
      .find({
        organizationId,
        roleId: { $in: adminRoleIds },
        isActive: true,
      })
      .populate('userId')
      .exec();
  }

  /**
   * Notify organization admins
   */
  private async notifyAdmins(
    organizationId: Types.ObjectId | string,
    title: string,
    body: string,
    excludeUserId?: Types.ObjectId
  ): Promise<void> {
    try {
      // Find admin roles in the database
      const adminRoles = await this.roleModel
        .find({
          contextType: 'ORGANIZATION',
          hierarchyLevel: { $lte: 2 }, // owner and admin roles
        })
        .exec();

      const adminRoleIds = adminRoles.map((role) => role.id);

      // Get all admin roles for the organization
      const query: any = {
        organizationId,
        roleId: { $in: adminRoleIds },
        isActive: true,
      };

      if (excludeUserId) {
        query.userId = { $ne: excludeUserId };
      }

      const orgAdminRoles = await this.organizationRoleModel
        .find(query)
        .populate('userId')
        .exec();

      if (orgAdminRoles.length === 0) {
        return;
      }

      // Get admin user IDs and emails
      const adminUserIds = [];
      const adminEmails = [];

      for (const role of orgAdminRoles) {
        const user = role.userId as any;
        if (user && user.email) {
          adminUserIds.push(user._id);
          adminEmails.push(user.email);
        }
      }

      // Send email notifications
      for (const email of adminEmails) {
        await this.emailService.sendEmail({
          to: email,
          subject: title,
          html: `<p>${body}</p>`,
        });
      }

      // Send push notifications
      await this.notificationService.sendNotification(
        adminUserIds,
        title,
        body,
        { organizationId: organizationId.toString() }
      );
    } catch (error: any) {
      this.logger.error(
        `Error notifying admins: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notify a specific user
   */
  private async notifyUser(
    userId: Types.ObjectId,
    title: string,
    body: string,
    organizationName?: string
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        return;
      }

      // Send email notification
      await this.emailService.sendEmail({
        to: user.email,
        subject: title,
        html: `<p>${body}</p>`,
      });

      // Send push notification
      await this.notificationService.sendNotification(
        [userId],
        title,
        body,
        organizationName ? { organizationName } : undefined
      );
    } catch (error: any) {
      this.logger.error(`Error notifying user: ${error.message}`, error.stack);
    }
  }
}
