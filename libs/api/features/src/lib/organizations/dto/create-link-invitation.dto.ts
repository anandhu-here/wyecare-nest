import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
} from 'class-validator';

export enum InvitationType {
  DIRECT = 'direct',
  EMAIL = 'email',
}

export class CreateLinkInvitationDto {
  @IsNotEmpty()
  @IsMongoId()
  sourceOrganizationId!: string;

  @IsOptional()
  @IsMongoId()
  targetOrganizationId?: string;

  @IsOptional()
  @IsEmail()
  targetEmail?: string;

  @IsNotEmpty()
  @IsEnum(InvitationType)
  invitationType!: InvitationType;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  linkType?: string;
}
