// app/organizations/dto/create-organization.dto.ts

import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgCategory } from '@prisma/client';
import { AddressDto } from './address.dto';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization category',
    enum: OrgCategory,
    example: OrgCategory.HOSPITAL,
  })
  @IsEnum(OrgCategory)
  category: OrgCategory;

  @ApiProperty({ description: 'Organization description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organization email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Organization phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Organization website URL', required: false })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ description: 'Organization logo URL', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    description: 'Sector-specific configuration',
    required: false,
  })
  @IsOptional()
  sectorConfig?: any;
  //   address
  @ApiProperty({ description: 'Department address', required: false })
  @IsOptional()
  address?: AddressDto;
}
