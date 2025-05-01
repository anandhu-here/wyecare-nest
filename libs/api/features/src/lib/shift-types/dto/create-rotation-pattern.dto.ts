// libs/api/features/src/lib/shifts/dto/create-rotation-pattern.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsEnum,
  IsArray,
  IsMongoId,
  IsDate,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { OrganizationCategory } from 'libs/api/core/src/lib/schemas';

export class RotationSequenceItemDto {
  @IsMongoId()
  @IsNotEmpty()
  shiftTypeId!: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  consecutiveDays?: number;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RotationBreakDto {
  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}

export class CreateRotationPatternDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional as it may be retrieved from request context

  @IsOptional()
  @IsEnum(OrganizationCategory)
  category?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RotationSequenceItemDto)
  sequence!: RotationSequenceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RotationBreakDto)
  breaks?: RotationBreakDto[];

  @IsNumber()
  @Min(1)
  cycleLength!: number;

  @IsOptional()
  @IsBoolean()
  repeatIndefinitely?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRepetitions?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableStaff?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableRoles?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
