import { baseApi } from '@/redux/baseApi';
import {
  Timesheet,
  TimesheetStatus,
  InvoiceStatus,
  CreateTimesheetDto,
  UpdateTimesheetDto,
  TimesheetQueryFilters,
} from '@wyecare-monorepo/shared-types';

export const timesheetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get timesheets with filters
    getTimesheets: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        status?: 'all' | 'approved' | 'pending' | 'rejected';
        invoiceStatus?: string;
        startDate?: string;
        endDate?: string;
        isEmergency?: boolean;
        carerRole?: string;
        shiftPatternId?: string;
        careUserId?: string;
        organizationId?: string;
      }
    >({
      query: (params) => ({
        url: '/timesheets',
        method: 'GET',
        params,
      }),
      providesTags: ['Timesheets'],
    }),
    getUserTimesheetByShiftId: builder.query({
      query: (params) => ({
        url: `/timesheets/user/${params.shiftId}`,
        method: 'GET',
      }),
      providesTags: ['Timesheets'],
    }),

    // Get timesheet stats
    getTimesheetStats: builder.query<
      any,
      {
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: '/timesheets/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['TimesheetStats'],
    }),

    // Get user timesheets
    getUserTimesheets: builder.query<
      any,
      {
        userId: string;
        startDate: string;
        endDate: string;
      }
    >({
      query: (params) => ({
        url: '/timesheets/user',
        method: 'GET',
        params,
      }),
      providesTags: (result, error, arg) => [
        { type: 'Timesheets', id: arg.userId },
      ],
    }),

    // Create timesheet
    createTimesheet: builder.mutation<
      Timesheet,
      {
        shiftId: string;
        shiftPatternId?: string;
        homeId?: string;
      }
    >({
      query: (data) => ({
        url: '/timesheets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timesheets'],
    }),

    // Create manual timesheets
    createManualTimesheets: builder.mutation<
      any,
      {
        homeId: string;
        shiftPatternId: string;
        carerIds: string[];
        shiftDate: string;
        temporaryHomeId?: string;
        isTemporaryHome?: boolean;
      }
    >({
      query: (data) => ({
        url: '/timesheets/upload-manual',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timesheets'],
    }),

    // Create timesheet for signature
    createTimesheetForSignature: builder.mutation<
      Timesheet,
      {
        shiftId: string;
        homeId: string;
      }
    >({
      query: (data) => ({
        url: '/timesheets/create-for-signature',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timesheets'],
    }),

    // Approve timesheet with signature
    approveTimesheetWithSignature: builder.mutation<
      Timesheet,
      {
        timesheetId: string;
        signatureData: string;
        signerName: string;
        signerRole: 'nurse' | 'senior carer' | 'manager' | 'admin';
        rating?: number;
        review?: string;
      }
    >({
      query: ({ timesheetId, ...data }) => ({
        url: `/timesheets/${timesheetId}/approve-with-signature`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Approve timesheet
    approveTimesheet: builder.mutation<
      Timesheet,
      {
        timesheetId: string;
        rating?: number;
        review?: string;
        barcode?: string;
      }
    >({
      query: ({ timesheetId, ...data }) => ({
        url: `/timesheets/${timesheetId}/approve`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Reject timesheet
    rejectTimesheet: builder.mutation<
      Timesheet,
      {
        timesheetId: string;
        reason: string;
      }
    >({
      query: ({ timesheetId, ...data }) => ({
        url: `/timesheets/${timesheetId}/reject`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Invalidate timesheet
    invalidateTimesheet: builder.mutation<Timesheet, string>({
      query: (timesheetId) => ({
        url: `/timesheets/invalidate/${timesheetId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Delete timesheet
    deleteTimesheet: builder.mutation<void, string>({
      query: (timesheetId) => ({
        url: `/timesheets/${timesheetId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Scan QR/barcode
    scanBarcode: builder.mutation<
      Timesheet,
      {
        barcode: string;
        carerId?: string;
      }
    >({
      query: (data) => ({
        url: '/timesheets/scan-qr',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timesheets', 'TimesheetStats'],
    }),

    // Check timesheet status by QR code
    checkTimesheetStatus: builder.query<Timesheet, string>({
      query: (qrCode) => ({
        url: '/timesheets/check-status',
        method: 'GET',
        params: { qrCode },
      }),
      providesTags: ['Timesheets'],
    }),
  }),
});

export const {
  useGetTimesheetsQuery,
  useLazyGetTimesheetsQuery,
  useGetTimesheetStatsQuery,
  useGetUserTimesheetsQuery,
  useCreateTimesheetMutation,
  useCreateManualTimesheetsMutation,
  useCreateTimesheetForSignatureMutation,
  useApproveTimesheetWithSignatureMutation,
  useApproveTimesheetMutation,
  useRejectTimesheetMutation,
  useInvalidateTimesheetMutation,
  useDeleteTimesheetMutation,
  useScanBarcodeMutation,
  useCheckTimesheetStatusQuery,
  useLazyCheckTimesheetStatusQuery,

  useGetUserTimesheetByShiftIdQuery,
} = timesheetsApi;
