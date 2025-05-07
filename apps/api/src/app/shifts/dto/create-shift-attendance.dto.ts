// apps/api/src/app/shifts/dto/create-shift-attendance.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShiftAttendanceDto {
  @IsNotEmpty()
  @IsUUID()
  shiftScheduleId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualStartTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEndTime?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  overtimeMinutes?: number;

  @IsOptional()
  @IsUUID()
  approvedById?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
