// update-invoice-status.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsNotEmpty()
  @IsEnum([
    'draft',
    'pending',
    'sent',
    'paid',
    'cancelled',
    'partially_paid',
    'accepted',
    'rejected',
    'invalidated',
  ])
  status: string;
}
