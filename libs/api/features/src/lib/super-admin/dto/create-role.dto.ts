// super-admin/dto/create-role.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['SYSTEM', 'ORGANIZATION'])
  contextType: 'SYSTEM' | 'ORGANIZATION';

  @IsOptional()
  isSystem?: boolean;

  @IsString()
  @IsOptional()
  baseRoleId?: string;

  @IsOptional()
  isCustom?: boolean;

  @IsNumber()
  hierarchyLevel: number;
}
