// libs/api/features/src/lib/shifts/dto/update-scheduling-rule.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSchedulingRuleDto } from './create-scheduling-rule.dto';

export class UpdateSchedulingRuleDto extends PartialType(
  CreateSchedulingRuleDto
) {}
