// calculate-invoice.dto.ts
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CalculateInvoiceDto {
  @IsMongoId()
  @IsNotEmpty()
  homeId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsArray()
  @IsOptional()
  holidays?: string[] = [];
}
