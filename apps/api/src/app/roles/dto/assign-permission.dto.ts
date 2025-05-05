// app/roles/dto/assign-permission.dto.ts

import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Permission ID to assign' })
  @IsNotEmpty()
  @IsUUID()
  permissionId: string;

  @ApiProperty({
    description: 'Conditions for this permission (CASL conditions as JSON)',
    required: false,
    example: { organizationId: { $eq: '$user.organizationId' } },
  })
  @IsOptional()
  conditions?: any;
}
