// libs/api/features/src/lib/shifts/dto/create-shift-assignment.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsEnum,
  IsArray,
  IsMongoId,
  IsDate,
  IsNumber,
  Min,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { ClockEventType, ShiftStatus } from 'libs/api/core/src/lib/schemas';

export class ClockEventDto {
  @IsEnum(ClockEventType)
  type!: string;

  @IsDate()
  @Type(() => Date)
  timestamp!: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsMongoId()
  verifiedBy?: string;
}

export class BreakPeriodDto {
  @IsDate()
  @Type(() => Date)
  startTime!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PaymentDetailsDto {
  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsNumber()
  @Min(0)
  baseRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursWorked?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  regularHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weekendHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  holidayHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nightHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weekendRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  holidayRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nightRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  additionalPayments?: Record<string, any>;
}

export class CreateShiftAssignmentDto {
  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional as it may be retrieved from request context

  @IsMongoId()
  @IsNotEmpty()
  workerId!: string;

  @IsMongoId()
  @IsNotEmpty()
  shiftTypeId!: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  locationId?: string;

  @IsOptional()
  @IsMongoId()
  rotationPatternId?: string;

  @IsDate()
  @Type(() => Date)
  scheduledStartTime!: Date;

  @IsDate()
  @Type(() => Date)
  scheduledEndTime!: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  scheduledDurationMinutes?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualStartTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualEndTime?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDurationMinutes?: number;

  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClockEventDto)
  clockEvents?: ClockEventDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakPeriodDto)
  breaks?: BreakPeriodDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @IsOptional()
  @IsBoolean()
  isOvertime?: boolean;

  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @IsOptional()
  @IsBoolean()
  isWeekend?: boolean;

  @IsOptional()
  @IsBoolean()
  isNightShift?: boolean;

  @IsOptional()
  @IsMongoId()
  assignedBy?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  //   updated and created by
  @IsOptional()
  @IsMongoId()
  updatedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;
}
