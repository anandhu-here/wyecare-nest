// staff-compensation-rate.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentType {
  HOURLY = 'HOURLY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateStaffCompensationRateDto {
  @ApiProperty({
    description: 'The ID of the staff profile this compensation applies to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsNotEmpty()
  @IsUUID()
  staffProfileId: string;

  @ApiProperty({
    description: 'The ID of the department this compensation applies to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({
    description: 'The base compensation rate amount',
    example: 25.5,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty({
    description: 'The type of payment (hourly, weekly, or monthly)',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

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
    description: 'The date when this compensation rate becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @ApiPropertyOptional({
    description: 'The date when this compensation rate expires (optional)',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class UpdateStaffCompensationRateDto {
  @ApiPropertyOptional({
    description: 'The base compensation rate amount',
    example: 25.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseRate?: number;

  @ApiPropertyOptional({
    description: 'The type of payment (hourly, weekly, or monthly)',
    enum: PaymentType,
    example: PaymentType.HOURLY,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

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
    description: 'The date when this compensation rate becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description: 'The date when this compensation rate expires',
    example: '2025-12-31T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class FindStaffCompensationRateDto {
  @ApiPropertyOptional({
    description: 'Filter by staff profile ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  staffProfileId?: string;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

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
      'Filter by effective date - returns rates effective at the specified date',
    example: '2025-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description:
      'Filter active rates only (rates with no end date or end date in the future)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Include shift type premiums in the response',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includePremiums?: boolean;

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
