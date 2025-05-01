// libs/api/features/src/lib/shifts/dto/update-rotation-pattern.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRotationPatternDto } from './create-rotation-pattern.dto';

export class UpdateRotationPatternDto extends PartialType(
  CreateRotationPatternDto
) {}
