// shiftsApi.ts
import { baseApi } from '@/redux/baseApi';
import { IShift, IShiftAssignment } from '@wyecare-monorepo/shared-types';

export interface CreateShiftDto {
  agentId?: string;
  homeId: string;
  isTemporaryHome?: boolean;
  temporaryHomeId?: string;
  count?: number;
  date: string;
  shiftPattern?: string;
  emergency?: boolean;
  genderPreference?: {
    male: number;
    female: number;
  };
  nursePreference?: {
    classification: 'RN' | 'EN' | 'NA';
    count: number;
  };
  preferredStaff?: string[];
  requirements?: {
    minExperience: number;
    specializations?: string[];
    certifications?: string[];
  };
}

export interface UpdateShiftDto extends Partial<CreateShiftDto> {
  isAccepted?: boolean;
  isRejected?: boolean;
  isCompleted?: boolean;
  isDone?: boolean;
  bookingStatus?: 'pending' | 'approved' | 'rejected' | 'invalidated';
}

export interface CreateShiftAssignmentDto {
  shift: string;
  user: string;
}

export interface UpdateShiftAssignmentDto {
  status?: 'assigned' | 'confirmed' | 'declined' | 'completed' | 'signed';
}

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShiftsForaDay: builder.query<IShift[], string>({
      query: (date) => `shifts/by-date/${date}`,
      providesTags: (result, error, date) => [
        { type: 'ShiftsByDate', id: date },
        'Shifts',
      ],
    }),

    // Approve unauthorized shift
    approveUnauthorizedShift: builder.mutation<
      IShift,
      { shiftId: string; action: 'approved' | 'rejected' }
    >({
      query: ({ shiftId, action }) => ({
        url: `shifts/${shiftId}/approve`,
        method: 'POST',
        body: { status: action },
      }),
      invalidatesTags: (result, error, { shiftId }) => [
        'Shifts',
        { type: 'Shift', id: shiftId },
        'ShiftsByDate',
        'HomeShifts',
        'AgencyShifts',
      ],
    }),

    // Accept shift by agency
    acceptShiftByAgency: builder.mutation<IShift, string>({
      query: (id) => ({
        url: `shifts/${id}/agency-accept`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        'Shifts',
        { type: 'Shift', id },
        'ShiftsByDate',
        'HomeShifts',
        'AgencyShifts',
      ],
    }),
    // Shift endpoints
    getShifts: builder.query<IShift[], void>({
      query: () => 'shifts',
      providesTags: ['Shifts'],
    }),

    getShift: builder.query<IShift, string>({
      query: (id) => `shifts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Shift', id }],
    }),

    getShiftsByDate: builder.query<IShift[], string>({
      query: (date) => `shifts/by-date/${date}`,
      providesTags: (result, error, date) => [
        { type: 'ShiftsByDate', id: date },
      ],
    }),

    getHomeShifts: builder.query<
      IShift[],
      { orgId: string; month?: number; year?: number }
    >({
      query: ({ orgId, month, year }) => {
        let url = `shifts/home/${orgId}`;
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month.toString());
        if (year !== undefined) params.append('year', year.toString());
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
      providesTags: (result, error, { orgId }) => [
        { type: 'HomeShifts', id: orgId },
      ],
    }),

    getAgencyShifts: builder.query<
      IShift[],
      { agencyId: string; month?: number; year?: number }
    >({
      query: ({ agencyId, month, year }) => {
        let url = `shifts/agency/${agencyId}`;
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month.toString());
        if (year !== undefined) params.append('year', year.toString());
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
      providesTags: (result, error, { agencyId }) => [
        { type: 'AgencyShifts', id: agencyId },
      ],
    }),

    createShift: builder.mutation<IShift, CreateShiftDto>({
      query: (data) => ({
        url: 'shifts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shifts'],
    }),

    createMultipleShifts: builder.mutation<
      IShift[],
      { shifts: CreateShiftDto[]; needsApproval?: boolean }
    >({
      query: (data) => ({
        url: 'shifts/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shifts'],
    }),

    updateShift: builder.mutation<IShift, { id: string; data: UpdateShiftDto }>(
      {
        query: ({ id, data }) => ({
          url: `shifts/${id}`,
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: (result, error, { id }) => [
          'Shifts',
          { type: 'Shift', id },
          'ShiftsByDate',
          'HomeShifts',
          'AgencyShifts',
        ],
      }
    ),

    deleteShift: builder.mutation<void, string>({
      query: (id) => ({
        url: `shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shifts', 'ShiftsByDate', 'HomeShifts', 'AgencyShifts'],
    }),

    acceptShift: builder.mutation<IShift, string>({
      query: (id) => ({
        url: `shifts/accept/${id}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        'Shifts',
        { type: 'Shift', id },
        'ShiftsByDate',
        'HomeShifts',
        'AgencyShifts',
      ],
    }),

    rejectShift: builder.mutation<IShift, string>({
      query: (id) => ({
        url: `shifts/reject/${id}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        'Shifts',
        { type: 'Shift', id },
        'ShiftsByDate',
        'HomeShifts',
        'AgencyShifts',
      ],
    }),

    getQuickStats: builder.query({
      query: ({ month, year }) => ({
        url: 'shifts/dashboard/quick-stats',
        method: 'GET',
        params: { month, year },
      }),
      providesTags: ['QuickStats'],
    }),

    // Shift assignment endpoints
    createShiftAssignment: builder.mutation<
      IShiftAssignment,
      CreateShiftAssignmentDto
    >({
      query: (data) => ({
        url: 'shifts/assignments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShiftAssignments'],
    }),

    getShiftAssignments: builder.query<IShiftAssignment[], string>({
      query: (shiftId) => `shifts/assignments/shift/${shiftId}`,
      providesTags: (result, error, shiftId) => [
        { type: 'ShiftAssignments', id: shiftId },
      ],
    }),

    getUserAssignments: builder.query({
      query: ({ userId }: { userId: string; orgId?: string }) => {
        let url = `shifts/assignments/user/${userId}`;
        return url;
      },
      providesTags: (result, error, { userId }) => [
        { type: 'UserAssignments', id: userId },
      ],
    }),

    updateShiftAssignment: builder.mutation<
      IShiftAssignment,
      { id: string; data: UpdateShiftAssignmentDto }
    >({
      query: ({ id, data }) => ({
        url: `shifts/assignments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        'ShiftAssignments',
        { type: 'ShiftAssignment', id },
        'UserAssignments',
      ],
    }),

    deleteShiftAssignment: builder.mutation<void, string>({
      query: (id) => ({
        url: `shifts/assignments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShiftAssignments', 'UserAssignments'],
    }),

    assignMultipleUsers: builder.mutation<
      IShiftAssignment[],
      { shiftId: string; userIds: string[] }
    >({
      query: ({ shiftId, userIds }) => ({
        url: `shifts/assignments/multiple/${shiftId}`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: (result, error, { shiftId }) => [
        'ShiftAssignments',
        { type: 'ShiftAssignments', id: shiftId },
        'UserAssignments',
      ],
    }),

    swapAssignedUsers: builder.mutation<
      IShiftAssignment,
      { shiftId: string; oldUserId: string; newUserId: string }
    >({
      query: ({ shiftId, oldUserId, newUserId }) => ({
        url: `shifts/assignments/swap/${shiftId}`,
        method: 'PUT',
        body: { oldUserId, newUserId },
      }),
      invalidatesTags: (result, error, { shiftId }) => [
        'ShiftAssignments',
        { type: 'ShiftAssignments', id: shiftId },
        'UserAssignments',
      ],
    }),
    getShiftWithAssignments: builder.query({
      query: (shiftId: string) => `shift/${shiftId}`,
      providesTags: (result, error, shiftId) => [
        { type: 'Shift', id: shiftId },
      ],
    }),
    getAssignedStaffs: builder.query({
      query: (shiftId: string) => `shift/${shiftId}/assigned`,
      providesTags: (result, error, shiftId) => [
        { type: 'AssignedStaffs', id: shiftId },
      ],
    }),
    assignUsersToShift: builder.mutation({
      query: ({ shiftId, assignments }) => ({
        url: `shift/${shiftId}/assign`,
        method: 'POST',
        body: { assignments },
      }),
      invalidatesTags: ['Shift', 'ShiftsForTheDay'],
    }),
    unassignUserFromShift: builder.mutation({
      query: ({ shiftId, userId }) => ({
        url: `shift/${shiftId}/unassign/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shift', 'ShiftsForTheDay'],
    }),
  }),
});

export const {
  useGetShiftWithAssignmentsQuery,
  useAssignUsersToShiftMutation,
  useUnassignUserFromShiftMutation,
  useGetAssignedStaffsQuery,
  useGetShiftsForaDayQuery,
  useApproveUnauthorizedShiftMutation,
  useAcceptShiftByAgencyMutation,
  useGetShiftsQuery,
  useGetShiftQuery,
  useGetShiftsByDateQuery,
  useGetHomeShiftsQuery,
  useGetAgencyShiftsQuery,
  useCreateShiftMutation,
  useCreateMultipleShiftsMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useAcceptShiftMutation,
  useRejectShiftMutation,
  useCreateShiftAssignmentMutation,
  useGetShiftAssignmentsQuery,
  useGetUserAssignmentsQuery,
  useUpdateShiftAssignmentMutation,
  useDeleteShiftAssignmentMutation,
  useAssignMultipleUsersMutation,
  useSwapAssignedUsersMutation,
  useGetQuickStatsQuery,
} = shiftsApi;
