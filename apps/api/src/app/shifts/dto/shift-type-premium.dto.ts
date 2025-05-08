// shift-type-premium.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShiftTypePremiumDto {
  @ApiProperty({
    description: 'The ID of the shift type this premium applies to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsNotEmpty()
  @IsUUID()
  shiftTypeId: string;

  @ApiProperty({
    description: 'The ID of the compensation rate this premium applies to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsNotEmpty()
  @IsUUID()
  compensationRateId: string;

  @ApiProperty({
    description:
      'Whether the premium is calculated as a percentage (true) or fixed amount (false)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isPremiumPercentage: boolean;

  @ApiProperty({
    description: 'The premium value (percentage or fixed amount)',
    example: 0.25, // 25% if isPremiumPercentage=true, or $0.25 if isPremiumPercentage=false
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  premiumValue: number;

  @ApiProperty({
    description: 'The date when this shift premium becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @ApiPropertyOptional({
    description: 'The date when this shift premium expires (optional)',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class UpdateShiftTypePremiumDto {
  @ApiPropertyOptional({
    description:
      'Whether the premium is calculated as a percentage (true) or fixed amount (false)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPremiumPercentage?: boolean;

  @ApiPropertyOptional({
    description: 'The premium value (percentage or fixed amount)',
    example: 0.25, // 25% if isPremiumPercentage=true, or $0.25 if isPremiumPercentage=false
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  premiumValue?: number;

  @ApiPropertyOptional({
    description: 'The date when this shift premium becomes effective',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description: 'The date when this shift premium expires',
    example: '2025-12-31T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class FindShiftTypePremiumDto {
  @ApiPropertyOptional({
    description: 'Filter by shift type ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  shiftTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by compensation rate ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsOptional()
  @IsUUID()
  compensationRateId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by effective date - returns premiums effective at the specified date',
    example: '2025-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description:
      'Filter active premiums only (premiums with no end date or end date in the future)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Number of records to skip for pagination',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of records to take for pagination',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take?: number;
}
