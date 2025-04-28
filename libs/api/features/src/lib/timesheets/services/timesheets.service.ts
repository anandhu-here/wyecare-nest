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
    if (!shift.shiftPattern) {
      this.logger.error(`No shift pattern linked to shift ID: ${shiftId}`);
      throw new BadRequestException('Shift pattern not found for this shift');
    }
    const currentDateTime = new Date();
    const currentDateTimeInTZ = new Date(
      currentDateTime.toLocaleString('en-US', { timeZone: timezone })
    );
    const shiftDate = shift.date;
    const formattedShiftDate = moment(shiftDate).format('YYYY-MM-DD');
    const formattedCurrentDate =
      moment(currentDateTimeInTZ).format('YYYY-MM-DD');
    const shiftPattern = shift.shiftPattern as any;
    if (!shiftPattern.timings || !shiftPattern.timings.length) {
      throw new BadRequestException('No timings defined in the shift pattern');
    }
    const homeId = home || shift.homeId.toString();
    const timing = shiftPattern.timings.find(
      (t: any) => t.careHomeId === homeId
    );
    if (!timing) {
      throw new BadRequestException(
        'No timing found for this care home in the shift pattern'
      );
    }
    const [startHour, startMinute] = timing.startTime.split(':').map(Number);
    const [endHour, endMinute] = timing.endTime.split(':').map(Number);
    const shiftStartDate = new Date(formattedShiftDate);
    shiftStartDate.setHours(startHour, startMinute, 0, 0);
    shiftStartDate.setTime(
      new Date(
        shiftStartDate.toLocaleString('en-US', { timeZone: timezone })
      ).getTime()
    );
    const shiftEndDate = new Date(formattedShiftDate);
    shiftEndDate.setHours(endHour, endMinute, 0, 0);
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
    const toleranceEndDate = new Date(shiftEndDate);
    toleranceEndDate.setHours(toleranceEndDate.getHours() + 3);
    const isWithinShiftTime =
      currentDateTimeInTZ >= shiftStartDate &&
      currentDateTimeInTZ <= toleranceEndDate;
    if (!isWithinShiftTime) {
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
    const shiftAssignment = await this.shiftAssignmentModel
      .findOne({
        shift: new Types.ObjectId(shiftId),
        user: new Types.ObjectId(userId),
      })
      .lean();
    if (!shiftAssignment) {
      throw new NotFoundException('Shift assignment not found');
    }
    const timesheet: any = await this.timesheetModel.findOneAndUpdate(
      {
        shiftId: new Types.ObjectId(shiftId),
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
    const timesheet: any = await this.timesheetModel.findById(timesheetId);
    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }
    const fileName = `signatures/${timesheet.home}/${
      timesheet.carer
    }/${timesheetId}_${Date.now()}.png`;
    const bucket = admin.storage().bucket();
    const signatureBuffer = Buffer.from(
      signatureData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
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
    const shiftId = updatedTimesheet.shiftId;
    const allAssignments = await this.shiftAssignmentModel.find({
      shift: shiftId,
    });
    const allCompleted = allAssignments.every(
      (assignment) =>
        assignment.status === 'completed' || assignment.status === 'signed'
    );
    if (allCompleted) {
      const allTimesheets = await this.timesheetModel.find({ shift_: shiftId });
      const allTimesheetsApproved = allTimesheets.every(
        (ts) => ts.status === 'approved'
      );
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
      console.log(
        `Fetching timesheets for user ${userId} with account type ${accountType}`,
        `orgType: ${orgType}, orgId: ${orgId}, organizationIdQuery: ${organizationIdQuery}`,
        `pagination: ${JSON.stringify(pagination)}`,
        `status: ${status}, startDate: ${startDate}, endDate: ${endDate}`,
        `invoiceStatus: ${invoiceStatus}, isEmergency: ${isEmergency}`,
        `carerRole: ${carerRole}, shiftPatternId: ${shiftPatternId}`,
        `careUserId: ${careUserId}`
      );

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;
      let matchStage: Record<string, any> = {};
      if (invoiceStatus) {
        matchStage['invoiceStatus'] = invoiceStatus;
      }
      if (status && status !== 'all') {
        matchStage['status'] = status;
      }
      if (careUserId) {
        matchStage['carer'] = new Types.ObjectId(careUserId);
      }
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
        case 'owner':
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
        default:
          matchStage['carer'] = new Types.ObjectId(userId);
      }
      const pipeline: any[] = [];
      pipeline.push({ $match: matchStage });

      // Fixed lookup stage: Using 'shift' instead of 'shift_'
      pipeline.push({
        $lookup: {
          from: 'shifts',
          localField: 'shiftId',
          foreignField: '_id',
          as: 'shiftData',
        },
      });

      // Fixed unwind stage: Using 'shiftData' instead of 'shift'
      pipeline.push({
        $unwind: {
          path: '$shiftData',
          preserveNullAndEmptyArrays: false,
        },
      });

      // Updated all references to 'shift.' to 'shiftData.'
      if (isEmergency !== null && isEmergency !== undefined) {
        pipeline.push({
          $match: {
            'shiftData.isEmergency': isEmergency,
          },
        });
      }

      if (shiftPatternId) {
        pipeline.push({
          $match: {
            'shiftData.shiftPattern': new Types.ObjectId(shiftPatternId),
          },
        });
      }

      if (startDate && endDate) {
        pipeline.push({
          $match: {
            'shiftData.date': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        });
      }

      // Updated lookup to use shiftData.shiftPattern
      pipeline.push({
        $lookup: {
          from: 'shiftpatterns',
          localField: 'shiftData.shiftPattern',
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

      if (carerRole && carerRole !== 'all') {
        pipeline.push({
          $match: {
            'carerDetails.role': carerRole,
          },
        });
      }

      pipeline.push({
        $lookup: {
          from: 'organizations',
          localField: 'home',
          foreignField: '_id',
          as: 'regularHome',
        },
      });

      // Updated to use shiftData.temporaryHomeId
      pipeline.push({
        $lookup: {
          from: 'temporaryhomes',
          localField: 'shiftData.temporaryHomeId',
          foreignField: '_id',
          as: 'tempHome',
        },
      });

      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'total' });

      // Updated to use shiftData.date for sorting
      pipeline.push({ $sort: { 'shiftData.date': -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Add a project stage to restructure the document to maintain backward compatibility
      pipeline.push({
        $project: {
          _id: 1,
          agency: 1,
          home: 1,
          carer: 1,
          status: 1,
          invoiceStatus: 1,
          carerDetails: 1,
          regularHome: 1,
          tempHome: 1,
          shiftPatternData: 1,
          // Map shiftData back to shift for compatibility with frontend
          shift: '$shiftData',
          // Include other fields as needed
          createdAt: 1,
          updatedAt: 1,
          // Keep original data too
          shiftData: 1,
        },
      });

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

  getUserTimesheetByShiftId(userId: string, shiftId: string): Promise<any> {
    console.log(`Fetching timesheet for user ${userId} and shift ${shiftId}`);
    return this.timesheetModel.findOne({
      carer: new Types.ObjectId(userId),
      shiftId: new Types.ObjectId(shiftId),
    });
  }

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
      try {
        const allAssignments = await this.shiftAssignmentModel.find({
          shift: timesheet.shiftId,
        });
        const allCompleted = allAssignments.every(
          (assignment) =>
            assignment.status === 'completed' || assignment.status === 'signed'
        );
        if (allCompleted) {
          const allTimesheets = await this.timesheetModel.find({
            shift_: timesheet.shiftId,
          });
          const allTimesheetsApproved = allTimesheets.every(
            (ts) => ts.status === 'approved'
          );
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
        this.logger.error('Error updating shift status:', shiftUpdateError);
      }
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
        1200
      );
      return timesheet;
    } catch (error: any) {
      this.logger.error('Error approving timesheet:', error);
      throw error;
    }
  }
  async rejectTimesheet(timesheetId: string, reason: string): Promise<any> {
    try {
      const timesheet: any = await this.timesheetModel.findOneAndDelete({
        _id: new Types.ObjectId(timesheetId),
      });
      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }
      this.logger.log(`Timesheet ${timesheetId} rejected. Reason: ${reason}`);
      return timesheet;
    } catch (error: any) {
      this.logger.error('Error rejecting timesheet:', error);
      throw error;
    }
  }
  async deleteTimesheet(timesheetId: string): Promise<any> {
    try {
      const timesheet: any = await this.timesheetModel.findById(timesheetId);
      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }
      if (
        timesheet.invoiceId ||
        ['paid', 'invoiced'].includes(timesheet.invoiceStatus)
      ) {
        throw new BadRequestException(
          'Timesheet cannot be deleted due to invoice status'
        );
      }
      if (timesheet.signature && timesheet.signature.storageRef) {
        try {
          const bucket = admin.storage().bucket();
          const file = bucket.file(timesheet.signature.storageRef);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            this.logger.log(
              `Deleted signature file: ${timesheet.signature.storageRef}`
            );
          }
        } catch (storageError: any) {
          this.logger.error(
            `Failed to delete signature file: ${storageError.message}`
          );
        }
      }
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
  async invalidateTimesheet(timesheetId: string): Promise<any> {
    try {
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
      return timesheet;
    } catch (error: any) {
      this.logger.error('Error invalidating timesheet:', error);
      throw error;
    }
  }
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
          1200
        );
        throw new NotFoundException('Timesheet not found');
      }
      this.logger.log(`Timesheet found - TimesheetId: ${timesheet._id}`);
      const shift = await this.shiftService.findOne(
        timesheet.shiftId.toString()
      );
      this.logger.log(`Shift retrieved - ShiftId: ${shift._id}`);
      await this.shiftAssignmentModel.findOneAndUpdate(
        {
          shift: timesheet.shiftId,
          user: userId,
        },
        {
          status: 'completed',
        }
      );
      try {
        const allAssignments = await this.shiftAssignmentModel.find({
          shift: timesheet.shiftId,
        });
        const allCompleted = allAssignments.every(
          (assignment) =>
            assignment.status === 'completed' || assignment.status === 'signed'
        );
        if (allCompleted) {
          const allTimesheets = await this.timesheetModel.find({
            shift_: timesheet.shiftId,
          });
          const allTimesheetsApproved = allTimesheets.every(
            (ts) => ts.status === 'approved'
          );
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
      const employee: any = await this.userService.findOne(userId);
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
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
        tokenForQrCode: qrCodeToken,
      };
    } catch (error: any) {
      this.logger.error('Error scanning barcode:', error);
      if (error.message !== 'Timesheet not found') {
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
  async addSSEConnection(qrCode: string, req: any, res: any): Promise<void> {
    const REDIS_KEY_PREFIX = 'timesheet:qr:';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const sendMessage = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };
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
    req.on('close', () => {
      clearInterval(interval);
      this.redisClient.disconnect();
    });
    setTimeout(() => {
      sendMessage({ status: 'timeout' });
      clearInterval(interval);
      this.redisClient.disconnect();
      res.end();
    }, 20 * 60 * 1000);
  }
  private async recalculateInvoiceAmount(
    invoiceId: string,
    session?: mongoose.ClientSession
  ): Promise<{ totalAmount: number; shiftSummary: Map<string, any> }> {
    try {
      return {} as any;
    } catch (error: any) {
      this.logger.error('Error recalculating invoice amount:', error);
      throw error;
    }
  }
}
