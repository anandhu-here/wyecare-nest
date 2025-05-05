// app/auth/dto/create-invitation.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address of the invitee' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Organization ID (if inviting to specific org)' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    description: 'Role ID to assign to the user upon acceptance',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({
    description: 'Expiration date for the invitation',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiProperty({
    description: 'Optional message to include with the invitation',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
