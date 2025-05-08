// payment-rules.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreatePaymentRuleDto,
  UpdatePaymentRuleDto,
  FindPaymentRuleDto,
} from '../dto/payment-rule.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentRulesService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentRuleDto: CreatePaymentRuleDto) {
    return this.prisma.paymentRule.create({
      data: {
        shiftTypeId: createPaymentRuleDto.shiftTypeId,
        roleId: createPaymentRuleDto.roleId,
        paymentType: createPaymentRuleDto.paymentType,
        baseRate: new Prisma.Decimal(createPaymentRuleDto.baseRate),
        specialtyBonus: createPaymentRuleDto.specialtyBonus
          ? new Prisma.Decimal(createPaymentRuleDto.specialtyBonus)
          : new Prisma.Decimal(0),
        experienceMultiplier: createPaymentRuleDto.experienceMultiplier || 1.0,
        effectiveDate: createPaymentRuleDto.effectiveDate,
        endDate: createPaymentRuleDto.endDate,
        organizationId: createPaymentRuleDto.organizationId,
      },
      include: {
        shiftType: true,
        role: true,
        organization: true,
      },
    });
  }

  async findAll(query: FindPaymentRuleDto) {
    const where: Prisma.PaymentRuleWhereInput = {};

    if (query.shiftTypeId) {
      where.shiftTypeId = query.shiftTypeId;
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
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

    return this.prisma.paymentRule.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 50,
      include: {
        shiftType: true,
        role: true,
      },
      orderBy: [
        { roleId: 'asc' },
        { shiftTypeId: 'asc' },
        { effectiveDate: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const paymentRule = await this.prisma.paymentRule.findUnique({
      where: { id },
      include: {
        shiftType: true,
        role: true,
        organization: true,
      },
    });

    if (!paymentRule) {
      throw new NotFoundException(`Payment rule with ID ${id} not found`);
    }

    return paymentRule;
  }

  async update(id: string, updatePaymentRuleDto: UpdatePaymentRuleDto) {
    const exists = await this.prisma.paymentRule.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Payment rule with ID ${id} not found`);
    }

    const data: Prisma.PaymentRuleUpdateInput = {};

    if (updatePaymentRuleDto.shiftTypeId !== undefined) {
      data.shiftType = { connect: { id: updatePaymentRuleDto.shiftTypeId } };
    }

    if (updatePaymentRuleDto.roleId !== undefined) {
      data.role = { connect: { id: updatePaymentRuleDto.roleId } };
    }

    if (updatePaymentRuleDto.paymentType !== undefined) {
      data.paymentType = updatePaymentRuleDto.paymentType;
    }

    if (updatePaymentRuleDto.baseRate !== undefined) {
      data.baseRate = new Prisma.Decimal(updatePaymentRuleDto.baseRate);
    }

    if (updatePaymentRuleDto.specialtyBonus !== undefined) {
      data.specialtyBonus = new Prisma.Decimal(
        updatePaymentRuleDto.specialtyBonus
      );
    }

    if (updatePaymentRuleDto.experienceMultiplier !== undefined) {
      data.experienceMultiplier = updatePaymentRuleDto.experienceMultiplier;
    }

    if (updatePaymentRuleDto.effectiveDate !== undefined) {
      data.effectiveDate = updatePaymentRuleDto.effectiveDate;
    }

    if (updatePaymentRuleDto.endDate !== undefined) {
      data.endDate = updatePaymentRuleDto.endDate;
    }

    return this.prisma.paymentRule.update({
      where: { id },
      data,
      include: {
        shiftType: true,
        role: true,
        organization: true,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.paymentRule.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Payment rule with ID ${id} not found`);
    }

    return this.prisma.paymentRule.delete({
      where: { id },
      include: {
        shiftType: true,
        role: true,
      },
    });
  }
}
