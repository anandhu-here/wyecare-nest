// leaves.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import moment from 'moment-timezone';
import {
  AccrualFrequency,
  LeaveBalance,
  LeaveBalanceDocument,
  LeavePolicy,
  LeavePolicyDocument,
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
  LeaveTimeUnit,
  Organization,
  OrganizationRole,
  User,
} from 'libs/api/core/src/lib/schemas';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';
@Injectable()
export class LeaveManagementService {
  private readonly logger = new Logger(LeaveManagementService.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveBalance.name)
    private leaveBalanceModel: Model<LeaveBalanceDocument>,
    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(Organization.name) private organizationModel: Model<any>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<any>
  ) {}

  /**
   * Get organization timezone or default to Europe/London
   */
  private async getOrganizationTimezone(
    organizationId: string
  ): Promise<string> {
    const organization = await this.organizationModel.findById(organizationId);
    return organization?.timezone || 'Europe/London';
  }

  /**
   * Convert time units as needed
   */
  private convertTimeUnits(
    amount: number,
    fromUnit: LeaveTimeUnit,
    toUnit: LeaveTimeUnit,
    workHoursPerDay: number = 8,
    workDaysPerWeek: number = 5
  ): any {
    if (fromUnit === toUnit) return amount;

    // Convert to hours first as base unit
    let amountInHours: number;

    switch (fromUnit) {
      case LeaveTimeUnit.HOURS:
        amountInHours = amount;
        break;
      case LeaveTimeUnit.DAYS:
        amountInHours = amount * workHoursPerDay;
        break;
      case LeaveTimeUnit.WEEKS:
        amountInHours = amount * workDaysPerWeek * workHoursPerDay;
        break;
    }

    // Convert from hours to target unit
    switch (toUnit) {
      case LeaveTimeUnit.HOURS:
        return amountInHours;
      case LeaveTimeUnit.DAYS:
        return amountInHours / workHoursPerDay;
      case LeaveTimeUnit.WEEKS:
        return amountInHours / (workDaysPerWeek * workHoursPerDay);
    }
  }

  /**
   * Create a new leave request
   */
  async createLeaveRequest(
    userId: string,
    organizationId: string,
    leaveData: {
      leaveType: string;
      startDateTime: Date | string;
      endDateTime: Date | string;
      timeUnit: LeaveTimeUnit;
      amount: number;
      reason: string;
      isPartialTimeUnit?: boolean;
      partialTimeDetails?: any;
      attachments?: string[];
      isRecurring?: boolean;
      recurringPattern?: any;
    }
  ): Promise<LeaveRequestDocument> {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get organization timezone
    const timezone = await this.getOrganizationTimezone(organizationId);

    // Get leave policy to check requirements
    const policy = await this.leavePolicyModel.findOne({
      organization: organizationId,
    });
    if (!policy) {
      throw new NotFoundException('Leave policy not found for organization');
    }

    // Find the specific leave type in policy
    const leaveTypeConfig = policy.leaveTypes.find(
      (lt: any) => lt.type === leaveData.leaveType
    );
    if (!leaveTypeConfig) {
      throw new BadRequestException(
        `Leave type ${leaveData.leaveType} not defined in policy`
      );
    }

    // Validate partial time unit is allowed if requested
    if (leaveData.isPartialTimeUnit && !leaveTypeConfig.allowPartialTimeUnit) {
      throw new BadRequestException(
        `Partial time units not allowed for ${leaveData.leaveType}`
      );
    }

    // Validate attachment requirement
    if (
      leaveTypeConfig.requiresAttachment &&
      (!leaveData.attachments || leaveData.attachments.length === 0)
    ) {
      throw new BadRequestException(
        `${leaveData.leaveType} requires attachments`
      );
    }

    // Format start and end dates in organization timezone
    const startMoment = moment.tz(leaveData.startDateTime, timezone);
    const endMoment = moment.tz(leaveData.endDateTime, timezone);

    // Validate dates
    if (!startMoment.isValid() || !endMoment.isValid()) {
      throw new BadRequestException('Invalid date format');
    }

    if (endMoment.isBefore(startMoment)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for leave conflicts
    const hasConflict = await this.checkLeaveConflicts(
      userId,
      organizationId,
      startMoment.toDate(),
      endMoment.toDate()
    );

    if (hasConflict) {
      throw new BadRequestException(
        'Leave request conflicts with existing leave'
      );
    }

    // Get leave balance to validate
    const balance = await this.getOrCreateLeaveBalance(userId, organizationId);

    // Ensure the leave type exists in the balance
    if (!balance.balances[leaveData.leaveType]) {
      throw new BadRequestException(
        `No balance defined for leave type: ${leaveData.leaveType}`
      );
    }

    // Convert requested amount to policy's default time unit if different
    const leaveBalanceInDefaultUnit = this.convertTimeUnits(
      leaveData.amount,
      leaveData.timeUnit,
      leaveTypeConfig.defaultTimeUnit,
      policy.workSchedule?.fullTimeHoursPerWeek /
        policy.workSchedule?.fullTimeDaysPerWeek || 8,
      policy.workSchedule?.fullTimeDaysPerWeek || 5
    );

    // Verify sufficient balance
    const leaveTypeBalance = balance.balances[leaveData.leaveType];
    const availableBalance =
      (leaveTypeBalance.allocations[leaveTypeConfig.defaultTimeUnit] || 0) -
      (leaveTypeBalance.used[leaveTypeConfig.defaultTimeUnit] || 0) -
      (leaveTypeBalance.pending[leaveTypeConfig.defaultTimeUnit] || 0);

    if (availableBalance < leaveBalanceInDefaultUnit) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${availableBalance} ${leaveTypeConfig.defaultTimeUnit}, Requested: ${leaveBalanceInDefaultUnit} ${leaveTypeConfig.defaultTimeUnit}`
      );
    }

    // Create the leave request
    const newLeaveRequest = new this.leaveRequestModel({
      user: userId,
      organization: organizationId,
      leaveType: leaveData.leaveType,
      status: LeaveStatus.PENDING,
      startDateTime: startMoment.toDate(),
      endDateTime: endMoment.toDate(),
      timeUnit: leaveData.timeUnit,
      amount: leaveData.amount,
      reason: leaveData.reason,
      attachments: leaveData.attachments || [],
      timezone: timezone,
      isPartialTimeUnit: !!leaveData.isPartialTimeUnit,
      partialTimeDetails: leaveData.partialTimeDetails,
      isRecurring: !!leaveData.isRecurring,
      recurringPattern: leaveData.recurringPattern,
      notificationsSent: {
        requestSubmitted: false,
      },
      // For approval workflow
      currentApprovalLevel: 1,
      approvalFlow:
        policy.approvalHierarchy.length > 0
          ? [
              {
                level: 1,
                status: 'pending',
                timestamp: new Date(),
              },
            ]
          : [],
    });

    // Update the balance
    if (!leaveTypeBalance.pending) {
      leaveTypeBalance.pending = {};
    }

    // Add to pending in the request's time unit
    leaveTypeBalance.pending[leaveData.timeUnit] =
      (leaveTypeBalance.pending[leaveData.timeUnit] || 0) + leaveData.amount;

    // Save balance changes
    balance.markModified('balances');
    await balance.save();

    // Send notifications to approvers
    try {
      //   await this.notificationService.sendNotification(
      //     {
      //       notification: {
      //         title: 'New Leave Request',
      //         body: `${user.firstName} ${user.lastName} has requested ${leaveData.amount} ${leaveData.timeUnit} of ${leaveData.leaveType} leave`,
      //       },
      //       data: {
      //         type: 'LEAVE_REQUEST',
      //         leaveRequestId: newLeaveRequest._id.toString(),
      //         timestamp: new Date().toISOString(),
      //       },
      //     },
      //     {
      //       organizationId: organizationId,
      //       roles: ['admin'], // Use actual roles from approval hierarchy
      //     }
      //   );

      newLeaveRequest.notificationsSent.requestSubmitted = true;
    } catch (error) {
      this.logger.error(`Failed to send notifications: ${error.message}`);
    }

    // Save and return the new leave request
    return await newLeaveRequest.save();
  }

  /**
   * Update leave request status
   */
  async updateLeaveStatus(
    requestId: string,
    status: LeaveStatus,
    approverUserId: string,
    comments?: string
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    const oldStatus = leaveRequest.status;

    // Don't update if already in final state
    if (oldStatus === LeaveStatus.APPROVED && status === LeaveStatus.REJECTED) {
      throw new BadRequestException('Cannot reject already approved leave');
    }
    if (oldStatus === LeaveStatus.REJECTED && status === LeaveStatus.APPROVED) {
      throw new BadRequestException('Cannot approve already rejected leave');
    }
    if (oldStatus === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Leave request has been cancelled');
    }
    if (oldStatus === LeaveStatus.INVALIDATED) {
      throw new BadRequestException('Leave request has been invalidated');
    }

    // Update request status
    leaveRequest.status = status;
    leaveRequest.approvedBy = new Types.ObjectId(approverUserId);
    leaveRequest.reviewedAt = new Date();

    if (comments) {
      leaveRequest.comments = comments;
    }

    // Get user and organization for notification
    const user = await this.userModel.findById(leaveRequest.user);
    const organization = await this.organizationModel.findById(
      leaveRequest.organization
    );

    // Get leave balance to update
    const balance = await this.getOrCreateLeaveBalance(
      leaveRequest.user.toString(),
      leaveRequest.organization.toString()
    );

    if (!balance.balances[leaveRequest.leaveType]) {
      throw new BadRequestException(
        `No balance found for leave type: ${leaveRequest.leaveType}`
      );
    }

    const leaveTypeBalance = balance.balances[leaveRequest.leaveType];

    // Ensure pending object exists
    if (!leaveTypeBalance.pending) {
      leaveTypeBalance.pending = {};
    }

    // Reduce from pending
    leaveTypeBalance.pending[leaveRequest.timeUnit] = Math.max(
      0,
      (leaveTypeBalance.pending[leaveRequest.timeUnit] || 0) -
        leaveRequest.amount
    );

    // Update balances based on new status
    if (status === LeaveStatus.APPROVED) {
      // Ensure used object exists
      if (!leaveTypeBalance.used) {
        leaveTypeBalance.used = {};
      }

      // Add to used
      leaveTypeBalance.used[leaveRequest.timeUnit] =
        (leaveTypeBalance.used[leaveRequest.timeUnit] || 0) +
        leaveRequest.amount;
    }

    // Mark as modified and save
    balance.markModified('balances');
    await balance.save();

    // Update notification sent flags
    leaveRequest.notificationsSent = {
      ...leaveRequest.notificationsSent,
      requestApproved: status === LeaveStatus.APPROVED,
      requestRejected: status === LeaveStatus.REJECTED,
    };

    // Send notification to the user
    try {
      //   await this.notificationService.sendNotification(
      //     {
      //       notification: {
      //         title: 'Leave Request Update',
      //         body: `Your ${
      //           leaveRequest.leaveType
      //         } leave request has been ${status.toLowerCase()}`,
      //       },
      //       data: {
      //         type: 'LEAVE_REQUEST_UPDATE',
      //         leaveRequestId: leaveRequest._id.toString(),
      //         status: status,
      //         timestamp: new Date().toISOString(),
      //       },
      //     },
      //     {
      //       userIds: [leaveRequest.user.toString()],
      //     }
      //   );
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }

    // Save and return the updated leave request
    return await leaveRequest.save();
  }

  /**
   * Invalidate a previously approved leave request
   */
  async invalidateLeaveRequest(
    requestId: string,
    adminUserId: string,
    reason: string
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved requests can be invalidated'
      );
    }

    // Update request status
    leaveRequest.status = LeaveStatus.INVALIDATED;
    leaveRequest.approvedBy = new Types.ObjectId(adminUserId);
    leaveRequest.reviewedAt = new Date();
    leaveRequest.comments = `Invalidated: ${reason}`;

    // Get leave balance to update
    const balance = await this.getOrCreateLeaveBalance(
      leaveRequest.user.toString(),
      leaveRequest.organization.toString()
    );

    if (!balance.balances[leaveRequest.leaveType]) {
      throw new BadRequestException(
        `No balance found for leave type: ${leaveRequest.leaveType}`
      );
    }

    const leaveTypeBalance = balance.balances[leaveRequest.leaveType];

    // Ensure used object exists
    if (!leaveTypeBalance.used) {
      leaveTypeBalance.used = {};
    }

    // Reduce from used
    leaveTypeBalance.used[leaveRequest.timeUnit] = Math.max(
      0,
      (leaveTypeBalance.used[leaveRequest.timeUnit] || 0) - leaveRequest.amount
    );

    // Update lastUpdated timestamp
    balance.lastUpdated = new Date();

    // Mark as modified and save
    balance.markModified('balances');
    await balance.save();

    // Update notification flags
    leaveRequest.notificationsSent = {
      ...leaveRequest.notificationsSent,
      requestRejected: true, // Using existing field since there's no "requestInvalidated"
    };

    // Send notification to the user
    try {
      //   await this.notificationService.sendNotification(
      //     {
      //       notification: {
      //         title: 'Leave Request Invalidated',
      //         body: `Your approved ${leaveRequest.leaveType} leave has been invalidated. Reason: ${reason}`,
      //       },
      //       data: {
      //         type: 'LEAVE_REQUEST_INVALIDATED',
      //         leaveRequestId: leaveRequest._id.toString(),
      //         timestamp: new Date().toISOString(),
      //       },
      //     },
      //     {
      //       userIds: [leaveRequest.user.toString()],
      //     }
      //   );
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }

    // Save and return the updated leave request
    return await leaveRequest.save();
  }

  /**
   * Get or create leave balance for a user
   */
  async getOrCreateLeaveBalance(
    userId: string,
    organizationId: string
  ): Promise<LeaveBalanceDocument> {
    const currentYear = new Date().getFullYear();

    // Get the organization timezone
    const timezone = await this.getOrganizationTimezone(organizationId);

    // Get the current leave policy
    const policy = await this.leavePolicyModel.findOne({
      organization: organizationId,
    });

    if (!policy) {
      throw new NotFoundException('Leave policy not found');
    }

    // Find the user's balance for the current year
    let balance = await this.leaveBalanceModel.findOne({
      user: userId,
      organization: organizationId,
      year: currentYear,
    });

    if (!balance) {
      // If no balance exists, create a new one with all leave types from policy
      const dynamicBalances: Record<
        string,
        {
          allocations: Record<string, number>;
          used: Record<string, number>;
          pending: Record<string, number>;
          accrual?: {
            frequency: AccrualFrequency;
            rate: number;
            timeUnit: LeaveTimeUnit;
            maxAccumulation?: number;
            lastAccrualDate: Date;
          };
        }
      > = {};

      policy.leaveTypes.forEach((leaveType: any) => {
        dynamicBalances[leaveType.type as any] = {
          // Initialize allocations in all supported time units
          allocations: {
            [leaveType.defaultTimeUnit]: leaveType.entitlementAmount || 0,
          },
          used: {},
          pending: {},
          // Store accrual information if applicable
          accrual: leaveType.accrualEnabled
            ? {
                frequency: leaveType.accrualFrequency,
                rate: leaveType.accrualAmount,
                timeUnit: leaveType.accrualTimeUnit,
                maxAccumulation: leaveType.maxAccrualAmount,
                lastAccrualDate: new Date(),
              }
            : undefined,
        };
      });

      balance = new this.leaveBalanceModel({
        user: userId,
        organization: organizationId,
        year: currentYear,
        balances: dynamicBalances,
        timezone: timezone,
        lastUpdated: new Date(),
        lastCalculated: new Date(),
      });

      await balance.save();
    } else {
      let balanceUpdated = false;

      // Add any missing leave types from policy
      for (const leaveType of policy.leaveTypes) {
        if (!balance.balances[leaveType.type]) {
          balance.balances[leaveType.type] = {
            allocations: {
              [leaveType.defaultTimeUnit]: leaveType.entitlementAmount || 0,
            },
            used: {},
            pending: {},
            accrual: leaveType.accrualEnabled
              ? ({
                  frequency: leaveType.accrualFrequency,
                  rate: leaveType.accrualAmount,
                  timeUnit: leaveType.accrualTimeUnit,
                  maxAccumulation: leaveType.maxAccrualAmount,
                  lastAccrualDate: new Date(),
                } as any)
              : undefined,
          };

          balanceUpdated = true;
        }
      }

      // Set timezone if not already set
      if (!balance.timezone) {
        balance.timezone = timezone;
        balanceUpdated = true;
      }

      if (balanceUpdated) {
        balance.lastUpdated = new Date();
        await balance.save();
      }
    }

    return balance;
  }

  /**
   * Delete a leave policy
   */
  async deleteLeavePolicy(
    organizationId: string,
    policyId: string
  ): Promise<boolean> {
    const policy = await this.leavePolicyModel.findOneAndDelete({
      organization: organizationId,
      _id: policyId,
    });

    if (!policy) {
      throw new NotFoundException('Leave policy not found');
    }

    return true;
  }

  /**
   * Get leave types for an organization
   */
  async getLeaveTypes(organizationId: string): Promise<any> {
    const policy = await this.leavePolicyModel
      .findOne({
        organization: organizationId,
      })
      .lean();

    if (!policy) {
      throw new NotFoundException('Leave policy not found');
    }

    return policy;
  }

  /**
   * Get or create default leave policy
   */
  async getLeavePolicy(organizationId: string): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findOne({
      organization: organizationId,
    });

    if (!policy) {
      // Create a default policy
      const timezone = await this.getOrganizationTimezone(organizationId);

      const defaultPolicy = new this.leavePolicyModel({
        organization: organizationId,
        policyName: 'Default Leave Policy',
        timezone: timezone,
        applicableRoles: ['care', 'admin', 'other'],
        leaveTypes: [],
        workSchedule: {
          defaultWorkingDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
          ],
          defaultWorkingHours: {
            start: '09:00',
            end: '17:00',
          },
          fullTimeHoursPerWeek: 40,
          fullTimeDaysPerWeek: 5,
          breakDuration: 60,
          flexibleHours: false,
        },
        yearSettings: {
          fiscalYearStart: {
            month: 1,
            day: 1,
          },
          leaveYearSameAsFiscal: true,
          useEmployeeAnniversary: false,
          accrualCalculationDay: 1,
        },
        isActive: true,
      });

      await defaultPolicy.save();
      return defaultPolicy;
    }

    return policy;
  }

  /**
   * Get leave requests with filtering and pagination
   */
  async getLeaveRequests(
    filters: {
      userId?: string;
      organization: string;
      status?: LeaveStatus;
      startDate?: Date;
      endDate?: Date;
      leaveType?: string;
    },
    pagination: {
      page: number;
      limit: number;
    }
  ) {
    const query: any = {
      organization: new Types.ObjectId(filters.organization),
    };

    if (filters.userId) {
      query.user = new Types.ObjectId(filters.userId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.leaveType) {
      query.leaveType = filters.leaveType;
    }

    if (filters.startDate || filters.endDate) {
      query.startDateTime = {};

      if (filters.startDate) {
        query.startDateTime.$gte = filters.startDate;
      }

      if (filters.endDate) {
        query.endDateTime = { $lte: filters.endDate };
      }
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [requests, total] = await Promise.all([
      this.leaveRequestModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .populate('user', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName'),
      this.leaveRequestModel.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Create or update leave policy
   */
  async upsertLeavePolicy(
    organizationId: string,
    policyData: Partial<LeavePolicyDocument>
  ): Promise<LeavePolicyDocument> {
    // Get organization timezone
    const timezone = await this.getOrganizationTimezone(organizationId);

    // Ensure timezone is set
    if (!policyData.timezone) {
      policyData.timezone = timezone;
    }

    // First, save the policy
    const policy = await this.leavePolicyModel.findOneAndUpdate(
      { organization: new Types.ObjectId(organizationId) },
      {
        $set: {
          ...policyData,
          organization: new Types.ObjectId(organizationId),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    // After policy is created/updated, trigger balance update for all applicable users
    this.updateUserLeaveBalances(policy)
      .then((updatedCount) => {
        this.logger.log(`Updated leave balances for ${updatedCount} users`);
      })
      .catch((error) => {
        this.logger.error('Error updating user leave balances:', error.message);
      });

    return policy;
  }

  /**
   * Update leave balances for all users affected by a policy change
   */
  private async updateUserLeaveBalances(
    policy: LeavePolicyDocument
  ): Promise<number> {
    const currentYear = new Date().getFullYear();

    // Find all organization roles that match the applicable roles in the policy
    const orgRoles = await this.organizationRoleModel.find({
      organization: policy.organization,
      staffType: { $in: policy.applicableRoles },
    });

    let updatedCount = 0;

    // Process each affected user
    for (const orgRole of orgRoles) {
      // Get or create leave balance for this user
      const balance = await this.getOrCreateLeaveBalance(
        orgRole.user.toString(),
        policy.organization.toString()
      );

      let balanceUpdated = false;

      // Check each leave type in the policy and update user's balance
      for (const leaveType of policy.leaveTypes) {
        // If leave type doesn't exist in user's balance, add it
        if (!balance.balances[leaveType.type]) {
          balance.balances[leaveType.type] = {
            allocations: {
              [leaveType.defaultTimeUnit]: leaveType.entitlementAmount || 0,
            },
            used: {},
            pending: {},
            accrual: leaveType.accrualEnabled
              ? ({
                  frequency: leaveType.accrualFrequency,
                  rate: leaveType.accrualAmount,
                  timeUnit: leaveType.accrualTimeUnit,
                  maxAccumulation: leaveType.maxAccrualAmount,
                  lastAccrualDate: new Date(),
                } as any)
              : undefined,
          };

          balanceUpdated = true;
        }
        // If leave type exists but entitlement amount has changed
        else if (
          balance.balances[leaveType.type]?.allocations?.[
            leaveType.defaultTimeUnit
          ] !== leaveType.entitlementAmount
        ) {
          // Update allocation
          if (!balance.balances[leaveType.type].allocations) {
            balance.balances[leaveType.type].allocations = {};
          }

          balance.balances[leaveType.type].allocations[
            leaveType.defaultTimeUnit
          ] = leaveType.entitlementAmount || 0;
          balanceUpdated = true;
        }

        // Update accrual settings if changed
        if (leaveType.accrualEnabled) {
          if (
            !balance.balances[leaveType.type].accrual ||
            balance.balances[leaveType.type].accrual?.frequency !==
              leaveType.accrualFrequency ||
            balance.balances[leaveType.type].accrual?.rate !==
              leaveType.accrualAmount ||
            balance.balances[leaveType.type].accrual?.timeUnit !==
              leaveType.accrualTimeUnit
          ) {
            balance.balances[leaveType.type].accrual = {
              frequency: leaveType.accrualFrequency as any,
              rate: leaveType?.accrualAmount as any,
              timeUnit: leaveType.accrualTimeUnit as any,
              maxAccumulation: leaveType.maxAccrualAmount,
              lastAccrualDate: new Date(),
            };

            balanceUpdated = true;
          }
        } else if (balance.balances[leaveType.type].accrual) {
          // Remove accrual if no longer enabled
          delete balance.balances[leaveType.type].accrual;
          balanceUpdated = true;
        }
      }

      // If balance needs to be updated
      if (balanceUpdated) {
        balance.lastUpdated = new Date();
        await balance.save();
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Check for leave conflicts
   */
  async checkLeaveConflicts(
    userId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const existingLeave = await this.leaveRequestModel.findOne({
      user: new Types.ObjectId(userId),
      organization: new Types.ObjectId(organizationId),
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      $or: [
        {
          startDateTime: { $lte: endDate },
          endDateTime: { $gte: startDate },
        },
      ],
    });

    return !!existingLeave;
  }

  /**
   * Cancel a leave request
   */
  async cancelLeaveRequest(
    requestId: string,
    userId: string,
    reason: string
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findOne({
      _id: requestId,
      user: new Types.ObjectId(userId),
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    leaveRequest.status = LeaveStatus.CANCELLED;
    leaveRequest.cancellationReason = reason;

    // Update leave balance
    const balance = await this.getOrCreateLeaveBalance(
      leaveRequest.user.toString(),
      leaveRequest.organization.toString()
    );

    if (!balance.balances[leaveRequest.leaveType]) {
      throw new NotFoundException('Leave balance not found');
    }

    const leaveTypeBalance = balance.balances[leaveRequest.leaveType];

    // Ensure pending object exists
    if (!leaveTypeBalance.pending) {
      leaveTypeBalance.pending = {};
    }

    // Reduce from pending
    leaveTypeBalance.pending[leaveRequest.timeUnit] = Math.max(
      0,
      (leaveTypeBalance.pending[leaveRequest.timeUnit] || 0) -
        leaveRequest.amount
    );

    balance.lastUpdated = new Date();
    balance.markModified('balances');
    await balance.save();

    return await leaveRequest.save();
  }

  /**
   * Get a single leave request by ID
   */
  async getLeaveRequestById(
    requestId: string,
    organizationId: string
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel
      .findOne({
        _id: requestId,
        organization: new Types.ObjectId(organizationId),
      })
      .populate('user', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  /**
   * Delete a leave request
   */
  async deleteLeaveRequest(
    requestId: string,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    const leaveRequest = await this.leaveRequestModel.findOne({
      _id: requestId,
      organization: new Types.ObjectId(organizationId),
      user: new Types.ObjectId(userId),
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Only allow deletion of rejected or cancelled requests
    if (
      leaveRequest.status !== LeaveStatus.REJECTED &&
      leaveRequest.status !== LeaveStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Only rejected or cancelled leave requests can be deleted'
      );
    }

    const requestDate = new Date(leaveRequest.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (requestDate < thirtyDaysAgo) {
      throw new BadRequestException(
        'Cannot delete requests older than 30 days'
      );
    }

    await this.leaveRequestModel.deleteOne({ _id: requestId });
    return true;
  }

  /**
   * Calculate and apply accruals for leaves
   * This should be run by a scheduled job
   */
  async processLeaveAccruals(): Promise<number> {
    const now = new Date();
    const currentYear = now.getFullYear();
    let processedCount = 0;

    // Get all active leave policies
    const policies = await this.leavePolicyModel.find({ isActive: true });

    // Process each policy
    for (const policy of policies) {
      // Find leave types with accrual enabled
      const accrualLeaveTypes = policy.leaveTypes.filter(
        (lt: any) => lt.accrualEnabled
      );

      if (accrualLeaveTypes.length === 0) continue;

      // Get all users with this organization role
      const orgRoles = await this.organizationRoleModel.find({
        organization: policy.organization,
        staffType: { $in: policy.applicableRoles },
      });

      // Process each user
      for (const orgRole of orgRoles) {
        const balance = await this.leaveBalanceModel.findOne({
          user: orgRole.user,
          organization: policy.organization,
          year: currentYear,
        });

        if (!balance) continue;

        let balanceUpdated = false;

        // Process each leave type with accrual
        for (const leaveType of accrualLeaveTypes) {
          const leaveTypeBalance = balance.balances[leaveType.type];

          if (!leaveTypeBalance || !leaveTypeBalance.accrual) continue;

          const {
            frequency,
            rate,
            timeUnit,
            lastAccrualDate,
            maxAccumulation,
          } = leaveTypeBalance.accrual;

          // Check if accrual should be applied based on frequency
          let shouldAccrue = false;
          const lastAccrualMoment = moment(lastAccrualDate);

          switch (frequency) {
            case AccrualFrequency.DAILY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'days') >= 1;
              break;
            case AccrualFrequency.WEEKLY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'weeks') >= 1;
              break;
            case AccrualFrequency.BIWEEKLY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'weeks') >= 2;
              break;
            case AccrualFrequency.MONTHLY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'months') >= 1;
              break;
            case AccrualFrequency.QUARTERLY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'months') >= 3;
              break;
            case AccrualFrequency.ANNUALLY:
              shouldAccrue = moment().diff(lastAccrualMoment, 'years') >= 1;
              break;
          }

          if (shouldAccrue) {
            // Ensure allocations object exists
            if (!leaveTypeBalance.allocations) {
              leaveTypeBalance.allocations = {};
            }

            // Add accrual to allocations
            leaveTypeBalance.allocations[timeUnit] =
              (leaveTypeBalance.allocations[timeUnit] || 0) + rate;

            // Apply max accumulation if set
            if (
              maxAccumulation &&
              leaveTypeBalance.allocations[timeUnit] > maxAccumulation
            ) {
              leaveTypeBalance.allocations[timeUnit] = maxAccumulation;
            }

            // Update last accrual date
            leaveTypeBalance.accrual.lastAccrualDate = new Date();

            balanceUpdated = true;
          }
        }

        if (balanceUpdated) {
          balance.lastUpdated = new Date();
          balance.lastCalculated = new Date();
          await balance.save();
          processedCount++;
        }
      }
    }

    return processedCount;
  }
}
