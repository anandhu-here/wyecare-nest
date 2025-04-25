// create-invoice.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateInvoiceDto {
  @IsMongoId()
  @IsNotEmpty()
  homeId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsObject()
  @IsNotEmpty()
  timesheets: string[];

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsObject()
  @IsOptional()
  shiftSummary?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isTemporaryHome?: boolean;

  @IsString()
  @IsOptional()
  temporaryHomeId?: string;

  @IsObject()
  @IsOptional()
  homeDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
  };
}
