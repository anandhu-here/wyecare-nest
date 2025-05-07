// apps/api/src/app/shifts/dto/find-shift-schedule.dto.ts
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindShiftScheduleDto {
  @IsOptional()
  @IsUUID()
  staffProfileId?: string;

  @IsOptional()
  @IsUUID()
  shiftTypeId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTimeFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTimeTo?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;
}
