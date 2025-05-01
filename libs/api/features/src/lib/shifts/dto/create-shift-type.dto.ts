// create-shift-type.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsHexColor,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationCategory } from 'libs/api/core/src/lib/schemas';
export class ShiftTimingDto {
  @ApiProperty({ description: 'Start time in 24-hour format (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in 24-hour format (HH:MM)' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({
    description:
      'Duration in minutes (optional, will be calculated if not provided)',
  })
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Whether the shift spans overnight',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;
}

export class CreateShiftTypeDto {
  @ApiProperty({ description: 'Name of the shift type' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the shift type' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Organization category this shift type applies to',
    enum: OrganizationCategory,
  })
  @IsEnum(OrganizationCategory)
  category: OrganizationCategory;

  @ApiProperty({ description: 'Default timing for this shift type' })
  @ValidateNested()
  @Type(() => ShiftTimingDto)
  defaultTiming?: ShiftTimingDto;

  @ApiPropertyOptional({
    description: 'Hexadecimal color code for UI representation',
    example: '#3B82F6',
    default: '#3B82F6',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icon name for UI representation',
    example: 'clock',
    default: 'clock',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Days of the week this shift type is applicable',
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}

// update-shift-type.dto.ts
export class UpdateShiftTypeDto {
  @ApiPropertyOptional({ description: 'Name of the shift type' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the shift type' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Default timing for this shift type',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShiftTimingDto)
  defaultTiming?: ShiftTimingDto;

  @ApiPropertyOptional({
    description: 'Hexadecimal color code for UI representation',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icon name for UI representation',
    example: 'clock',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Whether this shift type is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Days of the week this shift type is applicable',
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}
