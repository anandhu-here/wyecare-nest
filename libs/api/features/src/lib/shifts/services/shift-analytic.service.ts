import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as dayjs from 'dayjs';

// Import schemas
import { Shift, ShiftDocument } from '../../../../../core/src/lib/schemas';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
} from '../../../../../core/src/lib/schemas';
import {
  Timesheet,
  TimesheetDocument,
} from '../../../../../core/src/lib/schemas';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
import { User, UserDocument } from '../../../../../core/src/lib/schemas';
import {
  ShiftPattern,
  ShiftPatternDocument,
} from '../../../../../core/src/lib/schemas';
import {
  Organization,
  OrganizationDocument,
} from '../../../../../core/src/lib/schemas';
import moment from 'moment';

// These will be imported once migrated
// import { Invoice, InvoiceDocument } from '../../../../../core/src/lib/schemas';
// import { Attendance, AttendanceDocument } from '../../../../../core/src/lib/schemas';
// import { TemporaryHome, TemporaryHomeDocument } from '../../../../../core/src/lib/schemas';

// Interfaces
interface IDateRange {
  startDate: Date;
  endDate: Date;
}

interface IShiftDistribution {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  distribution: {
    byDate: Record<string, number>;
    byShiftPattern: Record<string, number>;
    byStatus: {
      completed: number;
      pending: number;
      cancelled: number;
      new: number;
    };
  };
}

interface ITimeBasedAnalysis {
  hourly: Record<string, number>;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
}

interface IFinancialMetrics {
  totalEarnings: number;
  periodEarnings: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  averagePerShift: number;
  averagePerHour: number;
  paymentStatus: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

interface IStaffAnalytics {
  userId: Types.ObjectId;
  dateRange: IDateRange;
  shifts: IShiftDistribution;
  workingPattern: ITimeBasedAnalysis;
  homeRelations: any[];
  financials: IFinancialMetrics;
  performance: any;
}

interface IAgencyAnalytics {
  agencyId: Types.ObjectId;
  dateRange: IDateRange;
  shifts: {
    received: IShiftDistribution;
    assigned: IShiftDistribution;
    completed: IShiftDistribution;
  };
  staffMetrics: {
    total: number;
    active: number;
    byPerformance: {
      excellent: number;
      good: number;
      average: number;
      belowAverage: number;
    };
  };
  homeRelations: any[];
  financials: any;
  innovativeMetrics: any;
}

interface ICareHomeAnalytics {
  homeId: Types.ObjectId;
  dateRange: IDateRange;
  shifts: {
    published: IShiftDistribution;
    direct: IShiftDistribution;
    agency: IShiftDistribution;
  };
  staffing: any;
  agencyRelations: any[];
  costs: any;
  innovativeMetrics: any;
}

@Injectable()
export class ShiftAnalyticsService {
  private readonly logger = new Logger(ShiftAnalyticsService.name);

  constructor(
    @InjectModel(Shift.name)
    private shiftModel: Model<ShiftDocument>,
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<TimesheetDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ShiftPattern.name)
    private shiftPatternModel: Model<ShiftPatternDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument> // These will be injected once migrated
  ) // @InjectModel(Invoice.name)
  // private invoiceModel: Model<InvoiceDocument>,
  // @InjectModel(Attendance.name)
  // private attendanceModel: Model<AttendanceDocument>,
  // @InjectModel(TemporaryHome.name)
  // private temporaryHomeModel: Model<TemporaryHomeDocument>,
  {}

  /**
   * Gets date range with defaults if not provided
   */
  private async getDateRange(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<IDateRange> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : moment(end).subtract(30, 'days').toDate();

    return { startDate: start, endDate: end };
  }

  /**
   * Get shift distribution based on query and time range
   */
  private async getShiftDistribution(
    query: any,
    timeRange: IDateRange
  ): Promise<IShiftDistribution> {
    try {
      // Format dates for MongoDB query
      const startDateStr = timeRange.startDate.toISOString().split('T')[0];
      const endDateStr = timeRange.endDate.toISOString().split('T')[0];

      const shifts = await this.shiftModel.aggregate([
        {
          $match: {
            ...query,
            date: {
              $gte: startDateStr,
              $lte: endDateStr,
            },
          },
        },
        {
          $lookup: {
            from: 'timesheets',
            localField: '_id',
            foreignField: 'shiftId', // Using updated field name
            as: 'timesheets',
          },
        },
        {
          $lookup: {
            from: 'shiftassignments',
            localField: '_id',
            foreignField: 'shift',
            as: 'assignments',
          },
        },
        {
          $facet: {
            distributions: [
              {
                $group: {
                  _id: null,
                  documentCount: { $sum: 1 },
                  totalShifts: { $sum: '$count' },
                  completedShifts: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$timesheets',
                                  as: 'ts',
                                  cond: { $eq: ['$$ts.status', 'approved'] },
                                },
                              },
                            },
                            0,
                          ],
                        },
                        '$count',
                        0,
                      ],
                    },
                  },
                  assignedShifts: {
                    $sum: {
                      $cond: [
                        { $gt: [{ $size: '$assignments' }, 0] },
                        '$count',
                        0,
                      ],
                    },
                  },
                  cancelledShifts: {
                    $sum: {
                      $cond: [{ $eq: ['$isRejected', true] }, '$count', 0],
                    },
                  },
                },
              },
            ],
            byDate: [
              {
                $group: {
                  _id: '$date',
                  totalShifts: { $sum: '$count' },
                  completedShifts: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$timesheets',
                                  as: 'ts',
                                  cond: { $eq: ['$$ts.status', 'approved'] },
                                },
                              },
                            },
                            0,
                          ],
                        },
                        '$count',
                        0,
                      ],
                    },
                  },
                  assignedShifts: {
                    $sum: {
                      $cond: [
                        { $gt: [{ $size: '$assignments' }, 0] },
                        '$count',
                        0,
                      ],
                    },
                  },
                },
              },
              { $sort: { _id: 1 } },
            ],
            byShiftPattern: [
              {
                $group: {
                  _id: '$shiftPattern',
                  totalShifts: { $sum: '$count' },
                },
              },
            ],
          },
        },
      ]);

      const result = shifts[0];
      const distribution = result.distributions[0] || {
        documentCount: 0,
        totalShifts: 0,
        completedShifts: 0,
        assignedShifts: 0,
        cancelledShifts: 0,
      };

      // Process byDate results
      const byDate = result.byDate.reduce(
        (acc: any, { _id, totalShifts }: any) => {
          acc[_id] = totalShifts;
          return acc;
        },
        {}
      );

      // Process byShiftPattern results
      const byShiftPattern = result.byShiftPattern.reduce(
        (acc: any, { _id, totalShifts }: any) => {
          acc[_id.toString()] = totalShifts;
          return acc;
        },
        {}
      );

      // Calculate pending shifts
      const pendingShifts =
        distribution.totalShifts -
        distribution.completedShifts -
        distribution.cancelledShifts;

      return {
        total: distribution.totalShifts,
        completed: distribution.completedShifts,
        pending: pendingShifts,
        cancelled: distribution.cancelledShifts,
        distribution: {
          byDate,
          byShiftPattern,
          byStatus: {
            completed: distribution.completedShifts,
            pending: pendingShifts,
            cancelled: distribution.cancelledShifts,
            new:
              distribution.totalShifts -
              (distribution.assignedShifts + distribution.cancelledShifts),
          },
        },
      };
    } catch (error) {
      this.logger.error('Error getting shift distribution:', error);
      throw new InternalServerErrorException(
        'Failed to get shift distribution'
      );
    }
  }

  /**
   * Get staff analytics
   */
  public async getStaffAnalytics(
    userId: string,
    dateRange?: IDateRange
  ): Promise<IStaffAnalytics> {
    try {
      const timeRange = await this.getDateRange(
        dateRange?.startDate,
        dateRange?.endDate
      );

      const shiftsQuery = {
        assignedUsers: new Types.ObjectId(userId),
      };

      // Get shift distribution
      const shiftDistribution = await this.getShiftDistribution(
        shiftsQuery,
        timeRange
      );

      // Get working pattern analysis
      const workingPattern = await this.getTimeBasedAnalysis(
        shiftsQuery,
        timeRange
      );

      // Get home relations
      const homeRelations = await this.shiftModel.aggregate([
        {
          $match: {
            assignedUsers: new Types.ObjectId(userId),
            date: {
              $gte: timeRange.startDate.toISOString().split('T')[0],
              $lte: timeRange.endDate.toISOString().split('T')[0],
            },
          },
        },
        {
          $lookup: {
            from: 'organizations',
            localField: 'homeId',
            foreignField: '_id',
            as: 'home',
          },
        },
        {
          $unwind: '$home',
        },
        {
          $lookup: {
            from: 'timesheets',
            localField: '_id',
            foreignField: 'shiftId', // Updated field name
            as: 'timesheet',
          },
        },
        {
          $group: {
            _id: '$homeId',
            homeName: { $first: '$home.name' },
            totalShifts: { $sum: '$count' },
            completedShifts: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$timesheet',
                            as: 'ts',
                            cond: { $eq: ['$$ts.status', 'approved'] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  '$count',
                  0,
                ],
              },
            },
            rating: { $avg: '$timesheet.rating' },
            lastShiftDate: { $max: '$date' },
            timesheetStats: {
              $push: {
                status: { $arrayElemAt: ['$timesheet.status', 0] },
                count: '$count',
              },
            },
          },
        },
      ]);

      // Get financial metrics
      const financials = await this.getStaffFinancialMetrics(userId, timeRange);

      // Get performance metrics
      const performance = await this.getStaffPerformanceMetrics(
        userId,
        timeRange
      );

      return {
        userId: new Types.ObjectId(userId),
        dateRange: timeRange,
        shifts: shiftDistribution,
        workingPattern,
        homeRelations: homeRelations.map((relation) => ({
          homeId: relation._id,
          homeName: relation.homeName,
          totalShifts: relation.totalShifts,
          completedShifts: relation.completedShifts,
          rating: relation.rating || 0,
          lastShiftDate: new Date(relation.lastShiftDate),
          timesheetStats: {
            approved: relation.timesheetStats.reduce(
              (sum: any, ts: any) =>
                ts.status === 'approved' ? sum + (ts.count || 1) : sum,
              0
            ),
            pending: relation.timesheetStats.reduce(
              (sum: any, ts: any) =>
                ts.status === 'pending' ? sum + (ts.count || 1) : sum,
              0
            ),
            rejected: relation.timesheetStats.reduce(
              (sum: any, ts: any) =>
                ts.status === 'rejected' ? sum + (ts.count || 1) : sum,
              0
            ),
          },
        })),
        financials,
        performance,
      };
    } catch (error) {
      this.logger.error('Error getting staff analytics:', error);
      throw new InternalServerErrorException('Failed to get staff analytics');
    }
  }

  /**
   * Get financial metrics for staff
   */
  private async getStaffFinancialMetrics(
    userId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<IFinancialMetrics> {
    try {
      // This implementation will be commented out until Invoice model is migrated
      /* 
      const timesheets = await this.timesheetModel.aggregate([
        {
          $match: {
            carer: new Types.ObjectId(userId: any),
            createdAt: {
              $gte: dateRange.startDate,
              $lte: dateRange.endDate,
            },
          },
        },
        {
          $lookup: {
            from: 'shifts',
            localField: 'shiftId',
            foreignField: '_id',
            as: 'shift',
          },
        },
        {
          $unwind: '$shift',
        },
        {
          $lookup: {
            from: 'shiftpatterns',
            localField: 'shift.shiftPattern',
            foreignField: '_id',
            as: 'pattern',
          },
        },
        {
          $unwind: '$pattern',
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
            },
            dailyEarnings: { $sum: '$pattern.rates.weekdayRate' }, // Simplified for example
            shiftsCount: { $sum: 1 },
            totalHours: { $sum: { $subtract: ['$endTime', '$startTime'] } },
          },
        },
      ]);

      // Process the aggregation results
      const dailyEarnings: Record<string, number> = {};
      let totalEarnings = 0;
      let totalShifts = 0;
      let totalHours = 0;

      timesheets.forEach((day) => {
        dailyEarnings[day._id.date] = day.dailyEarnings;
        totalEarnings += day.dailyEarnings;
        totalShifts += day.shiftsCount;
        totalHours += day.totalHours;
      });

      return {
        totalEarnings,
        periodEarnings: {
          daily: dailyEarnings,
          weekly: this.aggregateToWeekly(dailyEarnings),
          monthly: this.aggregateToMonthly(dailyEarnings),
        },
        averagePerShift: totalShifts > 0 ? totalEarnings / totalShifts : 0,
        averagePerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
        paymentStatus: {
          paid: 0,
          pending: 0,
          overdue: 0,
        },
      };
      */

      // Temporary implementation until Invoice model is available
      return {
        totalEarnings: 0,
        periodEarnings: {
          daily: {},
          weekly: {},
          monthly: {},
        },
        averagePerShift: 0,
        averagePerHour: 0,
        paymentStatus: {
          paid: 0,
          pending: 0,
          overdue: 0,
        },
      };
    } catch (error) {
      this.logger.error('Error getting staff financial metrics:', error);
      throw new InternalServerErrorException('Failed to get financial metrics');
    }
  }

  /**
   * Get performance metrics for staff
   */
  private async getStaffPerformanceMetrics(
    userId: string | Types.ObjectId,
    dateRange: IDateRange
  ) {
    try {
      const metrics = await this.timesheetModel.aggregate([
        {
          $match: {
            carer: new Types.ObjectId(userId),
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
          },
        },
        {
          $lookup: {
            from: 'shifts',
            localField: 'shiftId', // Updated field name
            foreignField: '_id',
            as: 'shift',
          },
        },
        {
          $unwind: '$shift',
        },
        {
          $facet: {
            ratings: [
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: '$rating' },
                  ratingsCount: {
                    $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] },
                  },
                  ratingDistribution: {
                    $push: {
                      $cond: [{ $gt: ['$rating', 0] }, '$rating', null],
                    },
                  },
                },
              },
            ],
            reliability: [
              {
                $group: {
                  _id: null,
                  totalShifts: { $sum: 1 },
                  onTimeArrivals: {
                    $sum: { $cond: [{ $eq: ['$requestType', 'auto'] }, 1, 0] },
                  },
                  lateArrivals: {
                    $sum: {
                      $cond: [{ $eq: ['$requestType', 'manual'] }, 1, 0],
                    },
                  },
                  completedShifts: {
                    $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                  },
                  cancelledShifts: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
                  },
                },
              },
            ],
            timeBasedMetrics: [
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                  },
                  monthlyShifts: { $sum: 1 },
                  monthlyRating: { $avg: '$rating' },
                  monthlyOnTime: {
                    $sum: { $cond: [{ $eq: ['$requestType', 'auto'] }, 1, 0] },
                  },
                },
              },
            ],
            specializationPerformance: [
              {
                $lookup: {
                  from: 'shiftpatterns',
                  localField: 'shift.shiftPattern',
                  foreignField: '_id',
                  as: 'pattern',
                },
              },
              {
                $unwind: '$pattern',
              },
              {
                $group: {
                  _id: '$pattern.specialization',
                  shiftsCount: { $sum: 1 },
                  averageRating: { $avg: '$rating' },
                  completionRate: {
                    $avg: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                  },
                },
              },
            ],
          },
        },
      ]);

      const result = metrics[0];
      const ratingInfo = result.ratings[0] || {
        averageRating: 0,
        ratingsCount: 0,
        ratingDistribution: [],
      };
      const reliabilityInfo = result.reliability[0] || {
        totalShifts: 0,
        onTimeArrivals: 0,
        lateArrivals: 0,
        completedShifts: 0,
        cancelledShifts: 0,
      };

      // Process rating distribution
      const ratingDistribution = {
        5: ratingInfo.ratingDistribution.filter((r: any) => r === 5).length,
        4: ratingInfo.ratingDistribution.filter((r: any) => r >= 4 && r < 5)
          .length,
        3: ratingInfo.ratingDistribution.filter((r: any) => r >= 3 && r < 4)
          .length,
        2: ratingInfo.ratingDistribution.filter((r: any) => r >= 2 && r < 3)
          .length,
        1: ratingInfo.ratingDistribution.filter((r: any) => r < 2).length,
      };

      // Calculate performance trends
      const trends = result.timeBasedMetrics.map((month: any) => ({
        period: `${month._id.year}-${month._id.month}`,
        shifts: month.monthlyShifts,
        rating: month.monthlyRating || 0,
        onTimeRate:
          month.monthlyShifts > 0
            ? (month.monthlyOnTime / month.monthlyShifts) * 100
            : 0,
      }));

      // Process specialization performance
      const specializations = result.specializationPerformance.map(
        (spec: any) => ({
          name: spec._id || 'General',
          shiftsCompleted: spec.shiftsCount,
          rating: spec.averageRating || 0,
          completionRate: (spec.completionRate || 0) * 100,
        })
      );

      return {
        overview: {
          rating: {
            average: ratingInfo.averageRating || 0,
            total: ratingInfo.ratingsCount,
            distribution: ratingDistribution,
          },
          reliability: {
            totalShifts: reliabilityInfo.totalShifts,
            completionRate:
              reliabilityInfo.totalShifts > 0
                ? (reliabilityInfo.completedShifts /
                    reliabilityInfo.totalShifts) *
                  100
                : 0,
            punctualityRate:
              reliabilityInfo.totalShifts > 0
                ? (reliabilityInfo.onTimeArrivals /
                    reliabilityInfo.totalShifts) *
                  100
                : 0,
            cancellationRate:
              reliabilityInfo.totalShifts > 0
                ? (reliabilityInfo.cancelledShifts /
                    reliabilityInfo.totalShifts) *
                  100
                : 0,
          },
        },
        trends,
        specializations,
        qualityScore: this.calculateQualityScore({
          rating: ratingInfo.averageRating || 0,
          punctuality:
            reliabilityInfo.totalShifts > 0
              ? reliabilityInfo.onTimeArrivals / reliabilityInfo.totalShifts
              : 0,
          completion:
            reliabilityInfo.totalShifts > 0
              ? reliabilityInfo.completedShifts / reliabilityInfo.totalShifts
              : 0,
        }),
      };
    } catch (error) {
      this.logger.error('Error getting staff performance metrics:', error);
      throw new InternalServerErrorException(
        'Failed to get performance metrics'
      );
    }
  }

  /**
   * Calculate quality score based on metrics
   */
  private calculateQualityScore(metrics: {
    rating: number;
    punctuality: number;
    completion: number;
  }) {
    const weights = {
      rating: 0.4, // 40% weight to ratings
      punctuality: 0.3, // 30% weight to punctuality
      completion: 0.3, // 30% weight to completion rate
    };

    // Convert all metrics to 0-100 scale
    const ratingScore = (metrics.rating / 5) * 100;
    const punctualityScore = metrics.punctuality * 100;
    const completionScore = metrics.completion * 100;

    return (
      ratingScore * weights.rating +
      punctualityScore * weights.punctuality +
      completionScore * weights.completion
    );
  }

  /**
   * Get time-based analysis of shifts
   */
  private async getTimeBasedAnalysis(
    query: any,
    dateRange: IDateRange
  ): Promise<ITimeBasedAnalysis> {
    try {
      const shifts = await this.shiftModel.aggregate([
        {
          $match: {
            ...query,
            date: {
              $gte: dateRange.startDate.toISOString().split('T')[0],
              $lte: dateRange.endDate.toISOString().split('T')[0],
            },
          },
        },
        {
          $lookup: {
            from: 'shiftpatterns',
            localField: 'shiftPattern',
            foreignField: '_id',
            as: 'pattern',
          },
        },
        {
          $unwind: '$pattern',
        },
        {
          $group: {
            _id: {
              date: '$date',
              hour: {
                $hour: {
                  $toDate: {
                    $concat: [
                      '$date',
                      'T',
                      { $arrayElemAt: ['$pattern.timings.startTime', 0] },
                    ],
                  },
                },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Process into required formats
      const hourlyData: Record<string, number> = {};
      const dailyData: Record<string, number> = {};

      shifts.forEach((shift) => {
        const date = shift._id.date;
        const hour = shift._id.hour;

        // Hourly aggregation
        const hourKey = `${hour}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + shift.count;

        // Daily aggregation
        dailyData[date] = (dailyData[date] || 0) + shift.count;
      });

      return {
        hourly: hourlyData,
        daily: dailyData,
        weekly: this.aggregateToWeekly(dailyData),
        monthly: this.aggregateToMonthly(dailyData),
      };
    } catch (error) {
      this.logger.error('Error getting time-based analysis:', error);
      throw new InternalServerErrorException('Failed to get time analysis');
    }
  }

  /**
   * Aggregate daily data to weekly
   */
  private aggregateToWeekly(
    dailyData: Record<string, number>
  ): Record<string, number> {
    const weeklyData: Record<string, number> = {};

    Object.entries(dailyData).forEach(([date, count]) => {
      const weekStart = moment(date).startOf('week').format('YYYY-MM-DD');
      weeklyData[weekStart] = (weeklyData[weekStart] || 0) + count;
    });

    return weeklyData;
  }

  /**
   * Aggregate daily data to monthly
   */
  private aggregateToMonthly(
    dailyData: Record<string, number>
  ): Record<string, number> {
    const monthlyData: Record<string, number> = {};

    Object.entries(dailyData).forEach(([date, count]) => {
      const monthStart = moment(date).startOf('month').format('YYYY-MM');
      monthlyData[monthStart] = (monthlyData[monthStart] || 0) + count;
    });

    return monthlyData;
  }

  /**
   * Get analytics for an agency
   */
  public async getAgencyAnalytics(
    agencyId: string | Types.ObjectId,
    dateRange?: IDateRange
  ): Promise<IAgencyAnalytics> {
    try {
      const timeRange = await this.getDateRange(
        dateRange?.startDate,
        dateRange?.endDate
      );

      // Get previous month date range for trend calculations
      const prevTimeRange = {
        startDate: moment(timeRange.startDate).subtract(1, 'month').toDate(),
        endDate: moment(timeRange.endDate).subtract(1, 'month').toDate(),
      };

      // Convert agencyId to ObjectId
      const agencyObjectId = new Types.ObjectId(agencyId);

      // Get shift distributions
      const receivedShifts = await this.getShiftDistribution(
        { agentId: agencyObjectId },
        timeRange
      );

      const assignedShifts = await this.getShiftDistribution(
        {
          agentId: agencyObjectId,
          assignedUsers: { $exists: true, $not: { $size: 0 } },
        },
        timeRange
      );

      const completedShifts = await this.getShiftDistribution(
        {
          agentId: agencyObjectId,
          isCompleted: true,
        },
        timeRange
      );

      // Fetch raw shift data for metrics
      const currentShifts = await this.shiftModel
        .find({
          agentId: agencyObjectId,
          date: {
            $gte: timeRange.startDate.toISOString().split('T')[0],
            $lte: timeRange.endDate.toISOString().split('T')[0],
          },
        })
        .populate('shiftPattern')
        .populate('assignedUsers')
        .populate('homeId')
        .lean();

      const previousShifts = await this.shiftModel
        .find({
          agentId: agencyObjectId,
          date: {
            $gte: prevTimeRange.startDate.toISOString().split('T')[0],
            $lte: prevTimeRange.endDate.toISOString().split('T')[0],
          },
        })
        .populate('shiftPattern')
        .populate('assignedUsers')
        .populate('homeId')
        .lean();

      // Get staff metrics
      const staffMetrics = await this.getAgencyStaffMetrics(
        agencyId,
        timeRange
      );

      // Get home relations
      const homeRelations = await this.getAgencyHomeRelations(
        agencyId,
        timeRange
      );

      // Get financials
      const financials = await this.getAgencyFinancials(agencyId, timeRange);

      // Calculate innovative metrics for agencies
      const responseTime = this.calculateResponseTime(
        currentShifts,
        previousShifts
      );
      const staffUtilization = this.calculateStaffUtilization(
        currentShifts,
        staffMetrics
      );
      const revenuePerformance = this.calculateRevenuePerformance(
        financials,
        previousShifts
      );
      const clientRetention = this.calculateClientRetention(
        currentShifts,
        previousShifts
      );
      const qualityScore = this.calculateAgencyQualityScore(
        currentShifts,
        staffMetrics
      );
      const marketPenetration = this.calculateMarketPenetration(
        homeRelations,
        currentShifts
      );
      const fulfillmentRate = this.calculateFulfillmentRate(
        receivedShifts,
        assignedShifts,
        completedShifts
      );
      const staffReliability = this.calculateStaffReliability(currentShifts);

      return {
        agencyId: agencyObjectId,
        dateRange: timeRange,
        shifts: {
          received: receivedShifts,
          assigned: assignedShifts,
          completed: completedShifts,
        },
        staffMetrics,
        homeRelations,
        financials,
        // Add innovative metrics
        innovativeMetrics: {
          responseTime,
          staffUtilization,
          revenuePerformance,
          clientRetention,
          qualityScore,
          marketPenetration,
          fulfillmentRate,
          staffReliability,
        },
      };
    } catch (error) {
      this.logger.error('Error getting agency analytics:', error);
      throw new InternalServerErrorException('Failed to get agency analytics');
    }
  }

  /**
   * Calculate response time between receiving and accepting shifts
   */
  private calculateResponseTime(currentShifts: any[], previousShifts: any[]) {
    // Calculate average time between receiving and accepting shifts
    const responseTimes = currentShifts
      .filter((s) => s.agencyAccepted)
      .map((shift) => {
        const created = new Date(shift.createdAt).getTime();
        const accepted = new Date(shift.updatedAt).getTime();
        return (accepted - created) / (3600 * 1000); // convert to hours
      });

    const avgResponseHours =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Calculate previous month for trend
    const prevResponseTimes = previousShifts
      .filter((s) => s.agencyAccepted)
      .map((shift) => {
        const created = new Date(shift.createdAt).getTime();
        const accepted = new Date(shift.updatedAt).getTime();
        return (accepted - created) / (3600 * 1000);
      });

    const prevAvgResponseHours =
      prevResponseTimes.length > 0
        ? prevResponseTimes.reduce((sum, time) => sum + time, 0) /
          prevResponseTimes.length
        : avgResponseHours;

    const improvementRate =
      prevAvgResponseHours > 0
        ? Math.round(
            ((prevAvgResponseHours - avgResponseHours) / prevAvgResponseHours) *
              100
          )
        : 0;

    return {
      averageHours: Math.round(avgResponseHours * 10) / 10, // Round to 1 decimal
      trend: improvementRate,
      improvementRate,
    };
  }

  /**
   * Calculate staff utilization metrics
   */
  private calculateStaffUtilization(shifts: any[], staffMetrics: any) {
    // Calculate what percentage of staff are actively assigned
    const utilization =
      staffMetrics.total > 0
        ? Math.round((staffMetrics.active / staffMetrics.total) * 100)
        : 0;

    // Calculate assignment balance across staff
    const assignedUsers = new Map();

    shifts.forEach((shift) => {
      if (shift.assignedUsers && shift.assignedUsers.length > 0) {
        shift.assignedUsers.forEach((user: any) => {
          const userId = user._id ? user._id.toString() : user.toString();
          assignedUsers.set(userId, (assignedUsers.get(userId) || 0) + 1);
        });
      }
    });

    // Calculate variance in assignments
    const assignments = Array.from(assignedUsers.values());
    const totalAssignments = assignments.reduce((sum, count) => sum + count, 0);
    const avgAssignmentsPerStaff =
      assignments.length > 0 ? totalAssignments / assignments.length : 0;

    // Calculate balance score (lower variance = higher balance)
    const variance =
      assignments.length > 0
        ? assignments.reduce(
            (sum, count) => sum + Math.pow(count - avgAssignmentsPerStaff, 2),
            0
          ) / assignments.length
        : 0;

    const balanceScore =
      variance > 0
        ? Math.min(100, Math.round(100 / (1 + Math.sqrt(variance))))
        : 100;

    return {
      utilizationRate: utilization,
      balanceScore,
      averageShiftsPerStaff: Math.round(avgAssignmentsPerStaff * 10) / 10,
      activeStaffCount: staffMetrics.active,
    };
  }

  /**
   * Calculate revenue performance metrics
   */
  private calculateRevenuePerformance(financials: any, previousShifts: any[]) {
    const totalRevenue = financials.totalEarnings || 0;
    const revPerShift = financials.averagePerShift || 0;

    // Estimate potential revenue as 20% more than current
    const potentialRevenue = totalRevenue * 1.2;
    const achievementRate = Math.round((totalRevenue / potentialRevenue) * 100);

    // Placeholder for growth calculation - would be based on previous month data
    const growthRate = 0;

    return {
      totalRevenue,
      revenuePerShift: Math.round(revPerShift),
      achievementRate,
      growthRate,
      projectedNextMonth: Math.round(totalRevenue * (1 + growthRate / 100)),
    };
  }

  /**
   * Calculate client retention metrics
   */
  private calculateClientRetention(
    currentShifts: any[],
    previousShifts: any[]
  ) {
    // Get unique home IDs from current period
    const currentHomes = new Set(
      currentShifts.map(
        (s) => s.homeId?._id?.toString() || s.homeId?.toString()
      )
    );

    // Get unique home IDs from previous period
    const previousHomes = new Set(
      previousShifts.map(
        (s) => s.homeId?._id?.toString() || s.homeId?.toString()
      )
    );

    // Returning homes are those in both periods
    const returningHomes = new Set(
      [...currentHomes].filter((id) => previousHomes.has(id))
    );

    const retentionRate =
      previousHomes.size > 0
        ? Math.round((returningHomes.size / previousHomes.size) * 100)
        : 100;

    // New homes are those in current but not previous
    const newHomes = new Set(
      [...currentHomes].filter((id) => !previousHomes.has(id))
    );

    // Lost homes are those in previous but not current
    const lostHomes = new Set(
      [...previousHomes].filter((id) => !currentHomes.has(id))
    );

    return {
      retentionRate,
      returningClients: returningHomes.size,
      newClients: newHomes.size,
      lostClients: lostHomes.size,
      totalActiveClients: currentHomes.size,
    };
  }

  /**
   * Calculate agency quality score
   */
  private calculateAgencyQualityScore(shifts: any[], staffMetrics: any) {
    // Get average ratings from shifts
    const ratings = shifts
      .flatMap((s) => s.timesheets?.map((t: any) => t.rating) || [])
      .filter((r: any) => r !== null && r !== undefined);

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    // Calculate fulfillment rate
    const totalShifts: number = shifts.reduce(
      (sum, s) => sum + (s.count || 1),
      0
    );
    const completedShifts = shifts
      .filter((s) => s.isCompleted)
      .reduce((sum, s) => sum + (s.count || 1), 0);

    const fulfillmentRate =
      totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0;

    // Calculate staff performance distribution
    const excellentStaff = staffMetrics.byPerformance?.excellent || 0;
    const goodStaff = staffMetrics.byPerformance?.good || 0;
    const totalRatedStaff: any = Object.values(
      staffMetrics.byPerformance || {}
    ).reduce((sum: number, count: any) => sum + count, 0);

    const qualityStaffRate =
      totalRatedStaff > 0
        ? ((excellentStaff + goodStaff) / totalRatedStaff) * 100
        : 0;

    // Calculate composite score with weights
    const score = Math.round(
      (avgRating / 5) * 40 + // 40% for ratings
        (fulfillmentRate / 100) * 40 + // 40% for fulfillment
        (qualityStaffRate / 100) * 20 // 20% for staff quality
    );

    return {
      score,
      averageRating: Math.round(avgRating * 10) / 10,
      fulfillmentRate: Math.round(fulfillmentRate),
      qualityStaffPercentage: Math.round(qualityStaffRate),
    };
  }

  /**
   * Calculate market penetration metrics
   */
  private calculateMarketPenetration(homeRelations: any[], shifts: any[]) {
    // Count unique homes the agency serves
    const servedHomes = homeRelations.length;

    // Count shifts per home and get market share distribution
    const shiftsPerHome: any = homeRelations.reduce((acc, home) => {
      acc[home.homeId] = home.shiftsReceived;
      return acc;
    }, {});

    // Identify top homes by shift volume
    const topHomes = Object.entries(shiftsPerHome)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 3)
      .map(([homeId]) => homeId);

    // Calculate concentration (what % of shifts come from top 3 homes)
    const topHomesShifts = topHomes.reduce(
      (sum, homeId) => sum + (shiftsPerHome[homeId] || 0),
      0
    );

    const totalShifts: any = Object.values(shiftsPerHome).reduce(
      (sum: number, count: any) => sum + count,
      0
    );

    const concentration =
      totalShifts > 0 ? Math.round((topHomesShifts / totalShifts) * 100) : 0;

    return {
      servedHomes,
      concentration,
      diversificationScore: 100 - concentration,
      topClients: topHomes.length,
      averageShiftsPerClient: Math.round(
        totalShifts / Math.max(1, servedHomes)
      ),
    };
  }

  /**
   * Calculate fulfillment rate metrics
   */
  private calculateFulfillmentRate(
    receivedShifts: any,
    assignedShifts: any,
    completedShifts: any
  ) {
    const total = receivedShifts.total;
    const assigned = assignedShifts.total;
    const completed = completedShifts.total;

    const assignmentRate = total > 0 ? Math.round((assigned / total) * 100) : 0;
    const completionRate =
      assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    const overallRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate efficiency score (how efficiently assigned shifts become completed)
    const efficiencyScore =
      assignmentRate > 0
        ? Math.round((completionRate / assignmentRate) * 100)
        : 0;

    return {
      assignmentRate,
      completionRate,
      overallRate,
      efficiencyScore,
      pendingRate:
        total > 0 ? Math.round(((total - completed) / total) * 100) : 0,
    };
  }

  /**
   * Calculate staff reliability metrics
   */
  private calculateStaffReliability(shifts: any[]) {
    // Count shifts with late arrivals, no-shows, or cancellations
    const totalAssignedShifts = shifts.reduce((sum, s) => {
      if (s.assignedUsers && s.assignedUsers.length > 0) {
        return sum + (s.count || 1);
      }
      return sum;
    }, 0);

    // For this example, we'll use timesheet requestType as proxy
    // Auto = on time, manual = late arrival
    const timesheets = shifts.flatMap((s) => s.timesheets || []);

    const onTimeArrivals = timesheets.filter(
      (ts) => ts.requestType === 'auto'
    ).length;
    const lateArrivals = timesheets.filter(
      (ts) => ts.requestType === 'manual'
    ).length;
    const cancelled = shifts.filter((s) => s.isRejected).length;

    const reliability =
      totalAssignedShifts > 0
        ? Math.round((onTimeArrivals / totalAssignedShifts) * 100)
        : 0;

    const punctualityRate =
      onTimeArrivals + lateArrivals > 0
        ? Math.round((onTimeArrivals / (onTimeArrivals + lateArrivals)) * 100)
        : 0;

    return {
      reliabilityScore: reliability,
      punctualityRate,
      cancellationRate:
        totalAssignedShifts > 0
          ? Math.round((cancelled / totalAssignedShifts) * 100)
          : 0,
      onTimePercentage:
        totalAssignedShifts > 0
          ? Math.round((onTimeArrivals / totalAssignedShifts) * 100)
          : 0,
    };
  }

  /**
   * Get agency staff metrics
   */
  private async getAgencyStaffMetrics(
    agencyId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<IAgencyAnalytics['staffMetrics']> {
    try {
      const staffMetrics = await this.organizationRoleModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(agencyId), // Updated field name
            roleId: { $in: ['care', 'nurse'] }, // Updated field name
          },
        },
        {
          $lookup: {
            from: 'shiftassignments',
            let: { userId: '$userId' }, // Updated field name
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      {
                        $gte: ['$createdAt', dateRange.startDate],
                      },
                      {
                        $lte: ['$createdAt', dateRange.endDate],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'shifts',
                  localField: 'shift',
                  foreignField: '_id',
                  as: 'shift',
                },
              },
              {
                $unwind: {
                  path: '$shift',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: 'assignments',
          },
        },
        {
          $lookup: {
            from: 'timesheets',
            let: { userId: '$userId' }, // Updated field name
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$carer', '$$userId'] },
                      { $eq: ['$status', 'approved'] }, // Only count approved timesheets
                      {
                        $gte: ['$createdAt', dateRange.startDate],
                      },
                      {
                        $lte: ['$createdAt', dateRange.endDate],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'shifts',
                  localField: 'shiftId', // Updated field name
                  foreignField: '_id',
                  as: 'shift',
                },
              },
              {
                $unwind: {
                  path: '$shift',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: 'timesheets',
          },
        },
        {
          $addFields: {
            assignmentShiftCounts: {
              $sum: {
                $map: {
                  input: '$assignments',
                  as: 'assignment',
                  in: { $ifNull: ['$$assignment.shift.count', 0] },
                },
              },
            },
            timesheetShiftCounts: {
              $sum: {
                $map: {
                  input: '$timesheets',
                  as: 'timesheet',
                  in: { $ifNull: ['$$timesheet.shift.count', 0] },
                },
              },
            },
            averageRating: {
              $cond: [
                { $gt: [{ $size: '$timesheets' }, 0] },
                { $avg: '$timesheets.rating' },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $gt: ['$assignmentShiftCounts', 0] },
                      { $gt: ['$timesheetShiftCounts', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            ratings: {
              $push: {
                $cond: [
                  { $ne: ['$averageRating', null] },
                  '$averageRating',
                  '$$REMOVE',
                ],
              },
            },
          },
        },
      ]);

      if (staffMetrics.length === 0) {
        return {
          total: 0,
          active: 0,
          byPerformance: {
            excellent: 0,
            good: 0,
            average: 0,
            belowAverage: 0,
          },
        };
      }

      const { total, active, ratings } = staffMetrics[0];

      // Calculate performance distribution
      const byPerformance = {
        excellent: ratings.filter((r: any) => r >= 4.5).length,
        good: ratings.filter((r: any) => r >= 4 && r < 4.5).length,
        average: ratings.filter((r: any) => r >= 3 && r < 4).length,
        belowAverage: ratings.filter((r: any) => r < 3).length,
      };

      return {
        total,
        active,
        byPerformance,
      };
    } catch (error) {
      this.logger.error('Error getting agency staff metrics:', error);
      throw new InternalServerErrorException('Failed to get staff metrics');
    }
  }

  /**
   * Get agency home relations
   */
  private async getAgencyHomeRelations(
    agencyId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<IAgencyAnalytics['homeRelations']> {
    try {
      return await this.shiftModel.aggregate([
        {
          $match: {
            agentId: new Types.ObjectId(agencyId),
            date: {
              $gte: dateRange.startDate.toISOString().split('T')[0],
              $lte: dateRange.endDate.toISOString().split('T')[0],
            },
          },
        },
        {
          $lookup: {
            from: 'organizations',
            localField: 'homeId',
            foreignField: '_id',
            as: 'home',
          },
        },
        {
          $unwind: '$home',
        },
        {
          $lookup: {
            from: 'timesheets',
            localField: '_id',
            foreignField: 'shiftId', // Updated field name
            as: 'timesheets',
          },
        },
        {
          $group: {
            _id: '$homeId',
            homeName: { $first: '$home.name' },
            documentCount: { $sum: 1 },
            shiftsReceived: { $sum: '$count' }, // Use count field
            shiftsCompleted: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$timesheets',
                            as: 'ts',
                            cond: { $eq: ['$$ts.status', 'approved'] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  '$count', // Use count field for completed shifts
                  0,
                ],
              },
            },
            staffAssigned: {
              $addToSet: '$assignedUsers',
            },
            ratings: {
              $push: '$timesheets.rating',
            },
            responseTime: {
              $avg: {
                $subtract: ['$updatedAt', '$createdAt'],
              },
            },
          },
        },
        {
          $project: {
            homeId: '$_id',
            homeName: 1,
            shiftsReceived: 1,
            shiftsCompleted: 1,
            staffAssigned: { $size: '$staffAssigned' },
            averageRating: { $avg: '$ratings' },
            responseRate: {
              $multiply: [
                {
                  $cond: [
                    { $eq: ['$shiftsReceived', 0] },
                    0,
                    { $divide: ['$shiftsCompleted', '$shiftsReceived'] },
                  ],
                },
                100,
              ],
            },
          },
        },
      ]);
    } catch (error) {
      this.logger.error('Error getting agency home relations:', error);
      throw new InternalServerErrorException('Failed to get home relations');
    }
  }

  /**
   * Get agency financials
   */
  private async getAgencyFinancials(
    agencyId: string | Types.ObjectId,
    timeRange: IDateRange
  ) {
    try {
      // This implementation will be commented out until Invoice model is migrated
      /* 
      const financials = await this.invoiceModel.aggregate([
        {
          $match: {
            agencyId: new Types.ObjectId(agencyId),
            createdAt: {
              $gte: timeRange.startDate,
              $lte: timeRange.endDate,
            },
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalEarnings: { $sum: '$totalAmount' },
                  invoiceCount: { $sum: 1 },
                  timesheetCount: { $sum: { $size: '$timesheetIds' } },
                },
              },
            ],
            daily: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                  },
                  amount: { $sum: '$totalAmount' },
                },
              },
            ],
            paymentStatus: [
              {
                $group: {
                  _id: '$status',
                  amount: { $sum: '$totalAmount' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]);

      const result = financials[0];
      const summary = result.summary[0] || {
        totalEarnings: 0,
        invoiceCount: 0,
        timesheetCount: 0,
      };

      const periodEarnings = {
        daily: result.daily.reduce((acc, { _id, amount }) => {
          acc[_id] = amount;
          return acc;
        }, {}),
      };

      const paymentStatus = result.paymentStatus.reduce(
        (acc, { _id, amount }) => {
          acc[_id] = amount;
          return acc;
        },
        { paid: 0, pending: 0, overdue: 0 }
      );

      return {
        totalEarnings: summary.totalEarnings,
        averagePerShift: summary.timesheetCount
          ? summary.totalEarnings / summary.timesheetCount
          : 0,
        periodEarnings,
        paymentStatus,
      };
      */

      // Temporary implementation until Invoice model is available
      return {
        totalEarnings: 0,
        averagePerShift: 0,
        periodEarnings: {
          daily: {},
        },
        paymentStatus: { paid: 0, pending: 0, overdue: 0 },
      };
    } catch (error) {
      this.logger.error('Error getting agency financials:', error);
      throw new InternalServerErrorException('Failed to get agency financials');
    }
  }

  /**
   * Get care home analytics
   */
  public async getCareHomeAnalytics(
    homeId: string | Types.ObjectId,
    dateRange?: IDateRange
  ): Promise<ICareHomeAnalytics> {
    try {
      const timeRange = await this.getDateRange(
        dateRange?.startDate,
        dateRange?.endDate
      );

      const prevTimeRange = {
        startDate: moment(timeRange.startDate).subtract(1, 'month').toDate(),
        endDate: moment(timeRange.endDate).subtract(1, 'month').toDate(),
      };

      // Convert homeId to ObjectId
      const homeObjectId = new Types.ObjectId(homeId);

      // Get shift distributions
      const publishedShifts = await this.getShiftDistribution(
        { homeId: homeObjectId },
        timeRange
      );

      const directShifts = await this.getShiftDistribution(
        {
          homeId: homeObjectId,
          agentId: { $exists: false },
        },
        timeRange
      );

      const agencyShifts = await this.getShiftDistribution(
        {
          homeId: homeObjectId,
          agentId: { $exists: true },
        },
        timeRange
      );

      // Get staffing metrics
      const staffing = await this.getCareHomeStaffingMetrics(homeId, timeRange);

      // Get agency relations
      const agencyRelations = await this.getCareHomeAgencyRelations(
        homeId,
        timeRange
      );

      // Get costs
      const costs = await this.getCareHomeCosts(homeId, timeRange);

      // Fetch raw shift data for new metrics
      const currentShifts = await this.shiftModel
        .find({
          homeId: homeObjectId,
          date: {
            $gte: timeRange.startDate.toISOString().split('T')[0],
            $lte: timeRange.endDate.toISOString().split('T')[0],
          },
        })
        .populate('shiftPattern')
        .populate('assignedUsers')
        .lean();

      const previousShifts = await this.shiftModel
        .find({
          homeId: homeObjectId,
          date: {
            $gte: prevTimeRange.startDate.toISOString().split('T')[0],
            $lte: prevTimeRange.endDate.toISOString().split('T')[0],
          },
        })
        .populate('shiftPattern')
        .populate('assignedUsers')
        .lean();

      // Calculate new metrics
      const fulfillmentMetrics = this.calculateFulfillmentMetrics(
        currentShifts,
        previousShifts
      );
      const staffConsistency = this.calculateStaffConsistency(
        currentShifts,
        previousShifts
      );
      const cancellationRisk = this.calculateCancellationRisk(currentShifts);
      const costEfficiency = this.calculateCostEfficiency(costs);
      const qualityIndex = this.calculateQualityIndex(
        staffing,
        publishedShifts
      );
      const patternEfficiency = this.calculatePatternEfficiency(currentShifts);
      const agencyDependency = this.calculateAgencyDependency(
        currentShifts,
        previousShifts
      );
      const advancePlanning = this.calculateAdvancePlanning(currentShifts);

      // Add staffConsistency data to staffing object
      staffing.consistency = staffConsistency.consistencyRate;
      staffing.returningStaff = staffConsistency.returningStaff;
      staffing.consistencyTrend = staffConsistency.consistencyTrend;

      return {
        homeId: homeObjectId,
        dateRange: timeRange,
        shifts: {
          published: publishedShifts,
          direct: directShifts,
          agency: agencyShifts,
        },
        staffing,
        agencyRelations,
        costs,
        innovativeMetrics: {
          fulfillment: fulfillmentMetrics,
          cancellationRisk,
          costEfficiency,
          qualityIndex,
          patternEfficiency,
          agencyDependency,
          advancePlanning,
        },
      };
    } catch (error) {
      this.logger.error('Error getting care home analytics:', error);
      throw new InternalServerErrorException(
        'Failed to get care home analytics'
      );
    }
  }

  /**
   * Calculate fulfillment metrics
   */
  private calculateFulfillmentMetrics(
    currentShifts: any[],
    previousShifts: any[]
  ) {
    // Filter shifts that have assigned users
    const fulfilledShifts = currentShifts.filter(
      (s) => s.assignedUsers && s.assignedUsers.length > 0
    );

    // Calculate average time between creation and assignment
    const avgHours =
      fulfilledShifts.length > 0
        ? fulfilledShifts.reduce((sum, shift) => {
            const created = new Date(shift.createdAt).getTime();
            const updated = new Date(shift.updatedAt).getTime();
            return sum + (updated - created) / (3600 * 1000);
          }, 0) / fulfilledShifts.length
        : 0;

    // Calculate for previous period for trend
    const prevFulfilledShifts = previousShifts.filter(
      (s) => s.assignedUsers && s.assignedUsers.length > 0
    );

    const prevAvgHours =
      prevFulfilledShifts.length > 0
        ? prevFulfilledShifts.reduce((sum, shift) => {
            const created = new Date(shift.createdAt).getTime();
            const updated = new Date(shift.updatedAt).getTime();
            return sum + (updated - created) / (3600 * 1000);
          }, 0) / prevFulfilledShifts.length
        : 0;

    const improvementRate =
      prevAvgHours && avgHours
        ? Math.round(((prevAvgHours - avgHours) / prevAvgHours) * 100)
        : 0;

    return {
      averageHours: Math.round(avgHours),
      trend: improvementRate,
      improvementRate,
    };
  }

  /**
   * Calculate staff consistency
   */
  private calculateStaffConsistency(
    currentShifts: any[],
    previousShifts: any[]
  ) {
    // Extract staff IDs from previous period
    const previousStaffIds = new Set(
      previousShifts.flatMap(
        (s) =>
          s.assignedUsers?.map((u: any) => u.toString() || u._id?.toString()) ||
          []
      )
    );

    // Count shifts with returning staff
    const shiftsWithReturningStaff = currentShifts.filter((shift) =>
      shift.assignedUsers?.some((userId: any) => {
        const id = userId.toString() || userId._id?.toString();
        return previousStaffIds.has(id);
      })
    ).length;

    const consistencyRate = currentShifts.length
      ? Math.round((shiftsWithReturningStaff / currentShifts.length) * 100)
      : 0;

    return {
      consistencyRate,
      returningStaff: previousStaffIds.size,
      consistencyTrend: 0, // Would calculate trend if earlier data available
    };
  }

  /**
   * Calculate cancellation risk
   */
  private calculateCancellationRisk(shifts: any[]) {
    const emergencyShifts = shifts.filter((s) => s.isEmergency).length;

    const latePublishedShifts = shifts.filter((s) => {
      const shiftDate = new Date(s.date);
      const publishDate = new Date(s.createdAt);
      return shiftDate.getTime() - publishDate.getTime() < 48 * 3600 * 1000; // Less than 48h
    }).length;

    const unfilledShifts = shifts.filter(
      (s) => !s.assignedUsers || s.assignedUsers.length === 0
    ).length;

    // Weight factors based on importance
    const score = shifts.length
      ? Math.round(
          ((emergencyShifts * 0.4 +
            latePublishedShifts * 0.3 +
            unfilledShifts * 0.3) /
            shifts.length) *
            100
        )
      : 0;

    return {
      score,
      atRiskShifts: emergencyShifts + latePublishedShifts + unfilledShifts,
    };
  }

  /**
   * Calculate cost efficiency
   */
  private calculateCostEfficiency(costs: any, benchmarkCost: number = 250) {
    // Default benchmark if not provided
    const totalShifts = costs.metrics?.totalShifts || 1;
    const avgCostPerShift = costs.total / totalShifts;

    // Calculate efficiency on 1-10 scale
    const efficiency =
      benchmarkCost > 0
        ? Math.min(
            10,
            Math.max(
              1,
              10 -
                5 *
                  Math.max(0, (avgCostPerShift - benchmarkCost) / benchmarkCost)
            )
          )
        : 5;

    const savings =
      benchmarkCost > 0
        ? Math.round(((benchmarkCost - avgCostPerShift) / benchmarkCost) * 100)
        : 0;

    return {
      rating: Math.round(efficiency * 10) / 10, // One decimal place
      savings,
      trend: 0, // Would calculate based on previous period
    };
  }

  /**
   * Calculate quality index
   */
  private calculateQualityIndex(staffing: any, shifts: any) {
    // Extract component scores
    const ratings =
      (staffing.byPerformance?.excellent || 0) * 5 +
      (staffing.byPerformance?.good || 0) * 4 +
      (staffing.byPerformance?.average || 0) * 3 +
      (staffing.byPerformance?.belowAverage || 0) * 2;
    const ratingsCount =
      (staffing.byPerformance?.excellent || 0) +
        (staffing.byPerformance?.good || 0) +
        (staffing.byPerformance?.average || 0) +
        (staffing.byPerformance?.belowAverage || 0) || 1;
    const avgRating = ratings / ratingsCount;

    const consistency = staffing.consistency || 0;
    const fulfillment =
      shifts.total > 0 ? (shifts.completed / shifts.total) * 100 : 0;

    // Weight the factors
    const score = Math.round(
      (avgRating / 5) * 40 + // 40% weight to ratings (0-5 scale)
        (consistency / 100) * 30 + // 30% weight to staff consistency (0-100%)
        (fulfillment / 100) * 30 // 30% weight to shift fulfillment (0-100%)
    );

    return {
      score,
      trend: 0, // Would calculate based on previous period
      components: { avgRating, consistency, fulfillment },
    };
  }

  /**
   * Calculate pattern efficiency
   */
  private calculatePatternEfficiency(shifts: any[]) {
    // Group shifts by pattern
    const shiftsByPattern = shifts.reduce((acc, shift) => {
      const pattern = shift.shiftPattern?._id?.toString() || 'unknown';
      acc[pattern] = (acc[pattern] || 0) + (shift.count || 1);
      return acc;
    }, {});

    const patternCount = Object.keys(shiftsByPattern).length || 1;

    // In a real implementation, would calculate actual efficiency metrics
    // For now, using a placeholder value
    const efficiency = Math.round(70 + Math.min(patternCount * 2, 20)); // Value between 70-90%

    return {
      efficiency,
      optimizationTips: Math.round(patternCount / 3),
      trend: 0,
    };
  }

  /**
   * Calculate agency dependency ratio
   */
  private calculateAgencyDependency(
    currentShifts: any[],
    previousShifts: any[]
  ) {
    // Calculate total and agency shifts
    const totalShifts = currentShifts.reduce(
      (sum, s) => sum + (s.count || 1),
      0
    );
    const agencyShifts = currentShifts
      .filter((s) => s.agentId)
      .reduce((sum, s) => sum + (s.count || 1), 0);

    const dependencyRatio =
      totalShifts > 0 ? Math.round((agencyShifts / totalShifts) * 100) : 0;

    // Calculate previous period for trend
    const prevTotal = previousShifts.reduce(
      (sum, s) => sum + (s.count || 1),
      0
    );
    const prevAgency = previousShifts
      .filter((s) => s.agentId)
      .reduce((sum, s) => sum + (s.count || 1), 0);

    const prevRatio = prevTotal > 0 ? (prevAgency / prevTotal) * 100 : 0;
    const reduction = Math.max(0, Math.round(prevRatio - dependencyRatio));

    return {
      dependencyRatio,
      reduction,
      trend: Math.round(prevRatio - dependencyRatio),
    };
  }

  /**
   * Calculate advance planning score
   */
  private calculateAdvancePlanning(shifts: any[]) {
    // Calculate average days between publishing and shift date
    const avgDays =
      shifts.length > 0
        ? shifts.reduce((sum, shift) => {
            const shiftDate = new Date(shift.date);
            const publishDate = new Date(shift.createdAt);
            return (
              sum +
              Math.max(
                0,
                (shiftDate.getTime() - publishDate.getTime()) / (86400 * 1000)
              )
            );
          }, 0) / shifts.length
        : 0;

    return {
      averageDays: Math.round(avgDays),
      improvement: 0, // Would need previous data
      trend: 0,
    };
  }

  /**
   * Get care home staffing metrics
   */
  private async getCareHomeStaffingMetrics(
    homeId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<ICareHomeAnalytics['staffing']> {
    try {
      const staffingMetrics = await this.organizationRoleModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(homeId), // Updated field name
            roleId: { $in: ['care'] }, // Updated field name
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId', // Updated field name
            foreignField: '_id',
            as: 'staff',
          },
        },
        {
          $unwind: '$staff',
        },
        {
          $lookup: {
            from: 'shiftassignments',
            let: { userId: '$userId' }, // Updated field name
            pipeline: [
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
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $eq: ['$shift.homeId', new Types.ObjectId(homeId)] },
                      { $eq: [{ $ifNull: ['$shift.agentId', null] }, null] }, // Only internal shifts
                      {
                        $and: [
                          {
                            $gte: [
                              '$shift.date',
                              dateRange.startDate.toISOString().split('T')[0],
                            ],
                          },
                          {
                            $lte: [
                              '$shift.date',
                              dateRange.endDate.toISOString().split('T')[0],
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'assignments',
          },
        },
        {
          $lookup: {
            from: 'timesheets',
            let: { userId: '$userId' }, // Updated field name
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$carer', '$$userId'] },
                      { $eq: ['$status', 'approved'] },
                      { $gte: ['$createdAt', dateRange.startDate] },
                      { $lte: ['$createdAt', dateRange.endDate] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'shifts',
                  localField: 'shiftId', // Updated field name
                  foreignField: '_id',
                  as: 'shift',
                },
              },
              {
                $unwind: {
                  path: '$shift',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: 'timesheets',
          },
        },
        {
          $addFields: {
            assignmentShiftCounts: {
              $sum: {
                $map: {
                  input: '$assignments',
                  as: 'assignment',
                  in: '$$assignment.shift.count',
                },
              },
            },
            timesheetShiftCounts: {
              $sum: {
                $map: {
                  input: '$timesheets',
                  as: 'timesheet',
                  in: { $ifNull: ['$$timesheet.shift.count', 0] },
                },
              },
            },
            averageRating: {
              $cond: [
                { $gt: [{ $size: '$timesheets' }, 0] },
                { $avg: '$timesheets.rating' },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $gt: ['$assignmentShiftCounts', 0] },
                      { $gt: ['$timesheetShiftCounts', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            byType: {
              $push: '$roleId', // Updated field name
            },
            byGender: {
              $push: '$staff.gender',
            },
            ratings: {
              $push: {
                $cond: [
                  { $ne: ['$averageRating', null] },
                  '$averageRating',
                  '$$REMOVE',
                ],
              },
            },
            utilizationByDate: {
              $push: {
                $cond: [
                  { $gt: [{ $size: '$assignments' }, 0] },
                  {
                    date: { $arrayElemAt: ['$assignments.shift.date', 0] },
                    count: {
                      $ifNull: [
                        { $arrayElemAt: ['$assignments.shift.count', 0] },
                        1,
                      ],
                    },
                  },
                  '$$REMOVE',
                ],
              },
            },
          },
        },
      ]);

      if (staffingMetrics.length === 0) {
        return {
          total: 0,
          active: 0,
          byType: {},
          utilization: {
            hourly: {},
            daily: {},
            weekly: {},
            monthly: {},
          },
          genderDistribution: { male: 0, female: 0 },
          byPerformance: {
            excellent: 0,
            good: 0,
            average: 0,
            belowAverage: 0,
          },
        };
      }

      const { total, active, byType, byGender, ratings, utilizationByDate } =
        staffingMetrics[0];

      // Process type distribution
      const typeDistribution: Record<string, number> = {};
      byType.forEach((type: string) => {
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });

      // Process gender distribution
      const genderDistribution = byGender.reduce(
        (acc: any, gender: string) => {
          if (gender?.toLowerCase() === 'male') acc.male++;
          if (gender?.toLowerCase() === 'female') acc.female++;
          return acc;
        },
        { male: 0, female: 0 }
      );

      // Process utilization
      const utilizationDaily: Record<string, number> = {};
      utilizationByDate.forEach((item: { date: string; count: number }) => {
        if (item && item.date) {
          utilizationDaily[item.date] =
            (utilizationDaily[item.date] || 0) + item.count;
        }
      });

      // Calculate performance distribution
      const byPerformance = {
        excellent: ratings.filter((r: any) => r >= 4.5).length,
        good: ratings.filter((r: any) => r >= 4 && r < 4.5).length,
        average: ratings.filter((r: any) => r >= 3 && r < 4).length,
        belowAverage: ratings.filter((r: any) => r < 3).length,
      };

      return {
        total,
        active,
        byType: typeDistribution,
        utilization: {
          hourly: {},
          daily: utilizationDaily,
          weekly: this.aggregateToWeekly(utilizationDaily),
          monthly: this.aggregateToMonthly(utilizationDaily),
        },
        genderDistribution,
        byPerformance,
      };
    } catch (error) {
      this.logger.error('Error getting care home staffing metrics:', error);
      throw new InternalServerErrorException('Failed to get staffing metrics');
    }
  }

  /**
   * Get care home agency relations
   */
  private async getCareHomeAgencyRelations(
    homeId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<ICareHomeAnalytics['agencyRelations']> {
    try {
      return await this.shiftModel.aggregate([
        {
          $match: {
            homeId: new Types.ObjectId(homeId),
            agentId: { $exists: true },
            date: {
              $gte: dateRange.startDate.toISOString().split('T')[0],
              $lte: dateRange.endDate.toISOString().split('T')[0],
            },
          },
        },
        {
          $lookup: {
            from: 'organizations',
            localField: 'agentId',
            foreignField: '_id',
            as: 'agency',
          },
        },
        {
          $unwind: '$agency',
        },
        {
          $lookup: {
            from: 'timesheets',
            localField: '_id',
            foreignField: 'shiftId', // Updated field name
            as: 'timesheets',
          },
        },
        {
          $group: {
            _id: '$agentId',
            agencyName: { $first: '$agency.name' },
            documentCount: { $sum: 1 },
            shiftsPublished: { $sum: '$count' }, // Use count field
            shiftsCompleted: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$timesheets',
                            as: 'ts',
                            cond: { $eq: ['$$ts.status', 'approved'] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  '$count', // Use count field for completed shifts
                  0,
                ],
              },
            },
            activeStaff: { $addToSet: '$assignedUsers' },
            ratings: { $push: '$timesheets.rating' },
            responseTime: {
              $avg: {
                $subtract: [{ $min: '$timesheets.createdAt' }, '$createdAt'],
              },
            },
          },
        },
        {
          $project: {
            agencyId: '$_id',
            agencyName: 1,
            shiftsPublished: 1,
            shiftsCompleted: 1,
            activeStaff: { $size: '$activeStaff' },
            averageRating: { $avg: '$ratings' },
            responseRate: {
              $multiply: [
                {
                  $cond: [
                    { $eq: ['$shiftsPublished', 0] },
                    0,
                    { $divide: ['$shiftsCompleted', '$shiftsPublished'] },
                  ],
                },
                100,
              ],
            },
          },
        },
      ]);
    } catch (error) {
      this.logger.error('Error getting care home agency relations:', error);
      throw new InternalServerErrorException('Failed to get agency relations');
    }
  }

  /**
   * Get care home costs
   */
  private async getCareHomeCosts(
    homeId: string | Types.ObjectId,
    dateRange: IDateRange
  ): Promise<any> {
    try {
      // This implementation will be commented out until Invoice model is migrated
      /* 
      const homeObjectId = new Types.ObjectId(homeId);

      const financialMetrics = await this.invoiceModel.aggregate([
        {
          $match: {
            homeId: homeObjectId,
            createdAt: {
              $gte: dateRange.startDate,
              $lte: dateRange.endDate,
            },
          },
        },
        {
          $lookup: {
            from: 'timesheets',
            localField: 'timesheetIds',
            foreignField: '_id',
            as: 'timesheets',
          },
        },
        {
          $lookup: {
            from: 'shifts',
            localField: 'timesheets.shiftId',
            foreignField: '_id',
            as: 'shifts',
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$totalAmount' },
                  paidAmount: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0],
                    },
                  },
                  pendingAmount: {
                    $sum: {
                      $cond: [
                        { $in: ['$status', ['pending', 'sent', 'accepted']] },
                        '$totalAmount',
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            byAgency: [
              {
                $group: {
                  _id: '$agencyId',
                  totalSpend: { $sum: '$totalAmount' },
                  invoiceCount: { $sum: 1 },
                  shiftCount: { $sum: { $size: '$timesheetIds' } },
                },
              },
            ],
            byDate: [
              {
                $unwind: '$shiftSummary',
              },
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    type: '$shiftSummary.k',
                  },
                  amount: { $sum: '$shiftSummary.v.totalAmount' },
                  weekdayHours: { $sum: '$shiftSummary.v.weekdayHours' },
                  weekendHours: { $sum: '$shiftSummary.v.weekendHours' },
                  emergencyHours: { $sum: '$shiftSummary.v.emergencyHours' },
                },
              },
            ],
            byShiftType: [
              {
                $unwind: '$shiftSummary',
              },
              {
                $group: {
                  _id: '$shiftSummary.k',
                  totalAmount: { $sum: '$shiftSummary.v.totalAmount' },
                  weekdayAmount: {
                    $sum: {
                      $multiply: [
                        '$shiftSummary.v.weekdayHours',
                        '$shiftSummary.v.weekdayRate',
                      ],
                    },
                  },
                  weekendAmount: {
                    $sum: {
                      $multiply: [
                        '$shiftSummary.v.weekendHours',
                        '$shiftSummary.v.weekendRate',
                      ],
                    },
                  },
                  emergencyAmount: {
                    $sum: {
                      $multiply: [
                        '$shiftSummary.v.emergencyHours',
                        '$shiftSummary.v.emergencyRate',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      const result = financialMetrics[0];
      const summary = result.summary[0] || {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };

      // Process daily costs into different time periods
      const dailyCosts = result.byDate.reduce((acc, { _id, amount }) => {
        const { date } = _id;
        acc[date] = (acc[date] || 0) + amount;
        return acc;
      }, {});

      // Process agency-wise costs
      const agencyCosts = result.byAgency.reduce((acc, agency) => {
        acc[agency._id.toString()] = {
          total: agency.totalSpend,
          invoiceCount: agency.invoiceCount,
          averagePerShift: agency.shiftCount
            ? agency.totalSpend / agency.shiftCount
            : 0,
        };
        return acc;
      }, {});

      // Process shift type costs
      const shiftTypeCosts = result.byShiftType.reduce((acc, type) => {
        acc[type._id] = {
          total: type.totalAmount,
          breakdown: {
            weekday: type.weekdayAmount,
            weekend: type.weekendAmount,
            emergency: type.emergencyAmount,
          },
        };
        return acc;
      }, {});

      return {
        total: summary.totalAmount,
        paid: summary.paidAmount,
        pending: summary.pendingAmount,
        byAgency: agencyCosts,
        byShiftType: shiftTypeCosts,
        trend: {
          hourly: this.calculateHourlyTrend(result.byDate),
          daily: dailyCosts,
          weekly: this.aggregateToWeekly(dailyCosts),
          monthly: this.aggregateToMonthly(dailyCosts),
        },
        metrics: {
          averagePerShift: this.calculateAveragePerShift(result.byAgency),
          topAgenciesBySpend: this.getTopAgenciesBySpend(agencyCosts, 5),
          costDistribution: this.calculateCostDistribution(shiftTypeCosts),
        },
      };
      */

      // Temporary implementation until Invoice model is available
      return {
        total: 0,
        paid: 0,
        pending: 0,
        byAgency: {},
        byShiftType: {},
        trend: {
          hourly: {},
          daily: {},
          weekly: {},
          monthly: {},
        },
        metrics: {
          averagePerShift: 0,
          topAgenciesBySpend: {},
          costDistribution: {},
        },
      };
    } catch (error) {
      this.logger.error('Error getting care home costs:', error);
      throw new InternalServerErrorException('Failed to get cost metrics');
    }
  }

  /**
   * Calculate hourly trend (placeholder implementation)
   */
  private calculateHourlyTrend(byDateData: any[]): Record<string, number> {
    // Implementation would calculate hourly cost trends
    return {};
  }

  /**
   * Calculate average cost per shift
   */
  private calculateAveragePerShift(agencyData: any[]): number {
    const totalSpend = agencyData.reduce(
      (sum, agency) => sum + agency.totalSpend,
      0
    );
    const totalShifts = agencyData.reduce(
      (sum, agency) => sum + agency.shiftCount,
      0
    );
    return totalShifts ? totalSpend / totalShifts : 0;
  }

  /**
   * Get top agencies by spend
   */
  private getTopAgenciesBySpend(
    agencyCosts: Record<string, any>,
    limit: number
  ) {
    return Object.entries(agencyCosts)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, limit)
      .reduce((acc: any, [id, data]) => {
        acc[id] = data;
        return acc;
      }, {});
  }

  /**
   * Calculate cost distribution
   */
  private calculateCostDistribution(shiftTypeCosts: Record<string, any>) {
    const total = Object.values(shiftTypeCosts).reduce(
      (sum, data: any) => sum + data.total,
      0
    );
    return Object.entries(shiftTypeCosts).reduce(
      (acc: any, [type, data]: [string, any]) => {
        acc[type] = total ? (data.total / total) * 100 : 0;
        return acc;
      },
      {}
    );
  }
}
