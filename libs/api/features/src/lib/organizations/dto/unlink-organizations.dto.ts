import { IsNotEmpty, IsMongoId } from 'class-validator';

export class UnlinkOrganizationsDto {
  @IsNotEmpty()
  @IsMongoId()
  sourceOrganizationId!: string;

  @IsNotEmpty()
  @IsMongoId()
  targetOrganizationId!: string;
}
