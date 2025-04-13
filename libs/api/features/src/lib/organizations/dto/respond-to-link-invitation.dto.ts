import {
  IsNotEmpty,
  IsMongoId,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class RespondToLinkInvitationDto {
  @IsNotEmpty()
  @IsMongoId()
  invitationId!: string;

  @IsNotEmpty()
  @IsBoolean()
  accept!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
