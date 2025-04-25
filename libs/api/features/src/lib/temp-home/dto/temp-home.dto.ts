import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateTemporaryHomeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateTemporaryHomeDto {
  @IsString()
  @IsNotEmpty()
  tempHomeId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ClaimTemporaryHomeDto {
  @IsString()
  @IsNotEmpty()
  temporaryId: string;
}

export class UnclaimTemporaryHomeDto {
  @IsString()
  @IsNotEmpty()
  tempHomeId: string;
}
