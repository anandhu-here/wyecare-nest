import {
  IsMongoId,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TimesheetPeriod } from 'libs/api/core/src/lib/schemas';

export class BulkGenerateTimesheetsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  workerIds!: string[];

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
  @IsMongoId()
  departmentId?: string;
}
