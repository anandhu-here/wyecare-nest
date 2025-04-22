// shiftPatternsApi.ts
import { baseApi } from '@/redux/baseApi';
import { IShiftPattern } from '@wyecare-monorepo/shared-types';

export interface CreateShiftPatternDto {
  name: string;
  rates?: {
    careHomeId: string;
    userType: string;
    weekdayRate: number;
    weekendRate: number;
    holidayRate?: number;
    emergencyWeekdayRate: number;
    emergencyWeekendRate: number;
    emergencyHolidayRate?: number;
  }[];
  userTypeRates?: {
    userType: string;
    weekdayRate: number;
    weekendRate: number;
    holidayRate?: number;
    emergencyWeekdayRate: number;
    emergencyWeekendRate: number;
    emergencyHolidayRate?: number;
  }[];
  timings?: {
    startTime: string;
    endTime: string;
    careHomeId: string;
    billableHours?: number;
    breakHours?: number;
  }[];
}

export interface CreateAgencyShiftPatternDto {
  name: string;
  homeRates: {
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
  }[];
  timings: {
    careHomeId: string;
    startTime: string;
    endTime: string;
    billableHours?: number;
    breakHours?: number;
  }[];
}

export const shiftPatternsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShiftPatterns: builder.query<IShiftPattern[], void>({
      query: () => 'shift-patterns',
      providesTags: ['ShiftPatterns'],
    }),

    getShiftPattern: builder.query<IShiftPattern, string>({
      query: (id) => `shift-patterns/${id}`,
      providesTags: (result, error, id) => [{ type: 'ShiftPattern', id }],
    }),

    getOtherOrganizationShiftPatterns: builder.query<IShiftPattern[], string>({
      query: (organizationId) => `shift-patterns/other/${organizationId}`,
      providesTags: (result, error, organizationId) => [
        { type: 'OtherShiftPatterns', id: organizationId },
      ],
    }),

    createShiftPattern: builder.mutation<IShiftPattern, CreateShiftPatternDto>({
      query: (data) => ({
        url: 'shift-patterns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShiftPatterns'],
    }),

    createAgencyShiftPattern: builder.mutation<
      IShiftPattern,
      CreateAgencyShiftPatternDto
    >({
      query: (data) => ({
        url: 'shift-patterns/agency',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShiftPatterns'],
    }),

    updateShiftPattern: builder.mutation<
      IShiftPattern,
      { id: string; data: Partial<CreateShiftPatternDto> }
    >({
      query: ({ id, data }) => ({
        url: `shift-patterns/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        'ShiftPatterns',
        { type: 'ShiftPattern', id },
      ],
    }),

    deleteShiftPattern: builder.mutation<void, string>({
      query: (id) => ({
        url: `shift-patterns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShiftPatterns'],
    }),
  }),
});

export const {
  useGetShiftPatternsQuery,
  useGetShiftPatternQuery,
  useGetOtherOrganizationShiftPatternsQuery,
  useCreateShiftPatternMutation,
  useCreateAgencyShiftPatternMutation,
  useUpdateShiftPatternMutation,
  useDeleteShiftPatternMutation,
} = shiftPatternsApi;
