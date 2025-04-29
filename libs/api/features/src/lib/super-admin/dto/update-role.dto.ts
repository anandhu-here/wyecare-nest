// super-admin/dto/update-role.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['SYSTEM', 'ORGANIZATION'])
  @IsOptional()
  contextType?: 'SYSTEM' | 'ORGANIZATION';

  @IsOptional()
  isSystem?: boolean;

  @IsString()
  @IsOptional()
  baseRoleId?: string;

  @IsOptional()
  isCustom?: boolean;

  @IsNumber()
  @IsOptional()
  hierarchyLevel?: number;
}
