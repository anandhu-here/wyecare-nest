// apps/api/src/app/shifts/dto/create-shift-schedule.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShiftScheduleDto {
  @IsNotEmpty()
  @IsUUID()
  staffProfileId: string;

  @IsNotEmpty()
  @IsUUID()
  shiftTypeId: string;

  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDateTime: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDateTime: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
