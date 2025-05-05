// app/hospital/dto/update-staff-profile.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateStaffProfileDto } from './create-staff-profile.dto';

export class UpdateStaffProfileDto extends PartialType(CreateStaffProfileDto) {}
