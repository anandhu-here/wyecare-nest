// super-admin/dto/assign-role.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsDateString()
  @IsOptional()
  activeFrom?: Date;

  @IsDateString()
  @IsOptional()
  activeTo?: Date;
}
