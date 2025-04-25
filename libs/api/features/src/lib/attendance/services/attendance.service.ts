import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DateTime } from 'luxon';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import {
  Attendance,
  AttendanceDocument,
  AttendanceStatus,
  ModificationType,
  ModifierType,
  Shift,
} from 'libs/api/core/src/lib/schemas';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

interface ClockInData {
  userId: string;
  workplaceId: string;
  timezone: string;
  metadata: {
    deviceId?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}

interface ClockOutData {
  userId: string;
  workplaceId: string;
  timezone: string;
  metadata: {
    deviceId?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}
interface QRPayload {
  workplaceId: string;
  type: 'IN' | 'OUT';
  timestamp: number;
  validUntil: number;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private redis: Redis;
  private readonly REDIS_KEY_PREFIX = 'attendance:qr:';
  private readonly QR_CODE_EXPIRY = 1200; // 20 minutes in seconds
  private readonly MINIMUM_DURATION = 2; // Minimum minutes between clock in and out
  private readonly DEFAULT_TIMEZONE = 'Europe/London';
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly QR_VALIDITY_DURATION = 30 * 60 * 1000;

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Shift.name)
    private shiftModel: Model<any>,
    private configService: ConfigService
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  /**
   * Convert a date to a Luxon DateTime with timezone support
   */
  private getDateTime(
    date: Date | string | undefined,
    timezone: string = this.DEFAULT_TIMEZONE
  ): DateTime {
    return date
      ? DateTime.fromJSDate(new Date(date)).setZone(timezone)
      : DateTime.now().setZone(timezone);
  }

  /**
   * Get a user's current attendance record
   */
  async getCurrentAttendance(
    userId: string,
    date: Date = new Date(),
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<AttendanceDocument | null> {
    try {
      this.logger.log(`Getting current attendance for user ${userId}`);

      // First, try to find ANY active session for this user regardless of date
      let attendance = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          status: AttendanceStatus.SIGNED_IN,
          signOutTime: null,
        })
        .populate([
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
        ])
        .sort({ createdAt: -1 });

      // If we found an active session, return it immediately
      if (attendance) {
        this.logger.log(
          `Found active attendance record ${attendance._id} for user ${userId}`
        );
        return attendance;
      }

      // If no active session, fall back to today's attendance records
      const dateTime = this.getDateTime(date, timezone);
      const startOfDay = dateTime.startOf('day').toJSDate();
      const endOfDay = dateTime.endOf('day').toJSDate();

      attendance = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
        .populate([
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
        ])
        .sort({ createdAt: -1 });

      this.logger.log(
        `Found attendance record for today: ${attendance?._id} with status ${attendance?.status}`
      );

      return attendance;
    } catch (error) {
      this.logger.error(
        `Error getting current attendance: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to get current attendance: ${error.message}`);
    }
  }

  /**
   * Get a user's shift for a specific date
   */
  async getUserShiftForDate(
    userId: string,
    date: Date,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<any> {
    try {
      this.logger.log(`Getting user shift for user ${userId} on date ${date}`);

      const dateTime = this.getDateTime(date, timezone);
      const startOfDay = dateTime.startOf('day').toJSDate();
      const endOfDay = dateTime.endOf('day').toJSDate();

      const existingAttendance = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
        .populate([
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
          {
            path: 'workplace',
          },
        ]);

      if (existingAttendance) {
        this.logger.log(
          `Found shift from existing attendance: ${existingAttendance.shift?._id}`
        );
        return existingAttendance.shift;
      }

      const shift = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
          status: AttendanceStatus.PENDING,
        })
        .populate('shift');

      return shift;
    } catch (error) {
      this.logger.error(
        `Error getting user shift: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to get user shift: ${error.message}`);
    }
  }

  /**
   * Process clock-in for a user
   */
  async processClockIn(data: ClockInData): Promise<AttendanceDocument> {
    const lockKey = `attendance:clockin:${data.userId}`;

    this.logger.debug(
      `Starting processClockIn for user: ${data.userId}, workplace: ${data.workplaceId}`
    );
    this.logger.debug(`Using timezone: ${data.timezone}`);

    try {
      // Acquire lock
      this.logger.debug(
        `Attempting to acquire Redis lock with key: ${lockKey}`
      );
      const locked = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');
      if (!locked) {
        this.logger.error(
          `Failed to acquire lock for user: ${data.userId} - operation in progress`
        );
        throw new BadRequestException(
          'Operation in progress. Please try again.'
        );
      }
      this.logger.debug(`Lock acquired successfully`);

      // Get current date/time in user's timezone
      const now = this.getDateTime(undefined, data.timezone);
      const today = now.startOf('day');
      const yesterday = today.minus({ days: 1 });

      this.logger.debug(`Current time in ${data.timezone}: ${now.toISO()}`);
      this.logger.debug(
        `Today: ${today.toFormat(
          'yyyy-MM-dd'
        )}, Yesterday: ${yesterday.toFormat('yyyy-MM-dd')}`
      );

      // Check for existing active session
      this.logger.debug(
        `Checking for existing active session for user: ${data.userId}`
      );
      const existingSession = await this.attendanceModel.findOne({
        user: new Types.ObjectId(data.userId),
        status: AttendanceStatus.SIGNED_IN,
        signOutTime: null,
      });

      if (existingSession) {
        this.logger.error(
          `User already has an active session - Attendance ID: ${existingSession._id}`
        );
        throw new BadRequestException('Already have an active session');
      }
      this.logger.debug(`No active session found, proceeding with clock-in`);

      // Find active shift
      this.logger.debug(`Finding active shift for user: ${data.userId}`);
      const activeShift: any = await this.findActiveShift(
        data.userId,
        data.workplaceId,
        today,
        yesterday,
        now
      );

      if (!activeShift) {
        this.logger.error(
          `No active shift found for user: ${
            data.userId
          } at time: ${now.toISO()}`
        );
        throw new BadRequestException('No active shift found for current time');
      }

      this.logger.debug(
        `Found active shift: ${activeShift._id}, pattern: ${activeShift.shiftPattern._id}`
      );

      // Prepare clock-in data
      const locationData = data.metadata.location
        ? {
            coordinates: [
              data.metadata.location.latitude,
              data.metadata.location.longitude,
            ],
            accuracy: data.metadata.location?.accuracy,
            timestamp: data.metadata.timestamp,
            deviceId: data.metadata.deviceId,
          }
        : undefined;

      this.logger.debug(`Preparing to create/update attendance record`);
      this.logger.debug(`Location data available: ${!!locationData}`);

      // Attempt to create attendance record with optimistic locking
      this.logger.debug(`Finding and updating attendance record with upsert`);
      const attendance = await this.attendanceModel.findOneAndUpdate(
        {
          user: new Types.ObjectId(data.userId),
          shift: activeShift._id,
          status: AttendanceStatus.PENDING,
          signInTime: null,
        },
        {
          $setOnInsert: {
            workplace: new Types.ObjectId(data.workplaceId),
            shiftPattern: activeShift.shiftPattern._id,
            organization: activeShift.agentId,
            date: today.toJSDate(),
            qrCode:
              Math.random().toString(36).substring(7) + Date.now().toString(36),
            expectedStartTime: activeShift.expectedStartTime,
            expectedEndTime: activeShift.expectedEndTime,
            expectedDuration: activeShift.expectedDuration || 0,
            qrCodeExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes validity
          },
          $set: {
            signInTime: now.toJSDate(),
            status: AttendanceStatus.SIGNED_IN,
            clockInLocation: locationData,
            lateBy: DateTime.fromJSDate(now as any).diff(
              DateTime.fromJSDate(
                activeShift.expectedStartTime || now.toJSDate()
              ),
              'minutes'
            ).minutes,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      if (!attendance) {
        this.logger.error(`Failed to create or update attendance record`);
        throw new BadRequestException(
          'Failed to create or update attendance record'
        );
      }

      this.logger.log(
        `Successfully created/updated attendance record: ${attendance._id}`
      );
      this.logger.debug(`Clock-in time: ${attendance.signInTime}`);

      return attendance;
    } catch (error) {
      this.logger.error(
        `Error processing clock in: ${error.message}`,
        error.stack
      );
      throw error;
    } finally {
      // Release lock
      this.logger.debug(`Releasing Redis lock: ${lockKey}`);
      await this.redis.del(lockKey);
    }
  }

  /**
   * Process clock-out for a user
   */
  async processClockOut(data: ClockOutData): Promise<AttendanceDocument> {
    const lockKey = `attendance:clockout:${data.userId}`;

    try {
      // Acquire lock
      const locked = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');
      if (!locked) {
        throw new BadRequestException(
          'Operation in progress. Please try again.'
        );
      }

      this.logger.log('Processing clock out', data);

      const now = this.getDateTime(undefined, data.timezone);
      const currentTime = now.toFormat('HH:mm');

      // Find active attendance with validation
      const attendance: any = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(data.userId),
          workplace: new Types.ObjectId(data.workplaceId),
          status: AttendanceStatus.SIGNED_IN,
          signInTime: { $ne: null },
          signOutTime: null,
        })
        .populate({
          path: 'shift',
          populate: {
            path: 'shiftPattern',
          },
        });

      if (!attendance) {
        throw new NotFoundException('No active clock-in found');
      }

      // Validate shift timing
      const timing = attendance.shift.shiftPattern.timings.find(
        (t: any) => t.careHomeId.toString() === data.workplaceId
      );

      if (!timing) {
        throw new BadRequestException('Invalid shift timing configuration');
      }

      // Validate clock out time
      await this.validateClockOutTime(timing, attendance, now, currentTime);

      // Calculate duration
      const clockInTime = this.getDateTime(
        attendance.signInTime,
        data.timezone
      );
      const durationInMinutes = Math.round(
        now.diff(clockInTime, 'minutes').minutes
      );

      if (durationInMinutes < this.MINIMUM_DURATION) {
        throw new BadRequestException(
          `Minimum duration of ${this.MINIMUM_DURATION} minutes required between clock in and out`
        );
      }

      // Prepare location data
      const locationData = data.metadata.location
        ? {
            coordinates: [
              data.metadata.location.latitude,
              data.metadata.location.longitude,
            ],
            accuracy: data.metadata.location?.accuracy,
            timestamp: data.metadata.timestamp,
            deviceId: data.metadata.deviceId,
          }
        : undefined;

      // Update attendance with optimistic locking
      const updatedAttendance = await this.attendanceModel.findOneAndUpdate(
        {
          _id: attendance._id,
          status: AttendanceStatus.SIGNED_IN,
          signOutTime: null,
        },
        {
          $set: {
            signOutTime: now.toJSDate(),
            status: AttendanceStatus.SIGNED_OUT,
            duration: durationInMinutes,
            clockOutLocation: locationData,
            earlyDepartureBy: DateTime.fromJSDate(
              attendance.expectedEndTime
            ).diff(DateTime.fromJSDate(now.toJSDate()), 'minutes').minutes,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedAttendance) {
        throw new BadRequestException(
          'Attendance record was modified by another process'
        );
      }

      return updatedAttendance;
    } catch (error) {
      this.logger.error(
        `Error processing clock out: ${error.message}`,
        error.stack
      );
      throw error;
    } finally {
      // Release lock
      await this.redis.del(lockKey);
    }
  }

  /**
   * Find an active shift for a user
   */
  private async findActiveShift(
    userId: string,
    workplaceId: string,
    today: DateTime,
    yesterday: DateTime,
    now: DateTime
  ) {
    const todayStr = today.toFormat('yyyy-MM-dd');
    const yesterdayStr = yesterday.toFormat('yyyy-MM-dd');
    const currentTime = now.toFormat('HH:mm');

    // Log for debugging
    this.logger.debug(
      `Finding active shift for user ${userId} at workplace ${workplaceId}`
    );
    this.logger.debug(
      `Today: ${todayStr}, Yesterday: ${yesterdayStr}, Current time: ${currentTime}`
    );

    const shifts = await this.shiftModel
      .find({
        homeId: new Types.ObjectId(workplaceId),
        assignedUsers: new Types.ObjectId(userId),
        date: { $in: [todayStr, yesterdayStr] },
      })
      .populate({
        path: 'shiftPattern',
        select: 'name timings',
      });

    this.logger.debug(`Found ${shifts.length} potential shifts`);

    // Add a small tolerance for clock-in (e.g., 15 minutes before shift starts)
    const EARLY_CLOCK_IN_MINUTES = 30;

    return shifts.find((shift: any) => {
      const timing = shift.shiftPattern.timings.find(
        (t: any) => t.careHomeId === workplaceId
      );

      if (!timing) {
        this.logger.debug(
          `No timing found for care home ID: ${workplaceId} in shift: ${shift._id}`
        );
        return false;
      }

      const { startTime, endTime } = timing;
      const shiftDate = shift.date;

      // Parse start and end times
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      // Create DateTime objects for shift times
      const shiftStartTime = DateTime.fromObject(
        {
          year: today.year,
          month: today.month,
          day: shiftDate === todayStr ? today.day : yesterday.day,
          hour: startHour,
          minute: startMinute,
        },
        { zone: now.zone }
      );

      // Add early tolerance
      const clockInStartTime = shiftStartTime.minus({
        minutes: EARLY_CLOCK_IN_MINUTES,
      });

      // Create shift end time, handling overnight shifts
      let shiftEndTime = DateTime.fromObject(
        {
          year: today.year,
          month: today.month,
          day: shiftDate === todayStr ? today.day : yesterday.day,
          hour: endHour,
          minute: endMinute,
        },
        { zone: now.zone }
      );

      // If it's an overnight shift, add one day to end time
      if (
        endHour < startHour ||
        (endHour === startHour && endMinute < startMinute)
      ) {
        shiftEndTime = shiftEndTime.plus({ days: 1 });
      }

      // Check if current time is within the allowed clock-in window
      const isWithinClockInWindow =
        now >= clockInStartTime && now <= shiftEndTime;

      this.logger.debug(`Shift ${shift._id} date: ${shiftDate}`);
      this.logger.debug(`Shift times: ${startTime} - ${endTime}`);
      this.logger.debug(
        `Allowed clock-in from: ${clockInStartTime.toFormat('HH:mm')}`
      );
      this.logger.debug(`Current time: ${now.toFormat('HH:mm')}`);
      this.logger.debug(`Is within clock-in window: ${isWithinClockInWindow}`);

      return isWithinClockInWindow;
    });
  }

  /**
   * Validate clock-out time against shift
   */
  private async validateClockOutTime(
    timing: any,
    attendance: any,
    now: DateTime,
    currentTime: string
  ): Promise<void> {
    const { startTime, endTime } = timing;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    this.logger.debug(
      `Validating clock-out time. Current: ${now.toFormat(
        'HH:mm'
      )}, Shift: ${startTime}-${endTime}`
    );

    // Get shift date and create DateTime objects
    const shiftDate = attendance.shift.date;
    const shiftDateObj = DateTime.fromFormat(shiftDate, 'yyyy-MM-dd', {
      zone: now.zone,
    });
    const clockInTime = this.getDateTime(
      attendance.signInTime,
      attendance.timezone
    );

    // Create shift start and end DateTimes
    let shiftStartTime = shiftDateObj.set({
      hour: startHour,
      minute: startMinute,
    });

    let shiftEndTime = shiftDateObj.set({
      hour: endHour,
      minute: endMinute,
    });

    // Handle overnight shifts
    const isOvernightShift =
      endHour < startHour || (endHour === startHour && endMinute < startMinute);
    if (isOvernightShift) {
      shiftEndTime = shiftEndTime.plus({ days: 1 });
      this.logger.debug(
        `Overnight shift detected, adjusted end time to ${shiftEndTime.toFormat(
          'yyyy-MM-dd HH:mm'
        )}`
      );
    }

    // Add tolerance for late clock-out (3 hours after shift ends)
    const LATE_CLOCK_OUT_HOURS = 3;
    const toleranceEndTime = shiftEndTime.plus({ hours: LATE_CLOCK_OUT_HOURS });

    this.logger.debug(
      `Clock-in time: ${clockInTime.toFormat('yyyy-MM-dd HH:mm')}`
    );
    this.logger.debug(
      `Shift start time: ${shiftStartTime.toFormat('yyyy-MM-dd HH:mm')}`
    );
    this.logger.debug(
      `Shift end time: ${shiftEndTime.toFormat('yyyy-MM-dd HH:mm')}`
    );
    this.logger.debug(
      `Tolerance end time: ${toleranceEndTime.toFormat('yyyy-MM-dd HH:mm')}`
    );
    this.logger.debug(`Current time: ${now.toFormat('yyyy-MM-dd HH:mm')}`);

    // Basic validation - must be after clock-in
    if (now <= clockInTime) {
      throw new BadRequestException(
        'Clock-out time must be after clock-in time'
      );
    }

    // Check if clock-out is too late (beyond tolerance period)
    if (now > toleranceEndTime) {
      const hoursSinceEnd = now.diff(shiftEndTime, 'hours').hours.toFixed(1);
      throw new BadRequestException(
        `Clock-out time is ${hoursSinceEnd} hours after shift ended, which exceeds the allowed tolerance of ${LATE_CLOCK_OUT_HOURS} hours`
      );
    }

    // If clock-out is after shift end but within tolerance, log a warning
    if (now > shiftEndTime && now <= toleranceEndTime) {
      const minutesLate = now.diff(shiftEndTime, 'minutes').minutes.toFixed(0);
      this.logger.warn(
        `Clocking out ${minutesLate} minutes after shift end time`,
        {
          attendanceId: attendance._id,
          currentTime: now.toFormat('HH:mm'),
          endTime,
        }
      );
    }

    this.logger.debug(`Clock-out time validation passed`);
  }

  /**
   * Get attendance records for a workplace on a specific date
   */
  async getWorkplaceAttendance(
    workplaceId: string,
    date: Date,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<any> {
    try {
      const dateTime = this.getDateTime(date, timezone);
      const startOfDay = dateTime.startOf('day').toJSDate();
      const endOfDay = dateTime.endOf('day').toJSDate();

      const attendanceRecords = await this.attendanceModel
        .find({
          workplace: new Types.ObjectId(workplaceId),
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
        .populate([
          {
            path: 'user',
            select: 'firstName lastName email phone',
          },
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
        ])
        .sort({ createdAt: -1 });

      const summary = {
        total: attendanceRecords.length,
        pending: attendanceRecords.filter(
          (a) => a.status === AttendanceStatus.PENDING
        ).length,
        signedIn: attendanceRecords.filter(
          (a) => a.status === AttendanceStatus.SIGNED_IN
        ).length,
        signedOut: attendanceRecords.filter(
          (a) => a.status === AttendanceStatus.SIGNED_OUT
        ).length,
        records: attendanceRecords,
      };

      return summary;
    } catch (error) {
      this.logger.error(
        `Error getting workplace attendance: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Process a QR code scan
   */
  async scanQRCode(
    userId: string,
    qrCode: string,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<AttendanceDocument> {
    this.logger.log('Processing QR code scan', { userId, qrCode, timezone });

    try {
      const attendance = await this.attendanceModel
        .findOne({
          qrCode,
          user: new Types.ObjectId(userId),
        })
        .populate({
          path: 'shift',
          populate: {
            path: 'shiftPattern',
          },
        });

      if (!attendance) {
        await this.storeRedisStatus(qrCode, {
          status: 'error',
          error: 'Invalid QR code or user',
          userId,
          timestamp: new Date().toISOString(),
        });
        throw new NotFoundException('Invalid QR code or user');
      }

      const shift: any = attendance.shift;
      const shiftPattern = shift.shiftPattern;
      const shiftTiming = shiftPattern.timings.find(
        (timing: any) =>
          timing.careHomeId.toString() === attendance.workplace.toString()
      );

      if (!shiftTiming) {
        throw new BadRequestException('Invalid shift timing configuration');
      }

      const now = this.getDateTime(undefined, timezone);
      const shiftDate = this.getDateTime(shift.date, timezone);
      const currentDate = now.toFormat('yyyy-MM-dd');
      const currentTime = now.toFormat('HH:mm');

      const shiftEndTime = DateTime.fromFormat(shiftTiming.endTime, 'HH:mm', {
        zone: timezone,
      });
      const shiftEndPlus30 = shiftEndTime
        .plus({ minutes: 30 })
        .toFormat('HH:mm');
      const shiftEndTimeMinus2 = shiftEndTime
        .minus({ minutes: 2 })
        .toFormat('HH:mm');

      if (shiftDate.toFormat('yyyy-MM-dd') !== currentDate) {
        await this.storeRedisStatus(qrCode, {
          status: 'error',
          error: 'QR code is not valid for today',
          userId,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException('QR code is not valid for today');
      }

      if (currentTime > shiftEndPlus30) {
        await this.storeRedisStatus(qrCode, {
          status: 'error',
          error: 'Shift has expired',
          userId,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException('Shift has expired');
      }

      try {
        if (attendance.status === AttendanceStatus.PENDING) {
          attendance.signInTime = now.toJSDate();
          attendance.status = AttendanceStatus.SIGNED_IN;
        } else if (attendance.status === AttendanceStatus.SIGNED_IN) {
          const signInDateTime = this.getDateTime(
            attendance.signInTime as any,
            timezone
          );
          if (now < signInDateTime.plus({ minutes: 2 })) {
            await this.storeRedisStatus(qrCode, {
              status: 'error',
              error: 'Cannot check out before 2 minutes of check-in',
              userId,
              timestamp: new Date().toISOString(),
            });
            return attendance;
          }

          attendance.signOutTime = now.toJSDate();
          attendance.status = AttendanceStatus.SIGNED_OUT;
        } else {
          throw new BadRequestException('Invalid attendance status');
        }

        await attendance.save();
        this.logger.log('Updated attendance record', {
          attendanceId: attendance._id,
          status: attendance.status,
        });

        await this.storeRedisStatus(qrCode, {
          status: 'success',
          userId,
          timestamp: new Date().toISOString(),
          attendanceStatus: attendance.status,
        });

        return attendance;
      } catch (error) {
        this.logger.error(
          `Error updating attendance: ${error.message}`,
          error.stack
        );
        await this.storeRedisStatus(qrCode, {
          status: 'error',
          error: error.message || 'Failed to update attendance',
          userId,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error processing QR code: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Store QR code status in Redis
   */
  private async storeRedisStatus(qrCode: string, data: any): Promise<void> {
    try {
      await this.redis.set(
        `${this.REDIS_KEY_PREFIX}${qrCode}`,
        JSON.stringify(data),
        'EX',
        this.QR_CODE_EXPIRY
      );
    } catch (error) {
      this.logger.error(`Redis storage error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a QR code for a shift assignment
   */
  async generateQRCode(
    shiftAssignment: any,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<string> {
    try {
      this.logger.log('Checking for existing attendance record', {
        shiftId: shiftAssignment.shift?._id,
        userId: shiftAssignment.user,
        timezone,
      });

      const existingAttendance = await this.attendanceModel.findOne({
        user: shiftAssignment.user,
        shift: shiftAssignment.shift._id,
        date: this.getDateTime(shiftAssignment.shift.date, timezone).toJSDate(),
      });

      if (existingAttendance?.qrCode) {
        this.logger.log('Found existing attendance record', {
          attendanceId: existingAttendance._id,
          qrCode: existingAttendance.qrCode,
        });
        return existingAttendance.qrCode;
      }

      const qrCode = Math.random().toString(36).substring(7);

      const attendance = new this.attendanceModel({
        user: shiftAssignment.user,
        shift: shiftAssignment.shift._id,
        shiftPattern: shiftAssignment.shift.shiftPattern._id,
        workplace: shiftAssignment.shift.homeId._id,
        organization: shiftAssignment.shift.agentId?._id,
        date: this.getDateTime(shiftAssignment.shift.date, timezone).toJSDate(),
        qrCode,
        qrCodeExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes validity
        status: AttendanceStatus.PENDING,
        expectedStartTime: shiftAssignment.shift.expectedStartTime,
        expectedEndTime: shiftAssignment.shift.expectedEndTime,
        expectedDuration: shiftAssignment.shift.expectedDuration || 0,
      });

      await attendance.save();
      this.logger.log('Created new attendance record', {
        attendanceId: attendance._id,
        qrCode,
      });

      return qrCode;
    } catch (error) {
      this.logger.error(
        `Error generating QR code: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Check the status of an attendance record by QR code
   */
  async checkAttendanceStatus(
    qrCode: string,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<AttendanceDocument> {
    try {
      const attendance = await this.attendanceModel
        .findOne({ qrCode })
        .populate('user')
        .populate('shift')
        .populate('workplace');

      if (!attendance) {
        throw new NotFoundException('Attendance record not found');
      }

      // Convert timestamps to user timezone
      if (attendance.signInTime) {
        attendance.signInTime = this.getDateTime(
          attendance.signInTime,
          timezone
        ).toJSDate();
      }
      if (attendance.signOutTime) {
        attendance.signOutTime = this.getDateTime(
          attendance.signOutTime,
          timezone
        ).toJSDate();
      }

      return attendance;
    } catch (error) {
      this.logger.error(
        `Error checking attendance status: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to check attendance status: ${error.message}`);
    }
  }

  /**
   * Get attendance status for a specific date
   */
  async getAttendanceStatusByDate(
    userId: string,
    date: Date,
    timezone: string = this.DEFAULT_TIMEZONE
  ): Promise<AttendanceDocument | null> {
    try {
      const dateTime = this.getDateTime(date, timezone);
      const startOfDay = dateTime.startOf('day').toJSDate();
      const endOfDay = dateTime.endOf('day').toJSDate();
      const previousDay = dateTime.minus({ days: 1 }).startOf('day').toJSDate();

      // Check for active attendance (signed in but not signed out)
      const activeAttendance = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          status: AttendanceStatus.SIGNED_IN,
          signOutTime: null,
          signInTime: {
            $gte: previousDay,
            $lt: endOfDay,
          },
        })
        .populate([
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
          {
            path: 'workplace',
          },
        ]);

      // If we found an active attendance, return it immediately
      if (activeAttendance) {
        this.logger.debug(
          `Found active attendance record ${activeAttendance._id} for user ${userId}`
        );
        return activeAttendance;
      }

      // If no active session, check for the specified date's attendance
      const dateAttendance = await this.attendanceModel
        .findOne({
          user: new Types.ObjectId(userId),
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
        .populate([
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
          {
            path: 'workplace',
          },
        ]);

      return dateAttendance;
    } catch (error) {
      this.logger.error(
        `Error getting attendance status by date: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to get attendance status: ${error.message}`);
    }
  }

  /**
   * Get attendance registry with pagination and filtering
   */
  async getAttendanceRegistry(params: {
    workplaceId: string;
    startDate: Date;
    endDate: Date;
    staffType?: string;
    agencyId?: string;
    page: number;
    limit: number;
  }): Promise<any> {
    try {
      const {
        workplaceId,
        startDate,
        endDate,
        staffType,
        agencyId,
        page,
        limit,
      } = params;

      // Ensure correct pagination
      const currentPage = Math.max(1, page);
      const pageSize = Math.max(1, limit);
      const skip = (currentPage - 1) * pageSize;

      // Set start and end date with correct times
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to beginning of day

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      // Build query
      const query: any = {
        workplace: new Types.ObjectId(workplaceId),
        date: {
          $gte: start,
          $lte: end,
        },
      };

      // Add staff type filter
      if (staffType === 'agency') {
        query.organization = { $ne: null };
        if (agencyId) {
          query.organization = new Types.ObjectId(agencyId);
        }
      } else if (staffType === 'permanent') {
        query.organization = null;
      }

      // Get total count
      const total = await this.attendanceModel.countDocuments(query);

      // Get paginated results
      const attendanceRecords = await this.attendanceModel
        .find(query)
        .populate([
          {
            path: 'user',
            select: 'firstName lastName email phone avatarUrl',
          },
          {
            path: 'shift',
            populate: {
              path: 'shiftPattern',
            },
          },
          {
            path: 'organization',
            select: 'name logoUrl',
          },
          {
            path: 'modifiedBy',
            select: 'firstName lastName',
          },
        ])
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return {
        records: attendanceRecords,
        pagination: {
          total,
          page: currentPage,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting attendance registry: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to get attendance registry: ${error.message}`);
    }
  }

  /**
   * Update attendance record manually (admin function)
   */
  async updateAttendanceManually(params: {
    attendanceId: string;
    signInTime?: string;
    signOutTime?: string;
    status?: AttendanceStatus;
    reason: string;
    adminUser: any;
    currentOrganization: any;
  }): Promise<AttendanceDocument> {
    try {
      const {
        attendanceId,
        signInTime,
        signOutTime,
        status,
        reason,
        adminUser,
        currentOrganization,
      } = params;

      // Find attendance record
      const attendance = await this.attendanceModel.findById(attendanceId);
      if (!attendance) {
        throw new NotFoundException('Attendance record not found');
      }

      // Create changes array to track what's being modified
      const changes = [];

      // Create an update object with only the fields we want to modify
      const updateObj: any = {};

      // Update the fields
      if (signInTime !== undefined) {
        changes.push({
          field: 'signInTime',
          oldValue: attendance.signInTime,
          newValue: new Date(signInTime),
        });
        updateObj.signInTime = new Date(signInTime);
      }

      if (signOutTime !== undefined) {
        changes.push({
          field: 'signOutTime',
          oldValue: attendance.signOutTime,
          newValue: new Date(signOutTime),
        });
        updateObj.signOutTime = new Date(signOutTime);
      }

      if (status !== undefined) {
        changes.push({
          field: 'status',
          oldValue: attendance.status,
          newValue: status,
        });
        updateObj.status = status;
      }

      // Calculate duration only if both sign in and sign out times are present
      // and status is signedOut
      if (
        (signInTime || attendance.signInTime) &&
        (signOutTime || attendance.signOutTime) &&
        (status === AttendanceStatus.SIGNED_OUT ||
          attendance.status === AttendanceStatus.SIGNED_OUT)
      ) {
        const signInDate = new Date(
          signInTime ?? attendance.signInTime ?? new Date()
        );
        const signOutDate = new Date(
          signOutTime || attendance.signOutTime || Date.now()
        );

        // Only calculate if sign out is after sign in
        if (signOutDate > signInDate) {
          const durationInMinutes = Math.round(
            (signOutDate.getTime() - signInDate.getTime()) / 60000
          );
          updateObj.duration = durationInMinutes;

          changes.push({
            field: 'duration',
            oldValue: attendance.duration,
            newValue: durationInMinutes,
          });
        }
      }

      // Add modification details
      updateObj.modifiedBy = adminUser._id;
      updateObj.modifiedAt = new Date();
      updateObj.modifiedReason = reason;
      updateObj.modifiedType = ModificationType.ADMIN_MODIFICATION;
      updateObj.modifiedByType =
        currentOrganization.type === 'agency'
          ? ModifierType.AGENCY_ADMIN
          : ModifierType.HOME_ADMIN;

      // Create modification record
      const modificationRecord = {
        timestamp: new Date(),
        modifiedBy: adminUser._id,
        modifiedByType:
          currentOrganization.type === 'agency'
            ? ModifierType.AGENCY_ADMIN
            : ModifierType.HOME_ADMIN,
        reason,
        changes,
      };

      // Use findOneAndUpdate to avoid validation issues
      const updatedAttendance = await this.attendanceModel
        .findOneAndUpdate(
          { _id: attendanceId },
          {
            $set: updateObj,
            $push: { modifications: modificationRecord },
          },
          {
            new: true, // Return the updated document
            runValidators: false, // Skip validation since we're doing a partial update
          }
        )
        .populate('user')
        .populate('shift')
        .populate('modifiedBy');

      if (!updatedAttendance) {
        throw new NotFoundException('Failed to update attendance record');
      }

      this.logger.log(`Successfully updated attendance record ${attendanceId}`);
      return updatedAttendance;
    } catch (error) {
      this.logger.error(
        `Error updating attendance manually: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to update attendance record: ${error.message}`);
    }
  }

  /**
   * Generate QR codes for a workplace
   */
  async generateWorkplaceQRCodes(workplaceId: string): Promise<{
    clockIn: string;
    clockOut: string;
    expiresAt: Date;
  }> {
    try {
      this.logger.log('Generating QR codes for workplace', { workplaceId });

      const now = Date.now();
      const validUntil = now + this.QR_VALIDITY_DURATION;

      const clockInPayload: QRPayload = {
        workplaceId,
        type: 'IN',
        timestamp: now,
        validUntil,
      };

      const clockOutPayload: QRPayload = {
        workplaceId,
        type: 'OUT',
        timestamp: now,
        validUntil,
      };

      const clockIn = await this.encryptPayload(clockInPayload);
      const clockOut = await this.encryptPayload(clockOutPayload);

      return {
        clockIn,
        clockOut,
        expiresAt: new Date(validUntil),
      };
    } catch (error) {
      this.logger.error('Error generating workplace QR codes:', error);
      throw new Error('Failed to generate QR codes');
    }
  }

  /**
   * Decrypt and validate QR code
   */
  async validateQRCode(encryptedQR: string): Promise<QRPayload> {
    try {
      const payload = await this.decryptPayload(encryptedQR);

      // Validate timestamp
      if (Date.now() > payload.validUntil) {
        throw new Error('QR code has expired');
      }

      return payload;
    } catch (error) {
      this.logger.error('Error validating QR code:', error);
      throw new Error('Invalid QR code');
    }
  }

  /**
   * Encrypt payload for QR code
   */
  private async encryptPayload(payload: QRPayload): Promise<string> {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);

      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      // Combine IV, encrypted data, and auth tag
      const result = Buffer.concat([iv, authTag, encrypted]);
      return result.toString('base64');
    } catch (error) {
      this.logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt payload');
    }
  }

  /**
   * Decrypt QR code payload
   */
  private async decryptPayload(encrypted: string): Promise<QRPayload> {
    try {
      const buffer = Buffer.from(encrypted, 'base64');

      // Extract IV, auth tag, and encrypted data
      const iv = buffer.subarray(0, 16);
      const authTag = buffer.subarray(16, 32);
      const encryptedData = buffer.subarray(32);

      const decipher = createDecipheriv(
        this.ALGORITHM,
        this.ENCRYPTION_KEY,
        iv
      );
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      this.logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt payload');
    }
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redis.status || this.redis.status !== 'ready') {
      await this.redis.connect();
    }
  }

  /**
   * Monitor QR code status for SSE updates
   */
  monitorQRCodeStatus(
    qrCode: string,
    callback: (data: any) => void
  ): NodeJS.Timeout {
    const checkStatus = async () => {
      try {
        await this.ensureRedisConnection();
        const result = await this.redis.get(
          `${this.REDIS_KEY_PREFIX}${qrCode}`
        );

        if (result) {
          const data = JSON.parse(result);
          const timeDiff = Date.now() - new Date(data.timestamp).getTime();

          if (timeDiff <= this.QR_CODE_EXPIRY * 1000) {
            if (data.status === 'success' || data.status === 'error') {
              callback(data);
              await this.redis.del(`${this.REDIS_KEY_PREFIX}${qrCode}`);
              return;
            }
          } else {
            callback({ status: 'expired' });
            await this.redis.del(`${this.REDIS_KEY_PREFIX}${qrCode}`);
            return;
          }
        } else {
          callback({ status: 'pending' });
        }
      } catch (error) {
        this.logger.error('Redis check error:', error);
        callback({ status: 'error', error: 'Internal server error' });
      }
    };

    // Set up polling interval
    return setInterval(checkStatus, 500);
  }
}
