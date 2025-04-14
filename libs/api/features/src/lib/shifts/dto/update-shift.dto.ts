import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftDto } from './create-shift.dto';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateShiftDto extends PartialType(CreateShiftDto) {
  @IsBoolean()
  @IsOptional()
  isAccepted?: boolean;

  @IsBoolean()
  @IsOptional()
  isRejected?: boolean;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsBoolean()
  @IsOptional()
  isDone?: boolean;

  @IsBoolean()
  @IsOptional()
  agencyAccepted?: boolean;

  @IsString()
  @IsOptional()
  qrCodeToken?: string;

  @IsDate()
  @IsOptional()
  qrCodeTokenExpiry?: Date;

  @IsMongoId()
  @IsOptional()
  qrCodeTokenUserId?: string;

  @IsObject()
  @IsOptional()
  signedCarers?: Record<string, any>;
}
