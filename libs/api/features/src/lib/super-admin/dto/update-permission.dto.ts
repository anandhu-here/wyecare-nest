// super-admin/dto/update-permission.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['SYSTEM', 'ORGANIZATION'])
  @IsOptional()
  contextType?: 'SYSTEM' | 'ORGANIZATION';

  @IsOptional()
  isSystem?: boolean;
}
