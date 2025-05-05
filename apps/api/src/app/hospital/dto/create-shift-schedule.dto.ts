// app/hospital/dto/create-shift-schedule.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDate,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShiftScheduleDto {
  @ApiProperty({ description: 'Staff Profile ID' })
  @IsNotEmpty()
  @IsUUID()
  staffProfileId: string;

  @ApiProperty({ description: 'Shift Type ID' })
  @IsNotEmpty()
  @IsUUID()
  shiftTypeId: string;

  @ApiProperty({ description: 'Department ID' })
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({ description: 'Shift start date and time' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDateTime: Date;

  @ApiProperty({ description: 'Shift end date and time' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDateTime: Date;

  @ApiProperty({
    description: 'Shift status',
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELED', 'SWAPPED'],
    default: 'SCHEDULED',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELED', 'SWAPPED'])
  status?: string;

  @ApiProperty({
    description: 'Whether the shift is confirmed by the staff',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @ApiProperty({ description: 'Shift notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
