import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  IsISO8601,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from 'libs/api/core/src/lib/schemas';

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class MetadataDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;
}

export class ScanQRCodeDto {
  @IsNotEmpty()
  @IsString()
  barcode: string;

  @IsNotEmpty()
  @IsString()
  carerId: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ClockInDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ClockOutDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GetAttendanceStatusDto {
  @IsNotEmpty()
  @IsString()
  day: string;

  @IsNotEmpty()
  @IsString()
  month: string;

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GetWorkplaceAttendanceDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GenerateQRCodeDto {
  @IsNotEmpty()
  @IsObject()
  shift: any;

  @IsNotEmpty()
  @IsString()
  user: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CheckAttendanceStatusDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ManualUpdateAttendanceDto {
  @IsOptional()
  @IsISO8601()
  signInTime?: string;

  @IsOptional()
  @IsISO8601()
  signOutTime?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class GetAttendanceRegistryDto {
  @IsNotEmpty()
  @IsISO8601()
  startDate: string;

  @IsNotEmpty()
  @IsISO8601()
  endDate: string;

  @IsOptional()
  @IsString()
  staffType?: string;

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
