import { api } from './api';
export const addTagTypes = [
  'auth',
  'auth/invitations',
  'users',
  'organizations',
  'roles',
  'hospital/shift-types',
  'hospital/staff-profiles',
  'hospital/shift-schedules',
  'hospital/shift-attendances',
  'hospital/pay-periods',
  'hospital/staff-payments',
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      authControllerLogin: build.mutation<
        AuthControllerLoginApiResponse,
        AuthControllerLoginApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/login`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['auth'],
      }),
      authControllerRegister: build.mutation<
        AuthControllerRegisterApiResponse,
        AuthControllerRegisterApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register`,
          method: 'POST',
          body: queryArg.createUserDto,
          params: {
            invitationToken: queryArg.invitationToken,
          },
        }),
        invalidatesTags: ['auth'],
      }),
      authControllerGetProfile: build.query<
        AuthControllerGetProfileApiResponse,
        AuthControllerGetProfileApiArg
      >({
        query: () => ({ url: `/auth/profile` }),
        providesTags: ['auth'],
      }),
      authControllerCreateSuperAdmin: build.mutation<
        AuthControllerCreateSuperAdminApiResponse,
        AuthControllerCreateSuperAdminApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/create-super-admin`,
          method: 'POST',
          body: queryArg.createUserDto,
          params: {
            secretKey: queryArg.secretKey,
          },
        }),
        invalidatesTags: ['auth'],
      }),
      authControllerRegisterWithOrganization: build.mutation<
        AuthControllerRegisterWithOrganizationApiResponse,
        AuthControllerRegisterWithOrganizationApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register-with-organization`,
          method: 'POST',
          params: {
            invitationToken: queryArg,
          },
        }),
        invalidatesTags: ['auth'],
      }),
      invitationsControllerCreate: build.mutation<
        InvitationsControllerCreateApiResponse,
        InvitationsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['auth/invitations'],
      }),
      invitationsControllerFindAll: build.query<
        InvitationsControllerFindAllApiResponse,
        InvitationsControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            status: queryArg.status,
          },
        }),
        providesTags: ['auth/invitations'],
      }),
      invitationsControllerValidateToken: build.query<
        InvitationsControllerValidateTokenApiResponse,
        InvitationsControllerValidateTokenApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/validate/${queryArg}`,
        }),
        providesTags: ['auth/invitations'],
      }),
      invitationsControllerFindOne: build.query<
        InvitationsControllerFindOneApiResponse,
        InvitationsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/auth/invitations/${queryArg}` }),
        providesTags: ['auth/invitations'],
      }),
      invitationsControllerRevoke: build.mutation<
        InvitationsControllerRevokeApiResponse,
        InvitationsControllerRevokeApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/${queryArg}/revoke`,
          method: 'PATCH',
        }),
        invalidatesTags: ['auth/invitations'],
      }),
      invitationsControllerResend: build.mutation<
        InvitationsControllerResendApiResponse,
        InvitationsControllerResendApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/${queryArg}/resend`,
          method: 'PATCH',
        }),
        invalidatesTags: ['auth/invitations'],
      }),
      usersControllerCreate: build.mutation<
        UsersControllerCreateApiResponse,
        UsersControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/users`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerFindAll: build.query<
        UsersControllerFindAllApiResponse,
        UsersControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/users`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            firstName: queryArg.firstName,
            lastName: queryArg.lastName,
            email: queryArg.email,
            organizationId: queryArg.organizationId,
          },
        }),
        providesTags: ['users'],
      }),
      usersControllerFindOne: build.query<
        UsersControllerFindOneApiResponse,
        UsersControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}` }),
        providesTags: ['users'],
      }),
      usersControllerUpdate: build.mutation<
        UsersControllerUpdateApiResponse,
        UsersControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateUserDto,
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerRemove: build.mutation<
        UsersControllerRemoveApiResponse,
        UsersControllerRemoveApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}`, method: 'DELETE' }),
        invalidatesTags: ['users'],
      }),
      usersControllerAssignRole: build.mutation<
        UsersControllerAssignRoleApiResponse,
        UsersControllerAssignRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/roles`,
          method: 'POST',
          body: queryArg.assignRoleDto,
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerRemoveRole: build.mutation<
        UsersControllerRemoveRoleApiResponse,
        UsersControllerRemoveRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/roles/${queryArg.roleId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerUpdateDepartment: build.mutation<
        UsersControllerUpdateDepartmentApiResponse,
        UsersControllerUpdateDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/departments`,
          method: 'POST',
          body: queryArg.updateUserDepartmentDto,
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerRemoveDepartment: build.mutation<
        UsersControllerRemoveDepartmentApiResponse,
        UsersControllerRemoveDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/departments/${queryArg.departmentId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerGetUserPermissions: build.query<
        UsersControllerGetUserPermissionsApiResponse,
        UsersControllerGetUserPermissionsApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}/permissions` }),
        providesTags: ['users'],
      }),
      usersControllerAssignPermission: build.mutation<
        UsersControllerAssignPermissionApiResponse,
        UsersControllerAssignPermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/permissions`,
          method: 'POST',
          body: queryArg.assignUserPermissionDto,
        }),
        invalidatesTags: ['users'],
      }),
      usersControllerRemovePermission: build.mutation<
        UsersControllerRemovePermissionApiResponse,
        UsersControllerRemovePermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/permissions/${queryArg.permissionId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['users'],
      }),
      organizationsControllerCreate: build.mutation<
        OrganizationsControllerCreateApiResponse,
        OrganizationsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsControllerFindAll: build.query<
        OrganizationsControllerFindAllApiResponse,
        OrganizationsControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            name: queryArg.name,
            category: queryArg.category,
          },
        }),
        providesTags: ['organizations'],
      }),
      organizationsControllerFindOne: build.query<
        OrganizationsControllerFindOneApiResponse,
        OrganizationsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/organizations/${queryArg}` }),
        providesTags: ['organizations'],
      }),
      organizationsControllerUpdate: build.mutation<
        OrganizationsControllerUpdateApiResponse,
        OrganizationsControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateOrganizationDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsControllerRemove: build.mutation<
        OrganizationsControllerRemoveApiResponse,
        OrganizationsControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsControllerCreateDepartment: build.mutation<
        OrganizationsControllerCreateDepartmentApiResponse,
        OrganizationsControllerCreateDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg.id}/departments`,
          method: 'POST',
          body: queryArg.createDepartmentDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsControllerGetDepartments: build.query<
        OrganizationsControllerGetDepartmentsApiResponse,
        OrganizationsControllerGetDepartmentsApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg}/departments`,
        }),
        providesTags: ['organizations'],
      }),
      rolesControllerCreate: build.mutation<
        RolesControllerCreateApiResponse,
        RolesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/roles`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['roles'],
      }),
      rolesControllerFindAll: build.query<
        RolesControllerFindAllApiResponse,
        RolesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/roles`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            name: queryArg.name,
            isSystemRole: queryArg.isSystemRole,
            organizationId: queryArg.organizationId,
            sector: queryArg.sector,
          },
        }),
        providesTags: ['roles'],
      }),
      rolesControllerFindAllPermissions: build.query<
        RolesControllerFindAllPermissionsApiResponse,
        RolesControllerFindAllPermissionsApiArg
      >({
        query: () => ({ url: `/roles/permissions` }),
        providesTags: ['roles'],
      }),
      rolesControllerFindOne: build.query<
        RolesControllerFindOneApiResponse,
        RolesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/roles/${queryArg}` }),
        providesTags: ['roles'],
      }),
      rolesControllerUpdate: build.mutation<
        RolesControllerUpdateApiResponse,
        RolesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateRolesDto,
        }),
        invalidatesTags: ['roles'],
      }),
      rolesControllerRemove: build.mutation<
        RolesControllerRemoveApiResponse,
        RolesControllerRemoveApiArg
      >({
        query: (queryArg) => ({ url: `/roles/${queryArg}`, method: 'DELETE' }),
        invalidatesTags: ['roles'],
      }),
      rolesControllerAssignPermission: build.mutation<
        RolesControllerAssignPermissionApiResponse,
        RolesControllerAssignPermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}/permissions`,
          method: 'POST',
          body: queryArg.assignPermissionDto,
        }),
        invalidatesTags: ['roles'],
      }),
      rolesControllerRemovePermission: build.mutation<
        RolesControllerRemovePermissionApiResponse,
        RolesControllerRemovePermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}/permissions/${queryArg.permissionId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['roles'],
      }),
      shiftTypesControllerCreate: build.mutation<
        ShiftTypesControllerCreateApiResponse,
        ShiftTypesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-types`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/shift-types'],
      }),
      shiftTypesControllerFindAll: build.query<
        ShiftTypesControllerFindAllApiResponse,
        ShiftTypesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-types`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            name: queryArg.name,
            organizationId: queryArg.organizationId,
          },
        }),
        providesTags: ['hospital/shift-types'],
      }),
      shiftTypesControllerFindOne: build.query<
        ShiftTypesControllerFindOneApiResponse,
        ShiftTypesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/hospital/shift-types/${queryArg}` }),
        providesTags: ['hospital/shift-types'],
      }),
      shiftTypesControllerUpdate: build.mutation<
        ShiftTypesControllerUpdateApiResponse,
        ShiftTypesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-types/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateShiftTypeDto,
        }),
        invalidatesTags: ['hospital/shift-types'],
      }),
      shiftTypesControllerRemove: build.mutation<
        ShiftTypesControllerRemoveApiResponse,
        ShiftTypesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-types/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/shift-types'],
      }),
      staffProfilesControllerCreate: build.mutation<
        StaffProfilesControllerCreateApiResponse,
        StaffProfilesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerFindAll: build.query<
        StaffProfilesControllerFindAllApiResponse,
        StaffProfilesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            specialty: queryArg.specialty,
            status: queryArg.status,
            staffType: queryArg.staffType,
          },
        }),
        providesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerFindOne: build.query<
        StaffProfilesControllerFindOneApiResponse,
        StaffProfilesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/hospital/staff-profiles/${queryArg}` }),
        providesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerUpdate: build.mutation<
        StaffProfilesControllerUpdateApiResponse,
        StaffProfilesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateStaffProfileDto,
        }),
        invalidatesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerRemove: build.mutation<
        StaffProfilesControllerRemoveApiResponse,
        StaffProfilesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerAddCompensationRate: build.mutation<
        StaffProfilesControllerAddCompensationRateApiResponse,
        StaffProfilesControllerAddCompensationRateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles/${queryArg.id}/compensation-rates`,
          method: 'POST',
          body: queryArg.createCompensationRateDto,
        }),
        invalidatesTags: ['hospital/staff-profiles'],
      }),
      staffProfilesControllerRemoveCompensationRate: build.mutation<
        StaffProfilesControllerRemoveCompensationRateApiResponse,
        StaffProfilesControllerRemoveCompensationRateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-profiles/${queryArg.id}/compensation-rates/${queryArg.rateId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/staff-profiles'],
      }),
      shiftSchedulesControllerCreate: build.mutation<
        ShiftSchedulesControllerCreateApiResponse,
        ShiftSchedulesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-schedules`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/shift-schedules'],
      }),
      shiftSchedulesControllerFindAll: build.query<
        ShiftSchedulesControllerFindAllApiResponse,
        ShiftSchedulesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-schedules`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            startDate: queryArg.startDate,
            endDate: queryArg.endDate,
            departmentId: queryArg.departmentId,
            staffProfileId: queryArg.staffProfileId,
            status: queryArg.status,
          },
        }),
        providesTags: ['hospital/shift-schedules'],
      }),
      shiftSchedulesControllerFindOne: build.query<
        ShiftSchedulesControllerFindOneApiResponse,
        ShiftSchedulesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/hospital/shift-schedules/${queryArg}` }),
        providesTags: ['hospital/shift-schedules'],
      }),
      shiftSchedulesControllerUpdate: build.mutation<
        ShiftSchedulesControllerUpdateApiResponse,
        ShiftSchedulesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-schedules/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateShiftScheduleDto,
        }),
        invalidatesTags: ['hospital/shift-schedules'],
      }),
      shiftSchedulesControllerRemove: build.mutation<
        ShiftSchedulesControllerRemoveApiResponse,
        ShiftSchedulesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-schedules/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/shift-schedules'],
      }),
      shiftAttendancesControllerCreate: build.mutation<
        ShiftAttendancesControllerCreateApiResponse,
        ShiftAttendancesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-attendances`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/shift-attendances'],
      }),
      shiftAttendancesControllerFindAll: build.query<
        ShiftAttendancesControllerFindAllApiResponse,
        ShiftAttendancesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-attendances`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            status: queryArg.status,
            date: queryArg.date,
            departmentId: queryArg.departmentId,
          },
        }),
        providesTags: ['hospital/shift-attendances'],
      }),
      shiftAttendancesControllerFindOne: build.query<
        ShiftAttendancesControllerFindOneApiResponse,
        ShiftAttendancesControllerFindOneApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-attendances/${queryArg}`,
        }),
        providesTags: ['hospital/shift-attendances'],
      }),
      shiftAttendancesControllerUpdate: build.mutation<
        ShiftAttendancesControllerUpdateApiResponse,
        ShiftAttendancesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-attendances/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateShiftAttendanceDto,
        }),
        invalidatesTags: ['hospital/shift-attendances'],
      }),
      shiftAttendancesControllerRemove: build.mutation<
        ShiftAttendancesControllerRemoveApiResponse,
        ShiftAttendancesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/shift-attendances/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/shift-attendances'],
      }),
      payPeriodsControllerCreate: build.mutation<
        PayPeriodsControllerCreateApiResponse,
        PayPeriodsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/pay-periods`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/pay-periods'],
      }),
      payPeriodsControllerFindAll: build.query<
        PayPeriodsControllerFindAllApiResponse,
        PayPeriodsControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/pay-periods`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            status: queryArg.status,
            startDate: queryArg.startDate,
            endDate: queryArg.endDate,
          },
        }),
        providesTags: ['hospital/pay-periods'],
      }),
      payPeriodsControllerFindOne: build.query<
        PayPeriodsControllerFindOneApiResponse,
        PayPeriodsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/hospital/pay-periods/${queryArg}` }),
        providesTags: ['hospital/pay-periods'],
      }),
      payPeriodsControllerUpdate: build.mutation<
        PayPeriodsControllerUpdateApiResponse,
        PayPeriodsControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/pay-periods/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updatePayPeriodDto,
        }),
        invalidatesTags: ['hospital/pay-periods'],
      }),
      payPeriodsControllerRemove: build.mutation<
        PayPeriodsControllerRemoveApiResponse,
        PayPeriodsControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/pay-periods/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/pay-periods'],
      }),
      staffPaymentsControllerCreate: build.mutation<
        StaffPaymentsControllerCreateApiResponse,
        StaffPaymentsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-payments`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['hospital/staff-payments'],
      }),
      staffPaymentsControllerFindAll: build.query<
        StaffPaymentsControllerFindAllApiResponse,
        StaffPaymentsControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-payments`,
          params: {
            skip: queryArg.skip,
            take: queryArg.take,
            payPeriodId: queryArg.payPeriodId,
            staffProfileId: queryArg.staffProfileId,
            paymentStatus: queryArg.paymentStatus,
          },
        }),
        providesTags: ['hospital/staff-payments'],
      }),
      staffPaymentsControllerFindOne: build.query<
        StaffPaymentsControllerFindOneApiResponse,
        StaffPaymentsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/hospital/staff-payments/${queryArg}` }),
        providesTags: ['hospital/staff-payments'],
      }),
      staffPaymentsControllerUpdate: build.mutation<
        StaffPaymentsControllerUpdateApiResponse,
        StaffPaymentsControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-payments/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateStaffPaymentDto,
        }),
        invalidatesTags: ['hospital/staff-payments'],
      }),
      staffPaymentsControllerRemove: build.mutation<
        StaffPaymentsControllerRemoveApiResponse,
        StaffPaymentsControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/hospital/staff-payments/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['hospital/staff-payments'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as generatedApi };
export type AuthControllerLoginApiResponse = unknown;
export type AuthControllerLoginApiArg = LoginDto;
export type AuthControllerRegisterApiResponse = unknown;
export type AuthControllerRegisterApiArg = {
  invitationToken: string;
  createUserDto: CreateUserDto;
};
export type AuthControllerGetProfileApiResponse = unknown;
export type AuthControllerGetProfileApiArg = void;
export type AuthControllerCreateSuperAdminApiResponse = unknown;
export type AuthControllerCreateSuperAdminApiArg = {
  secretKey: string;
  createUserDto: CreateUserDto;
};
export type AuthControllerRegisterWithOrganizationApiResponse = unknown;
export type AuthControllerRegisterWithOrganizationApiArg = string;
export type InvitationsControllerCreateApiResponse = unknown;
export type InvitationsControllerCreateApiArg = CreateInvitationDto;
export type InvitationsControllerFindAllApiResponse = unknown;
export type InvitationsControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  status?: string;
};
export type InvitationsControllerValidateTokenApiResponse = unknown;
export type InvitationsControllerValidateTokenApiArg = string;
export type InvitationsControllerFindOneApiResponse = unknown;
export type InvitationsControllerFindOneApiArg = string;
export type InvitationsControllerRevokeApiResponse = unknown;
export type InvitationsControllerRevokeApiArg = string;
export type InvitationsControllerResendApiResponse = unknown;
export type InvitationsControllerResendApiArg = string;
export type UsersControllerCreateApiResponse = unknown;
export type UsersControllerCreateApiArg = CreateUserDto;
export type UsersControllerFindAllApiResponse = unknown;
export type UsersControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  organizationId?: string;
};
export type UsersControllerFindOneApiResponse = unknown;
export type UsersControllerFindOneApiArg = string;
export type UsersControllerUpdateApiResponse = unknown;
export type UsersControllerUpdateApiArg = {
  id: string;
  updateUserDto: UpdateUserDto;
};
export type UsersControllerRemoveApiResponse = unknown;
export type UsersControllerRemoveApiArg = string;
export type UsersControllerAssignRoleApiResponse = unknown;
export type UsersControllerAssignRoleApiArg = {
  id: string;
  assignRoleDto: AssignRoleDto;
};
export type UsersControllerRemoveRoleApiResponse = unknown;
export type UsersControllerRemoveRoleApiArg = {
  id: string;
  roleId: string;
};
export type UsersControllerUpdateDepartmentApiResponse = unknown;
export type UsersControllerUpdateDepartmentApiArg = {
  id: string;
  updateUserDepartmentDto: UpdateUserDepartmentDto;
};
export type UsersControllerRemoveDepartmentApiResponse = unknown;
export type UsersControllerRemoveDepartmentApiArg = {
  id: string;
  departmentId: string;
};
export type UsersControllerGetUserPermissionsApiResponse = unknown;
export type UsersControllerGetUserPermissionsApiArg = string;
export type UsersControllerAssignPermissionApiResponse = unknown;
export type UsersControllerAssignPermissionApiArg = {
  id: string;
  assignUserPermissionDto: AssignUserPermissionDto;
};
export type UsersControllerRemovePermissionApiResponse = unknown;
export type UsersControllerRemovePermissionApiArg = {
  id: string;
  permissionId: string;
};
export type OrganizationsControllerCreateApiResponse = unknown;
export type OrganizationsControllerCreateApiArg = CreateOrganizationDto;
export type OrganizationsControllerFindAllApiResponse = unknown;
export type OrganizationsControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  name?: string;
  category?:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
};
export type OrganizationsControllerFindOneApiResponse = unknown;
export type OrganizationsControllerFindOneApiArg = string;
export type OrganizationsControllerUpdateApiResponse = unknown;
export type OrganizationsControllerUpdateApiArg = {
  id: string;
  updateOrganizationDto: UpdateOrganizationDto;
};
export type OrganizationsControllerRemoveApiResponse = unknown;
export type OrganizationsControllerRemoveApiArg = string;
export type OrganizationsControllerCreateDepartmentApiResponse = unknown;
export type OrganizationsControllerCreateDepartmentApiArg = {
  id: string;
  createDepartmentDto: CreateDepartmentDto;
};
export type OrganizationsControllerGetDepartmentsApiResponse = unknown;
export type OrganizationsControllerGetDepartmentsApiArg = string;
export type RolesControllerCreateApiResponse = unknown;
export type RolesControllerCreateApiArg = CreateRolesDto;
export type RolesControllerFindAllApiResponse = unknown;
export type RolesControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  name?: string;
  isSystemRole?: boolean;
  organizationId?: string;
  sector?:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
};
export type RolesControllerFindAllPermissionsApiResponse = unknown;
export type RolesControllerFindAllPermissionsApiArg = void;
export type RolesControllerFindOneApiResponse = unknown;
export type RolesControllerFindOneApiArg = string;
export type RolesControllerUpdateApiResponse = unknown;
export type RolesControllerUpdateApiArg = {
  id: string;
  updateRolesDto: UpdateRolesDto;
};
export type RolesControllerRemoveApiResponse = unknown;
export type RolesControllerRemoveApiArg = string;
export type RolesControllerAssignPermissionApiResponse = unknown;
export type RolesControllerAssignPermissionApiArg = {
  id: string;
  assignPermissionDto: AssignPermissionDto;
};
export type RolesControllerRemovePermissionApiResponse = unknown;
export type RolesControllerRemovePermissionApiArg = {
  id: string;
  permissionId: string;
};
export type ShiftTypesControllerCreateApiResponse = unknown;
export type ShiftTypesControllerCreateApiArg = CreateShiftTypeDto;
export type ShiftTypesControllerFindAllApiResponse = unknown;
export type ShiftTypesControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  name?: string;
  organizationId?: string;
};
export type ShiftTypesControllerFindOneApiResponse = unknown;
export type ShiftTypesControllerFindOneApiArg = string;
export type ShiftTypesControllerUpdateApiResponse = unknown;
export type ShiftTypesControllerUpdateApiArg = {
  id: string;
  updateShiftTypeDto: UpdateShiftTypeDto;
};
export type ShiftTypesControllerRemoveApiResponse = unknown;
export type ShiftTypesControllerRemoveApiArg = string;
export type StaffProfilesControllerCreateApiResponse = unknown;
export type StaffProfilesControllerCreateApiArg = CreateStaffProfileDto;
export type StaffProfilesControllerFindAllApiResponse = unknown;
export type StaffProfilesControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  specialty?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  staffType?: 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'RECEPTION' | 'SUPPORT';
};
export type StaffProfilesControllerFindOneApiResponse = unknown;
export type StaffProfilesControllerFindOneApiArg = string;
export type StaffProfilesControllerUpdateApiResponse = unknown;
export type StaffProfilesControllerUpdateApiArg = {
  id: string;
  updateStaffProfileDto: UpdateStaffProfileDto;
};
export type StaffProfilesControllerRemoveApiResponse = unknown;
export type StaffProfilesControllerRemoveApiArg = string;
export type StaffProfilesControllerAddCompensationRateApiResponse = unknown;
export type StaffProfilesControllerAddCompensationRateApiArg = {
  id: string;
  createCompensationRateDto: CreateCompensationRateDto;
};
export type StaffProfilesControllerRemoveCompensationRateApiResponse = unknown;
export type StaffProfilesControllerRemoveCompensationRateApiArg = {
  id: string;
  rateId: string;
};
export type ShiftSchedulesControllerCreateApiResponse = unknown;
export type ShiftSchedulesControllerCreateApiArg = CreateShiftScheduleDto;
export type ShiftSchedulesControllerFindAllApiResponse = unknown;
export type ShiftSchedulesControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  staffProfileId?: string;
  status?: string;
};
export type ShiftSchedulesControllerFindOneApiResponse = unknown;
export type ShiftSchedulesControllerFindOneApiArg = string;
export type ShiftSchedulesControllerUpdateApiResponse = unknown;
export type ShiftSchedulesControllerUpdateApiArg = {
  id: string;
  updateShiftScheduleDto: UpdateShiftScheduleDto;
};
export type ShiftSchedulesControllerRemoveApiResponse = unknown;
export type ShiftSchedulesControllerRemoveApiArg = string;
export type ShiftAttendancesControllerCreateApiResponse = unknown;
export type ShiftAttendancesControllerCreateApiArg = CreateShiftAttendanceDto;
export type ShiftAttendancesControllerFindAllApiResponse = unknown;
export type ShiftAttendancesControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  status?: string;
  date?: string;
  departmentId?: string;
};
export type ShiftAttendancesControllerFindOneApiResponse = unknown;
export type ShiftAttendancesControllerFindOneApiArg = string;
export type ShiftAttendancesControllerUpdateApiResponse = unknown;
export type ShiftAttendancesControllerUpdateApiArg = {
  id: string;
  updateShiftAttendanceDto: UpdateShiftAttendanceDto;
};
export type ShiftAttendancesControllerRemoveApiResponse = unknown;
export type ShiftAttendancesControllerRemoveApiArg = string;
export type PayPeriodsControllerCreateApiResponse = unknown;
export type PayPeriodsControllerCreateApiArg = CreatePayPeriodDto;
export type PayPeriodsControllerFindAllApiResponse = unknown;
export type PayPeriodsControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
};
export type PayPeriodsControllerFindOneApiResponse = unknown;
export type PayPeriodsControllerFindOneApiArg = string;
export type PayPeriodsControllerUpdateApiResponse = unknown;
export type PayPeriodsControllerUpdateApiArg = {
  id: string;
  updatePayPeriodDto: UpdatePayPeriodDto;
};
export type PayPeriodsControllerRemoveApiResponse = unknown;
export type PayPeriodsControllerRemoveApiArg = string;
export type StaffPaymentsControllerCreateApiResponse = unknown;
export type StaffPaymentsControllerCreateApiArg = CreateStaffPaymentDto;
export type StaffPaymentsControllerFindAllApiResponse = unknown;
export type StaffPaymentsControllerFindAllApiArg = {
  skip?: number;
  take?: number;
  payPeriodId?: string;
  staffProfileId?: string;
  paymentStatus?: string;
};
export type StaffPaymentsControllerFindOneApiResponse = unknown;
export type StaffPaymentsControllerFindOneApiArg = string;
export type StaffPaymentsControllerUpdateApiResponse = unknown;
export type StaffPaymentsControllerUpdateApiArg = {
  id: string;
  updateStaffPaymentDto: UpdateStaffPaymentDto;
};
export type StaffPaymentsControllerRemoveApiResponse = unknown;
export type StaffPaymentsControllerRemoveApiArg = string;
export type LoginDto = {
  email: string;
  password: string;
};
export type UserDepartmentDto = {
  /** Department ID */
  departmentId: string;
  /** User position in department */
  position?: string;
  /** Whether user is head of department */
  isHead?: boolean;
};
export type CreateUserDto = {
  /** User email */
  email: string;
  /** User password */
  password: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User active status */
  isActive?: boolean;
  /** Organization ID */
  organizationId?: string;
  /** Role IDs to assign */
  roles?: string[];
  /** Departments to assign */
  departments?: UserDepartmentDto[];
  /** Sector-specific user profile data */
  sectorProfile?: object;
};
export type CreateInvitationDto = {
  /** Email address of the invitee */
  email: string;
  /** Organization ID (if inviting to specific org) */
  organizationId: string;
  /** Role ID to assign to the user upon acceptance */
  roleId?: string;
  /** Expiration date for the invitation */
  expiresAt?: string;
  /** Optional message to include with the invitation */
  message?: string;
};
export type UpdateUserDto = {
  /** User email */
  email?: string;
  /** User password */
  password?: string;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** User active status */
  isActive?: boolean;
  /** Organization ID */
  organizationId?: string;
  /** Role IDs to assign */
  roles?: string[];
  /** Departments to assign */
  departments?: UserDepartmentDto[];
  /** Sector-specific user profile data */
  sectorProfile?: object;
};
export type AssignRoleDto = {
  /** Role ID to assign to the user */
  roleId: string;
  /** Expiration date for the role (temporary role) */
  validUntil?: string;
};
export type UpdateUserDepartmentDto = {
  /** Department ID */
  departmentId: string;
  /** User position in department */
  position?: string;
  /** Whether user is head of department */
  isHead?: boolean;
};
export type AssignUserPermissionDto = {
  /** Permission ID to assign to the user */
  permissionId: string;
  /** Conditions for the permission (CASL conditions) */
  conditions?: object;
  /** Expiration date for the permission (temporary access) */
  validUntil?: string;
};
export type AddressDto = {
  /** Street address */
  street: string;
  /** City */
  city: string;
  /** State/Province */
  state: string;
  /** Zip/Postal Code */
  zipCode: string;
  /** Country */
  country: string;
  /** Country Code */
  countryCode?: string;
};
export type CreateOrganizationDto = {
  /** Organization name */
  name: string;
  /** Organization category */
  category:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
  /** Organization description */
  description?: string;
  /** Organization email */
  email?: string;
  /** Organization phone */
  phone?: string;
  /** Organization website URL */
  websiteUrl?: string;
  /** Organization logo URL */
  logoUrl?: string;
  /** Sector-specific configuration */
  sectorConfig?: object;
  /** Department address */
  address?: AddressDto;
};
export type UpdateOrganizationDto = {
  /** Organization name */
  name?: string;
  /** Organization category */
  category?:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
  /** Organization description */
  description?: string;
  /** Organization email */
  email?: string;
  /** Organization phone */
  phone?: string;
  /** Organization website URL */
  websiteUrl?: string;
  /** Organization logo URL */
  logoUrl?: string;
  /** Sector-specific configuration */
  sectorConfig?: object;
  /** Organization address */
  address?: AddressDto;
};
export type CreateDepartmentDto = {
  /** Department name */
  name: string;
  /** Department description */
  description?: string;
  /** Parent department ID */
  parentId?: string;
};
export type CreateRolesDto = {
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Is this a system-wide role */
  isSystemRole?: boolean;
  /** Sector this role applies to (null means cross-sector) */
  sector?:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
  /** Organization ID (null for system roles) */
  organizationId?: string;
  /** Permission IDs to assign */
  permissions?: string[];
};
export type UpdateRolesDto = {
  /** Role name */
  name?: string;
  /** Role description */
  description?: string;
  /** Is this a system-wide role */
  isSystemRole?: boolean;
  /** Sector this role applies to (null means cross-sector) */
  sector?:
    | 'HOSPITAL'
    | 'CARE_HOME'
    | 'STAFF_PROVIDER'
    | 'SOFTWARE_COMPANY'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'RETAIL'
    | 'LOGISTICS'
    | 'CONSTRUCTION'
    | 'FINANCIAL'
    | 'HOSPITALITY'
    | 'HEALTHCARE'
    | 'OTHER';
  /** Organization ID (null for system roles) */
  organizationId?: string;
  /** Permission IDs to assign */
  permissions?: string[];
};
export type AssignPermissionDto = {
  /** Permission ID to assign */
  permissionId: string;
  /** Conditions for this permission (CASL conditions as JSON) */
  conditions?: object;
};
export type CreateShiftTypeDto = {
  /** Shift type name (e.g., Morning, Night) */
  name: string;
  /** Start time in 24-hour format (HH:MM) */
  startTime: string;
  /** End time in 24-hour format (HH:MM) */
  endTime: string;
  /** Whether the shift spans overnight (e.g., 22:00 to 06:00) */
  isOvernight?: boolean;
  /** Base pay multiplier (e.g., 1.5 for night shifts) */
  basePayMultiplier?: number;
  /** Shift type description */
  description?: string;
  /** Organization ID */
  organizationId: string;
};
export type UpdateShiftTypeDto = {
  /** Shift type name (e.g., Morning, Night) */
  name?: string;
  /** Start time in 24-hour format (HH:MM) */
  startTime?: string;
  /** End time in 24-hour format (HH:MM) */
  endTime?: string;
  /** Whether the shift spans overnight (e.g., 22:00 to 06:00) */
  isOvernight?: boolean;
  /** Base pay multiplier (e.g., 1.5 for night shifts) */
  basePayMultiplier?: number;
  /** Shift type description */
  description?: string;
  /** Organization ID */
  organizationId?: string;
};
export type CreateCompensationRateDto = {
  /** Department ID */
  departmentId: string;
  /** Base rate (hourly or per shift) */
  baseRate: number;
  /** Specialty bonus */
  specialtyBonus?: number;
  /** Experience multiplier */
  experienceMultiplier?: number;
  /** Effective date */
  effectiveDate?: string;
  /** End date (if applicable) */
  endDate?: string;
};
export type CreateStaffProfileDto = {
  /** User ID */
  userId: string;
  /** Staff type */
  staffType: 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'RECEPTION' | 'SUPPORT';
  /** Specialty (e.g., Cardiology, Orthopedics) */
  specialty?: string;
  /** Years of experience */
  experienceYears?: number;
  /** Education level */
  educationLevel?: string;
  /** Certifications as JSON array */
  certifications?: object;
  /** Base salary type */
  baseSalaryType?: 'HOURLY' | 'MONTHLY' | 'WEEKLY' | 'PER_SHIFT';
  /** Base salary amount */
  baseSalaryAmount?: number;
  /** Date joined */
  dateJoined?: string;
  /** Staff status */
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  /** Compensation rates */
  compensationRates?: CreateCompensationRateDto[];
};
export type UpdateStaffProfileDto = {
  /** User ID */
  userId?: string;
  /** Staff type */
  staffType?: 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'RECEPTION' | 'SUPPORT';
  /** Specialty (e.g., Cardiology, Orthopedics) */
  specialty?: string;
  /** Years of experience */
  experienceYears?: number;
  /** Education level */
  educationLevel?: string;
  /** Certifications as JSON array */
  certifications?: object;
  /** Base salary type */
  baseSalaryType?: 'HOURLY' | 'MONTHLY' | 'WEEKLY' | 'PER_SHIFT';
  /** Base salary amount */
  baseSalaryAmount?: number;
  /** Date joined */
  dateJoined?: string;
  /** Staff status */
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  /** Compensation rates */
  compensationRates?: CreateCompensationRateDto[];
};
export type CreateShiftScheduleDto = {
  /** Staff Profile ID */
  staffProfileId: string;
  /** Shift Type ID */
  shiftTypeId: string;
  /** Department ID */
  departmentId: string;
  /** Shift start date and time */
  startDateTime: string;
  /** Shift end date and time */
  endDateTime: string;
  /** Shift status */
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'SWAPPED';
  /** Whether the shift is confirmed by the staff */
  isConfirmed?: boolean;
  /** Shift notes */
  notes?: string;
};
export type UpdateShiftScheduleDto = {
  /** Staff Profile ID */
  staffProfileId?: string;
  /** Shift Type ID */
  shiftTypeId?: string;
  /** Department ID */
  departmentId?: string;
  /** Shift start date and time */
  startDateTime?: string;
  /** Shift end date and time */
  endDateTime?: string;
  /** Shift status */
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'SWAPPED';
  /** Whether the shift is confirmed by the staff */
  isConfirmed?: boolean;
  /** Shift notes */
  notes?: string;
};
export type CreateShiftAttendanceDto = {
  /** Shift Schedule ID */
  shiftScheduleId: string;
  /** Actual start time of the shift */
  actualStartTime?: string;
  /** Actual end time of the shift */
  actualEndTime?: string;
  /** Attendance status */
  status?: 'PENDING' | 'PRESENT' | 'LATE' | 'ABSENT' | 'PARTIALLY_COMPLETE';
  /** Overtime minutes */
  overtimeMinutes?: number;
  /** Notes about the attendance */
  notes?: string;
};
export type UpdateShiftAttendanceDto = {
  /** Shift Schedule ID */
  shiftScheduleId?: string;
  /** Actual start time of the shift */
  actualStartTime?: string;
  /** Actual end time of the shift */
  actualEndTime?: string;
  /** Attendance status */
  status?: 'PENDING' | 'PRESENT' | 'LATE' | 'ABSENT' | 'PARTIALLY_COMPLETE';
  /** Overtime minutes */
  overtimeMinutes?: number;
  /** Notes about the attendance */
  notes?: string;
};
export type CreatePayPeriodDto = {
  /** Organization ID */
  organizationId: string;
  /** Pay period start date */
  startDate: string;
  /** Pay period end date */
  endDate: string;
  /** Pay period status */
  status?: 'OPEN' | 'CALCULATING' | 'FINALIZED' | 'PAID';
};
export type UpdatePayPeriodDto = {
  /** Organization ID */
  organizationId?: string;
  /** Pay period start date */
  startDate?: string;
  /** Pay period end date */
  endDate?: string;
  /** Pay period status */
  status?: 'OPEN' | 'CALCULATING' | 'FINALIZED' | 'PAID';
};
export type CreateStaffPaymentDto = {
  /** Staff Profile ID */
  staffProfileId: string;
  /** Pay Period ID */
  payPeriodId: string;
  /** Regular hours worked */
  regularHours: number;
  /** Overtime hours worked */
  overtimeHours?: number;
  /** Regular pay amount */
  regularPay: number;
  /** Overtime pay amount */
  overtimePay?: number;
  /** Specialty bonus amount */
  specialtyBonus?: number;
  /** Other bonuses amount */
  otherBonuses?: number;
  /** Deductions amount */
  deductions?: number;
  /** Payment status */
  paymentStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  /** Payment date */
  paymentDate?: string;
};
export type UpdateStaffPaymentDto = {
  /** Staff Profile ID */
  staffProfileId?: string;
  /** Pay Period ID */
  payPeriodId?: string;
  /** Regular hours worked */
  regularHours?: number;
  /** Overtime hours worked */
  overtimeHours?: number;
  /** Regular pay amount */
  regularPay?: number;
  /** Overtime pay amount */
  overtimePay?: number;
  /** Specialty bonus amount */
  specialtyBonus?: number;
  /** Other bonuses amount */
  otherBonuses?: number;
  /** Deductions amount */
  deductions?: number;
  /** Payment status */
  paymentStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  /** Payment date */
  paymentDate?: string;
};
export const {
  useAuthControllerLoginMutation,
  useAuthControllerRegisterMutation,
  useAuthControllerGetProfileQuery,
  useAuthControllerCreateSuperAdminMutation,
  useAuthControllerRegisterWithOrganizationMutation,
  useInvitationsControllerCreateMutation,
  useInvitationsControllerFindAllQuery,
  useInvitationsControllerValidateTokenQuery,
  useInvitationsControllerFindOneQuery,
  useInvitationsControllerRevokeMutation,
  useInvitationsControllerResendMutation,
  useUsersControllerCreateMutation,
  useUsersControllerFindAllQuery,
  useUsersControllerFindOneQuery,
  useUsersControllerUpdateMutation,
  useUsersControllerRemoveMutation,
  useUsersControllerAssignRoleMutation,
  useUsersControllerRemoveRoleMutation,
  useUsersControllerUpdateDepartmentMutation,
  useUsersControllerRemoveDepartmentMutation,
  useUsersControllerGetUserPermissionsQuery,
  useUsersControllerAssignPermissionMutation,
  useUsersControllerRemovePermissionMutation,
  useOrganizationsControllerCreateMutation,
  useOrganizationsControllerFindAllQuery,
  useOrganizationsControllerFindOneQuery,
  useOrganizationsControllerUpdateMutation,
  useOrganizationsControllerRemoveMutation,
  useOrganizationsControllerCreateDepartmentMutation,
  useOrganizationsControllerGetDepartmentsQuery,
  useRolesControllerCreateMutation,
  useRolesControllerFindAllQuery,
  useRolesControllerFindAllPermissionsQuery,
  useRolesControllerFindOneQuery,
  useRolesControllerUpdateMutation,
  useRolesControllerRemoveMutation,
  useRolesControllerAssignPermissionMutation,
  useRolesControllerRemovePermissionMutation,
  useShiftTypesControllerCreateMutation,
  useShiftTypesControllerFindAllQuery,
  useShiftTypesControllerFindOneQuery,
  useShiftTypesControllerUpdateMutation,
  useShiftTypesControllerRemoveMutation,
  useStaffProfilesControllerCreateMutation,
  useStaffProfilesControllerFindAllQuery,
  useStaffProfilesControllerFindOneQuery,
  useStaffProfilesControllerUpdateMutation,
  useStaffProfilesControllerRemoveMutation,
  useStaffProfilesControllerAddCompensationRateMutation,
  useStaffProfilesControllerRemoveCompensationRateMutation,
  useShiftSchedulesControllerCreateMutation,
  useShiftSchedulesControllerFindAllQuery,
  useShiftSchedulesControllerFindOneQuery,
  useShiftSchedulesControllerUpdateMutation,
  useShiftSchedulesControllerRemoveMutation,
  useShiftAttendancesControllerCreateMutation,
  useShiftAttendancesControllerFindAllQuery,
  useShiftAttendancesControllerFindOneQuery,
  useShiftAttendancesControllerUpdateMutation,
  useShiftAttendancesControllerRemoveMutation,
  usePayPeriodsControllerCreateMutation,
  usePayPeriodsControllerFindAllQuery,
  usePayPeriodsControllerFindOneQuery,
  usePayPeriodsControllerUpdateMutation,
  usePayPeriodsControllerRemoveMutation,
  useStaffPaymentsControllerCreateMutation,
  useStaffPaymentsControllerFindAllQuery,
  useStaffPaymentsControllerFindOneQuery,
  useStaffPaymentsControllerUpdateMutation,
  useStaffPaymentsControllerRemoveMutation,
} = injectedRtkApi;
