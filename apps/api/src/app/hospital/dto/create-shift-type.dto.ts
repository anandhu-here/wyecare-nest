// app/hospital/dto/create-shift-type.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftTypeDto {
  @ApiProperty({ description: 'Shift type name (e.g., Morning, Night)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Start time in 24-hour format (HH:MM)',
    example: '08:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in 24-hour format (HH:MM)',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in 24-hour format (HH:MM)',
    example: '16:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in 24-hour format (HH:MM)',
  })
  endTime: string;

  @ApiProperty({
    description: 'Whether the shift spans overnight (e.g., 22:00 to 06:00)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiProperty({
    description: 'Base pay multiplier (e.g., 1.5 for night shifts)',
    required: false,
    default: 1.0,
    minimum: 1.0,
    maximum: 3.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(3.0)
  basePayMultiplier?: number;

  @ApiProperty({ description: 'Shift type description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;
}
