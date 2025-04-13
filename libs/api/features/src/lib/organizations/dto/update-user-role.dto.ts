import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;

  @IsNotEmpty()
  @IsMongoId()
  organizationId!: string;

  @IsNotEmpty()
  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  staffType?: string;
}
