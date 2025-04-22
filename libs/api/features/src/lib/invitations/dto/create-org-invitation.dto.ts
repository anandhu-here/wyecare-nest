import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateOrgInvitationDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  roleToAssign!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsNotEmpty()
  invitedBy!: Types.ObjectId;
}
