// libs/api/features/src/lib/users/dto/update-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Address } from '@wyecare-monorepo/types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  address?: Address;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };

  @IsOptional()
  fcmTokens?: string[];
}
