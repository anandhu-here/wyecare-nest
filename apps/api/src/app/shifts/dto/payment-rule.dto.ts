// payment-rule.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentType {
  HOURLY = 'HOURLY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  PER_SHIFT = 'PER_SHIFT',
}

export class CreatePaymentRuleDto {
  @ApiProperty({
    description: 'The ID of the shift type for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsNotEmpty()
  @IsUUID()
  shiftTypeId: string;

  @ApiProperty({
    description: 'The ID of the role for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsNotEmpty()
  @IsUUID()
  roleId: string;

  @ApiProperty({
    description: 'The type of payment (hourly, weekly, monthly, or per shift)',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'The base payment rate',
    example: 25.5,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiPropertyOptional({
    description: 'Additional bonus for specialized skills (optional)',
    example: 5.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialtyBonus?: number;

  @ApiPropertyOptional({
    description: 'Multiplier applied based on experience level (optional)',
    example: 1.2,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  experienceMultiplier?: number;

  @ApiProperty({
    description: 'The date when this payment rule becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @ApiPropertyOptional({
    description: 'The date when this payment rule expires (optional)',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({
    description: 'The ID of the organization this payment rule belongs to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
  })
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;
}

export class UpdatePaymentRuleDto {
  @ApiPropertyOptional({
    description: 'The ID of the shift type for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  shiftTypeId?: string;

  @ApiPropertyOptional({
    description: 'The ID of the role for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'The type of payment (hourly, weekly, monthly, or per shift)',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiPropertyOptional({
    description: 'The base payment rate',
    example: 25.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseRate?: number;

  @ApiPropertyOptional({
    description: 'Additional bonus for specialized skills',
    example: 5.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialtyBonus?: number;

  @ApiPropertyOptional({
    description: 'Multiplier applied based on experience level',
    example: 1.2,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  experienceMultiplier?: number;

  @ApiPropertyOptional({
    description: 'The date when this payment rule becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description: 'The date when this payment rule expires',
    example: '2025-12-31T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class FindPaymentRuleDto {
  @ApiPropertyOptional({
    description: 'Filter by shift type ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  shiftTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by organization ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment type',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiPropertyOptional({
    description:
      'Filter by effective date - returns rules effective at the specified date',
    example: '2025-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description:
      'Filter active rules only (rules with no end date or end date in the future)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Number of records to skip for pagination',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of records to take for pagination',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take?: number;
}

export class PaymentRuleResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the shift type for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  shiftTypeId: string;

  @ApiProperty({
    description: 'The ID of the role for this payment rule',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  roleId: string;

  @ApiProperty({
    description: 'The type of payment',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'The base payment rate',
    example: 25.5,
  })
  baseRate: number;

  @ApiProperty({
    description: 'Additional bonus for specialized skills',
    example: 5.0,
  })
  specialtyBonus: number;

  @ApiProperty({
    description: 'Multiplier applied based on experience level',
    example: 1.2,
  })
  experienceMultiplier: number;

  @ApiProperty({
    description: 'The date when this payment rule becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  effectiveDate: Date;

  @ApiPropertyOptional({
    description: 'The date when this payment rule expires',
    example: '2025-12-31T00:00:00.000Z',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'The ID of the organization this payment rule belongs to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
  })
  organizationId: string;

  @ApiProperty({
    description: 'When the payment rule was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the payment rule was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The related shift type details',
  })
  shiftType?: any;

  @ApiPropertyOptional({
    description: 'The related role details',
  })
  role?: any;
}
