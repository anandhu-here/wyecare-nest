// timesheets/services/timesheets.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import * as dayjs from 'dayjs';
import Redis from 'ioredis';
import * as admin from 'firebase-admin';
import { Shift, ShiftDocument } from '../../../../../core/src/lib/schemas';
import { ShiftsService } from '../../shifts/services/shifts.service';
import { ShiftPatternsService } from '../../shift-patterns/services/shift-patterns.service';
import moment from 'moment';
import {
  Timesheet,
  TimesheetDocument,
} from 'libs/api/core/src/lib/schemas/timesheets/timesheet.schema';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
} from 'libs/api/core/src/lib/schemas/shifts/shift-assignment.schema';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class TimesheetsService {
  private readonly logger = new Logger(TimesheetsService.name);
  private readonly redisClient: Redis;

  private readonly defaultPopulateOptions = [
    {
      path: 'shift_',
      select: 'shiftPattern homeId date',
      populate: {
        path: 'shiftPattern',
        select: 'name timings userTypeRates rates',
      },
    },
    {
      path: 'carer',
      select: 'firstName lastName _id avatar.url role',
    },
    {
      path: 'home',
      select: 'name _id',
    },
    {
      path: 'agency',
      select: 'name _id',
    },
    {
      path: 'approvedBy',
      select: 'firstName lastName role',
    },
  ];

  constructor(
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<TimesheetDocument>,
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    private userService: UsersService,
    private shiftService: ShiftsService,
    private shiftPatternService: ShiftPatternsService
  ) {
    this.redisClient = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
    });
  }

  /**
   * Create a timesheet for signature approval
   */
  async createTimesheetForSignature(
    shiftId: string,
    userId: string,
    agency?: string,
    home?: string,
    timezone: string = 'UTC'
  ): Promise<any> {
    this.logger.log(
      `Starting timesheet creation for signature - Shift: ${shiftId}, User: ${userId}`
    );

    // Find the shift and populate the shift pattern
    const shift = await this.shiftModel
      .findOne({
        _id: new Types.ObjectId(shiftId),
      })
      .populate('shiftPattern')
      .lean();

    if (!shift) {
      this.logger.error(`Shift not found with ID: ${shiftId}`);
      throw new NotFoundException('Shift not found');
    }

    if (shift.agentId && !agency) {
      throw new BadRequestException(
        'This is an agency shift and your current organization is not an agency'
      );
    }

    // Check if the shiftPattern exists
    if (!shift.shiftPattern) {
      this.logger.error(`No shift pattern linked to shift ID: ${shiftId}`);
      throw new BadRequestException('Shift pattern not found for this shift');
    }

    // Get current date/time in the provided timezone
    const currentDateTime = new Date();
    const currentDateTimeInTZ = new Date(
      currentDateTime.toLocaleString('en-US', { timeZone: timezone })
    );

    // Parse the shift date
    const shiftDate = shift.date;
    const formattedShiftDate = moment(shiftDate).format('YYYY-MM-DD');
    const formattedCurrentDate =
      moment(currentDateTimeInTZ).format('YYYY-MM-DD');

    // Find the timing for this shift from the shift pattern
    const shiftPattern = shift.shiftPattern as any;
    if (!shiftPattern.timings || !shiftPattern.timings.length) {
      throw new BadRequestException('No timings defined in the shift pattern');
    }

    // Find the applicable timing for the care home
    const homeId = home || shift.homeId.toString();
    const timing = shiftPattern.timings.find(
      (t: any) => t.careHomeId === homeId
    );

    if (!timing) {
      throw new BadRequestException(
        'No timing found for this care home in the shift pattern'
      );
    }

    // Parse start and end times
    const [startHour, startMinute] = timing.startTime.split(':').map(Number);
    const [endHour, endMinute] = timing.endTime.split(':').map(Number);

    // Create Date objects for shift start and end times
    const shiftStartDate = new Date(formattedShiftDate);
    shiftStartDate.setHours(startHour, startMinute, 0, 0);
    shiftStartDate.setTime(
      new Date(
        shiftStartDate.toLocaleString('en-US', { timeZone: timezone })
      ).getTime()
    );

    // Create shift end date, handling overnight shifts
    const shiftEndDate = new Date(formattedShiftDate);
    shiftEndDate.setHours(endHour, endMinute, 0, 0);

    // If end time is earlier than start time, it means the shift ends the next day
    const isOvernightShift =
      endHour < startHour || (endHour === startHour && endMinute < startMinute);

    if (isOvernightShift) {
      shiftEndDate.setDate(shiftEndDate.getDate() + 1);
    }

    shiftEndDate.setTime(
      new Date(
        shiftEndDate.toLocaleString('en-US', { timeZone: timezone })
      ).getTime()
    );

    // Add tolerance of 3 hours after shift end time
    const toleranceEndDate = new Date(shiftEndDate);
    toleranceEndDate.setHours(toleranceEndDate.getHours() + 3);

    // Check if current time is within the shift time range with tolerance
    const isWithinShiftTime =
      currentDateTimeInTZ >= shiftStartDate &&
      currentDateTimeInTZ <= toleranceEndDate;

    if (!isWithinShiftTime) {
      // Calculate how long until/since the shift
      let timeMessage = '';
      if (currentDateTimeInTZ < shiftStartDate) {
        const msTillStart =
          shiftStartDate.getTime() - currentDateTimeInTZ.getTime();
        const daysTillStart = Math.floor(msTillStart / (1000 * 60 * 60 * 24));
        const hoursTillStart = Math.floor(
          (msTillStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutesTillStart = Math.floor(
          (msTillStart % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (daysTillStart > 0) {
          timeMessage = `Shift starts in ${daysTillStart}d ${hoursTillStart}h ${minutesTillStart}m`;
        } else {
          timeMessage = `Shift starts in ${hoursTillStart}h ${minutesTillStart}m`;
        }
      } else if (currentDateTimeInTZ > toleranceEndDate) {
        const msSinceEnd =
          currentDateTimeInTZ.getTime() - toleranceEndDate.getTime();
        const daysSinceEnd = Math.floor(msSinceEnd / (1000 * 60 * 60 * 24));
        const hoursSinceEnd = Math.floor(
          (msSinceEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutesSinceEnd = Math.floor(
          (msSinceEnd % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (daysSinceEnd > 0) {
          timeMessage = `Shift (including 3h tolerance) ended ${daysSinceEnd}d ${hoursSinceEnd}h ${minutesSinceEnd}m ago`;
        } else {
          timeMessage = `Shift (including 3h tolerance) ended ${hoursSinceEnd}h ${minutesSinceEnd}m ago`;
        }
      }

      throw new BadRequestException(
        `Timesheet can only be created during the shift timing or within 3 hours after the shift ends. ${timeMessage}`
      );
    }

    // Verify shift assignment
    const shiftAssignment = await this.shiftAssignmentModel
      .findOne({
        shift: new Types.ObjectId(shiftId),
        user: new Types.ObjectId(userId),
      })
      .lean();

    if (!shiftAssignment) {
      throw new NotFoundException('Shift assignment not found');
    }

    // Update or create timesheet without barcode
    const timesheet: any = await this.timesheetModel.findOneAndUpdate(
      {
        shift_: new Types.ObjectId(shiftId),
        carer: new Types.ObjectId(userId),
        home: new Types.ObjectId(home || shift.homeId.toString()),
      },
      {
        $set: {
          agency: agency ? new Types.ObjectId(agency) : null,
          status: 'pending',
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return timesheet;
  }

  /**
   * Approve timesheet with signature
   */
  async approveTimesheetWithSignature(
    timesheetId: string,
    signatureData: string,
    approvingUserId: string,
    signerName: string,
    signerRole: string,
    rating?: number | null,
    review?: string | null,
    ipAddress?: string,
    deviceInfo?: string
  ): Promise<any> {
    this.logger.log(
      `Approving timesheet with signature - TimesheetId: ${timesheetId}`
    );

    // 1. Find the timesheet to ensure it exists
    const timesheet: any = await this.timesheetModel.findById(timesheetId);
    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // 2. Upload signature to Firebase
    const fileName = `signatures/${timesheet.home}/${
      timesheet.carer
    }/${timesheetId}_${Date.now()}.png`;
    const bucket = admin.storage().bucket();

    // Convert base64 data to buffer
    const signatureBuffer = Buffer.from(
      signatureData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    // Upload to Firebase
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(signatureBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    let signedUrl;
    if (process.env['NODE_ENV'] === 'local') {
      signedUrl = `http://localhost:9199/mock-signed-url/${fileName}`;
    } else {
      [signedUrl] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });
    }

    // 3. Prepare update data
    const updateData: any = {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: approvingUserId,
      signature: {
        storageRef: fileName,
        downloadUrl: signedUrl,
        timestamp: new Date(),
        ipAddress: ipAddress || null,
        deviceInfo: deviceInfo || null,
        verified: true,
        signerName: signerName,
        signerRole: signerRole,
      },
    };

    if (rating !== undefined && rating !== null) updateData.rating = rating;
    if (review !== undefined && review !== null) updateData.review = review;

    const updatedTimesheet = await this.timesheetModel
      .findByIdAndUpdate(timesheetId, updateData, { new: true })
      .exec();

    if (!updatedTimesheet) {
      throw new NotFoundException('Failed to update timesheet');
    }

    // 4. Update shift assignment status to 'signed'
    await this.shiftAssignmentModel.findOneAndUpdate(
      {
        shift: updatedTimesheet.shiftId,
        user: updatedTimesheet.carer,
      },
      {
        status: 'signed',
      },
      {
        new: true,
      }
    );

    // 5. Check if all shift assignments are completed or signed
    const shiftId = updatedTimesheet.shiftId;
    const allAssignments = await this.shiftAssignmentModel.find({
      shift: shiftId,
    });

    const allCompleted = allAssignments.every(
      (assignment) =>
        assignment.status === 'completed' || assignment.status === 'signed'
    );

    // 6. If all assignments are completed/signed, check if all timesheets are approved
    if (allCompleted) {
      const allTimesheets = await this.timesheetModel.find({ shift_: shiftId });
      const allTimesheetsApproved = allTimesheets.every(
        (ts) => ts.status === 'approved'
      );

      // 7. If all timesheets are approved, mark the shift as completed and done
      if (allTimesheetsApproved) {
        await this.shiftModel.findByIdAndUpdate(
          shiftId,
          {
            isCompleted: true,
            isDone: true,
          },
          {
            new: true,
          }
        );
        this.logger.log(`Marked shift ${shiftId} as completed and done`);
      }
    }

    return updatedTimesheet;
  }

  /**
   * Get timesheets by role (with filtering and pagination)
   */
  async getTimesheetsByRole(
    accountType: string,
    userId: string,
    orgType?: string,
    orgId?: string,
    organizationIdQuery?: string,
    pagination?: { page: number; limit: number },
    status?: 'all' | 'approved' | 'pending' | 'rejected',
    startDate?: string,
    endDate?: string,
    invoiceStatus?: string | null,
    isEmergency?: boolean | null,
    carerRole?: string,
    shiftPatternId?: string | null,
    careUserId?: string | null
  ): Promise<{ data: any[]; pagination: any }> {
    try {
      // Calculate pagination values
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      // Base match stage
      let matchStage: Record<string, any> = {};

      // Add base filters
      if (invoiceStatus) {
        matchStage['invoiceStatus'] = invoiceStatus;
      }

      if (status && status !== 'all') {
        matchStage['status'] = status;
      }

      if (careUserId) {
        matchStage['carer'] = new Types.ObjectId(careUserId);
      }

      // Add role-based filters
      switch (accountType) {
        case 'admin':
          if (orgType === 'agency') {
            matchStage['agency'] = new Types.ObjectId(orgId);
            if (organizationIdQuery) {
              matchStage['home'] = new Types.ObjectId(organizationIdQuery);
            }
          } else if (orgType === 'home') {
            if (organizationIdQuery) {
              matchStage['agency'] = new Types.ObjectId(organizationIdQuery);
            }
            matchStage['home'] = new Types.ObjectId(orgId);
          }
          break;

        case 'care':
          matchStage[orgType === 'agency' ? 'agency' : 'home'] =
            new Types.ObjectId(orgId);
          matchStage['carer'] = new Types.ObjectId(userId);
          break;

        default: // carer
          matchStage['carer'] = new Types.ObjectId(userId);
      }

      // Build the aggregation pipeline
      const pipeline: any[] = [];

      // Initial match stage
      pipeline.push({ $match: matchStage });

      // Lookup shift details
      pipeline.push({
        $lookup: {
          from: 'shifts',
          localField: 'shift_',
          foreignField: '_id',
          as: 'shift',
        },
      });

      pipeline.push({
        $unwind: {
          path: '$shift',
          preserveNullAndEmptyArrays: false,
        },
      });

      // Add emergency filter if provided
      if (isEmergency !== null && isEmergency !== undefined) {
        pipeline.push({
          $match: {
            'shift.isEmergency': isEmergency,
          },
        });
      }

      // Add shift pattern filter if provided
      if (shiftPatternId) {
        pipeline.push({
          $match: {
            'shift.shiftPattern': new Types.ObjectId(shiftPatternId),
          },
        });
      }

      // Add date range filter if dates are provided
      if (startDate && endDate) {
        pipeline.push({
          $match: {
            'shift.date': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        });
      }

      // Add remaining lookups and processing from original code
      // Lookup shift pattern details
      pipeline.push({
        $lookup: {
          from: 'shiftpatterns',
          localField: 'shift.shiftPattern',
          foreignField: '_id',
          as: 'shiftPatternData',
        },
      });

      pipeline.push({
        $unwind: {
          path: '$shiftPatternData',
          preserveNullAndEmptyArrays: true,
        },
      });

      // Lookup carer details
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'carer',
          foreignField: '_id',
          as: 'carerDetails',
        },
      });

      pipeline.push({
        $unwind: {
          path: '$carerDetails',
          preserveNullAndEmptyArrays: true,
        },
      });

      // Add carer role filter if provided
      if (carerRole && carerRole !== 'all') {
        pipeline.push({
          $match: {
            'carerDetails.role': carerRole,
          },
        });
      }

      // Lookup regular homes from organizations collection
      pipeline.push({
        $lookup: {
          from: 'organizations',
          localField: 'home',
          foreignField: '_id',
          as: 'regularHome',
        },
      });

      // Lookup temporary homes using the shift temporaryHomeId (if present)
      pipeline.push({
        $lookup: {
          from: 'temporaryhomes',
          localField: 'shift.temporaryHomeId',
          foreignField: '_id',
          as: 'tempHome',
        },
      });

      // Additional lookups and fields processing
      // ... (continue with the remaining pipeline from the original code)

      // Count total documents for pagination
      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'total' });

      // Get data with pagination
      pipeline.push({ $sort: { 'shift.date': -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Add final projection from original code
      // ... (add the final projection stage)

      // Execute both queries in parallel for better performance
      const [countResult, timesheets] = await Promise.all([
        this.timesheetModel.aggregate(countPipeline),
        this.timesheetModel.aggregate(pipeline),
      ]);

      const total = countResult[0]?.total || 0;

      return {
        data: timesheets,
        pagination: {
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error('Error getting timesheets by role:', error);
      throw error;
    }
  }

  /**
   * Get timesheet counts by user
   */
  async getTimesheetCountsByUser(
    orgId: string,
    orgType: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const matchStage = {
        [orgType === 'agency' ? 'agency' : 'home']: new Types.ObjectId(orgId),
      };

      const pipeline = [
        {
          $lookup: {
            from: 'shifts',
            localField: 'shift_',
            foreignField: '_id',
            as: 'shift',
          },
        },
        { $unwind: '$shift' },
        {
          $match: {
            ...matchStage,
            'shift.date': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: '$carer',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $project: {
            _id: 1,
            count: 1,
            firstName: '$userDetails.firstName',
            lastName: '$userDetails.lastName',
            role: '$userDetails.role',
            avatarUrl: '$userDetails.avatarUrl',
          },
        },
        { $match: { count: { $gt: 0 } } },
        { $sort: { count: -1 } },
      ];

      return await this.timesheetModel.aggregate(pipeline as any);
    } catch (error: any) {
      this.logger.error('Error getting timesheet counts:', error);
      throw error;
    }
  }

  /**
   * Get user timesheets
   */
  async getUserTimesheets(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      return await this.timesheetModel
        .find({
          carer: new Types.ObjectId(userId),
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        })
        .populate(this.defaultPopulateOptions);
    } catch (error: any) {
      this.logger.error('Error getting user timesheets:', error);
      throw error;
    }
  }

  /**
   * Create a timesheet
   */
  async createTimesheet({
    shiftId,
    userId,
    shiftPatternId,
    organizationId,
    homeId,
    documentUrl,
  }: {
    shiftId: string;
    userId: string;
    shiftPatternId: string;
    organizationId: string;
    homeId: string;
    documentUrl?: string;
  }): Promise<any> {
    try {
      const [user, shift] = await Promise.all([
        this.userService.findOne(userId),
        this.shiftService.findOne(shiftId),
      ]);

      if (!user) throw new NotFoundException('User not found');
      if (!shift) throw new NotFoundException('Shift not found');

      const timesheet: any = await this.timesheetModel.create({
        shift_: new Types.ObjectId(shiftId),
        carer: new Types.ObjectId(userId),
        agency: organizationId ? new Types.ObjectId(organizationId) : null,
        home: new Types.ObjectId(homeId),
        status: 'pending',
        startTime: new Date(),
        documentUrl,
      });

      await this.shiftAssignmentModel.findOneAndUpdate(
        {
          user: userId,
          shift: shiftId,
        },
        {
          status: 'completed',
        }
      );

      return timesheet;
    } catch (error: any) {
      this.logger.error('Error creating timesheet:', error);
      throw error;
    }
  }

  /**
   * Create manual timesheets
   */
  async createManualTimesheets({
    homeId,
    shiftPatternId,
    carerIds,
    shiftDate,
    createdBy,
    agentId,
    isTemporaryHome,
    temporaryHomeId,
  }: {
    homeId: string;
    shiftPatternId: string;
    carerIds: string[];
    shiftDate: string;
    createdBy: string;
    agentId: string;
    isTemporaryHome?: boolean;
    temporaryHomeId?: string;
  }): Promise<any> {
    try {
      // 1. First check for existing timesheets for these carers on this date
      const existingTimesheets: any = await this.timesheetModel
        .find({
          home: new Types.ObjectId(homeId),
          carer: { $in: carerIds.map((id) => new Types.ObjectId(id)) },
          shift_: {
            $in: await this.shiftModel
              .find({
                homeId: new Types.ObjectId(homeId),
                date: shiftDate,
              })
              .select('_id'),
          },
        })
        .populate('carer', 'firstName lastName');

      if (existingTimesheets.length > 0) {
        // Return detailed information about existing timesheets
        const existingCarers = existingTimesheets.map((ts: any) => ({
          id: ts.carer._id,
          name: `${ts.carer.firstName} ${ts.carer.lastName}`,
        }));

        return {
          success: false,
          message:
            'Timesheets already exist for some staff members on this date',
          data: {
            timesheets: [],
            existingEntries: existingCarers,
            duplicateDate: shiftDate,
          },
        };
      }

      // 2. Create shift if it doesn't exist
      let shift = await this.shiftModel.findOne({
        homeId: new Types.ObjectId(homeId),
        temporaryHomeId: isTemporaryHome
          ? new Types.ObjectId(temporaryHomeId)
          : null,
        isTemporaryHome,
        shiftPattern: new Types.ObjectId(shiftPatternId),
        date: shiftDate,
      });

      if (!shift) {
        shift = await this.shiftModel.create({
          homeId: new Types.ObjectId(homeId),
          agentId: new Types.ObjectId(agentId),
          shiftPattern: new Types.ObjectId(shiftPatternId),
          date: shiftDate,
          assignedUsers: carerIds.map((id) => new Types.ObjectId(id)),
          isAccepted: true,
          isDone: true,
        });
      }

      // 3. Create timesheets
      const timesheetData = carerIds.map((carerId) => ({
        shift_: shift._id,
        carer: new Types.ObjectId(carerId),
        home: new Types.ObjectId(isTemporaryHome ? temporaryHomeId : homeId),
        agency: new Types.ObjectId(agentId),
        status: 'pending',
        requestType: 'manual',
        approvedBy: new Types.ObjectId(createdBy),
        invoiceStatus: 'idle',
      }));

      const createdTimesheets = await this.timesheetModel.insertMany(
        timesheetData
      );

      // 4. Return populated timesheets
      const populatedTimesheets = await this.timesheetModel
        .find({
          _id: { $in: createdTimesheets.map((t) => t._id) },
        })
        .populate([
          {
            path: 'shift_',
            populate: {
              path: 'shiftPattern',
            },
          },
          {
            path: 'carer',
            select: 'firstName lastName email',
          },
          {
            path: 'home',
            select: 'name',
          },
        ]);

      return {
        success: true,
        message: 'Timesheets created successfully',
        data: {
          timesheets: populatedTimesheets,
        },
      };
    } catch (error: any) {
      this.logger.error('Error creating manual timesheets:', error);
      throw error;
    }
  }

  /**
   * Approve a timesheet
   */
  async approveTimesheet(
    timesheetId: string,
    rating?: number | null,
    review?: string | null,
    approvingUserId?: string,
    barcode?: any
  ): Promise<any> {
    try {
      const updateData: any = {
        status: 'approved',
        approvedAt: new Date(),
      };

      if (rating !== undefined && rating !== null) updateData.rating = rating;
      if (review !== undefined && review !== null) updateData.review = review;

      const timesheet: any = await this.timesheetModel
        .findByIdAndUpdate(
          timesheetId,
          {
            ...updateData,
            approvedBy: approvingUserId,
          },
          { new: true }
        )
        .exec();

      if (!timesheet) throw new NotFoundException('Timesheet not found');

      await Promise.all([
        this.shiftAssignmentModel.findOneAndUpdate(
          {
            user: timesheet.carer,
            shift: timesheet.shiftId,
          },
          {
            status: 'signed',
          }
        ),
        this.shiftService.update(timesheet.shiftId?.toString(), {
          status: 'done',
        }),
      ]);

      // Check if all shift assignments are completed or signed
      try {
        const allAssignments = await this.shiftAssignmentModel.find({
          shift: timesheet.shiftId,
        });

        const allCompleted = allAssignments.every(
          (assignment) =>
            assignment.status === 'completed' || assignment.status === 'signed'
        );

        // If all assignments are completed/signed, check if all timesheets are approved
        if (allCompleted) {
          const allTimesheets = await this.timesheetModel.find({
            shift_: timesheet.shiftId,
          });

          const allTimesheetsApproved = allTimesheets.every(
            (ts) => ts.status === 'approved'
          );

          // If all timesheets are approved, mark the shift as completed and done
          if (allTimesheetsApproved) {
            await this.shiftModel.findByIdAndUpdate(timesheet.shiftId, {
              isCompleted: true,
              isDone: true,
            });
            this.logger.log(
              `Marked shift ${timesheet.shiftId} as completed and done`
            );
          }
        }
      } catch (shiftUpdateError) {
        // Log the error but don't fail the whole operation
        this.logger.error('Error updating shift status:', shiftUpdateError);
      }

      // Update Redis for QR code status
      const REDIS_KEY_PREFIX = 'timesheet:qr:';

      await this.redisClient.set(
        `${REDIS_KEY_PREFIX}${timesheet.tokenForQrCode}`,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'success',
          carerId: timesheet.carer.toString(),
          orgId: timesheet.home.toString(),
          timesheetId: timesheet._id.toString(),
        }),
        'EX',
        1200 // 20 minutes expiry
      );

      return timesheet;
    } catch (error: any) {
      this.logger.error('Error approving timesheet:', error);
      throw error;
    }
  }

  /**
   * Reject a timesheet
   */
  async rejectTimesheet(timesheetId: string, reason: string): Promise<any> {
    try {
      const timesheet: any = await this.timesheetModel.findOneAndDelete({
        _id: new Types.ObjectId(timesheetId),
      });

      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }

      // Record the rejection reason in logs or another system if needed
      this.logger.log(`Timesheet ${timesheetId} rejected. Reason: ${reason}`);

      return timesheet;
    } catch (error: any) {
      this.logger.error('Error rejecting timesheet:', error);
      throw error;
    }
  }

  /**
   * Delete a timesheet
   */
  async deleteTimesheet(timesheetId: string): Promise<any> {
    try {
      // Find the timesheet to get the signature reference
      const timesheet: any = await this.timesheetModel.findById(timesheetId);

      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }

      // Check if the timesheet can be deleted based on invoice status
      if (
        timesheet.invoiceId ||
        ['paid', 'invoiced'].includes(timesheet.invoiceStatus)
      ) {
        throw new BadRequestException(
          'Timesheet cannot be deleted due to invoice status'
        );
      }

      // Check if there's a signature to delete
      if (timesheet.signature && timesheet.signature.storageRef) {
        try {
          // Delete the signature file from Firebase Storage
          const bucket = admin.storage().bucket();
          const file = bucket.file(timesheet.signature.storageRef);

          // Check if file exists before deleting
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            this.logger.log(
              `Deleted signature file: ${timesheet.signature.storageRef}`
            );
          }
        } catch (storageError: any) {
          // Log but don't fail the entire operation if file deletion fails
          this.logger.error(
            `Failed to delete signature file: ${storageError.message}`
          );
        }
      }

      // Now delete the timesheet
      const deletedTimesheet = await this.timesheetModel.findByIdAndDelete(
        timesheetId
      );

      if (!deletedTimesheet) {
        throw new NotFoundException('Failed to delete timesheet');
      }

      return deletedTimesheet;
    } catch (error: any) {
      this.logger.error('Error deleting timesheet:', error);
      throw error;
    }
  }

  /**
   * Invalidate a timesheet
   */
  async invalidateTimesheet(timesheetId: string): Promise<any> {
    try {
      // 1. Find and update the timesheet
      const timesheet: any = await this.timesheetModel
        .findByIdAndUpdate(
          timesheetId,
          {
            status: 'invalidated',
            invoiceStatus: 'invalidated',
            invoiceId: null,
          },
          { new: true }
        )
        .exec();

      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }

      // 2. Find the invoice that contains this timesheet
      //   const invoice = await this.invoiceModel
      //     .findOne({
      //       timesheetIds: timesheetId,
      //     })
      //     .exec();

      // 3. If invoice exists, update it
      //   if (invoice) {
      //     // Remove timesheet from invoice
      //     invoice.timesheetIds = invoice.timesheetIds.filter(
      //       (id) => id !== timesheetId
      //     );

      //     // Recalculate invoice amount and shift summary
      //     const { totalAmount, shiftSummary } =
      //       await this.recalculateInvoiceAmount(invoice._id.toString());

      //     // Update invoice data
      //     invoice.totalAmount = totalAmount;
      //     invoice.shiftSummary = shiftSummary;

      //     // If no timesheets left, invalidate the invoice
      //     if (invoice.timesheetIds.length === 0) {
      //       invoice.status = 'invalidated';
      //     }

      //     // Save the updated invoice
      //     await invoice.save();
      //   }

      return timesheet;
    } catch (error: any) {
      this.logger.error('Error invalidating timesheet:', error);
      throw error;
    }
  }

  /**
   * Scan a barcode/QR code for timesheet
   */
  async scanBarcode(
    signedBy: string,
    userId: string,
    qrCodeToken: string
  ): Promise<any> {
    this.logger.log(
      `Scanning barcode - SignedBy: ${signedBy}, UserId: ${userId}, Token: ${qrCodeToken}`
    );

    const REDIS_KEY_PREFIX = 'timesheet:qr:';

    try {
      const timesheet: any = await this.timesheetModel
        .findOne({
          tokenForQrCode: qrCodeToken,
          carer: userId,
        })
        .exec();

      if (!timesheet) {
        this.logger.error(
          `Timesheet not found - Token: ${qrCodeToken}, UserId: ${userId}`
        );

        // Store error in Redis
        await this.redisClient.set(
          `${REDIS_KEY_PREFIX}${qrCodeToken}`,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'error',
            carerId: userId,
            orgId: '',
            timesheetId: '',
            error: 'Timesheet not found',
          }),
          'EX',
          1200 // 20 minutes
        );

        throw new NotFoundException('Timesheet not found');
      }

      this.logger.log(`Timesheet found - TimesheetId: ${timesheet._id}`);

      const shift = await this.shiftService.findOne(
        timesheet.shiftId.toString()
      );
      this.logger.log(`Shift retrieved - ShiftId: ${shift._id}`);

      // Update shift assignment to 'completed'
      await this.shiftAssignmentModel.findOneAndUpdate(
        {
          shift: timesheet.shiftId,
          user: userId,
        },
        {
          status: 'completed',
        }
      );

      // Check shift completion status
      try {
        // Check if all shift assignments are completed or signed
        const allAssignments = await this.shiftAssignmentModel.find({
          shift: timesheet.shiftId,
        });

        const allCompleted = allAssignments.every(
          (assignment) =>
            assignment.status === 'completed' || assignment.status === 'signed'
        );

        // If all assignments are completed/signed, check if all timesheets are approved
        if (allCompleted) {
          const allTimesheets = await this.timesheetModel.find({
            shift_: timesheet.shiftId,
          });

          const allTimesheetsApproved = allTimesheets.every(
            (ts) => ts.status === 'approved'
          );

          // If all timesheets are approved, mark the shift as completed and done
          if (allTimesheetsApproved) {
            await this.shiftModel.findByIdAndUpdate(timesheet.shiftId, {
              isCompleted: true,
              isDone: true,
            });
            this.logger.log(
              `Marked shift ${timesheet.shiftId} as completed and done`
            );
          }
        }
      } catch (shiftUpdateError) {
        // Log the error but don't fail the whole operation
        this.logger.error('Error updating shift status:', shiftUpdateError);
      }

      const shiftPattern = await this.shiftPatternService.findOne(
        shift.shiftPattern
      );
      this.logger.log(
        `ShiftPattern retrieved - PatternId: ${shiftPattern._id}`
      );

      const shiftTiming = shiftPattern?.timings?.find(
        (timing: any) =>
          timing.careHomeId.toString() === timesheet.home.toString()
      );

      this.logger.log(
        `Shift timing found - StartTime: ${shiftTiming?.startTime}, EndTime: ${shiftTiming?.endTime}`
      );

      const shiftDate = moment(shift.date).format('YYYY-MM-DD');
      const shiftStartTime = moment(shiftTiming?.startTime).format('HH:mm');
      const shiftEndTime = moment(shiftTiming?.endTime).format('HH:mm');
      const currentTime = moment().format('YYYY-MM-DD HH:mm');

      // Validation warnings to be shown on the review screen
      const validationWarnings = [];

      if (shiftDate !== moment().format('YYYY-MM-DD')) {
        validationWarnings.push('This timesheet is not for today');
      }

      const shiftEndPlus30 = moment(shiftEndTime, 'HH:mm')
        .add(30, 'minute')
        .format('HH:mm');

      if (currentTime > shiftEndPlus30) {
        validationWarnings.push('Shift has expired');
      }

      if (currentTime < shiftEndTime) {
        validationWarnings.push('Shift has not ended yet');
      }

      // Fetch employee details
      const employee: any = await this.userService.findOne(userId);

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Get employee rating - calculate from existing timesheets
      const aggregationResult = await this.timesheetModel
        .aggregate([
          {
            $match: {
              carer: new Types.ObjectId(userId),
              rating: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
            },
          },
        ])
        .exec();

      const employeeRating =
        aggregationResult.length > 0
          ? parseFloat(aggregationResult[0].averageRating.toFixed(1))
          : 0;

      // Get recent reviews
      const recentReviews = await this.timesheetModel
        .find({
          carer: userId,
          rating: { $exists: true, $ne: null },
          review: { $exists: true, $ne: null },
        })
        .sort({ updatedAt: -1 })
        .limit(3)
        .populate('approvedBy', 'firstName lastName')
        .select('rating review updatedAt approvedBy')
        .exec();

      // Format reviews
      const formattedReviews = recentReviews.map((review: any) => ({
        id: review._id.toString(),
        rating: review.rating || 0,
        comment: review.review || '',
        date: review.updatedAt
          ? new Date(review.updatedAt).toLocaleDateString()
          : '',
        reviewerName: review.approvedBy
          ? `${review.approvedBy?.firstName} ${review.approvedBy?.lastName}`
          : 'Anonymous',
      }));

      // Return employee details and timesheet info for review
      return {
        timesheetId: timesheet._id,
        shiftId: timesheet.shiftId,
        employeeDetails: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          profilePicture: employee.avatarUrl || null,
          position: employee.role,
          rating: employeeRating,
          reviews: formattedReviews,
        },
        shift: {
          date: shiftDate,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          facilityId: timesheet.home,
        },
        validationWarnings,
        tokenForQrCode: qrCodeToken, // Keep this to use for approval
      };
    } catch (error: any) {
      this.logger.error('Error scanning barcode:', error);

      if (error.message !== 'Timesheet not found') {
        // Store error in Redis
        await this.redisClient.set(
          `${REDIS_KEY_PREFIX}${qrCodeToken}`,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'error',
            carerId: userId,
            orgId: '',
            timesheetId: '',
            error: error.message || 'Unknown error occurred',
          }),
          'EX',
          1200
        );
      }

      throw error;
    }
  }

  /**
   * Check timesheet status by QR code
   */
  async checkTimesheetStatus(carerId: string, qrcode: string): Promise<any> {
    try {
      const timesheet: any = await this.timesheetModel
        .findOne({
          carer: carerId,
          tokenForQrCode: qrcode,
        })
        .exec();

      return timesheet ? timesheet : null;
    } catch (error: any) {
      this.logger.error('Error checking timesheet status:', error);
      throw error;
    }
  }

  /**
   * Set up SSE connection for real-time timesheet updates
   */
  async addSSEConnection(qrCode: string, req: any, res: any): Promise<void> {
    const REDIS_KEY_PREFIX = 'timesheet:qr:';

    // Set headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*', // Add CORS if needed
    });

    // Send initial connection message
    const sendMessage = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Force flush the response
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    // Send initial status
    sendMessage({ status: 'connected' });

    const checkStatus = async () => {
      try {
        const result = await this.redisClient.get(
          `${REDIS_KEY_PREFIX}${qrCode}`
        );

        if (result) {
          const data = JSON.parse(result);
          const timeDiff = Date.now() - new Date(data.timestamp).getTime();

          if (timeDiff <= 20 * 60 * 1000) {
            // 20 minutes
            if (data.status === 'success') {
              sendMessage({ status: 'success' });
              await this.redisClient.del(`${REDIS_KEY_PREFIX}${qrCode}`);
              clearInterval(interval);
              this.redisClient.disconnect();
              res.end();
              return;
            } else if (data.status === 'error') {
              sendMessage({ status: 'error', error: data.error });
              await this.redisClient.del(`${REDIS_KEY_PREFIX}${qrCode}`);
              clearInterval(interval);
              this.redisClient.disconnect();
              res.end();
              return;
            }
          } else {
            sendMessage({ status: 'expired' });
            await this.redisClient.del(`${REDIS_KEY_PREFIX}${qrCode}`);
            clearInterval(interval);
            this.redisClient.disconnect();
            res.end();
            return;
          }
        } else {
          sendMessage({ status: 'not_found' });
        }
      } catch (error: any) {
        this.logger.error('Redis check error:', error);
        sendMessage({ status: 'error', error: 'Internal server error' });
        clearInterval(interval);
        this.redisClient.disconnect();
        res.end();
        return;
      }
    };

    const interval = setInterval(checkStatus, 500);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      this.redisClient.disconnect();
    });

    // Set a timeout to end the connection after 20 minutes
    setTimeout(() => {
      sendMessage({ status: 'timeout' });
      clearInterval(interval);
      this.redisClient.disconnect();
      res.end();
    }, 20 * 60 * 1000);
  }

  /**
   * Helper method to recalculate invoice amount
   */
  private async recalculateInvoiceAmount(
    invoiceId: string,
    session?: mongoose.ClientSession
  ): Promise<{ totalAmount: number; shiftSummary: Map<string, any> }> {
    try {
      // Get the invoice
      //   const invoice = await this.invoiceModel
      //     .findById(invoiceId, null, {
      //       session,
      //     })
      //     .exec();

      //   if (!invoice) {
      //     throw new NotFoundException('Invoice not found');
      //   }

      // Get all remaining timesheets
      //   const timesheets = await this.timesheetModel.aggregate([
      //     {
      //       $match: {
      //         _id: {
      //           $in: invoice.timesheetIds.map((id) => new Types.ObjectId(id)),
      //         },
      //       },
      //     },
      //     // Join with shifts collection
      //     {
      //       $lookup: {
      //         from: 'shifts',
      //         localField: 'shift_',
      //         foreignField: '_id',
      //         as: 'shift',
      //       },
      //     },
      //     { $unwind: '$shift' },

      //     // Join with shiftTypes collection using shift.shiftPattern
      //     {
      //       $lookup: {
      //         from: 'shiftpatterns',
      //         localField: 'shift.shiftPattern',
      //         foreignField: '_id',
      //         as: 'shiftPatternData',
      //       },
      //     },
      //     {
      //       $unwind: {
      //         path: '$shiftPatternData',
      //         preserveNullAndEmptyArrays: true,
      //       },
      //     },

      //     // Join with users collection for carer details
      //     {
      //       $lookup: {
      //         from: 'users',
      //         localField: 'carer',
      //         foreignField: '_id',
      //         as: 'carerDetails',
      //       },
      //     },
      //     { $unwind: '$carerDetails' },

      //     // Join with organizations collection for home details
      //     {
      //       $lookup: {
      //         from: 'organizations',
      //         localField: 'home',
      //         foreignField: '_id',
      //         as: 'homeDetails',
      //       },
      //     },
      //     { $unwind: '$homeDetails' },

      //     // Project only needed fields
      //     {
      //       $project: {
      //         _id: 1,
      //         shift: {
      //           _id: 1,
      //           date: 1,
      //           isEmergency: 1,
      //         },
      //         carerDetails: {
      //           firstName: 1,
      //           lastName: 1,
      //           userType: 1,
      //         },
      //         homeDetails: {
      //           _id: 1,
      //           name: 1,
      //         },
      //         shiftPatternData: 1,
      //       },
      //     },
      //   ]);

      //   // Calculate new totals and shift summary
      //   let totalAmount = 0;
      //   const shiftSummary = new Map();

      //   // Process timesheets for invoice calculation
      //   for (const timesheet of timesheets) {
      //     try {
      //       if (!timesheet.shiftPatternData) {
      //         continue;
      //       }

      //       // First try to find rate by care home
      //       let rate = timesheet.shiftPatternData.rates?.find(
      //         (r: any) => r.careHomeId === timesheet.homeDetails._id.toString()
      //       );

      //       // If no home-specific rate found, try user type rate
      //       if (!rate && timesheet.shiftPatternData.userTypeRates?.length) {
      //         const userTypeRate = timesheet.shiftPatternData.userTypeRates.find(
      //           (r: any) => r.userType === timesheet.carerDetails.userType
      //         );

      //         if (userTypeRate) {
      //           rate = userTypeRate;
      //         }
      //       }

      //       if (!rate) {
      //         continue;
      //       }

      //       // Find timing configuration
      //       const timing = timesheet.shiftPatternData.timings?.find(
      //         (t: any) => t.careHomeId === timesheet.homeDetails._id.toString()
      //       );

      //       if (!timing) {
      //         continue;
      //       }

      //       // Determine if weekend
      //       const isWeekend = moment(timesheet.shift.date).day() > 5;

      //       // Calculate hourly rate
      //       const hourlyPay = timesheet.shift.isEmergency
      //         ? isWeekend
      //           ? rate.emergencyWeekendRate
      //           : rate.emergencyWeekdayRate
      //         : isWeekend
      //         ? rate.weekendRate
      //         : rate.weekdayRate;

      //       // Calculate duration
      //       const startTime = moment(timing.startTime, 'HH:mm');
      //       const endTime = moment(timing.endTime, 'HH:mm');

      //       let shiftDuration;
      //       if (endTime.isBefore(startTime)) {
      //         // Overnight shift
      //         shiftDuration = endTime.add(1, 'day').diff(startTime);
      //       } else {
      //         shiftDuration = endTime.diff(startTime);
      //       }

      //       const hours = shiftDuration / (1000 * 60 * 60);
      //       const amount = hourlyPay * hours;
      //       totalAmount += amount;

      //       // Update shift summary
      //       const shiftTypeId = timesheet.shiftPatternData._id.toString();
      //       if (!shiftSummary.has(shiftTypeId)) {
      //         shiftSummary.set(shiftTypeId, {
      //           count: 0,
      //           weekdayHours: 0,
      //           weekendHours: 0,
      //           emergencyHours: 0,
      //           weekdayRate: rate.weekdayRate,
      //           weekendRate: rate.weekendRate,
      //           emergencyRate: timesheet.shift.isEmergency
      //             ? isWeekend
      //               ? rate.emergencyWeekendRate
      //               : rate.emergencyWeekdayRate
      //             : 0,
      //           totalAmount: 0,
      //         });
      //       }

      //       const summary = shiftSummary.get(shiftTypeId);
      //       summary.count += 1;

      //       if (timesheet.shift.isEmergency) {
      //         summary.emergencyHours += hours;
      //       } else if (isWeekend) {
      //         summary.weekendHours += hours;
      //       } else {
      //         summary.weekdayHours += hours;
      //       }

      //       summary.totalAmount += amount;
      //       shiftSummary.set(shiftTypeId, summary);
      //     } catch (error: any) {
      //       this.logger.error(
      //         'Error processing timesheet for invoice recalculation:',
      //         {
      //           error,
      //           timesheetId: timesheet._id,
      //         }
      //       );
      //     }
      //   }

      return {} as any;
    } catch (error: any) {
      this.logger.error('Error recalculating invoice amount:', error);
      throw error;
    }
  }
}
