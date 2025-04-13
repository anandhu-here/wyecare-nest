// libs/api/features/src/lib/parent-companies/dto/update-parent-company.dto.ts
import {
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Address, AddressDto } from '@wyecare-monorepo/types';

export class UpdateParentCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: Address;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  organizations?: string[];
}
