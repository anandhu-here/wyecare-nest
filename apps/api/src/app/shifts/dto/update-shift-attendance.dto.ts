// apps/api/src/app/shifts/dto/update-shift-attendance.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftAttendanceDto } from './create-shift-attendance.dto';

export class UpdateShiftAttendanceDto extends PartialType(
  CreateShiftAttendanceDto
) {}
