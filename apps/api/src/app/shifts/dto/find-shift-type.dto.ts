// apps/api/src/app/shifts/dto/find-shift-type.dto.ts
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FindShiftTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;
}
