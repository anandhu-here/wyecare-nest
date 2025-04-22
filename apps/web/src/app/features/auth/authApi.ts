// auth.ts

import { baseApi } from '@/redux/baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: 'auth/login',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    registerWithOrgInvitation: builder.mutation({
      query: (data) => ({
        url: 'auth/register-with-invitation?token=' + data.token,
        method: 'POST',
        body: data,
      }),
    }),

    profile: builder.query({
      query: () => 'auth/profile',
      providesTags: ['Profile'],
    }),
    createTimesheetAdmin: builder.mutation({
      query: () => ({
        url: 'auth/register-timesheet-admin',
        method: 'POST',
      }),
      // invalidatesTags: ['TimesheetAdmins'],
    }),
    loginTimesheetAdmin: builder.mutation({
      query: (data) => ({
        url: 'auth/login-timesheet-admin',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
    getTimesheetaAdmins: builder.query({
      query: () => ({
        url: 'auth/timesheet-admins',
      }),
      providesTags: ['TimesheetAdmins'],
    }),
    resetTimesheetAdminPass: builder.mutation({
      query: (id) => ({
        url: `auth/timesheet-admins/reset-password/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['TimesheetAdmins'],
    }),

    deleteTimesheetAdmin: builder.mutation({
      query: (id) => ({
        url: `auth/timesheet-admins/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TimesheetAdmins'],
    }),
    getUser: builder.query({
      query: () => 'auth/user',
      providesTags: ['User'],
    }),
    getLinkedUsers: builder.query({
      query: (type: string) => `auth/linked-users/${type}`,
    }),
    getStaffsForAssign: builder.query({
      query: ({ date }: { date: string }) => `auth/staffs?date=${date}`,
    }),
    linkUser: builder.mutation({
      query: ({ userId, userType }: { userId: string; userType: string }) => ({
        url: `auth/link`,
        method: 'PATCH',
        body: {
          linkedUserId: userId,
          linkedUserType: userType,
        },
      }),
    }),
    unlinkUser: builder.mutation({
      query: ({
        userId,
        userType,
        rating,
        review,
      }: {
        userId: string;
        userType: string;
        rating?: number;
        review?: string;
      }) => ({
        url: `auth/unlink`,
        method: 'PATCH',
        body: {
          linkedUserId: userId,
          linkedUserType: userType,
          rating,
          review,
        },
      }),
    }),
    getUsers: builder.query({
      query: (accountType: string) => 'auth/users/' + accountType,
    }),
    getCarerResume: builder.query({
      query: (carerId: string) => `auth/${carerId}/carer-resume`,
    }),
    searchUsers: builder.query({
      query: ({ query, accountType }: { query: string; accountType: string }) =>
        `auth/search-users/${accountType}?companyName=${query}`,
    }),

    deleteAvailability: builder.mutation({
      query: (date: string) => ({
        url: `auth/availabilities/${date}`,
        method: 'DELETE',
      }),
    }),
    updateFcmToken: builder.mutation({
      query: (fcmToken: string) => ({
        url: `auth/update-fcm-token`,
        method: 'PUT',
        body: { fcmToken },
      }),
    }),
    initializeCustomer: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/initialize-customer',
        method: 'POST',
      }),
    }),
    requestPasswordReset: builder.mutation<void, string>({
      query: (email: string) => ({
        url: `auth/request-reset`,
        method: 'POST',
        body: { email },
      }),
    }),
    resetPassword: builder.mutation<
      void,
      { email: string; code: string; newPassword: string }
    >({
      query: (data) => ({
        url: `auth/reset-password`,
        method: 'POST',
        body: {
          email: data.email,
          code: data.code,
          newPassword: data.newPassword,
        },
      }),
    }),
    resendVerificationEmail: builder.mutation({
      query: (email) => ({
        url: 'auth/resend-verification-email',
        method: 'POST',
        body: { email },
      }),
    }),
    verifyEmailCode: builder.mutation({
      query: ({ email, code }) => ({
        url: 'auth/verify-email',
        method: 'POST',
        body: { token: code },
      }),
    }),
    //  deletion

    requestDeleteAccount: builder.mutation({
      query: () => ({
        url: 'auth/request-account-deletion',
        method: 'POST',
      }),
    }),
    cancelDeleteRequest: builder.mutation({
      query: (data) => ({
        url: 'auth/cancel-account-deletion',
        method: 'POST',
        body: data,
      }),
    }),

    // fcm token
    registerFcmToken: builder.mutation({
      query: ({ token, device }: { token: string; device: any }) => ({
        url: 'fcm',
        method: 'POST',
        body: { token, device },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterFcmTokenMutation,
  useRegisterWithOrgInvitationMutation,
  useProfileQuery,
  useRequestDeleteAccountMutation,
  useCancelDeleteRequestMutation,
  useRegisterMutation,
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetLinkedUsersQuery,
  useLazyGetLinkedUsersQuery,
  useGetStaffsForAssignQuery,
  useLazyGetStaffsForAssignQuery,
  useLinkUserMutation,
  useUnlinkUserMutation,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetCarerResumeQuery,
  useLazyGetCarerResumeQuery,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useDeleteAvailabilityMutation,
  useUpdateFcmTokenMutation,
  useInitializeCustomerMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useResendVerificationEmailMutation,
  useVerifyEmailCodeMutation,
  useCreateTimesheetAdminMutation,
  useLoginTimesheetAdminMutation,
  useDeleteTimesheetAdminMutation,
  useGetTimesheetaAdminsQuery,
  useResetTimesheetAdminPassMutation,
} = authApi;
