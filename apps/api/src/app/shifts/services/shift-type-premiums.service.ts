// shift-type-premiums.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateShiftTypePremiumDto,
  UpdateShiftTypePremiumDto,
  FindShiftTypePremiumDto,
} from '../dto/shift-type-premium.dto';

@Injectable()
export class ShiftTypePremiumsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateShiftTypePremiumDto) {
    // Check if the compensation rate exists
    const compRate = await this.prisma.staffCompensationRate.findUnique({
      where: { id: createDto.compensationRateId },
    });

    if (!compRate) {
      throw new NotFoundException(
        `Compensation rate with ID ${createDto.compensationRateId} not found`
      );
    }

    // Check if the shift type exists
    const shiftType = await this.prisma.shiftType.findUnique({
      where: { id: createDto.shiftTypeId },
    });

    if (!shiftType) {
      throw new NotFoundException(
        `Shift type with ID ${createDto.shiftTypeId} not found`
      );
    }

    return this.prisma.shiftTypePremium.create({
      data: {
        shiftTypeId: createDto.shiftTypeId,
        compensationRateId: createDto.compensationRateId,
        isPremiumPercentage: createDto.isPremiumPercentage,
        premiumValue: new Prisma.Decimal(createDto.premiumValue),
        effectiveDate: createDto.effectiveDate,
        endDate: createDto.endDate,
      },
      include: {
        shiftType: true,
        compensationRate: {
          include: {
            staffProfile: {
              include: { user: true },
            },
            department: true,
          },
        },
      },
    });
  }

  async findAll(query: FindShiftTypePremiumDto) {
    const where: Prisma.ShiftTypePremiumWhereInput = {};

    if (query.shiftTypeId) {
      where.shiftTypeId = query.shiftTypeId;
    }

    if (query.compensationRateId) {
      where.compensationRateId = query.compensationRateId;
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

    return this.prisma.shiftTypePremium.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 50,
      include: {
        shiftType: true,
        compensationRate: {
          include: {
            staffProfile: {
              include: { user: true },
            },
            department: true,
          },
        },
      },
      orderBy: [
        { shiftTypeId: 'asc' },
        { compensationRateId: 'asc' },
        { effectiveDate: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const premium = await this.prisma.shiftTypePremium.findUnique({
      where: { id },
      include: {
        shiftType: true,
        compensationRate: {
          include: {
            staffProfile: {
              include: { user: true },
            },
            department: true,
          },
        },
      },
    });

    if (!premium) {
      throw new NotFoundException(`Shift type premium with ID ${id} not found`);
    }

    return premium;
  }

  async update(id: string, updateDto: UpdateShiftTypePremiumDto) {
    const exists = await this.prisma.shiftTypePremium.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Shift type premium with ID ${id} not found`);
    }

    const data: Prisma.ShiftTypePremiumUpdateInput = {};

    if (updateDto.isPremiumPercentage !== undefined) {
      data.isPremiumPercentage = updateDto.isPremiumPercentage;
    }

    if (updateDto.premiumValue !== undefined) {
      data.premiumValue = new Prisma.Decimal(updateDto.premiumValue);
    }

    if (updateDto.effectiveDate !== undefined) {
      data.effectiveDate = updateDto.effectiveDate;
    }

    if (updateDto.endDate !== undefined) {
      data.endDate = updateDto.endDate;
    }

    return this.prisma.shiftTypePremium.update({
      where: { id },
      data,
      include: {
        shiftType: true,
        compensationRate: {
          include: {
            staffProfile: {
              include: { user: true },
            },
            department: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.shiftTypePremium.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Shift type premium with ID ${id} not found`);
    }

    return this.prisma.shiftTypePremium.delete({
      where: { id },
    });
  }

  // Special method to find applicable premiums for a specific staff profile and shift type
  async findApplicablePremiums(
    staffProfileId: string,
    departmentId: string,
    shiftTypeId: string
  ) {
    // First, find all active compensation rates for the staff profile and department
    const now = new Date();

    const activeRates = await this.prisma.staffCompensationRate.findMany({
      where: {
        staffProfileId,
        departmentId,
        effectiveDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (activeRates.length === 0) {
      return [];
    }

    // Then find all premiums for these rates and the specified shift type
    const premiums = await this.prisma.shiftTypePremium.findMany({
      where: {
        shiftTypeId,
        compensationRateId: { in: activeRates.map((rate) => rate.id) },
        effectiveDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        shiftType: true,
        compensationRate: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return premiums;
  }
}
