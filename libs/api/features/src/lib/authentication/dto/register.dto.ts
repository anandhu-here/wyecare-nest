import { AddressDto } from '@wyecare-monorepo/types';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
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
  @MinLength(8)
  @MaxLength(32)
  password!: string;

  @IsOptional()
  @IsString()
  role!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  countryCode!: string;

  @IsNotEmpty()
  @IsString()
  gender!: string;

  @IsOptional()
  address?: AddressDto;

  @IsOptional()
  company?: string;

  @IsOptional()
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };
}
