// api/features/src/lib/shifts/dto/create-shift-assignment.dto.ts
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { ShiftAssignmentStatus } from '../schemas/shift-assignment.schema';

export class CreateShiftAssignmentDto {
  @IsNotEmpty()
  @IsMongoId()
  shift!: string;

  @IsNotEmpty()
  @IsMongoId()
  user!: string;

  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus;
}
