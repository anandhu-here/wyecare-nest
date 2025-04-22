// libs/shared/types/src/lib/shift-pattern.interface.ts
import { Schema as MongooseSchema } from 'mongoose';

export interface IHomeTiming {
  startTime: string;
  endTime: string;
  careHomeId: string;
  billableHours?: number;
  breakHours?: number;
}

export interface IRate {
  careHomeId: string;
  userType: string;
  weekdayRate: number;
  weekendRate: number;
  holidayRate?: number;
  emergencyWeekdayRate: number;
  emergencyWeekendRate: number;
  emergencyHolidayRate?: number;
}

export interface IUserTypeRate {
  userType: string;
  weekdayRate: number;
  weekendRate: number;
  holidayRate?: number;
  emergencyWeekdayRate: number;
  emergencyWeekendRate: number;
  emergencyHolidayRate?: number;
}

export interface IShiftPattern {
  _id: string | MongooseSchema.Types.ObjectId;
  userId: string | MongooseSchema.Types.ObjectId;
  name: string;
  rates?: IRate[];
  userTypeRates?: IUserTypeRate[];
  timings?: IHomeTiming[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAgencyShiftPatternHomeRate {
  careHomeId: string;
  careHomeName: string;

  carerWeekdayRate: number;
  carerWeekendRate: number;
  carerHolidayRate?: number;
  carerEmergencyWeekdayRate: number;
  carerEmergencyWeekendRate: number;
  carerEmergencyHolidayRate?: number;

  nurseWeekdayRate: number;
  nurseWeekendRate: number;
  nurseHolidayRate?: number;
  nurseEmergencyWeekdayRate: number;
  nurseEmergencyWeekendRate: number;
  nurseEmergencyHolidayRate?: number;

  seniorCarerWeekdayRate: number;
  seniorCarerWeekendRate: number;
  seniorCarerHolidayRate?: number;
  seniorCarerEmergencyWeekdayRate: number;
  seniorCarerEmergencyWeekendRate: number;
  seniorCarerEmergencyHolidayRate?: number;
}

export interface IAgencyShiftPatternTiming {
  careHomeId: string;
  startTime: string;
  endTime: string;
  billableHours?: number;
  breakHours?: number;
}

export interface ICreateAgencyShiftPatternDto {
  name: string;
  homeRates: IAgencyShiftPatternHomeRate[];
  timings: IAgencyShiftPatternTiming[];
}
