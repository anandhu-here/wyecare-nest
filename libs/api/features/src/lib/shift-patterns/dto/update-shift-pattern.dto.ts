import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftPatternDto } from './create-shift-pattern.dto';

export class UpdateShiftPatternDto extends PartialType(CreateShiftPatternDto) {}
