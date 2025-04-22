import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffInvitationDto {
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
  role!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
