import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddUserToOrganizationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsNotEmpty()
  @IsMongoId()
  organizationId!: string;

  @IsNotEmpty()
  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  staffType?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}
