// app/users/dto/create-user.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class UserDepartmentDto {
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

export class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'User first name' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User active status',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Organization ID', required: false })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    description: 'Role IDs to assign',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Departments to assign',
    required: false,
    type: [UserDepartmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDepartmentDto)
  departments?: UserDepartmentDto[];

  @ApiProperty({
    description: 'Sector-specific user profile data',
    required: false,
  })
  @IsOptional()
  sectorProfile?: any;
}
