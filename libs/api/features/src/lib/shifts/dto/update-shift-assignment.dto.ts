// api/features/src/lib/shifts/dto/update-shift-assignment.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { ShiftAssignmentStatus } from '../schemas/shift-assignment.schema';

export class UpdateShiftAssignmentDto {
  @IsOptional()
  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus;
}
