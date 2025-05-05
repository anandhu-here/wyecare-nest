// app/hospital/dto/create-compensation-rate.dto.ts

import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDecimal,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCompensationRateDto {
  @ApiProperty({ description: 'Department ID' })
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({
    description: 'Base rate (hourly or per shift)',
    example: 50.0,
  })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '2' })
  baseRate: number;

  @ApiProperty({
    description: 'Specialty bonus',
    required: false,
    default: 0,
    example: 10.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  specialtyBonus?: number;

  @ApiProperty({
    description: 'Experience multiplier',
    required: false,
    default: 1.0,
    minimum: 1.0,
    maximum: 2.0,
    example: 1.25,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(2.0)
  experienceMultiplier?: number;

  @ApiProperty({
    description: 'Effective date',
    required: false,
    default: 'Current date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveDate?: Date;

  @ApiProperty({
    description: 'End date (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
