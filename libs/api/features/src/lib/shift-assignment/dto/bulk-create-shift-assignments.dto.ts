// libs/api/features/src/lib/shifts/dto/bulk-create-shift-assignments.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { CreateShiftAssignmentDto } from './create-shift-assignment.dto';

export class BulkCreateShiftAssignmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShiftAssignmentDto)
  shifts!: CreateShiftAssignmentDto[];

  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional, will be applied to all shifts if provided
}
