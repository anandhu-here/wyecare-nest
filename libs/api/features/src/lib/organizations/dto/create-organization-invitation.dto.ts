import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';

export enum InvitationRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  NURSE = 'nurse',
  SENIOR_CARER = 'senior_carer',
  CARER = 'carer',
}

export class CreateOrganizationInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsMongoId()
  organizationId!: string;

  @IsNotEmpty()
  @IsEnum(InvitationRole)
  role!: InvitationRole;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
