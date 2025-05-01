// libs/api/features/src/lib/shifts/dto/update-shift-assignment.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateShiftAssignmentDto } from './create-shift-assignment.dto';

export class UpdateShiftAssignmentDto extends PartialType(
  OmitType(CreateShiftAssignmentDto, ['organizationId'] as const)
) {}
