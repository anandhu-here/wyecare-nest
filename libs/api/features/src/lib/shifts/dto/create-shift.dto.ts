import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class NursePreferenceDto {
  @IsEnum(['RN', 'EN', 'NA'])
  @IsOptional()
  classification?: string;

  @IsNumber()
  @IsOptional()
  count?: number;
}

class GenderPreferenceDto {
  @IsNumber()
  @IsOptional()
  male?: number;

  @IsNumber()
  @IsOptional()
  female?: number;
}

class RequirementsDto {
  @IsNumber()
  @IsOptional()
  minExperience?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];
}

export class CreateShiftDto {
  @IsMongoId()
  @IsOptional()
  agentId?: string;

  @IsMongoId()
  @IsNotEmpty()
  homeId!: string;

  @IsBoolean()
  @IsOptional()
  isTemporaryHome?: boolean;

  @IsMongoId()
  @IsOptional()
  temporaryHomeId?: string;

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  assignedUsers?: string[];

  @IsMongoId()
  @IsOptional()
  shiftPattern?: string;

  @IsBoolean()
  @IsOptional()
  emergency?: boolean;

  @IsBoolean()
  @IsOptional()
  isEmergency?: boolean;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GenderPreferenceDto)
  genderPreference?: GenderPreferenceDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NursePreferenceDto)
  nursePreference?: NursePreferenceDto;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  preferredStaff?: string[];

  @IsBoolean()
  @IsOptional()
  needsApproval?: boolean;

  @IsEnum(['pending', 'approved', 'rejected', 'invalidated'])
  @IsOptional()
  bookingStatus?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RequirementsDto)
  requirements?: RequirementsDto;
}
