// app/users/dto/assign-user-permission.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignUserPermissionDto {
  @ApiProperty({
    description: 'Permission ID to assign to the user',
    type: String,
  })
  @IsUUID()
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Conditions for the permission (CASL conditions)',
    type: Object,
  })
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Expiration date for the permission (temporary access)',
    type: Date,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;
}
