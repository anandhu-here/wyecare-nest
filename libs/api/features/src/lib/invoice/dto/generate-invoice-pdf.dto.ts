// generate-invoice-pdf.dto.ts
import { IsBoolean, IsOptional } from 'class-validator';

export class GenerateInvoicePdfDto {
  @IsBoolean()
  @IsOptional()
  includeDetailed?: boolean = false;
}
