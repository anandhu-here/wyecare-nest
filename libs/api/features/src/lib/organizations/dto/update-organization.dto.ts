// libs/api/features/src/lib/organizations/dto/update-organization.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Address,
  AddressDto,
  NotificationSettings,
  NotificationSettingsDto,
} from '@wyecare-monorepo/types';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['agency', 'home'])
  type?: 'agency' | 'home';

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: Address;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsMongoId()
  admin?: string;

  @IsOptional()
  @IsMongoId()
  parentCompany?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  staff?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  linkedOrganizations?: string[];

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  staffsRange?: string;

  @IsOptional()
  @IsString()
  residentsRange?: string;

  @IsOptional()
  @IsBoolean()
  residentManagementEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  location?: {
    type: string;
    coordinates: number[];
  };

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notificationSettings?: NotificationSettings;
}
