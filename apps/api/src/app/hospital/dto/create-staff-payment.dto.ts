// app/hospital/dto/create-staff-payment.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStaffPaymentDto {
  @ApiProperty({ description: 'Staff Profile ID' })
  @IsNotEmpty()
  @IsUUID()
  staffProfileId: string;

  @ApiProperty({ description: 'Pay Period ID' })
  @IsNotEmpty()
  @IsUUID()
  payPeriodId: string;

  @ApiProperty({ description: 'Regular hours worked' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  regularHours: number;

  @ApiProperty({
    description: 'Overtime hours worked',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiProperty({ description: 'Regular pay amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  regularPay: number;

  @ApiProperty({
    description: 'Overtime pay amount',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimePay?: number;

  @ApiProperty({
    description: 'Specialty bonus amount',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialtyBonus?: number;

  @ApiProperty({
    description: 'Other bonuses amount',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherBonuses?: number;

  @ApiProperty({
    description: 'Deductions amount',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiProperty({
    description: 'Payment status',
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED'],
    default: 'PENDING',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED'])
  paymentStatus?: string;

  @ApiProperty({
    description: 'Payment date',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paymentDate?: Date;
}
