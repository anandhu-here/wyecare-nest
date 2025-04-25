// timesheets/dto/create-timesheet.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTimesheetDto {
  @IsNotEmpty()
  @IsString()
  shiftId!: string;

  @IsOptional()
  @IsString()
  shiftPatternId?: string;

  @IsNotEmpty()
  @IsString()
  homeId!: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;
}
