// super-admin/dto/create-permission.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(['SYSTEM', 'ORGANIZATION'])
  contextType: 'SYSTEM' | 'ORGANIZATION';

  @IsOptional()
  isSystem?: boolean;
}
