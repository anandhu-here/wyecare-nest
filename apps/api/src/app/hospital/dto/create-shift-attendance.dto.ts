// app/hospital/dto/create-shift-attendance.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShiftAttendanceDto {
  @ApiProperty({ description: 'Shift Schedule ID' })
  @IsNotEmpty()
  @IsUUID()
  shiftScheduleId: string;

  @ApiProperty({
    description: 'Actual start time of the shift',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualStartTime?: Date;

  @ApiProperty({
    description: 'Actual end time of the shift',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualEndTime?: Date;

  @ApiProperty({
    description: 'Attendance status',
    enum: ['PENDING', 'PRESENT', 'LATE', 'ABSENT', 'PARTIALLY_COMPLETE'],
    default: 'PENDING',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PRESENT', 'LATE', 'ABSENT', 'PARTIALLY_COMPLETE'])
  status?: string;

  @ApiProperty({
    description: 'Overtime minutes',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  overtimeMinutes?: number;

  @ApiProperty({
    description: 'Notes about the attendance',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
