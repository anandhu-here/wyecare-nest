import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsArray,
  IsMongoId,
  IsDate,
  IsNumber,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import {
  TimesheetPeriod,
  TimesheetStatus,
} from 'libs/api/core/src/lib/schemas';

export class CreateTimesheetDto {
  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional as it may be retrieved from request context

  @IsMongoId()
  @IsNotEmpty()
  workerId!: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsEnum(TimesheetPeriod)
  periodType!: string;

  @IsDate()
  @Type(() => Date)
  periodStart!: Date;

  @IsDate()
  @Type(() => Date)
  periodEnd!: Date;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;

  @IsOptional()
  @IsNumber()
  monthNumber?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsEnum(TimesheetStatus)
  status?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  shiftAssignments?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
