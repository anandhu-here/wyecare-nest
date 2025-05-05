// app/roles/dto/create-roles.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgCategory } from '@prisma/client';

export class CreateRolesDto {
  @ApiProperty({ description: 'Role name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Is this a system-wide role',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @ApiProperty({
    description: 'Sector this role applies to (null means cross-sector)',
    required: false,
    enum: OrgCategory,
  })
  @IsOptional()
  @IsEnum(OrgCategory)
  sector?: OrgCategory;

  @ApiProperty({
    description: 'Organization ID (null for system roles)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    description: 'Permission IDs to assign',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  permissions?: string[];
}
