// app/hospital/dto/update-shift-attendance.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateShiftAttendanceDto } from './create-shift-attendance.dto';
import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShiftAttendanceDto extends PartialType(
  CreateShiftAttendanceDto
) {}
