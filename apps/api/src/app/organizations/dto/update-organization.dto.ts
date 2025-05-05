// Enhanced update-organization.dto.ts
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';
import { OrgCategory } from '@prisma/client';
import { AddressDto } from './address.dto';

// This makes all properties from CreateOrganizationDto optional
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiProperty({
    description: 'Organization address',
    required: false,
    type: AddressDto,
  })
  @IsOptional()
  address?: AddressDto;
}
