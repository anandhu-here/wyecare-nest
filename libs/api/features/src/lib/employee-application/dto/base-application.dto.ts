// update-section.dto.ts
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSectionDto {
  @IsObject()
  data: Record<string, any>;
}

export class AddToArrayDto {
  @IsObject()
  item: Record<string, any>;
}

export class UploadDocumentDto {
  @IsString()
  section: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsNumber()
  @IsOptional()
  index?: number;

  @IsEnum(['front', 'back'])
  @IsOptional()
  side?: 'front' | 'back';
}

export class GetAgencyApplicationDto {
  @IsMongoId()
  @IsNotEmpty()
  carerId: string;

  @IsMongoId()
  @IsNotEmpty()
  agencyOrgId: string;
}
