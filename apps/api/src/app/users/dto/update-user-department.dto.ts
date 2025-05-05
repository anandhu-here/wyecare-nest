// app/users/dto/update-user-department.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDepartmentDto {
  @ApiProperty({ description: 'Department ID' })
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({ description: 'User position in department', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    description: 'Whether user is head of department',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isHead?: boolean;
}
