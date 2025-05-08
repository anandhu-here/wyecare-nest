import { api } from '../api';

export const addShiftTagTypes = [
  'shifts/shift-types',
  'shifts/shift-schedules',
  'shifts/shift-attendances',
  'shifts/shift-reports',
] as const;

export const shiftsApi = api
  .enhanceEndpoints({
    addTagTypes: addShiftTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      // Shift Types
      createShiftType: build.mutation<ShiftType, CreateShiftTypeDto>({
        query: (createShiftTypeDto) => ({
          url: `shift-types`,
          method: 'POST',
          body: createShiftTypeDto,
        }),
        invalidatesTags: ['shifts/shift-types'],
      }),

      findAllShiftTypes: build.query<ShiftType[], FindShiftTypeDto>({
        query: (query) => ({
          url: `shift-types`,
          params: query,
        }),
        providesTags: ['shifts/shift-types'],
      }),

      findOneShiftType: build.query<ShiftType, string>({
        query: (id) => ({
          url: `shift-types/${id}`,
        }),
        providesTags: ['shifts/shift-types'],
      }),

      updateShiftType: build.mutation<
        ShiftType,
        { id: string; updateShiftTypeDto: UpdateShiftTypeDto }
      >({
        query: ({ id, updateShiftTypeDto }) => ({
          url: `shift-types/${id}`,
          method: 'PATCH',
          body: updateShiftTypeDto,
        }),
        invalidatesTags: ['shifts/shift-types'],
      }),

      removeShiftType: build.mutation<ShiftType, string>({
        query: (id) => ({
          url: `shift-types/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['shifts/shift-types'],
      }),

      cloneShiftType: build.mutation<
        ShiftType,
        { id: string; updateData: Partial<UpdateShiftTypeDto> }
      >({
        query: ({ id, updateData }) => ({
          url: `shift-types/${id}/clone`,
          method: 'POST',
          body: updateData,
        }),
        invalidatesTags: ['shifts/shift-types'],
      }),

      findShiftTypesByOrganization: build.query<ShiftType[], string>({
        query: (organizationId) => ({
          url: `shift-types/organization/${organizationId}`,
        }),
        providesTags: ['shifts/shift-types'],
      }),

      // Shift Schedules
      createShiftSchedule: build.mutation<
        ShiftSchedule,
        CreateShiftScheduleDto
      >({
        query: (createShiftScheduleDto) => ({
          url: `shift-schedules`,
          method: 'POST',
          body: createShiftScheduleDto,
        }),
        invalidatesTags: ['shifts/shift-schedules'],
      }),

      bulkCreateShiftSchedules: build.mutation<
        ShiftSchedule[],
        BulkCreateShiftScheduleDto
      >({
        query: (bulkCreateDto) => ({
          url: `shift-schedules/bulk`,
          method: 'POST',
          body: bulkCreateDto,
        }),
        invalidatesTags: ['shifts/shift-schedules'],
      }),

      findAllShiftSchedules: build.query<ShiftSchedule[], FindShiftScheduleDto>(
        {
          query: (query) => ({
            url: `shift-schedules`,
            params: query,
          }),
          providesTags: ['shifts/shift-schedules'],
        }
      ),

      findOneShiftSchedule: build.query<ShiftSchedule, string>({
        query: (id) => ({
          url: `shift-schedules/${id}`,
        }),
        providesTags: ['shifts/shift-schedules'],
      }),

      updateShiftSchedule: build.mutation<
        ShiftSchedule,
        { id: string; updateShiftScheduleDto: UpdateShiftScheduleDto }
      >({
        query: ({ id, updateShiftScheduleDto }) => ({
          url: `shift-schedules/${id}`,
          method: 'PATCH',
          body: updateShiftScheduleDto,
        }),
        invalidatesTags: ['shifts/shift-schedules'],
      }),

      removeShiftSchedule: build.mutation<ShiftSchedule, string>({
        query: (id) => ({
          url: `shift-schedules/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['shifts/shift-schedules'],
      }),

      findShiftSchedulesByStaff: build.query<
        ShiftSchedule[],
        {
          staffProfileId: string;
          query: Omit<FindShiftScheduleDto, 'staffProfileId'>;
        }
      >({
        query: ({ staffProfileId, query }) => ({
          url: `shift-schedules/staff/${staffProfileId}`,
          params: query,
        }),
        providesTags: ['shifts/shift-schedules'],
      }),

      findShiftSchedulesByDepartment: build.query<
        ShiftSchedule[],
        {
          departmentId: string;
          query: Omit<FindShiftScheduleDto, 'departmentId'>;
        }
      >({
        query: ({ departmentId, query }) => ({
          url: `shift-schedules/department/${departmentId}`,
          params: query,
        }),
        providesTags: ['shifts/shift-schedules'],
      }),

      swapShifts: build.mutation<
        { source: ShiftSchedule; target: ShiftSchedule },
        SwapShiftDto
      >({
        query: (swapShiftDto) => ({
          url: `shift-schedules/swap`,
          method: 'POST',
          body: swapShiftDto,
        }),
        invalidatesTags: ['shifts/shift-schedules'],
      }),

      // Shift Attendances
      createShiftAttendance: build.mutation<
        ShiftAttendance,
        CreateShiftAttendanceDto
      >({
        query: (createShiftAttendanceDto) => ({
          url: `shift-attendances`,
          method: 'POST',
          body: createShiftAttendanceDto,
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      findAllShiftAttendances: build.query<
        ShiftAttendance[],
        FindShiftAttendanceDto
      >({
        query: (query) => ({
          url: `shift-attendances`,
          params: query,
        }),
        providesTags: ['shifts/shift-attendances'],
      }),

      findOneShiftAttendance: build.query<ShiftAttendance, string>({
        query: (id) => ({
          url: `shift-attendances/${id}`,
        }),
        providesTags: ['shifts/shift-attendances'],
      }),

      updateShiftAttendance: build.mutation<
        ShiftAttendance,
        { id: string; updateShiftAttendanceDto: UpdateShiftAttendanceDto }
      >({
        query: ({ id, updateShiftAttendanceDto }) => ({
          url: `shift-attendances/${id}`,
          method: 'PATCH',
          body: updateShiftAttendanceDto,
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      removeShiftAttendance: build.mutation<ShiftAttendance, string>({
        query: (id) => ({
          url: `shift-attendances/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      approveShiftAttendance: build.mutation<
        ShiftAttendance,
        { id: string; approvalData: { approvedById: string; notes?: string } }
      >({
        query: ({ id, approvalData }) => ({
          url: `shift-attendances/${id}/approve`,
          method: 'POST',
          body: approvalData,
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      findShiftAttendanceByShiftSchedule: build.query<ShiftAttendance, string>({
        query: (shiftScheduleId) => ({
          url: `shift-attendances/by-shift/${shiftScheduleId}`,
        }),
        providesTags: ['shifts/shift-attendances'],
      }),

      clockIn: build.mutation<ShiftAttendance, string>({
        query: (shiftScheduleId) => ({
          url: `shift-attendances/clock-in/${shiftScheduleId}`,
          method: 'POST',
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      clockOut: build.mutation<ShiftAttendance, string>({
        query: (shiftScheduleId) => ({
          url: `shift-attendances/clock-out/${shiftScheduleId}`,
          method: 'POST',
        }),
        invalidatesTags: ['shifts/shift-attendances'],
      }),

      // Shift Reports
      getStaffHoursReport: build.query<
        StaffHoursReport,
        { staffProfileId: string; startDate?: Date; endDate?: Date }
      >({
        query: ({ staffProfileId, startDate, endDate }) => ({
          url: `shift-reports/staff/${staffProfileId}`,
          params: {
            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
          },
        }),
        providesTags: ['shifts/shift-reports'],
      }),

      getDepartmentHoursReport: build.query<
        DepartmentHoursReport,
        { departmentId: string; startDate?: Date; endDate?: Date }
      >({
        query: ({ departmentId, startDate, endDate }) => ({
          url: `shift-reports/department/${departmentId}`,
          params: {
            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
          },
        }),
        providesTags: ['shifts/shift-reports'],
      }),

      getOrganizationCoverageReport: build.query<
        OrganizationCoverageReport,
        { organizationId: string; startDate?: Date; endDate?: Date }
      >({
        query: ({ organizationId, startDate, endDate }) => ({
          url: `shift-reports/organization/${organizationId}/coverage`,
          params: {
            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
          },
        }),
        providesTags: ['shifts/shift-reports'],
      }),

      getOvertimeReport: build.query<
        OvertimeReportItem[],
        { organizationId: string; startDate?: Date; endDate?: Date }
      >({
        query: ({ organizationId, startDate, endDate }) => ({
          url: `shift-reports/organization/${organizationId}/overtime`,
          params: {
            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
          },
        }),
        providesTags: ['shifts/shift-reports'],
      }),
    }),
    overrideExisting: false,
  });

// Types
export interface ShiftType {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  isOvernight: boolean;
  hoursCount: number;
  basePayMultiplier: number;
  description?: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateShiftTypeDto {
  name: string;
  startTime: Date;
  endTime: Date;
  isOvernight?: boolean;
  hoursCount: number;
  basePayMultiplier?: number;
  description?: string;
  organizationId: string;
}

export interface UpdateShiftTypeDto {
  name?: string;
  startTime?: Date;
  endTime?: Date;
  isOvernight?: boolean;
  hoursCount?: number;
  basePayMultiplier?: number;
  description?: string;
  organizationId?: string;
}

export interface FindShiftTypeDto {
  name?: string;
  organizationId?: string;
  isOvernight?: boolean;
  skip?: number;
  take?: number;
}

export interface ShiftSchedule {
  id: string;
  staffProfileId: string;
  shiftTypeId: string;
  departmentId: string;
  startDateTime: Date;
  endDateTime: Date;
  status: string;
  isConfirmed: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  staffProfile?: any;
  shiftType?: ShiftType;
  department?: any;
  attendance?: ShiftAttendance;
}

export interface CreateShiftScheduleDto {
  staffProfileId: string;
  shiftTypeId: string;
  departmentId: string;
  startDateTime: Date;
  endDateTime: Date;
  status?: string;
  isConfirmed?: boolean;
  notes?: string;
}

export interface UpdateShiftScheduleDto {
  staffProfileId?: string;
  shiftTypeId?: string;
  departmentId?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  status?: string;
  isConfirmed?: boolean;
  notes?: string;
}

export interface FindShiftScheduleDto {
  staffProfileId?: string;
  shiftTypeId?: string;
  departmentId?: string;
  startDateTimeFrom?: Date;
  startDateTimeTo?: Date;
  status?: string;
  isConfirmed?: boolean;
  skip?: number;
  take?: number;
}

export interface BulkCreateShiftScheduleDto {
  shifts: CreateShiftScheduleDto[];
}

export interface SwapShiftDto {
  sourceShiftId: string;
  targetShiftId: string;
  reason?: string;
}

export interface ShiftAttendance {
  id: string;
  shiftScheduleId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: string;
  overtimeMinutes: number;
  approvedById?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  shiftSchedule?: ShiftSchedule;
  approvedBy?: any;
}

export interface CreateShiftAttendanceDto {
  shiftScheduleId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status?: string;
  overtimeMinutes?: number;
  approvedById?: string;
  notes?: string;
}

export interface UpdateShiftAttendanceDto {
  actualStartTime?: Date;
  actualEndTime?: Date;
  status?: string;
  overtimeMinutes?: number;
  approvedById?: string;
  notes?: string;
}

export interface FindShiftAttendanceDto {
  shiftScheduleId?: string;
  status?: string;
  approvedById?: string;
  skip?: number;
  take?: number;
}

export interface StaffHoursReport {
  staffProfileId: string;
  staffName: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  shifts: number;
  absences: number;
  lateArrivals: number;
}

export interface DepartmentHoursReport {
  departmentId: string;
  departmentName: string;
  staffCount: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalShifts: number;
  totalAbsences: number;
  staffReports: StaffHoursReport[];
}

export interface OrganizationCoverageReport {
  totalScheduledShifts: number;
  totalCompletedShifts: number;
  coverageRate: number;
  departmentsWithLowCoverage: Array<{
    departmentId: string;
    departmentName: string;
    coverageRate: number;
  }>;
}

export interface OvertimeReportItem {
  staffProfileId: string;
  staffName: string;
  departmentName: string;
  totalOvertimeHours: number;
  totalOvertimeMinutes: number;
  costImpact: number;
}

// Export hooks for usage in components
export const {
  // Shift Types
  useCreateShiftTypeMutation,
  useFindAllShiftTypesQuery,
  useFindOneShiftTypeQuery,
  useUpdateShiftTypeMutation,
  useRemoveShiftTypeMutation,
  useCloneShiftTypeMutation,
  useFindShiftTypesByOrganizationQuery,

  // Shift Schedules
  useCreateShiftScheduleMutation,
  useBulkCreateShiftSchedulesMutation,
  useFindAllShiftSchedulesQuery,
  useFindOneShiftScheduleQuery,
  useUpdateShiftScheduleMutation,
  useRemoveShiftScheduleMutation,
  useFindShiftSchedulesByStaffQuery,
  useFindShiftSchedulesByDepartmentQuery,
  useSwapShiftsMutation,

  // Shift Attendances
  useCreateShiftAttendanceMutation,
  useFindAllShiftAttendancesQuery,
  useFindOneShiftAttendanceQuery,
  useUpdateShiftAttendanceMutation,
  useRemoveShiftAttendanceMutation,
  useApproveShiftAttendanceMutation,
  useFindShiftAttendanceByShiftScheduleQuery,
  useClockInMutation,
  useClockOutMutation,

  // Shift Reports
  useGetStaffHoursReportQuery,
  useGetDepartmentHoursReportQuery,
  useGetOrganizationCoverageReportQuery,
  useGetOvertimeReportQuery,
} = shiftsApi;
