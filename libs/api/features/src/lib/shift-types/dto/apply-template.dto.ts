// libs/api/features/src/lib/shifts/dto/apply-template.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { ShiftTimingDto } from './create-shift-type.dto';

export class ApplyTemplateDto {
  @IsMongoId()
  @IsNotEmpty()
  templateId!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShiftTimingDto)
  defaultTiming?: ShiftTimingDto;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
