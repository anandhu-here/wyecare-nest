// apps/api/src/app/shifts/dto/swap-shift.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class SwapShiftDto {
  @IsNotEmpty()
  @IsUUID()
  sourceShiftId: string;

  @IsNotEmpty()
  @IsUUID()
  targetShiftId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
