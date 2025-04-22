// organizations/dto/create-staff-invitation.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateStaffInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsOptional()
  message?: string;
}
