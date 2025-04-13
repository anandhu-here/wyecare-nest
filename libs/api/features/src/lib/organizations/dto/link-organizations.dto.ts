import { IsNotEmpty, IsMongoId, IsOptional, IsString } from 'class-validator';

export class LinkOrganizationsDto {
  @IsNotEmpty()
  @IsMongoId()
  sourceOrganizationId!: string;

  @IsNotEmpty()
  @IsMongoId()
  targetOrganizationId!: string;

  @IsOptional()
  @IsString()
  linkType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
