import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
} from '../../../../../core/src/lib/schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Shift, ShiftDocument } from '../../../../../core/src/lib/schemas';
import {
  Timesheet,
  TimesheetDocument,
} from '../../../../../core/src/lib/schemas';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  constructor(
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    @InjectModel(Shift.name)
    private shiftModel: Model<ShiftDocument>,
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<TimesheetDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>
  ) {}
  private calculateMonthGrowth(
    current: number,
    previous: number
  ): number | null {
    if (previous === 0) {
      return null;
    }
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
  private calculateCompletionTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
  async getCarerQuickStats(
    userId: string,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const prevStartDate = new Date(year, month - 2, 1);
      const prevEndDate = new Date(year, month - 1, 0);
      const carerId = userId;
      const stats = await this.shiftAssignmentModel.aggregate([
        {
          $facet: {
            currentMonth: [
              {
                $match: {
                  user: carerId,
                },
              },
              {
                $lookup: {
                  from: 'shifts',
                  localField: 'shift',
                  foreignField: '_id',
                  as: 'shiftDetails',
                },
              },
              {
                $unwind: '$shiftDetails',
              },
              {
                $match: {
                  'shiftDetails.date': {
                    $gte: startDate.toISOString().split('T')[0],
                    $lte: endDate.toISOString().split('T')[0],
                  },
                },
              },
              {
                $lookup: {
                  from: 'timesheets',
                  let: { shiftId: '$shift', carerId: '$user' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$shift_', '$$shiftId'] },
                            { $eq: ['$carer', '$$carerId'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'timesheet',
                },
              },
              {
                $group: {
                  _id: null,
                  totalShifts: { $sum: 1 },
                  completedShifts: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: [{ $size: '$timesheet' }, 0] },
                            {
                              $eq: [
                                { $arrayElemAt: ['$timesheet.status', 0] },
                                'approved',
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  pendingShifts: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: [{ $size: '$timesheet' }, 0] },
                            {
                              $eq: [
                                { $arrayElemAt: ['$timesheet.status', 0] },
                                'pending',
                              ],
                            },
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
                        { $gt: [{ $size: '$timesheet' }, 0] },
                        { $arrayElemAt: ['$timesheet.rating', 0] },
                        null,
                      ],
                    },
                  },
                  weeklyStats: {
                    $push: {
                      date: '$shiftDetails.date',
                      completed: {
                        $cond: [
                          {
                            $and: [
                              { $gt: [{ $size: '$timesheet' }, 0] },
                              {
                                $eq: [
                                  { $arrayElemAt: ['$timesheet.status', 0] },
                                  'approved',
                                ],
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            ],
            previousMonth: [],
          },
        },
      ]);
      const currentMonthStats = stats[0].currentMonth[0] || {
        totalShifts: 0,
        completedShifts: 0,
        pendingShifts: 0,
        ratings: [],
        weeklyStats: [],
      };
      const previousMonthStats = stats[0].previousMonth[0] || {
        totalShifts: 0,
        completedShifts: 0,
      };
      const monthGrowth = this.calculateMonthGrowth(
        currentMonthStats.totalShifts,
        previousMonthStats.totalShifts
      );
      const completionTrend = this.calculateCompletionTrend(
        currentMonthStats.completedShifts,
        previousMonthStats.completedShifts
      );
      const validRatings = currentMonthStats.ratings.filter(
        (rating: any) => rating != null
      );
      const averageRating =
        validRatings.length > 0
          ? validRatings.reduce((acc: any, val: any) => acc + val, 0) /
            validRatings.length
          : null;
      const weeklyAverage = Math.ceil(currentMonthStats.totalShifts / 4);
      return {
        overall: {
          totalShifts: currentMonthStats.totalShifts,
          completedShifts: currentMonthStats.completedShifts,
          pendingShifts: currentMonthStats.pendingShifts,
          weeklyAverage,
          monthOverMonthGrowth: monthGrowth,
          completionTrend: completionTrend,
          completionRate:
            currentMonthStats.totalShifts > 0
              ? Math.round(
                  (currentMonthStats.completedShifts /
                    currentMonthStats.totalShifts) *
                    100
                )
              : 0,
        },
        previousMonth: {
          totalShifts: previousMonthStats.totalShifts,
          completedShifts: previousMonthStats.completedShifts,
        },
        performance: {
          rating: averageRating ? Number(averageRating.toFixed(1)) : null,
          completionRate:
            currentMonthStats.totalShifts > 0
              ? Math.round(
                  (currentMonthStats.completedShifts /
                    currentMonthStats.totalShifts) *
                    100
                )
              : 0,
        },
      };
    } catch (error) {
      this.logger.error('Error getting carer quick stats:', error);
      throw new InternalServerErrorException('Failed to get quick stats');
    }
  }
  async getAgencyQuickStats(
    agencyId: string,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const prevStartDate = new Date(year, month - 2, 1);
      const prevEndDate = new Date(year, month - 1, 0);
      const stats = await this.shiftModel.aggregate([
        {
          $facet: {
            currentMonth: [
              {
                $match: {
                  agentId: agencyId,
                  date: {
                    $gte: startDate.toISOString().split('T')[0],
                    $lte: endDate.toISOString().split('T')[0],
                  },
                },
              },
              {
                $lookup: {
                  from: 'timesheets',
                  let: { shiftId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$shiftId', '$$shiftId'] },
                            { $eq: ['$agency', agencyId] },
                          ],
                        },
                      },
                    },
                    { $project: { status: 1, rating: 1 } },
                  ],
                  as: 'timesheets',
                },
              },
              {
                $group: {
                  _id: null,
                  totalAssignments: { $sum: 1 },
                  completedAssignments: {
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
                        1,
                        0,
                      ],
                    },
                  },
                  pendingAssignments: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$timesheets',
                                  as: 'ts',
                                  cond: { $eq: ['$$ts.status', 'pending'] },
                                },
                              },
                            },
                            0,
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  ratings: {
                    $push: {
                      $avg: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$timesheets',
                              as: 'ts',
                              cond: { $ne: ['$$ts.rating', null] },
                            },
                          },
                          as: 'rated',
                          in: '$$rated.rating',
                        },
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalAssignments: 1,
                  completedAssignments: 1,
                  pendingAssignments: 1,
                  ratings: {
                    $filter: {
                      input: '$ratings',
                      as: 'r',
                      cond: { $ne: ['$$r', null] },
                    },
                  },
                },
              },
            ],
            previousMonth: [
              {
                $match: {
                  agentId: agencyId,
                  date: {
                    $gte: prevStartDate.toISOString().split('T')[0],
                    $lte: prevEndDate.toISOString().split('T')[0],
                  },
                },
              },
              {
                $lookup: {
                  from: 'timesheets',
                  let: { shiftId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$shiftId', '$$shiftId'] },
                            { $eq: ['$agency', agencyId] },
                          ],
                        },
                      },
                    },
                    { $project: { status: 1 } },
                  ],
                  as: 'timesheets',
                },
              },
              {
                $group: {
                  _id: null,
                  totalAssignments: { $sum: 1 },
                  completedAssignments: {
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
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalAssignments: 1,
                  completedAssignments: 1,
                },
              },
            ],
            staffMetrics: [
              {
                $lookup: {
                  from: 'organizationroles',
                  let: { agencyId: agencyId },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$organizationId', '$$agencyId'] },
                            { $in: ['$roleId', ['care', 'nurse']] },
                            { $eq: ['$isActive', true] },
                          ],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: 'shiftassignments',
                        let: { userId: '$userId' },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $and: [
                                  { $eq: ['$user', '$$userId'] },
                                  { $gte: ['$createdAt', startDate] },
                                  { $lte: ['$createdAt', endDate] },
                                ],
                              },
                            },
                          },
                          { $limit: 1 },
                        ],
                        as: 'assignments',
                      },
                    },
                    {
                      $addFields: {
                        isActive: { $gt: [{ $size: '$assignments' }, 0] },
                      },
                    },
                    {
                      $group: {
                        _id: null,
                        totalStaff: { $sum: 1 },
                        activeStaff: { $sum: { $cond: ['$isActive', 1, 0] } },
                      },
                    },
                  ],
                  as: 'staffStats',
                },
              },
              {
                $unwind: {
                  path: '$staffStats',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 0,
                  totalStaff: '$staffStats.totalStaff',
                  activeStaff: '$staffStats.activeStaff',
                },
              },
            ],
          },
        },
      ]);
      const currentMonthStats = stats[0].currentMonth[0] || {
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        ratings: [],
      };
      const previousMonthStats = stats[0].previousMonth[0] || {
        totalAssignments: 0,
        completedAssignments: 0,
      };
      const staffStats = stats[0].staffMetrics[0] || {
        totalStaff: 0,
        activeStaff: 0,
      };
      const monthGrowth = this.calculateMonthGrowth(
        currentMonthStats.totalAssignments,
        previousMonthStats.totalAssignments
      );
      const completionTrend = this.calculateCompletionTrend(
        currentMonthStats.completedAssignments,
        previousMonthStats.completedAssignments
      );
      const validRatings = currentMonthStats.ratings.filter(
        (r: any) => r !== null
      );
      const averageRating =
        validRatings.length > 0
          ? Number(
              (
                validRatings.reduce((sum: any, val: any) => sum + val, 0) /
                validRatings.length
              ).toFixed(1)
            )
          : null;
      return {
        overall: {
          totalAssignments: currentMonthStats.totalAssignments,
          completedAssignments: currentMonthStats.completedAssignments,
          pendingAssignments: currentMonthStats.pendingAssignments,
          weeklyAverage: Math.round(currentMonthStats.totalAssignments / 4),
          monthOverMonthGrowth: monthGrowth,
          completionTrend: completionTrend,
          utilizationRate:
            currentMonthStats.totalAssignments > 0
              ? Math.round(
                  (currentMonthStats.completedAssignments /
                    currentMonthStats.totalAssignments) *
                    100
                )
              : 0,
        },
        staff: {
          total: staffStats.totalStaff || 0,
          active: staffStats.activeStaff || 0,
          utilization:
            staffStats.totalStaff > 0
              ? Math.round(
                  (staffStats.activeStaff / staffStats.totalStaff) * 100
                )
              : 0,
        },
        previousMonth: {
          totalAssignments: previousMonthStats.totalAssignments,
          completedAssignments: previousMonthStats.completedAssignments,
        },
        performance: {
          rating: averageRating,
          completionRate:
            currentMonthStats.totalAssignments > 0
              ? Math.round(
                  (currentMonthStats.completedAssignments /
                    currentMonthStats.totalAssignments) *
                    100
                )
              : 0,
        },
      };
    } catch (error) {
      this.logger.error('Error getting agency quick stats:', error);
      throw new InternalServerErrorException('Failed to get quick stats');
    }
  }
  async getHomeQuickStats(
    homeId: string,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const prevStartDate = new Date(year, month - 2, 1);
      const prevEndDate = new Date(year, month - 1, 0);
      const stats = await this.shiftModel.aggregate([
        {
          $facet: {
            currentMonth: [
              {
                $match: {
                  homeId: homeId,
                  date: {
                    $gte: startDate.toISOString().split('T')[0],
                    $lte: endDate.toISOString().split('T')[0],
                  },
                },
              },
              {
                $lookup: {
                  from: 'timesheets',
                  let: { shiftId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$shiftId', '$$shiftId'] },
                            {
                              $in: [
                                '$status',
                                ['pending', 'approved', 'rejected'],
                              ],
                            },
                          ],
                        },
                      },
                    },
                    { $project: { status: 1 } },
                  ],
                  as: 'timesheets',
                },
              },
              {
                $addFields: {
                  isAgencyShift: { $ne: ['$agentId', null] },
                },
              },
              {
                $group: {
                  _id: '$isAgencyShift',
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
                  pendingShiftsCount: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$timesheets',
                                  as: 'ts',
                                  cond: { $eq: ['$$ts.status', 'pending'] },
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
                },
              },
              {
                $group: {
                  _id: null,
                  totalStats: { $push: '$$ROOT' },
                  overallTotal: { $sum: '$totalShifts' },
                  overallCompleted: { $sum: '$completedShifts' },
                  overallPending: { $sum: '$pendingShiftsCount' },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalShifts: '$overallTotal',
                  completedShifts: '$overallCompleted',
                  pendingShiftsCount: '$overallPending',
                  weeklyAverage: {
                    $round: [{ $divide: ['$overallTotal', 4] }, 0],
                  },
                  utilizationRate: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $cond: [
                              { $eq: ['$overallTotal', 0] },
                              0,
                              {
                                $divide: ['$overallCompleted', '$overallTotal'],
                              },
                            ],
                          },
                          100,
                        ],
                      },
                      1,
                    ],
                  },
                  byType: {
                    $arrayToObject: {
                      $map: {
                        input: '$totalStats',
                        as: 'stat',
                        in: {
                          k: {
                            $cond: [
                              { $eq: ['$$stat._id', true] },
                              'agency',
                              'internal',
                            ],
                          },
                          v: {
                            total: '$$stat.totalShifts',
                            completed: '$$stat.completedShifts',
                            pending: '$$stat.pendingShiftsCount',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
            previousMonth: [
              {
                $match: {
                  homeId: homeId,
                  date: {
                    $gte: prevStartDate.toISOString().split('T')[0],
                    $lte: prevEndDate.toISOString().split('T')[0],
                  },
                },
              },
              {
                $lookup: {
                  from: 'timesheets',
                  let: { shiftId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$shiftId', '$$shiftId'] },
                            { $eq: ['$status', 'approved'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'timesheets',
                },
              },
              {
                $addFields: {
                  isAgencyShift: { $ne: ['$agentId', null] },
                },
              },
              {
                $group: {
                  _id: '$isAgencyShift',
                  documentCount: { $sum: 1 },
                  totalShifts: { $sum: '$count' },
                  completedShifts: {
                    $sum: {
                      $cond: [
                        { $gt: [{ $size: '$timesheets' }, 0] },
                        '$count',
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  previousMonthShifts: { $sum: '$totalShifts' },
                  previousMonthCompleted: { $sum: '$completedShifts' },
                  byType: { $push: '$$ROOT' },
                },
              },
              {
                $project: {
                  _id: 0,
                  previousMonthShifts: 1,
                  previousMonthCompleted: 1,
                  byType: {
                    $arrayToObject: {
                      $map: {
                        input: '$byType',
                        as: 'stat',
                        in: {
                          k: {
                            $cond: [
                              { $eq: ['$$stat._id', true] },
                              'agency',
                              'internal',
                            ],
                          },
                          v: {
                            total: '$$stat.totalShifts',
                            completed: '$$stat.completedShifts',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ]);
      const currentMonthStats = stats[0].currentMonth[0] || {
        totalShifts: 0,
        completedShifts: 0,
        pendingShiftsCount: 0,
        weeklyAverage: 0,
        utilizationRate: 0,
        byType: {
          agency: { total: 0, completed: 0, pending: 0 },
          internal: { total: 0, completed: 0, pending: 0 },
        },
      };
      const previousMonthStats = stats[0].previousMonth[0] || {
        previousMonthShifts: 0,
        previousMonthCompleted: 0,
        byType: {
          agency: { total: 0, completed: 0 },
          internal: { total: 0, completed: 0 },
        },
      };
      const monthGrowth = this.calculateMonthGrowth(
        currentMonthStats.totalShifts,
        previousMonthStats.previousMonthShifts
      );
      const completionTrend = this.calculateCompletionTrend(
        currentMonthStats.completedShifts,
        previousMonthStats.previousMonthCompleted
      );
      return {
        overall: {
          totalShifts: currentMonthStats.totalShifts,
          completedShifts: currentMonthStats.completedShifts,
          pendingShifts: currentMonthStats.pendingShiftsCount,
          weeklyAverage: currentMonthStats.weeklyAverage,
          utilizationRate: currentMonthStats.utilizationRate,
          monthOverMonthGrowth: monthGrowth,
          completionTrend: completionTrend,
        },
        internal: currentMonthStats.byType.internal || {
          total: 0,
          completed: 0,
          pending: 0,
        },
        agency: currentMonthStats.byType.agency || {
          total: 0,
          completed: 0,
          pending: 0,
        },
        previousMonth: {
          total: previousMonthStats.previousMonthShifts,
          completed: previousMonthStats.previousMonthCompleted,
          internal: previousMonthStats.byType.internal || {
            total: 0,
            completed: 0,
          },
          agency: previousMonthStats.byType.agency || {
            total: 0,
            completed: 0,
          },
        },
      };
    } catch (error) {
      this.logger.error('Error getting home quick stats:', error);
      throw new InternalServerErrorException('Failed to get quick stats');
    }
  }
}
