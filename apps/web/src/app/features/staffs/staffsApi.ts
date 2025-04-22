import { baseApi } from '@/redux/baseApi';

interface IFavoriteStaff {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
  role: string;
  organization: string;
  notes?: {
    staffId: string;
    note: string;
    createdAt: string;
  }[];
}

interface IFavoriteStaffResponse {
  success: boolean;
  favoriteStaff: IFavoriteStaff[];
  notes: {
    staffId: string;
    note: string;
    createdAt: string;
  }[];
}

interface AddFavoriteStaffRequest {
  staffId: string;
}

interface AddFavoriteNoteRequest {
  staffId: string;
  note: string;
}

// Types
interface IStaffAvailability {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  role: string;
  organization: string;
  availability: {
    isAvailable: boolean;
    reason?: string;
    periods?: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      night: boolean;
    };
  };
}

interface IAvailableStaffResponse {
  success: boolean;
  data: IStaffAvailability[];
  meta: {
    total: number;
    availableCount: number;
  };
}

interface IStaffAvailabilityMap {
  success: boolean;
  data: Record<string, IStaffAvailability[]>;
  meta: {
    dateRange: {
      startDate: string;
      endDate: string;
      totalDays: number;
    };
  };
}

interface GetAvailableStaffParams {
  shiftPatternId: string;
  shiftDate: string;
  careHomeId: string;
}

interface GetStaffAvailabilityParams {
  startDate: string;
  endDate: string;
}
const buildStaffQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();

  const paramMappings = {
    page: (val: any) => val?.toString(),
    limit: (val: any) => val?.toString(),
    staffType: (val: any) => val, // Add this new parameter
    role: (val: any) => (val !== 'all' ? val : null),
    search: (val: any) => val,
    status: (val: any) => (val !== 'all' ? val : null),
    sortBy: (val: any) => val,
    sortOrder: (val: any) => val,
    startDate: (val: any) => val,
    endDate: (val: any) => val,
  };

  Object.entries(paramMappings).forEach(([key, transform]: any) => {
    const value = transform(params[key]);
    if (value) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffPaginated: builder.query({
      query: (params) => `/staffs/paginated${buildStaffQueryString(params)}`,
      providesTags: ['Staffs', 'StaffsForChat'],
    }),
    removeStaff: builder.mutation<any, string>({
      query: (staffId: string) => ({
        url: `/staffs/${staffId}`,
        method: 'DELETE',
      }),

      invalidatesTags: ['Staffs'],
    }),

    getCareStaffs: builder.query<any[], void>({
      query: () => '/staffs/care',
      providesTags: ['StaffsForChat', 'Staffs'],
    }),
    getAdminStaffs: builder.query<any[], void>({
      query: () => '/staffs/admin',
      providesTags: ['Staffs', 'StaffsForChat'],
    }),
    getCareStaffsPaginated: builder.query({
      query: (params) =>
        `/staffs/care/paginated${buildStaffQueryString(params)}`,
      providesTags: ['StaffsForChat', 'Staffs'],
    }),

    getAdminStaffsPaginated: builder.query({
      query: (params) =>
        `/staffs/admin/paginated${buildStaffQueryString(params)}`,
      providesTags: ['Staffs', 'StaffsForChat'],
    }),

    getAgencyCareStaffs: builder.query({
      query: (organizationId: string) =>
        `/staffs/agency/${organizationId}/care`,
      providesTags: ['StaffsForChat', 'Staffs'],
    }),

    getStaffsForAssign: builder.query<any[], { date: string }>({
      query: ({ date }) => `auth/staffs?date=${date}`,
    }),
    getCarerResume: builder.query<any, string>({
      query: (carerId) => `auth/${carerId}/carer-resume`,
    }),
    searchUsers: builder.query<any[], { query: string; accountType: string }>({
      query: ({ query, accountType }) =>
        `auth/search-users/${accountType}?companyName=${query}`,
    }),
    getThirdPartyUsers: builder.query<any[], void>({
      query: () => `auth/third-party`,
    }),
    uploadProfilePicture: builder.mutation<any, { userId: string; file: File }>(
      {
        query: ({ userId, file }) => ({
          url: `/picture/${userId}/upload`,
          method: 'POST',
          body: file,
          formData: true,
        }),
      }
    ),

    getAvailableStaff: builder.query<
      IAvailableStaffResponse,
      GetAvailableStaffParams
    >({
      query: ({ shiftPatternId, shiftDate, careHomeId }) => ({
        url: 'organizations/staff/available/shift',
        method: 'GET',
        params: {
          shiftPatternId,
          shiftDate,
          careHomeId,
        },
      }),
      providesTags: ['StaffAvailability'],
    }),

    getStaffAvailability: builder.query<
      IStaffAvailabilityMap,
      GetStaffAvailabilityParams
    >({
      query: ({ startDate, endDate }) => ({
        url: '/staffs/staff-availability',
        method: 'GET',
        params: {
          startDate,
          endDate,
        },
      }),
      providesTags: ['StaffAvailability'],
    }),
    getFavoriteStaff: builder.query<IFavoriteStaffResponse, void>({
      query: () => ({
        url: '/staffs/favorites',
        method: 'GET',
      }),
      providesTags: ['FavoriteStaffs'],
    }),

    addFavoriteStaff: builder.mutation<
      { success: boolean },
      AddFavoriteStaffRequest
    >({
      query: (body) => ({
        url: '/staffs/favorites',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FavoriteStaffs'],
    }),

    removeFavoriteStaff: builder.mutation<{ success: boolean }, string>({
      query: (staffId) => ({
        url: `/staffs/favorites/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FavoriteStaffs'],
    }),

    addFavoriteNote: builder.mutation<
      { success: boolean },
      AddFavoriteNoteRequest
    >({
      query: (body) => ({
        url: '/staffs/favorites/note',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FavoriteStaffs'],
    }),

    checkIsFavorite: builder.query<
      { success: boolean; isFavorite: boolean },
      string
    >({
      query: (staffId) => ({
        url: `/staffs/favorites/${staffId}/check`,
        method: 'GET',
      }),
      providesTags: (result, error, staffId) => [
        { type: 'FavoriteStatus', id: staffId },
      ],
    }),

    generateStaffPaymentReport: builder.mutation({
      query: ({
        startDate,
        endDate,
        staffIds,
      }: {
        startDate: string;
        endDate: string;
        staffIds: string[];
      }) => ({
        url: '/staffs/calculate-payments',
        method: 'POST',
        body: {
          startDate,
          endDate,
          staffIds,
        },
      }),
    }),
  }),
});

export const {
  useRemoveStaffMutation,
  useGetCareStaffsQuery,
  useGetAgencyCareStaffsQuery,
  useGetAdminStaffsQuery,
  useGetStaffsForAssignQuery,
  useGetCarerResumeQuery,
  useSearchUsersQuery,
  useGetThirdPartyUsersQuery,
  useUploadProfilePictureMutation,
  useGetAvailableStaffQuery,
  useGetStaffAvailabilityQuery,

  useGetFavoriteStaffQuery,
  useAddFavoriteStaffMutation,
  useRemoveFavoriteStaffMutation,
  useAddFavoriteNoteMutation,
  useCheckIsFavoriteQuery,

  useGetCareStaffsPaginatedQuery,
  useGetAdminStaffsPaginatedQuery,

  useGetStaffPaginatedQuery,

  useGenerateStaffPaymentReportMutation,
} = staffApi;
