import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { LeaveStatus } from 'libs/api/core/src/lib/schemas';

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  comments?: string;
}
