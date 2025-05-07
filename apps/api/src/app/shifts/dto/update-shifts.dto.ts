import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftsDto } from './create-shifts.dto';

export class UpdateShiftsDto extends PartialType(CreateShiftsDto) {}
