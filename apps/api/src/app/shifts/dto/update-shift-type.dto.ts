// apps/api/src/app/shifts/dto/update-shift-type.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftTypeDto } from './create-shift-type.dto';

export class UpdateShiftTypeDto extends PartialType(CreateShiftTypeDto) {}
