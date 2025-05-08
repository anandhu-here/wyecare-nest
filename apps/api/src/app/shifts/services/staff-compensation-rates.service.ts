// staff-compensation-rates.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateStaffCompensationRateDto,
  UpdateStaffCompensationRateDto,
  FindStaffCompensationRateDto,
} from '../dto/staff-compensation-rate.dto';

@Injectable()
export class StaffCompensationRatesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateStaffCompensationRateDto) {
    return this.prisma.staffCompensationRate.create({
      data: {
        staffProfileId: createDto.staffProfileId,
        departmentId: createDto.departmentId,
        baseRate: new Prisma.Decimal(createDto.baseRate),
        paymentType: createDto.paymentType,
        specialtyBonus: createDto.specialtyBonus
          ? new Prisma.Decimal(createDto.specialtyBonus)
          : new Prisma.Decimal(0),
        experienceMultiplier: createDto.experienceMultiplier || 1.0,
        effectiveDate: createDto.effectiveDate,
        endDate: createDto.endDate,
      },
      include: {
        staffProfile: {
          include: { user: true },
        },
        department: true,
        shiftPremiums: {
          include: { shiftType: true },
        },
      },
    });
  }

  async findAll(query: FindStaffCompensationRateDto) {
    const where: Prisma.StaffCompensationRateWhereInput = {};

    if (query.staffProfileId) {
      where.staffProfileId = query.staffProfileId;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.paymentType) {
      where.paymentType = query.paymentType;
    }

    if (query.effectiveDate) {
      where.effectiveDate = {
        lte: query.effectiveDate,
      };

      where.OR = [{ endDate: null }, { endDate: { gte: query.effectiveDate } }];
    }

    if (query.active) {
      const now = new Date();
      where.OR = [{ endDate: null }, { endDate: { gte: now } }];
    }

    return this.prisma.staffCompensationRate.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 50,
      include: {
        staffProfile: {
          include: { user: true },
        },
        department: true,
        shiftPremiums: query.includePremiums
          ? {
              include: { shiftType: true },
            }
          : false,
      },
      orderBy: [
        { staffProfileId: 'asc' },
        { departmentId: 'asc' },
        { effectiveDate: 'desc' },
      ],
    });
  }

  async findOne(id: string, includePremiums: boolean = false) {
    const rate = await this.prisma.staffCompensationRate.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: { user: true },
        },
        department: true,
        shiftPremiums: includePremiums
          ? {
              include: { shiftType: true },
            }
          : false,
      },
    });

    if (!rate) {
      throw new NotFoundException(
        `Staff compensation rate with ID ${id} not found`
      );
    }

    return rate;
  }

  async update(id: string, updateDto: UpdateStaffCompensationRateDto) {
    const exists = await this.prisma.staffCompensationRate.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(
        `Staff compensation rate with ID ${id} not found`
      );
    }

    const data: Prisma.StaffCompensationRateUpdateInput = {};

    if (updateDto.baseRate !== undefined) {
      data.baseRate = new Prisma.Decimal(updateDto.baseRate);
    }

    if (updateDto.paymentType !== undefined) {
      data.paymentType = updateDto.paymentType;
    }

    if (updateDto.specialtyBonus !== undefined) {
      data.specialtyBonus = new Prisma.Decimal(updateDto.specialtyBonus);
    }

    if (updateDto.experienceMultiplier !== undefined) {
      data.experienceMultiplier = updateDto.experienceMultiplier;
    }

    if (updateDto.effectiveDate !== undefined) {
      data.effectiveDate = updateDto.effectiveDate;
    }

    if (updateDto.endDate !== undefined) {
      data.endDate = updateDto.endDate;
    }

    return this.prisma.staffCompensationRate.update({
      where: { id },
      data,
      include: {
        staffProfile: {
          include: { user: true },
        },
        department: true,
        shiftPremiums: {
          include: { shiftType: true },
        },
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.staffCompensationRate.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(
        `Staff compensation rate with ID ${id} not found`
      );
    }

    // First delete any related shift premiums
    await this.prisma.shiftTypePremium.deleteMany({
      where: { compensationRateId: id },
    });

    // Then delete the compensation rate
    return this.prisma.staffCompensationRate.delete({
      where: { id },
    });
  }

  // Special method to find current effective rate for a staff member in a department
  async findCurrentRate(staffProfileId: string, departmentId: string) {
    const now = new Date();

    const rate = await this.prisma.staffCompensationRate.findFirst({
      where: {
        staffProfileId,
        departmentId,
        effectiveDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        staffProfile: true,
        department: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      throw new NotFoundException(
        `No active compensation rate found for staff ${staffProfileId} in department ${departmentId}`
      );
    }

    return rate;
  }

  // Method to calculate pay for a shift
  async calculateShiftPay(
    staffProfileId: string,
    departmentId: string,
    shiftTypeId: string,
    hoursWorked: number
  ) {
    // Get the current compensation rate
    const rate = await this.findCurrentRate(staffProfileId, departmentId);

    // Get the shift premium for this shift type and compensation rate, if any
    const premium = await this.prisma.shiftTypePremium.findFirst({
      where: {
        compensationRateId: rate.id,
        shiftTypeId,
        effectiveDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    // Get the shift type for its base multiplier
    const shiftType = await this.prisma.shiftType.findUnique({
      where: { id: shiftTypeId },
    });

    if (!shiftType) {
      throw new NotFoundException(
        `Shift type with ID ${shiftTypeId} not found`
      );
    }

    // Base pay calculation depends on payment type
    let basePay = 0;

    // For hourly rates, simply multiply by hours worked
    if (rate.paymentType === 'HOURLY') {
      basePay = parseFloat(rate.baseRate.toString()) * hoursWorked;
    }
    // For weekly rates, calculate the hourly equivalent
    else if (rate.paymentType === 'WEEKLY') {
      // Assuming 40-hour workweek
      const hourlyRate = parseFloat(rate.baseRate.toString()) / 40;
      basePay = hourlyRate * hoursWorked;
    }
    // For monthly rates, calculate the hourly equivalent
    else if (rate.paymentType === 'MONTHLY') {
      // Assuming 160 hours per month (40 hours * 4 weeks)
      const hourlyRate = parseFloat(rate.baseRate.toString()) / 160;
      basePay = hourlyRate * hoursWorked;
    }

    // Apply shift type's base multiplier
    let adjustedPay = basePay * shiftType.basePayMultiplier;

    // Apply specialty bonus (prorated for the hours worked)
    const specialtyBonus = parseFloat(rate.specialtyBonus.toString());
    if (specialtyBonus > 0) {
      if (rate.paymentType === 'HOURLY') {
        adjustedPay += specialtyBonus * hoursWorked;
      } else if (rate.paymentType === 'WEEKLY') {
        adjustedPay += (specialtyBonus / 40) * hoursWorked;
      } else if (rate.paymentType === 'MONTHLY') {
        adjustedPay += (specialtyBonus / 160) * hoursWorked;
      }
    }

    // Apply experience multiplier
    adjustedPay *= rate.experienceMultiplier;

    // Apply shift premium if available
    if (premium) {
      if (premium.isPremiumPercentage) {
        adjustedPay *= 1 + parseFloat(premium.premiumValue.toString());
      } else {
        // For fixed amount premiums, add the premium per hour
        adjustedPay +=
          parseFloat(premium.premiumValue.toString()) * hoursWorked;
      }
    }

    return {
      baseRate: parseFloat(rate.baseRate.toString()),
      paymentType: rate.paymentType,
      specialtyBonus: specialtyBonus,
      experienceMultiplier: rate.experienceMultiplier,
      shiftMultiplier: shiftType.basePayMultiplier,
      shiftPremium: premium
        ? {
            isPremiumPercentage: premium.isPremiumPercentage,
            premiumValue: parseFloat(premium.premiumValue.toString()),
          }
        : null,
      hoursWorked,
      basePay,
      totalPay: adjustedPay,
    };
  }
}
