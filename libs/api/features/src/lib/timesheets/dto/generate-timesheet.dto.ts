import {
  IsMongoId,
  IsNotEmpty,
  IsDate,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TimesheetPeriod } from 'libs/api/core/src/lib/schemas';

export class GenerateTimesheetDto {
  @IsMongoId()
  @IsNotEmpty()
  workerId!: string;

  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional as it may be retrieved from request context

  @IsDate()
  @Type(() => Date)
  periodStart!: Date;

  @IsDate()
  @Type(() => Date)
  periodEnd!: Date;

  @IsEnum(TimesheetPeriod)
  periodType!: string;

  @IsOptional()
  @IsOptional()
  @IsMongoId()
  departmentId?: string;
}
