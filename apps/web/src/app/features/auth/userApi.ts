import { baseApi } from '@/redux/baseApi';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: ({ identifier }: { identifier: string }) =>
        `users/profile?identifier=${identifier}`,
      providesTags: ['UserProfile'],
    }),
    updateUser: builder.mutation<any, any>({
      query: (data) => ({
        url: 'users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserProfile'],
    }),
    updateTimeZone: builder.mutation<any, string>({
      query: (timezone) => ({
        url: `users/update-timezone`,
        method: 'PUT',
        body: { timezone },
      }),
    }),
    getLinkedUsers: builder.query<any, string>({
      query: (type) => `linked-users/${type}`,
    }),
    linkUser: builder.mutation<any, { userId: string; userType: string }>({
      query: ({ userId, userType }) => ({
        url: `link`,
        method: 'PATCH',
        body: {
          linkedUserId: userId,
          linkedUserType: userType,
        },
      }),
    }),
    unLinkUser: builder.mutation<
      any,
      { userId: string; userType: string; rating?: number; review?: string }
    >({
      query: ({ userId, userType, rating, review }) => ({
        url: `unlink`,
        method: 'PATCH',
        body: {
          linkedUserId: userId,
          linkedUserType: userType,
          rating,
          review,
        },
      }),
    }),
    getUsers: builder.query<any, string>({
      query: (accountType) => 'users/' + accountType,
    }),
    searchUsers: builder.query<any, { query: string; accountType: string }>({
      query: ({ query, accountType }) =>
        `search-users/${accountType}?companyName=${query}`,
    }),
    deleteAvailability: builder.mutation<any, string>({
      query: (date) => ({
        url: `availabilities/${date}`,
        method: 'DELETE',
      }),
    }),

    // new

    getCurrentOrganizationDetails: builder.query({
      query: () => 'users/current',
      providesTags: ['UserOrganization'],
    }),

    getPrimaryOrganizationDetails: builder.query({
      query: () => 'users/primary',
      providesTags: ['UserOrganization'],
    }),

    getAllUserOrganizationsDetails: builder.query({
      query: () => 'users/all',
      providesTags: ['UserOrganization'],
    }),

    getOrganizationDetails: builder.query({
      query: (organizationId) => `users/${organizationId}`,
      providesTags: ['UserOrganization'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdateTimeZoneMutation,
  useGetLinkedUsersQuery,
  useLinkUserMutation,
  useUnLinkUserMutation,
  useGetUsersQuery,
  useSearchUsersQuery,
  useDeleteAvailabilityMutation,

  // new

  useGetCurrentOrganizationDetailsQuery,
  useGetPrimaryOrganizationDetailsQuery,
  useGetAllUserOrganizationsDetailsQuery,
  useGetOrganizationDetailsQuery,
} = userApi;
