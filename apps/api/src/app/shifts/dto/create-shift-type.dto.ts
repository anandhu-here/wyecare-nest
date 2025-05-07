// apps/api/src/app/shifts/dto/create-shift-type.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftTypeDto {
  @ApiProperty({ description: 'Shift type name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Shift type description' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({ description: 'Shift type description' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiPropertyOptional({
    description: 'Whether the shift type is overnight',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Shift type hours count' })
  @IsNotEmpty()
  @IsNumber()
  hoursCount: number;

  @ApiPropertyOptional({ description: 'Shift type base pay multiplier' })
  @IsOptional()
  @IsNumber()
  basePayMultiplier?: number;

  @ApiPropertyOptional({ description: 'Shift type description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;
}
