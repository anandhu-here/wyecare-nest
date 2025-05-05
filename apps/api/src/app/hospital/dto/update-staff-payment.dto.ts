// app/hospital/dto/update-staff-payment.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateStaffPaymentDto } from './create-staff-payment.dto';
import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStaffPaymentDto extends PartialType(CreateStaffPaymentDto) {}
