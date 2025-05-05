// app/organizations/dto/create-department.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Department name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Department description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Parent department ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}
