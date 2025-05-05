// app/users/dto/assign-role.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role ID to assign to the user',
    type: String,
  })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Expiration date for the role (temporary role)',
    type: Date,
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  validUntil?: Date;
}
