// app/organizations/dto/address.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'Zip/Postal Code' })
  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @ApiProperty({ description: 'Country' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ description: 'Country Code', required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
