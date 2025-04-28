import { baseApi } from '@/redux/baseApi';
import {
  LeaveRequest,
  LeaveStatus,
  LeavePolicy,
  LeaveBalance,
} from '@wyecare-monorepo/shared-types';
import { Types } from 'mongoose';

// Request DTOs
interface CreateLeaveRequestDto {
  leaveType: string;
  startDateTime: string;
  endDateTime: string;
  timeUnit: string;
  amount: number;
  reason: string;
  attachments?: string[];
  isPartialTimeUnit?: boolean;
  partialTimeDetails?: {
    startTime?: string;
    endTime?: string;
    hoursRequested?: number;
    timeSlots?: Array<{
      date: string;
      startTime: string;
      endTime: string;
      hoursCount: number;
    }>;
  };
  isRecurring?: boolean;
  recurringPattern?: {
    frequency?: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

interface UpdateLeaveStatusDto {
  status: LeaveStatus;
  comments?: string;
}

interface InvalidateLeaveRequestDto {
  reason: string;
}

interface CancelLeaveRequestDto {
  reason: string;
}

interface CheckLeaveConflictsDto {
  startDateTime: string;
  endDateTime: string;
}

interface GetLeaveRequestsDto {
  status?: LeaveStatus;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Response interfaces
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

interface ConflictCheckResponse {
  hasConflict: boolean;
  message: string;
}

interface LeaveTypeResponse {
  name: string;
  description?: string;
  type: string;
  allowedTimeUnits: string[];
  entitlementAmount: number;
  defaultTimeUnit: string;
  requiresApproval: boolean;
  [key: string]: any;
}

export const leaveManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new leave request
    createLeaveRequest: builder.mutation<
      ApiResponse<LeaveRequest>,
      CreateLeaveRequestDto
    >({
      query: (data) => ({
        url: 'leave-management/requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveBalance'],
    }),

    // Get all leave requests for an organization (admin)
    getLeaveRequests: builder.query<
      PaginatedResponse<LeaveRequest>,
      { organizationId: string } & GetLeaveRequestsDto
    >({
      query: ({ organizationId, ...params }) => ({
        url: `leave-management/requests/organization/${organizationId}`,
        method: 'GET',
        params,
      }),
      providesTags: ['LeaveRequests'],
    }),

    // Get user's leave balance
    getUserLeaveBalance: builder.query<ApiResponse<LeaveBalance>, void>({
      query: () => ({
        url: 'leave-management/balance',
        method: 'GET',
      }),
      providesTags: ['LeaveBalance'],
    }),

    // Get specific user's leave balance (admin only)
    getSpecificUserLeaveBalance: builder.query<
      ApiResponse<LeaveBalance>,
      { organizationId: string; userId: string }
    >({
      query: ({ organizationId, userId }) => ({
        url: `leave-management/balance/${organizationId}/${userId}`,
        method: 'GET',
      }),
      providesTags: ['LeaveBalance'],
    }),

    // Update leave request status (approve/reject)
    updateLeaveStatus: builder.mutation<
      ApiResponse<LeaveRequest>,
      { requestId: string; updateStatusDto: UpdateLeaveStatusDto }
    >({
      query: ({ requestId, updateStatusDto }) => ({
        url: `leave-management/requests/${requestId}/status`,
        method: 'PUT',
        body: updateStatusDto,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveBalance'],
    }),

    // Check for leave conflicts
    checkLeaveConflicts: builder.mutation<
      ApiResponse<ConflictCheckResponse>,
      CheckLeaveConflictsDto
    >({
      query: (data) => ({
        url: 'leave-management/check-conflicts',
        method: 'POST',
        body: data,
      }),
    }),

    // Update or create organization leave policy
    upsertLeavePolicy: builder.mutation<
      ApiResponse<LeavePolicy>,
      Partial<LeavePolicy>
    >({
      query: (data) => ({
        url: 'leave-management/policy',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['LeavePolicy'],
    }),

    // Get organization leave policy
    getLeavePolicy: builder.query<ApiResponse<LeavePolicy>, void>({
      query: () => ({
        url: 'leave-management/policy',
        method: 'GET',
      }),
      providesTags: ['LeavePolicy'],
    }),

    // Get leave types for organization
    getLeaveTypes: builder.query<ApiResponse<LeaveTypeResponse[]>, void>({
      query: () => ({
        url: 'leave-management/leave-types',
        method: 'GET',
      }),
      providesTags: ['LeaveTypes'],
    }),

    // Delete a leave policy
    deleteLeavePolicy: builder.mutation<
      ApiResponse<void>,
      { policyId: string }
    >({
      query: ({ policyId }) => ({
        url: `leave-management/policy/${policyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeavePolicy'],
    }),

    // Invalidate a leave request (admin)
    invalidateLeaveRequest: builder.mutation<
      ApiResponse<LeaveRequest>,
      { requestId: string; invalidateDto: InvalidateLeaveRequestDto }
    >({
      query: ({ requestId, invalidateDto }) => ({
        url: `leave-management/requests/${requestId}/invalidate`,
        method: 'PUT',
        body: invalidateDto,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveBalance'],
    }),

    // Cancel a leave request (self)
    cancelLeaveRequest: builder.mutation<
      ApiResponse<LeaveRequest>,
      { requestId: string; cancelDto: CancelLeaveRequestDto }
    >({
      query: ({ requestId, cancelDto }) => ({
        url: `leave-management/requests/${requestId}/cancel`,
        method: 'PUT',
        body: cancelDto,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveBalance'],
    }),

    // Get a single leave request by ID
    getLeaveRequest: builder.query<ApiResponse<LeaveRequest>, string>({
      query: (requestId) => ({
        url: `leave-management/requests/${requestId}`,
        method: 'GET',
      }),
      providesTags: (result, error, requestId) => [
        { type: 'LeaveRequests', id: requestId },
      ],
    }),

    // Delete a leave request
    deleteLeaveRequest: builder.mutation<ApiResponse<void>, string>({
      query: (requestId) => ({
        url: `leave-management/requests/${requestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveBalance'],
    }),

    // Manually trigger leave accrual calculation (admin only)
    processLeaveAccruals: builder.mutation<
      ApiResponse<{ processedCount: number }>,
      void
    >({
      query: () => ({
        url: 'leave-management/process-accruals',
        method: 'POST',
      }),
      invalidatesTags: ['LeaveBalance'],
    }),
  }),
  overrideExisting: false,
});

// Export the auto-generated hooks
export const {
  useCreateLeaveRequestMutation,
  useGetLeaveRequestsQuery,
  useLazyGetLeaveRequestsQuery,
  useGetUserLeaveBalanceQuery,
  useGetSpecificUserLeaveBalanceQuery,
  useUpdateLeaveStatusMutation,
  useCheckLeaveConflictsMutation,
  useUpsertLeavePolicyMutation,
  useGetLeavePolicyQuery,
  useGetLeaveTypesQuery,
  useDeleteLeavePolicyMutation,
  useInvalidateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useGetLeaveRequestQuery,
  useDeleteLeaveRequestMutation,
  useProcessLeaveAccrualsMutation,
} = leaveManagementApi;
