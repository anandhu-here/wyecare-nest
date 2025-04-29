// super-admin/dto/assign-permission.dto.ts
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  permissionId: string;

  @IsEnum(['SYSTEM', 'ORGANIZATION'])
  contextType: 'SYSTEM' | 'ORGANIZATION';

  @IsString()
  @IsOptional()
  contextId?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}
