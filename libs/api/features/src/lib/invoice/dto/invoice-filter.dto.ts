// invoice-filter.dto.ts
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class InvoiceFilterDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
