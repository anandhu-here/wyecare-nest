// app/hospital/dto/update-pay-period.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreatePayPeriodDto } from './create-pay-period.dto';
import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePayPeriodDto extends PartialType(CreatePayPeriodDto) {}
