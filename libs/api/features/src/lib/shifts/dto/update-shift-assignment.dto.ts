// api/features/src/lib/shifts/dto/update-shift-assignment.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { ShiftAssignmentStatus } from '../../../../../core/src/lib/schemas';

export class UpdateShiftAssignmentDto {
  @IsOptional()
  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus;
}
