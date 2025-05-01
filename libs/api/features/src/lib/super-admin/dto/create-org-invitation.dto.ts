// super-admin/dto/create-org-invitation.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreateOrgInvitationDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  roleToAssign: string;

  // Add organization type field
  @IsNotEmpty()
  @IsEnum([
    'care_home',
    'hospital',
    'education',
    'healthcare',
    'social_services',
    'retail',
    'service_provider',
    'other',
  ])
  organizationType: string;

  message?: string;
}
