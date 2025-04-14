import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RateDto {
  @IsNotEmpty()
  @IsString()
  careHomeId!: string;

  @IsNotEmpty()
  @IsString()
  userType!: string;

  @IsNotEmpty()
  @IsNumber()
  weekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  weekendRate!: number;

  @IsOptional()
  @IsNumber()
  holidayRate?: number;

  @IsNotEmpty()
  @IsNumber()
  emergencyWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  emergencyWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  emergencyHolidayRate?: number;
}

class UserTypeRateDto {
  @IsNotEmpty()
  @IsString()
  userType!: string;

  @IsNotEmpty()
  @IsNumber()
  weekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  weekendRate!: number;

  @IsOptional()
  @IsNumber()
  holidayRate?: number;

  @IsNotEmpty()
  @IsNumber()
  emergencyWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  emergencyWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  emergencyHolidayRate?: number;
}

class HomeTimingDto {
  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @IsNotEmpty()
  @IsString()
  careHomeId!: string;

  @IsOptional()
  @IsNumber()
  billableHours?: number;

  @IsOptional()
  @IsNumber()
  breakHours?: number;
}

export class CreateShiftPatternDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateDto)
  rates?: RateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserTypeRateDto)
  userTypeRates?: UserTypeRateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeTimingDto)
  timings?: HomeTimingDto[];
}
