// app/hospital/services/staff-payments.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffPaymentDto } from '../dto/create-staff-payment.dto';
import { UpdateStaffPaymentDto } from '../dto/update-staff-payment.dto';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class StaffPaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createStaffPaymentDto: CreateStaffPaymentDto,
    currentUser: User
  ) {
    try {
      // Verify staff profile exists
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { id: createStaffPaymentDto.staffProfileId },
        include: { user: true },
      });

      if (!staffProfile) {
        throw new NotFoundException(
          `Staff profile with ID ${createStaffPaymentDto.staffProfileId} not found`
        );
      }

      // Verify pay period exists
      const payPeriod = await this.prisma.payPeriod.findUnique({
        where: { id: createStaffPaymentDto.payPeriodId },
      });

      if (!payPeriod) {
        throw new NotFoundException(
          `Pay period with ID ${createStaffPaymentDto.payPeriodId} not found`
        );
      }

      // Check if organization matches
      if (staffProfile.user.organizationId !== payPeriod.organizationId) {
        throw new BadRequestException(
          'Staff and pay period must belong to the same organization'
        );
      }

      // Verify user has access to this organization
      if (currentUser.organizationId !== staffProfile.user.organizationId) {
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
            'You cannot create payments for staff from other organizations'
          );
        }
      }

      // Check if payment already exists
      const existingPayment = await this.prisma.staffPayment.findUnique({
        where: {
          staffProfileId_payPeriodId: {
            staffProfileId: createStaffPaymentDto.staffProfileId,
            payPeriodId: createStaffPaymentDto.payPeriodId,
          },
        },
      });

      if (existingPayment) {
        throw new ConflictException(
          `Payment already exists for this staff member and pay period`
        );
      }

      // Calculate total pay
      const totalPay =
        createStaffPaymentDto.regularPay +
        createStaffPaymentDto.overtimePay +
        createStaffPaymentDto.specialtyBonus +
        createStaffPaymentDto.otherBonuses -
        createStaffPaymentDto.deductions;

      // Create payment
      const payment = await this.prisma.staffPayment.create({
        data: {
          staffProfileId: createStaffPaymentDto.staffProfileId,
          payPeriodId: createStaffPaymentDto.payPeriodId,
          regularHours: createStaffPaymentDto.regularHours,
          overtimeHours: createStaffPaymentDto.overtimeHours,
          regularPay: createStaffPaymentDto.regularPay,
          overtimePay: createStaffPaymentDto.overtimePay,
          specialtyBonus: createStaffPaymentDto.specialtyBonus,
          otherBonuses: createStaffPaymentDto.otherBonuses,
          deductions: createStaffPaymentDto.deductions,
          totalPay,
          paymentStatus: createStaffPaymentDto.paymentStatus || 'PENDING',
          paymentDate: createStaffPaymentDto.paymentDate,
        },
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
          payPeriod: true,
        },
      });

      return payment;
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
        `Failed to create staff payment: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StaffPaymentWhereInput;
    orderBy?: Prisma.StaffPaymentOrderByWithRelationInput;
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
        // Get staff profile for user
        const staffProfile = await this.prisma.staffProfile.findUnique({
          where: { userId: currentUser.id },
        });

        // Check if user has HR role or admin role
        const isHROrAdmin = await this.prisma.userRole.findFirst({
          where: {
            userId: currentUser.id,
            role: {
              OR: [
                { name: 'HR', organizationId: currentUser.organizationId },
                { name: 'Admin', organizationId: currentUser.organizationId },
                {
                  name: 'Hospital Admin',
                  organizationId: currentUser.organizationId,
                },
              ],
            },
          },
        });

        if (isHROrAdmin) {
          // HR and admins can see all payments in their organization
          finalWhere = {
            ...where,
            payPeriod: {
              organizationId: currentUser.organizationId,
            },
          };
        } else if (staffProfile) {
          // Regular staff can only see their own payments
          finalWhere = {
            ...where,
            staffProfileId: staffProfile.id,
          };
        } else {
          // Other users with no specific role can't see any payments
          finalWhere = {
            ...where,
            staffProfileId: 'no-access', // This ensures no results
          };
        }
      }
    }

    try {
      const [payments, total] = await Promise.all([
        this.prisma.staffPayment.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
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
            payPeriod: true,
          },
        }),
        this.prisma.staffPayment.count({ where: finalWhere }),
      ]);

      return {
        payments,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch staff payments: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const payment = await this.prisma.staffPayment.findUnique({
        where: { id },
        include: {
          staffProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  organizationId: true,
                },
              },
            },
          },
          payPeriod: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Staff payment with ID ${id} not found`);
      }

      // Check if user has permission to view this payment
      const isOwnPayment = currentUser.id === payment.staffProfile.userId;
      const isSameOrganization =
        currentUser.organizationId === payment.staffProfile.user.organizationId;

      if (!isOwnPayment && !isSameOrganization) {
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
            'You do not have permission to view this payment'
          );
        }
      }

      // If user is viewing their own payment but doesn't have HR/Admin role, redact some fields
      if (isOwnPayment && !isSameOrganization) {
        const isHROrAdmin = await this.prisma.userRole.findFirst({
          where: {
            userId: currentUser.id,
            role: {
              OR: [
                { name: 'HR', organizationId: currentUser.organizationId },
                { name: 'Admin', organizationId: currentUser.organizationId },
                {
                  name: 'Hospital Admin',
                  organizationId: currentUser.organizationId,
                },
              ],
            },
          },
        });

        if (!isHROrAdmin) {
          // Redact sensitive fields
          delete payment['deductions'];
          delete payment['overtimePay'];
        }
      }

      return payment;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff payment: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    updateStaffPaymentDto: UpdateStaffPaymentDto,
    currentUser: User
  ) {
    try {
      // First check if payment exists and user has permission
      const existingPayment = await this.findOne(id, currentUser);

      // Only HR and admins can update payments
      const isHROrAdmin = await this.prisma.userRole.findFirst({
        where: {
          userId: currentUser.id,
          role: {
            OR: [
              { name: 'HR', organizationId: currentUser.organizationId },
              { name: 'Admin', organizationId: currentUser.organizationId },
              {
                name: 'Hospital Admin',
                organizationId: currentUser.organizationId,
              },
              { name: 'Super Admin', isSystemRole: true },
            ],
          },
        },
      });

      if (!isHROrAdmin) {
        throw new UnauthorizedException(
          'Only HR and administrators can update payments'
        );
      }

      // Cannot update payments for finalized pay periods
      const payPeriod = await this.prisma.payPeriod.findUnique({
        where: { id: existingPayment.payPeriodId },
      });

      if (payPeriod.status === 'FINALIZED' || payPeriod.status === 'PAID') {
        throw new BadRequestException(
          'Cannot update payments for finalized or paid pay periods'
        );
      }

      // Calculate total pay if any relevant fields are updated
      let totalPay = existingPayment.totalPay;

      if (
        updateStaffPaymentDto.regularPay !== undefined ||
        updateStaffPaymentDto.overtimePay !== undefined ||
        updateStaffPaymentDto.specialtyBonus !== undefined ||
        updateStaffPaymentDto.otherBonuses !== undefined ||
        updateStaffPaymentDto.deductions !== undefined
      ) {
        totalPay = ((updateStaffPaymentDto.regularPay !== undefined
          ? updateStaffPaymentDto.regularPay
          : existingPayment.regularPay.toNumber()) +
          (updateStaffPaymentDto.overtimePay !== undefined
            ? updateStaffPaymentDto.overtimePay
            : existingPayment.overtimePay.toNumber()) +
          (updateStaffPaymentDto.specialtyBonus !== undefined
            ? updateStaffPaymentDto.specialtyBonus
            : existingPayment.specialtyBonus.toNumber()) +
          (updateStaffPaymentDto.otherBonuses !== undefined
            ? updateStaffPaymentDto.otherBonuses
            : existingPayment.otherBonuses.toNumber()) -
          (updateStaffPaymentDto.deductions !== undefined
            ? updateStaffPaymentDto.deductions
            : existingPayment.deductions.toNumber())) as any;
      }

      // Update payment
      const updatedPayment = await this.prisma.staffPayment.update({
        where: { id },
        data: {
          ...updateStaffPaymentDto,
          totalPay,
        },
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
          payPeriod: true,
        },
      });

      return updatedPayment;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update staff payment: ${error.message}`
      );
    }
  }

  async remove(id: string, currentUser: User) {
    try {
      // First check if payment exists and user has permission
      const existingPayment = await this.findOne(id, currentUser);

      // Only HR and admins can delete payments
      const isHROrAdmin = await this.prisma.userRole.findFirst({
        where: {
          userId: currentUser.id,
          role: {
            OR: [
              { name: 'HR', organizationId: currentUser.organizationId },
              { name: 'Admin', organizationId: currentUser.organizationId },
              {
                name: 'Hospital Admin',
                organizationId: currentUser.organizationId,
              },
              { name: 'Super Admin', isSystemRole: true },
            ],
          },
        },
      });

      if (!isHROrAdmin) {
        throw new UnauthorizedException(
          'Only HR and administrators can delete payments'
        );
      }

      // Cannot delete payments for finalized pay periods
      const payPeriod = await this.prisma.payPeriod.findUnique({
        where: { id: existingPayment.payPeriodId },
      });

      if (payPeriod.status === 'FINALIZED' || payPeriod.status === 'PAID') {
        throw new BadRequestException(
          'Cannot delete payments for finalized or paid pay periods'
        );
      }

      // Delete payment
      await this.prisma.staffPayment.delete({
        where: { id },
      });

      return { message: 'Staff payment deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete staff payment: ${error.message}`
      );
    }
  }
}
