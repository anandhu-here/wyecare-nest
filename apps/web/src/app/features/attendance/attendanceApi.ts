import { baseApi } from '@/redux/baseApi';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Generate QR code for attendance
    generateQRCode: builder.mutation<any, any>({
      query: (data) => ({
        url: '/attendance/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AttendanceQR'],
    }),

    // Scan QR code
    scanQRCode: builder.mutation<
      any,
      {
        barcode: string;
        carerId: string;
      }
    >({
      query: (data) => ({
        url: '/attendance/scan',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Check attendance status by QR code
    checkAttendanceStatus: builder.query<any, string>({
      query: (qrCode) => ({
        url: '/attendance/check-status',
        method: 'GET',
        params: { qrCode },
      }),
      providesTags: ['Attendance'],
    }),

    // Get attendance status for a specific date
    getAttendanceStatus: builder.query<
      any,
      {
        day: string;
        month: string;
        year: string;
      }
    >({
      query: (params) => ({
        url: '/attendance/status',
        method: 'GET',
        params,
      }),
      providesTags: ['Attendance'],
    }),

    // Generate workplace QR codes
    generateWorkplaceQRs: builder.query<any, string>({
      query: (workplaceId) => ({
        url: `/attendance/workplace/${workplaceId}/qr`,
        method: 'GET',
      }),
      providesTags: ['AttendanceQR'],
    }),

    // Clock in
    clockIn: builder.mutation<
      any,
      {
        qrCode: string;
        deviceId?: string;
        location?: any;
      }
    >({
      query: (data) => ({
        url: '/attendance/clock-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'AttendanceRegistry'],
    }),

    // Clock out
    clockOut: builder.mutation<
      any,
      {
        qrCode: string;
        deviceId?: string;
        location?: any;
      }
    >({
      query: (data) => ({
        url: '/attendance/clock-out',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'AttendanceRegistry'],
    }),

    // Get workplace attendance
    getWorkplaceAttendance: builder.query<
      any,
      {
        workplaceId: string;
        date?: string;
      }
    >({
      query: ({ workplaceId, date }) => ({
        url: `/attendance/workplace/${workplaceId}/attendance`,
        method: 'GET',
        params: date ? { date } : undefined,
      }),
      providesTags: ['AttendanceRegistry'],
    }),

    // Get attendance scanner data
    getAttendanceScanner: builder.query<any, void>({
      query: () => ({
        url: '/attendance/attendance/scan',
        method: 'GET',
      }),
      providesTags: ['Attendance'],
    }),

    // Get attendance registry
    getAttendanceRegistry: builder.query<
      any,
      {
        startDate: string;
        endDate: string;
        staffType?: string;
        agencyId?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/attendance/registry',
        method: 'GET',
        params,
      }),
      providesTags: ['AttendanceRegistry'],
    }),

    // Get linked agencies for a home/organization
    getLinkedAgencies: builder.query<any, string>({
      query: (homeId) => ({
        url: `/attendance/organizations/${homeId}/linked-agencies`,
        method: 'GET',
      }),
      providesTags: ['Organizations'],
    }),

    // Update attendance record manually (admin function)
    updateAttendanceManually: builder.mutation<
      any,
      {
        attendanceId: string;
        signInTime?: string;
        signOutTime?: string;
        status?: string;
        reason: string;
      }
    >({
      query: ({ attendanceId, ...data }) => ({
        url: `/attendance/${attendanceId}/manual-update`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'AttendanceRegistry'],
    }),

    // SSE connection for attendance events
    // Note: This is typically handled separately since it's an SSE endpoint,
    // but we include it here for completeness
    monitorAttendanceEvents: builder.query<any, string>({
      query: (qrCode) => ({
        url: '/attendance/attendance-events',
        method: 'GET',
        params: { qrCode },
      }),
      // This endpoint will be handled specially in the component
      // since it's an SSE connection
    }),
  }),
});

export const {
  useGenerateQRCodeMutation,
  useScanQRCodeMutation,
  useCheckAttendanceStatusQuery,
  useLazyCheckAttendanceStatusQuery,
  useGetAttendanceStatusQuery,
  useGenerateWorkplaceQRsQuery,
  useClockInMutation,
  useClockOutMutation,
  useGetWorkplaceAttendanceQuery,
  useGetAttendanceScannerQuery,
  useGetAttendanceRegistryQuery,
  useGetLinkedAgenciesQuery,
  useUpdateAttendanceManuallyMutation,
  // The SSE endpoint would typically be handled differently
  // but we include the hook for completeness
  useMonitorAttendanceEventsQuery,
} = attendanceApi;
