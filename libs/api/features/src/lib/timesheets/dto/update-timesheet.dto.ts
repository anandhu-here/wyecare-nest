// timesheets/dto/update-timesheet.dto.ts
import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class UpdateTimesheetDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'invalidated'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'pending_invoice',
    'invoiced',
    'paid',
    'approved',
    'invalidated',
    'idle',
  ])
  invoiceStatus?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  review?: string;
}
