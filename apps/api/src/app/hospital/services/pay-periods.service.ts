// app/hospital/services/pay-periods.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayPeriodDto } from '../dto/create-pay-period.dto';
import { UpdatePayPeriodDto } from '../dto/update-pay-period.dto';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class PayPeriodsService {
  constructor(private prisma: PrismaService) {}

  async create(createPayPeriodDto: CreatePayPeriodDto, currentUser: User) {
    try {
      // Verify organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: createPayPeriodDto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID ${createPayPeriodDto.organizationId} not found`
        );
      }

      // Verify user has access to this organization
      if (currentUser.organizationId !== createPayPeriodDto.organizationId) {
        // Check if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You cannot create pay periods for organizations you do not belong to'
          );
        }
      }

      // Check for overlapping pay periods
      const overlappingPeriod = await this.prisma.payPeriod.findFirst({
        where: {
          organizationId: createPayPeriodDto.organizationId,
          OR: [
            {
              // New period starts during existing period
              startDate: {
                lte: createPayPeriodDto.endDate,
              },
              endDate: {
                gte: createPayPeriodDto.startDate,
              },
            },
          ],
        },
      });

      if (overlappingPeriod) {
        throw new ConflictException(
          'There is already a pay period that overlaps with this date range'
        );
      }

      // Create pay period
      const payPeriod = await this.prisma.payPeriod.create({
        data: {
          organizationId: createPayPeriodDto.organizationId,
          startDate: createPayPeriodDto.startDate,
          endDate: createPayPeriodDto.endDate,
          status: createPayPeriodDto.status || 'OPEN',
        },
      });

      return payPeriod;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Pay period already exists for this date range'
          );
        }
      }

      throw new BadRequestException(
        `Failed to create pay period: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PayPeriodWhereInput;
    orderBy?: Prisma.PayPeriodOrderByWithRelationInput;
    currentUser: User;
  }) {
    const { skip, take, where, orderBy, currentUser } = params;

    // If user is not system admin, restrict to their organization
    let finalWhere = where;
    if (currentUser.organizationId) {
      // Check if user has super admin permissions
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      if (!isSuperAdmin) {
        finalWhere = {
          ...where,
          organizationId: currentUser.organizationId,
        };
      }
    }

    try {
      const [payPeriods, total] = await Promise.all([
        this.prisma.payPeriod.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { payments: true },
            },
          },
        }),
        this.prisma.payPeriod.count({ where: finalWhere }),
      ]);

      return {
        payPeriods,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch pay periods: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const payPeriod = await this.prisma.payPeriod.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: {
            include: {
              staffProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payPeriod) {
        throw new NotFoundException(`Pay period with ID ${id} not found`);
      }

      // Check if user has permission to view this pay period
      if (currentUser.organizationId !== payPeriod.organizationId) {
        // Check if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You do not have permission to view this pay period'
          );
        }
      }

      return payPeriod;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch pay period: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updatePayPeriodDto: UpdatePayPeriodDto,
    currentUser: User
  ) {
    try {
      // First check if pay period exists and user has permission
      const existingPayPeriod = await this.findOne(id, currentUser);

      // If status is changing to FINALIZED, make sure all payments are processed
      if (
        updatePayPeriodDto.status === 'FINALIZED' &&
        existingPayPeriod.status !== 'FINALIZED'
      ) {
        const unprocessedPayments = await this.prisma.staffPayment.count({
          where: {
            payPeriodId: id,
            paymentStatus: 'PENDING',
          },
        });

        if (unprocessedPayments > 0) {
          throw new BadRequestException(
            'Cannot finalize pay period with unprocessed payments'
          );
        }
      }

      // If status is changing to CALCULATING, generate payment records for all staff
      if (
        updatePayPeriodDto.status === 'CALCULATING' &&
        existingPayPeriod.status === 'OPEN'
      ) {
        await this.generatePaymentRecords(id, currentUser);
      }

      // If dates are being updated, check for overlapping pay periods
      if (updatePayPeriodDto.startDate || updatePayPeriodDto.endDate) {
        const startDate =
          updatePayPeriodDto.startDate || existingPayPeriod.startDate;
        const endDate = updatePayPeriodDto.endDate || existingPayPeriod.endDate;

        const overlappingPeriod = await this.prisma.payPeriod.findFirst({
          where: {
            id: { not: id },
            organizationId: existingPayPeriod.organizationId,
            OR: [
              {
                // Updated period starts during existing period
                startDate: {
                  lte: endDate,
                },
                endDate: {
                  gte: startDate,
                },
              },
            ],
          },
        });

        if (overlappingPeriod) {
          throw new ConflictException(
            'There is already a pay period that overlaps with this date range'
          );
        }
      }

      // Update pay period
      const updatedPayPeriod = await this.prisma.payPeriod.update({
        where: { id },
        data: updatePayPeriodDto,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedPayPeriod;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update pay period: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if pay period exists and user has permission
      const existingPayPeriod = await this.findOne(id, currentUser);

      // Cannot delete pay periods with payments
      const paymentsCount = await this.prisma.staffPayment.count({
        where: { payPeriodId: id },
      });

      if (paymentsCount > 0) {
        throw new BadRequestException(
          'Cannot delete pay period with associated payments'
        );
      }

      // Delete pay period
      await this.prisma.payPeriod.delete({
        where: { id },
      });

      return { message: 'Pay period deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete pay period: ${error.message}`
      );
    }
  }

  // Helper method to generate payment records for all staff
  private async generatePaymentRecords(payPeriodId: string, currentUser: User) {
    try {
      // Get pay period details
      const payPeriod = await this.prisma.payPeriod.findUnique({
        where: { id: payPeriodId },
      });

      if (!payPeriod) {
        throw new NotFoundException(
          `Pay period with ID ${payPeriodId} not found`
        );
      }

      // Get all staff profiles with at least one shift during this pay period
      const staffWithShifts = await this.prisma.staffProfile.findMany({
        where: {
          shiftSchedules: {
            some: {
              startDateTime: {
                gte: payPeriod.startDate,
              },
              endDateTime: {
                lte: payPeriod.endDate,
              },
              status: {
                in: ['COMPLETED'],
              },
            },
          },
          user: {
            organizationId: payPeriod.organizationId,
            isActive: true,
          },
        },
        include: {
          shiftSchedules: {
            where: {
              startDateTime: {
                gte: payPeriod.startDate,
              },
              endDateTime: {
                lte: payPeriod.endDate,
              },
              status: {
                in: ['COMPLETED'],
              },
            },
            include: {
              shiftType: true,
              attendance: true,
              department: true,
            },
          },
          compensationRates: {
            where: {
              effectiveDate: {
                lte: payPeriod.endDate,
              },
              OR: [
                { endDate: null },
                { endDate: { gte: payPeriod.startDate } },
              ],
            },
          },
        },
      });

      // For each staff, calculate payment
      for (const staff of staffWithShifts) {
        // Check if payment record already exists
        const existingPayment = await this.prisma.staffPayment.findUnique({
          where: {
            staffProfileId_payPeriodId: {
              staffProfileId: staff.id,
              payPeriodId: payPeriodId,
            },
          },
        });

        if (existingPayment) {
          continue; // Skip if payment already exists
        }

        // Calculate regular and overtime hours and pay
        let regularHours = 0;
        let overtimeHours = 0;
        let regularPay = 0;
        let overtimePay = 0;
        let specialtyBonus = 0;

        for (const shift of staff.shiftSchedules) {
          // Get compensation rate for the shift's department
          const compRate = staff.compensationRates.find(
            (cr) => cr.departmentId === shift.departmentId
          );

          if (!compRate) {
            continue; // Skip if no compensation rate for this department
          }

          // Calculate shift duration in hours
          const shiftHours = shift.shiftType.hoursCount;

          // Add to regular hours
          regularHours += shiftHours;

          // Calculate base pay for this shift
          const basePayRate = parseFloat(compRate.baseRate.toString());
          const shiftBasePay =
            basePayRate *
            shiftHours *
            shift.shiftType.basePayMultiplier *
            compRate.experienceMultiplier;

          regularPay += shiftBasePay;

          // Add specialty bonus if applicable
          const bonusRate = parseFloat(compRate.specialtyBonus.toString());
          if (bonusRate > 0) {
            specialtyBonus += bonusRate * shiftHours;
          }

          // Add overtime if any
          if (shift.attendance && shift.attendance.overtimeMinutes > 0) {
            const overtimeHrs = shift.attendance.overtimeMinutes / 60;
            overtimeHours += overtimeHrs;

            // Overtime pay is typically 1.5x regular rate
            overtimePay +=
              basePayRate * overtimeHrs * 1.5 * compRate.experienceMultiplier;
          }
        }
        // Calculate total pay
        const totalPay = regularPay + overtimePay + specialtyBonus;

        // Create payment record
        await this.prisma.staffPayment.create({
          data: {
            staffProfileId: staff.id,
            payPeriodId: payPeriodId,
            regularHours: Math.round(regularHours * 100) / 100, // Round to 2 decimal places
            overtimeHours: Math.round(overtimeHours * 100) / 100,
            regularPay: Math.round(regularPay * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            specialtyBonus: Math.round(specialtyBonus * 100) / 100,
            otherBonuses: 0,
            deductions: 0,
            totalPay: Math.round(totalPay * 100) / 100,
            paymentStatus: 'PENDING',
          },
        });
      }

      // Update pay period status to CALCULATING
      await this.prisma.payPeriod.update({
        where: { id: payPeriodId },
        data: { status: 'CALCULATING' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate payment records: ${error.message}`
      );
    }
  }
}
