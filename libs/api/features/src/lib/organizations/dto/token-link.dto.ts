// create-link-token.dto.ts
import { IsNotEmpty, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateLinkTokenDto {
  @IsNotEmpty()
  @IsMongoId()
  sourceOrganizationId!: string;

  @IsOptional()
  @IsString()
  linkType?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  expiresIn?: string; // e.g., '24h', '7d' - defaults to 7d if not provided
}


export class VerifyLinkTokenDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class AcceptLinkDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsNotEmpty()
  @IsMongoId()
  targetOrganizationId!: string;
}
