// app/hospital/dto/create-pay-period.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePayPeriodDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Pay period start date' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Pay period end date' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: 'Pay period status',
    enum: ['OPEN', 'CALCULATING', 'FINALIZED', 'PAID'],
    default: 'OPEN',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'CALCULATING', 'FINALIZED', 'PAID'])
  status?: string;
}
