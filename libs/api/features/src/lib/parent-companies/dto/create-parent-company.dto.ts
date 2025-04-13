// libs/api/features/src/lib/parent-companies/dto/create-parent-company.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Address, AddressDto } from '@wyecare-monorepo/types';

export class CreateParentCompanyDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: Address;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  organizations?: string[];
}
