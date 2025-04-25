import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AvailabilityPeriod {
  DAY = 'day',
  NIGHT = 'night',
  BOTH = 'both',
}

export class AvailabilityEntryDto {
  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsNotEmpty()
  @IsEnum(AvailabilityPeriod)
  period: AvailabilityPeriod;
}

export class CreateAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityEntryDto)
  availabilityEntries: AvailabilityEntryDto[];

  @IsNotEmpty()
  @IsISO8601()
  effectiveFrom: string;

  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}

export class UpdateAvailabilityDto extends CreateAvailabilityDto {}

export class SingleDateAvailabilityDto {
  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsOptional()
  @IsEnum(AvailabilityPeriod)
  period?: AvailabilityPeriod | null;
}

export class GetAvailabilityQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsISO8601()
  startDate: string;

  @IsNotEmpty()
  @IsISO8601()
  endDate: string;
}

export class GetAvailableEmployeesQueryDto {
  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsNotEmpty()
  @IsEnum(AvailabilityPeriod)
  period: AvailabilityPeriod;
}
