import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsHexColor,
  ArrayMinSize,
  IsMongoId,
} from 'class-validator';
import { OrganizationCategory } from 'libs/api/core/src/lib/schemas';

export class ShiftTimingDto {
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @IsOptional()
  durationMinutes?: number;
}

export class CreateShiftTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(OrganizationCategory)
  category!: string;

  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShiftTimingDto)
  defaultTiming?: ShiftTimingDto;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
