// app/hospital/dto/create-staff-profile.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  IsDecimal,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StaffType, SalaryType, StaffStatus } from '@prisma/client';
import { CreateCompensationRateDto } from './create-compensation-rate.dto';

export class CreateStaffProfileDto {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Staff type',
    enum: StaffType,
  })
  @IsNotEmpty()
  @IsEnum(StaffType)
  staffType: StaffType;

  @ApiProperty({
    description: 'Specialty (e.g., Cardiology, Orthopedics)',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({
    description: 'Years of experience',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({
    description: 'Education level',
    required: false,
  })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiProperty({
    description: 'Certifications as JSON array',
    required: false,
    example: [
      { name: 'Basic Life Support', issuer: 'AHA', expiry: '2025-01-01' },
      {
        name: 'Advanced Cardiac Life Support',
        issuer: 'AHA',
        expiry: '2025-01-01',
      },
    ],
  })
  @IsOptional()
  certifications?: any;

  @ApiProperty({
    description: 'Base salary type',
    enum: SalaryType,
    required: false,
    default: SalaryType.MONTHLY,
  })
  @IsOptional()
  @IsEnum(SalaryType)
  baseSalaryType?: SalaryType;

  @ApiProperty({
    description: 'Base salary amount',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  baseSalaryAmount?: number;

  @ApiProperty({
    description: 'Date joined',
    required: false,
    default: 'Current date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateJoined?: Date;

  @ApiProperty({
    description: 'Staff status',
    enum: StaffStatus,
    required: false,
    default: StaffStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiProperty({
    description: 'Compensation rates',
    required: false,
    type: [CreateCompensationRateDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompensationRateDto)
  compensationRates?: CreateCompensationRateDto[];
}
