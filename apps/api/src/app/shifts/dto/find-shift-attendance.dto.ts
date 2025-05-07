// apps/api/src/app/shifts/dto/find-shift-attendance.dto.ts
import { IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FindShiftAttendanceDto {
  @IsOptional()
  @IsUUID()
  shiftScheduleId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  approvedById?: string;

  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;
}
