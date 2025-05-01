// create-payment-config.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftPaymentMethod } from 'libs/api/core/src/lib/schemas';

export class HourlyRateConfigDto {
  @ApiProperty({ description: 'Base hourly rate' })
  @IsNumber()
  baseRate: number;

  @ApiPropertyOptional({
    description: 'Multiplier for overtime hours',
    example: 1.5,
  })
  @IsOptional()
  @IsNumber()
  overtimeMultiplier?: number;

  @ApiPropertyOptional({ description: 'Weekend hourly rate', example: 20 })
  @IsOptional()
  @IsNumber()
  weekendRate?: number;

  @ApiPropertyOptional({ description: 'Holiday hourly rate', example: 25 })
  @IsOptional()
  @IsNumber()
  holidayRate?: number;

  @ApiPropertyOptional({
    description: 'Extra amount for night shifts',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  nightDifferential?: number;
}

export class FixedRateConfigDto {
  @ApiProperty({ description: 'Base amount per shift' })
  @IsNumber()
  baseAmount: number;

  @ApiPropertyOptional({ description: 'Extra amount for weekend shifts' })
  @IsOptional()
  @IsNumber()
  weekendBonus?: number;

  @ApiPropertyOptional({ description: 'Extra amount for holiday shifts' })
  @IsOptional()
  @IsNumber()
  holidayBonus?: number;
}

export class CommissionConfigDto {
  @ApiPropertyOptional({ description: 'Base amount before commission' })
  @IsOptional()
  @IsNumber()
  baseAmount?: number;

  @ApiProperty({ description: 'Commission rate (percentage or fixed amount)' })
  @IsNumber()
  commissionRate: number;

  @ApiPropertyOptional({
    description: 'Type of commission calculation',
    example: 'percentage',
    enum: ['percentage', 'fixed', 'tiered'],
  })
  @IsOptional()
  @IsString()
  commissionType?: string;
}

export class RecurringRateConfigDto {
  @ApiProperty({ description: 'Base amount for the period' })
  @IsNumber()
  baseAmount: number;

  @ApiProperty({
    description: 'Payment period',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @IsEnum(['daily', 'weekly', 'monthly'])
  period: string;

  @ApiPropertyOptional({ description: 'Expected working days per period' })
  @IsOptional()
  @IsNumber()
  workingDaysPerPeriod?: number;

  @ApiPropertyOptional({ description: 'Expected working hours per period' })
  @IsOptional()
  @IsNumber()
  workingHoursPerPeriod?: number;
}

export class CustomRateConfigDto {
  @ApiPropertyOptional({
    description: 'Custom formula for calculation',
    example: 'baseRate * hoursWorked + (salesAmount * commissionRate)',
  })
  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  parameters?: Record<string, any>;
}

export class CreatePaymentConfigDto {
  @ApiProperty({
    description: 'ID of the shift type this payment config applies to',
  })
  @IsMongoId()
  shiftTypeId: string;

  @ApiProperty({
    description: 'Payment method',
    enum: ShiftPaymentMethod,
  })
  @IsEnum(ShiftPaymentMethod)
  paymentMethod: ShiftPaymentMethod;

  @ApiPropertyOptional({ description: 'Name of the payment configuration' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the payment configuration',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    default: 'default',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Date when this config becomes effective',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Date when this config expires' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  // The following configs are based on payment method
  @ApiPropertyOptional({ description: 'Hourly rate configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => HourlyRateConfigDto)
  hourlyConfig?: HourlyRateConfigDto;

  @ApiPropertyOptional({ description: 'Fixed rate configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FixedRateConfigDto)
  fixedConfig?: FixedRateConfigDto;

  @ApiPropertyOptional({ description: 'Commission configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionConfigDto)
  commissionConfig?: CommissionConfigDto;

  @ApiPropertyOptional({ description: 'Recurring payment configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringRateConfigDto)
  recurringConfig?: RecurringRateConfigDto;

  @ApiPropertyOptional({ description: 'Custom payment configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomRateConfigDto)
  customConfig?: CustomRateConfigDto;
}

// update-payment-config.dto.ts
export class UpdatePaymentConfigDto {
  @ApiPropertyOptional({ description: 'Name of the payment configuration' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the payment configuration',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this payment config is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Currency code',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Date when this config becomes effective',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Date when this config expires' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  // The following configs are based on payment method
  @ApiPropertyOptional({ description: 'Hourly rate configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => HourlyRateConfigDto)
  hourlyConfig?: HourlyRateConfigDto;

  @ApiPropertyOptional({ description: 'Fixed rate configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FixedRateConfigDto)
  fixedConfig?: FixedRateConfigDto;

  @ApiPropertyOptional({ description: 'Commission configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionConfigDto)
  commissionConfig?: CommissionConfigDto;

  @ApiPropertyOptional({ description: 'Recurring payment configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringRateConfigDto)
  recurringConfig?: RecurringRateConfigDto;

  @ApiPropertyOptional({ description: 'Custom payment configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomRateConfigDto)
  customConfig?: CustomRateConfigDto;
}

// assign-staff-rate.dto.ts
export class AssignStaffRateDto {
  @ApiProperty({ description: 'ID of the user' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ description: 'ID of the shift type' })
  @IsMongoId()
  shiftTypeId: string;

  @ApiPropertyOptional({ description: 'ID of the payment configuration' })
  @IsOptional()
  @IsMongoId()
  paymentConfigId?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: ShiftPaymentMethod,
  })
  @IsOptional()
  @IsEnum(ShiftPaymentMethod)
  paymentMethod?: ShiftPaymentMethod;

  @ApiPropertyOptional({ description: 'Override rate for this staff member' })
  @IsOptional()
  @IsNumber()
  overrideRate?: number;

  @ApiPropertyOptional({
    description: 'Additional bonus rate for this staff member',
  })
  @IsOptional()
  @IsNumber()
  bonusRate?: number;

  @IsOptional()
  customRateParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Date when this rate becomes effective' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Date when this rate expires' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;
}

// update-staff-rate.dto.ts
export class UpdateStaffRateDto {
  @ApiPropertyOptional({ description: 'Override rate for this staff member' })
  @IsOptional()
  @IsNumber()
  overrideRate?: number;

  @ApiPropertyOptional({
    description: 'Additional bonus rate for this staff member',
  })
  @IsOptional()
  @IsNumber()
  bonusRate?: number;

  @IsOptional()
  customRateParams?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether this staff rate is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Date when this rate becomes effective' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Date when this rate expires' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;
}
