// libs/api/features/src/lib/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Address } from '@wyecare-monorepo/types';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

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
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @IsString()
  role!: string;

  @IsOptional()
  address?: Address;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  countryCode!: string;

  @IsOptional()
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };

  @IsOptional()
  fcmTokens?: string[];
}
