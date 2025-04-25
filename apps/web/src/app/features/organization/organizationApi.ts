// src/redux/api/organizationApi.ts
import { baseApi } from '@/redux/baseApi';
import { IOrganization } from '@wyecare-monorepo/shared-types';

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current organization
    getOrganization: builder.query({
      query: () => 'organizations',
      providesTags: ['Organization'],
    }),

    // Create organization
    createOrganization: builder.mutation({
      query: (data) => ({
        url: 'organizations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Organization', 'Profile'],
    }),

    // Update organization
    updateOrganization: builder.mutation({
      query: (data: Partial<IOrganization & { _id: string }>) => {
        const url = `organizations/${data._id}`;
        console.log('RTK Query sending PATCH to:', url);
        console.log('With data:', data);
        return {
          url: url,
          method: 'PATCH',
          body: data,
        };
      },
      invalidatesTags: ['Organization'],
    }),
    getLinkedOrganizations: builder.query({
      query: () => 'organizations/linked',
      providesTags: ['LinkedOrganizations'],
    }),

    // Get staff invitations
    getStaffInvitations: builder.query({
      query: ({ page = 1, limit = 10, status }) => {
        let url = `organizations/staff/invitations?page=${page}&limit=${limit}`;
        if (status) {
          url += `&status=${status}`;
        }
        return url;
      },
      providesTags: ['StaffInvitations'],
    }),

    // Create staff invitation
    createStaffInvitation: builder.mutation({
      query: (data) => ({
        url: 'organizations/staff/invitations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StaffInvitations'],
    }),

    // Resend staff invitation
    resendStaffInvitation: builder.mutation({
      query: (invitationId) => ({
        url: `organizations/staff/invitations/${invitationId}/resend`,
        method: 'POST',
      }),
      invalidatesTags: ['StaffInvitations'],
    }),

    // Cancel staff invitation
    cancelStaffInvitation: builder.mutation({
      query: (invitationId) => ({
        url: `organizations/staff/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StaffInvitations'],
    }),

    // Get organization staff
    getOrganizationStaff: builder.query({
      query: () => 'organizations/staff',
      providesTags: ['OrganizationStaff'],
    }),

    // Add user to organization
    addUserToOrganization: builder.mutation({
      query: (data) => ({
        url: 'organizations/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OrganizationStaff'],
    }),

    // Update user role in organization
    updateUserRole: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `organizations/staff/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['OrganizationStaff'],
    }),

    // Remove user from organization
    removeUserFromOrganization: builder.mutation({
      query: (userId) => ({
        url: `organizations/staff/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrganizationStaff'],
    }),

    // Get admin staff
    getAdminStaff: builder.query({
      query: () => 'organizations/staff/admin',
      providesTags: ['OrganizationStaff'],
    }),

    // Get care staff
    getCareStaff: builder.query({
      query: () => 'organizations/staff/care',
      providesTags: ['OrganizationStaff'],
    }),

    // staffs enpoints
    getAvailableStaffForShift: builder.query({
      query: ({ shiftPatternId, shiftDate, careHomeId }) =>
        `organizations/staff/availability/shift?shiftPatternId=${shiftPatternId}&shiftDate=${shiftDate}&careHomeId=${careHomeId}`,
      providesTags: ['StaffAvailability'],
    }),

    getStaffAvailabilityForDateRange: builder.query({
      query: ({ organizationId, startDate, endDate }) =>
        `organizations/${organizationId}/staff/availability/dateRange?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['StaffAvailability'],
    }),

    getMatchingStaffForShift: builder.mutation({
      query: ({
        organizationId,
        shiftPatternId,
        shiftDate,
        careHomeId,
        requirements,
      }) => ({
        url: `organizations/${organizationId}/staff/matching`,
        method: 'GET',
        params: { shiftPatternId, shiftDate, careHomeId },
        body: requirements,
      }),
      invalidatesTags: ['StaffAvailability'],
    }),

    addFavoriteStaff: builder.mutation({
      query: ({ organizationId, staffId }) => ({
        url: `organizations/${organizationId}/staff/${staffId}/favorite`,
        method: 'POST',
      }),
      invalidatesTags: ['FavoriteStaff', 'StaffAvailability'],
    }),

    removeFavoriteStaff: builder.mutation({
      query: ({ organizationId, staffId }) => ({
        url: `organizations/${organizationId}/staff/${staffId}/favorite`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FavoriteStaff', 'StaffAvailability'],
    }),

    getFavoriteStaff: builder.query({
      query: (organizationId) =>
        `organizations/${organizationId}/staff/favorites`,
      providesTags: ['FavoriteStaff'],
    }),

    addFavoriteStaffNote: builder.mutation({
      query: ({ organizationId, staffId, note }) => ({
        url: `organizations/${organizationId}/staff/${staffId}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['FavoriteStaff'],
    }),

    calculateStaffPayments: builder.query({
      query: ({ organizationId, startDate, endDate, staffIds }) =>
        `organizations/${organizationId}/staff/payments?startDate=${startDate}&endDate=${endDate}&staffIds=${staffIds.join(
          ','
        )}`,
      providesTags: ['StaffPayments'],
    }),

    // invitations and linking

    getLinkedOrganizationsPaginated: builder.query({
      query: ({ page = 1, limit = 10, type }) => {
        let url = `organizations/linked/paginated?page=${page}&limit=${limit}`;
        if (type) {
          url += `&type=${type}`;
        }
        return url;
      },
      providesTags: ['LinkedOrganizations'],
    }),

    getLinkedOrganization: builder.query({
      query: (organizationId) => `organizations/linked/${organizationId}`,
      providesTags: (result, error, organizationId) => [
        { type: 'LinkedOrganization', id: organizationId },
      ],
    }),

    getLinkedAdmins: builder.query({
      query: () => 'organizations/linked-admins',
      providesTags: ['LinkedAdmins'],
    }),

    linkOrganizations: builder.mutation({
      query: (data) => ({
        url: 'organizations/link',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LinkedOrganizations', 'OrganizationLinks'],
    }),

    unlinkOrganizations: builder.mutation({
      query: (data) => ({
        url: 'organizations/unlink',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LinkedOrganizations', 'OrganizationLinks'],
    }),

    createLinkInvitation: builder.mutation({
      query: (data) => ({
        url: 'organizations/linkInvitation',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LinkInvitations'],
    }),

    getLinkInvitations: builder.query({
      query: () => 'organizations/linkInvitations',
      providesTags: ['LinkInvitations'],
    }),

    deleteLinkInvitation: builder.mutation({
      query: (invitationId) => ({
        url: `organizations/linkInvitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LinkInvitations'],
    }),

    respondToLinkInvitation: builder.mutation({
      query: (data) => ({
        url: 'organizations/respondToLinkInvitation',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        'LinkInvitations',
        'LinkedOrganizations',
        'OrganizationLinks',
      ],
    }),

    findOrganizationsByEmail: builder.query({
      query: (email) =>
        `organizations/find-by-email?email=${encodeURIComponent(email)}`,
      providesTags: ['OrganizationSearch'],
    }),

    createLinkToken: builder.mutation({
      query: (data) => ({
        url: 'organizations/link-token',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OrganizationLinks'],
    }),

    sendLinkInvitation: builder.mutation({
      query: (data) => ({
        url: 'organizations/send-link-invitation',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OrganizationLinks'],
    }),

    verifyLinkToken: builder.mutation({
      query: (data) => ({
        url: 'organizations/verify-link-token',
        method: 'POST',
        body: data,
      }),
    }),

    acceptLinkToken: builder.mutation({
      query: (data) => ({
        url: 'organizations/accept-link-token',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LinkedOrganizations', 'OrganizationLinks'],
    }),

    getStaffPaginated: builder.query({
      query: ({ page = 1, limit = 10, staffType, role, search }) => {
        let url = `organizations/staff/paginated?page=${page}&limit=${limit}`;
        if (staffType) url += `&staffType=${staffType}`;
        if (role && role !== 'all') url += `&role=${role}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['OrganizationStaff'],
    }),

    inviteStaff: builder.mutation({
      query: (data) => ({
        url: 'organizations/staff/invitations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StaffInvitations', 'OrganizationStaff'],
    }),

    verifyStaffInvitation: builder.query({
      query: (token) => `organizations/staff/invitations/verify/${token}`,
      providesTags: ['StaffInvitation'],
    }),

    acceptStaffInvitation: builder.mutation({
      query: (token) => ({
        url: 'organizations/staff/invitations/accept',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['StaffInvitations', 'OrganizationStaff', 'Profile'],
    }),
  }),
});

export const {
  useGetLinkedOrganizationsPaginatedQuery,
  useUnlinkOrganizationsMutation,
  useGetLinkedOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useGetStaffInvitationsQuery,
  useCreateStaffInvitationMutation,
  useResendStaffInvitationMutation,
  useCancelStaffInvitationMutation,
  useGetOrganizationStaffQuery,
  useAddUserToOrganizationMutation,
  useUpdateUserRoleMutation,
  useRemoveUserFromOrganizationMutation,
  useGetAdminStaffQuery,
  useGetCareStaffQuery,

  useGetAvailableStaffForShiftQuery,
  useGetStaffAvailabilityForDateRangeQuery,
  useGetMatchingStaffForShiftMutation,
  useAddFavoriteStaffMutation,
  useRemoveFavoriteStaffMutation,
  useGetFavoriteStaffQuery,
  useAddFavoriteStaffNoteMutation,
  useCalculateStaffPaymentsQuery,
  useCreateLinkInvitationMutation,

  useFindOrganizationsByEmailQuery,
  useCreateLinkTokenMutation,
  useSendLinkInvitationMutation,
  useLazyFindOrganizationsByEmailQuery,

  useVerifyLinkTokenMutation,
  useAcceptLinkTokenMutation,

  useGetStaffPaginatedQuery,
  useInviteStaffMutation,

  useVerifyStaffInvitationQuery,
  useAcceptStaffInvitationMutation,
} = organizationApi;
