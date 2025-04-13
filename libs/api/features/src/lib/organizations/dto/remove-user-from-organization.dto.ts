import { IsNotEmpty, IsMongoId } from 'class-validator';

export class RemoveUserFromOrganizationDto {
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;

  @IsNotEmpty()
  @IsMongoId()
  organizationId!: string;
}
