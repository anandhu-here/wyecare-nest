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

class HomeRateDto {
  @IsNotEmpty()
  @IsMongoId()
  careHomeId!: string;

  @IsNotEmpty()
  @IsString()
  careHomeName!: string;

  // Carer rates
  @IsNotEmpty()
  @IsNumber()
  carerWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  carerWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  carerHolidayRate?: number;

  @IsNotEmpty()
  @IsNumber()
  carerEmergencyWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  carerEmergencyWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  carerEmergencyHolidayRate?: number;

  // Nurse rates
  @IsNotEmpty()
  @IsNumber()
  nurseWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  nurseWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  nurseHolidayRate?: number;

  @IsNotEmpty()
  @IsNumber()
  nurseEmergencyWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  nurseEmergencyWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  nurseEmergencyHolidayRate?: number;

  // Senior carer rates
  @IsNotEmpty()
  @IsNumber()
  seniorCarerWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  seniorCarerWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  seniorCarerHolidayRate?: number;

  @IsNotEmpty()
  @IsNumber()
  seniorCarerEmergencyWeekdayRate!: number;

  @IsNotEmpty()
  @IsNumber()
  seniorCarerEmergencyWeekendRate!: number;

  @IsOptional()
  @IsNumber()
  seniorCarerEmergencyHolidayRate?: number;
}

class HomeTimingDto {
  @IsNotEmpty()
  @IsMongoId()
  careHomeId!: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @IsOptional()
  @IsNumber()
  billableHours?: number;

  @IsOptional()
  @IsNumber()
  breakHours?: number;
}

// New class for UserTypeRate
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

export class CreateAgencyShiftPatternDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeRateDto)
  homeRates!: HomeRateDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeTimingDto)
  timings!: HomeTimingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserTypeRateDto)
  userTypeRates?: UserTypeRateDto[];
}
