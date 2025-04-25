import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  IsISO8601,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LeaveTimeUnit } from 'libs/api/core/src/lib/schemas';

class PartialTimeDetailsDto {
  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursRequested?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots?: TimeSlotDto[];
}

class TimeSlotDto {
  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  hoursCount: number;
}

class RecurringPatternDto {
  @IsNotEmpty()
  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: 'daily' | 'weekly' | 'monthly';

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  interval: number;

  @IsNotEmpty()
  @IsISO8601()
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsArray()
  @IsISO8601()
  exceptions?: string[];
}

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  leaveType: string;

  @IsNotEmpty()
  @IsISO8601()
  startDateTime: string;

  @IsNotEmpty()
  @IsISO8601()
  endDateTime: string;

  @IsNotEmpty()
  @IsEnum(LeaveTimeUnit)
  timeUnit: LeaveTimeUnit;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsBoolean()
  isPartialTimeUnit?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PartialTimeDetailsDto)
  partialTimeDetails?: PartialTimeDetailsDto;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecurringPatternDto)
  recurringPattern?: RecurringPatternDto;
}
