import { api } from "./api";
export const addTagTypes = [
  "auth",
  "auth/invitations",
  "users",
  "organizations",
  "roles",
  "ShiftTypes",
  "ShiftSchedules",
  "Shift Attendances",
  "ShiftReports",
  "Payment Rules",
  "Shift Type Premiums",
  "Staff Compensation Rates",
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
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["auth"],
      }),
      authControllerRegister: build.mutation<
        AuthControllerRegisterApiResponse,
        AuthControllerRegisterApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register`,
          method: "POST",
          body: queryArg.createUserDto,
          params: {
            invitationToken: queryArg.invitationToken,
          },
        }),
        invalidatesTags: ["auth"],
      }),
      authControllerGetProfile: build.query<
        AuthControllerGetProfileApiResponse,
        AuthControllerGetProfileApiArg
      >({
        query: () => ({ url: `/auth/profile` }),
        providesTags: ["auth"],
      }),
      authControllerCreateSuperAdmin: build.mutation<
        AuthControllerCreateSuperAdminApiResponse,
        AuthControllerCreateSuperAdminApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/create-super-admin`,
          method: "POST",
          body: queryArg.createUserDto,
          params: {
            secretKey: queryArg.secretKey,
          },
        }),
        invalidatesTags: ["auth"],
      }),
      authControllerRegisterWithOrganization: build.mutation<
        AuthControllerRegisterWithOrganizationApiResponse,
        AuthControllerRegisterWithOrganizationApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register-with-organization`,
          method: "POST",
          params: {
            invitationToken: queryArg,
          },
        }),
        invalidatesTags: ["auth"],
      }),
      invitationsControllerCreate: build.mutation<
        InvitationsControllerCreateApiResponse,
        InvitationsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["auth/invitations"],
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
        providesTags: ["auth/invitations"],
      }),
      invitationsControllerValidateToken: build.query<
        InvitationsControllerValidateTokenApiResponse,
        InvitationsControllerValidateTokenApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/validate/${queryArg}`,
        }),
        providesTags: ["auth/invitations"],
      }),
      invitationsControllerFindOne: build.query<
        InvitationsControllerFindOneApiResponse,
        InvitationsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/auth/invitations/${queryArg}` }),
        providesTags: ["auth/invitations"],
      }),
      invitationsControllerRevoke: build.mutation<
        InvitationsControllerRevokeApiResponse,
        InvitationsControllerRevokeApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/${queryArg}/revoke`,
          method: "PATCH",
        }),
        invalidatesTags: ["auth/invitations"],
      }),
      invitationsControllerResend: build.mutation<
        InvitationsControllerResendApiResponse,
        InvitationsControllerResendApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/invitations/${queryArg}/resend`,
          method: "PATCH",
        }),
        invalidatesTags: ["auth/invitations"],
      }),
      usersControllerCreate: build.mutation<
        UsersControllerCreateApiResponse,
        UsersControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/users`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["users"],
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
        providesTags: ["users"],
      }),
      usersControllerFindOne: build.query<
        UsersControllerFindOneApiResponse,
        UsersControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}` }),
        providesTags: ["users"],
      }),
      usersControllerUpdate: build.mutation<
        UsersControllerUpdateApiResponse,
        UsersControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateUserDto,
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerRemove: build.mutation<
        UsersControllerRemoveApiResponse,
        UsersControllerRemoveApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}`, method: "DELETE" }),
        invalidatesTags: ["users"],
      }),
      usersControllerAssignRole: build.mutation<
        UsersControllerAssignRoleApiResponse,
        UsersControllerAssignRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/roles`,
          method: "POST",
          body: queryArg.assignRoleDto,
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerRemoveRole: build.mutation<
        UsersControllerRemoveRoleApiResponse,
        UsersControllerRemoveRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/roles/${queryArg.roleId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerUpdateDepartment: build.mutation<
        UsersControllerUpdateDepartmentApiResponse,
        UsersControllerUpdateDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/departments`,
          method: "POST",
          body: queryArg.updateUserDepartmentDto,
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerRemoveDepartment: build.mutation<
        UsersControllerRemoveDepartmentApiResponse,
        UsersControllerRemoveDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/departments/${queryArg.departmentId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerGetUserPermissions: build.query<
        UsersControllerGetUserPermissionsApiResponse,
        UsersControllerGetUserPermissionsApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}/permissions` }),
        providesTags: ["users"],
      }),
      usersControllerAssignPermission: build.mutation<
        UsersControllerAssignPermissionApiResponse,
        UsersControllerAssignPermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/permissions`,
          method: "POST",
          body: queryArg.assignUserPermissionDto,
        }),
        invalidatesTags: ["users"],
      }),
      usersControllerRemovePermission: build.mutation<
        UsersControllerRemovePermissionApiResponse,
        UsersControllerRemovePermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.id}/permissions/${queryArg.permissionId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["users"],
      }),
      organizationsControllerCreate: build.mutation<
        OrganizationsControllerCreateApiResponse,
        OrganizationsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["organizations"],
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
        providesTags: ["organizations"],
      }),
      organizationsControllerFindOne: build.query<
        OrganizationsControllerFindOneApiResponse,
        OrganizationsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/organizations/${queryArg}` }),
        providesTags: ["organizations"],
      }),
      organizationsControllerUpdate: build.mutation<
        OrganizationsControllerUpdateApiResponse,
        OrganizationsControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateOrganizationDto,
        }),
        invalidatesTags: ["organizations"],
      }),
      organizationsControllerRemove: build.mutation<
        OrganizationsControllerRemoveApiResponse,
        OrganizationsControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["organizations"],
      }),
      organizationsControllerCreateDepartment: build.mutation<
        OrganizationsControllerCreateDepartmentApiResponse,
        OrganizationsControllerCreateDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg.id}/departments`,
          method: "POST",
          body: queryArg.createDepartmentDto,
        }),
        invalidatesTags: ["organizations"],
      }),
      organizationsControllerGetDepartments: build.query<
        OrganizationsControllerGetDepartmentsApiResponse,
        OrganizationsControllerGetDepartmentsApiArg
      >({
        query: (queryArg) => ({
          url: `/organizations/${queryArg}/departments`,
        }),
        providesTags: ["organizations"],
      }),
      rolesControllerCreate: build.mutation<
        RolesControllerCreateApiResponse,
        RolesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/roles`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["roles"],
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
        providesTags: ["roles"],
      }),
      rolesControllerFindAllPermissions: build.query<
        RolesControllerFindAllPermissionsApiResponse,
        RolesControllerFindAllPermissionsApiArg
      >({
        query: () => ({ url: `/roles/permissions` }),
        providesTags: ["roles"],
      }),
      rolesControllerFindOne: build.query<
        RolesControllerFindOneApiResponse,
        RolesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/roles/${queryArg}` }),
        providesTags: ["roles"],
      }),
      rolesControllerUpdate: build.mutation<
        RolesControllerUpdateApiResponse,
        RolesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateRolesDto,
        }),
        invalidatesTags: ["roles"],
      }),
      rolesControllerRemove: build.mutation<
        RolesControllerRemoveApiResponse,
        RolesControllerRemoveApiArg
      >({
        query: (queryArg) => ({ url: `/roles/${queryArg}`, method: "DELETE" }),
        invalidatesTags: ["roles"],
      }),
      rolesControllerAssignPermission: build.mutation<
        RolesControllerAssignPermissionApiResponse,
        RolesControllerAssignPermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}/permissions`,
          method: "POST",
          body: queryArg.assignPermissionDto,
        }),
        invalidatesTags: ["roles"],
      }),
      rolesControllerRemovePermission: build.mutation<
        RolesControllerRemovePermissionApiResponse,
        RolesControllerRemovePermissionApiArg
      >({
        query: (queryArg) => ({
          url: `/roles/${queryArg.id}/permissions/${queryArg.permissionId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["roles"],
      }),
      shiftTypesControllerCreate: build.mutation<
        ShiftTypesControllerCreateApiResponse,
        ShiftTypesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-types`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerFindAll: build.query<
        ShiftTypesControllerFindAllApiResponse,
        ShiftTypesControllerFindAllApiArg
      >({
        query: () => ({ url: `/shift-types` }),
        providesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerFindOne: build.query<
        ShiftTypesControllerFindOneApiResponse,
        ShiftTypesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/shift-types/${queryArg}` }),
        providesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerUpdate: build.mutation<
        ShiftTypesControllerUpdateApiResponse,
        ShiftTypesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-types/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateShiftTypeDto,
        }),
        invalidatesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerRemove: build.mutation<
        ShiftTypesControllerRemoveApiResponse,
        ShiftTypesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-types/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerCloneShiftType: build.mutation<
        ShiftTypesControllerCloneShiftTypeApiResponse,
        ShiftTypesControllerCloneShiftTypeApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-types/${queryArg}/clone`,
          method: "POST",
        }),
        invalidatesTags: ["ShiftTypes"],
      }),
      shiftTypesControllerFindByOrganization: build.query<
        ShiftTypesControllerFindByOrganizationApiResponse,
        ShiftTypesControllerFindByOrganizationApiArg
      >({
        query: (queryArg) => ({ url: `/shift-types/organization/${queryArg}` }),
        providesTags: ["ShiftTypes"],
      }),
      shiftSchedulesControllerCreate: build.mutation<
        ShiftSchedulesControllerCreateApiResponse,
        ShiftSchedulesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerFindAll: build.query<
        ShiftSchedulesControllerFindAllApiResponse,
        ShiftSchedulesControllerFindAllApiArg
      >({
        query: () => ({ url: `/shift-schedules` }),
        providesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerBulkCreate: build.mutation<
        ShiftSchedulesControllerBulkCreateApiResponse,
        ShiftSchedulesControllerBulkCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules/bulk`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerFindOne: build.query<
        ShiftSchedulesControllerFindOneApiResponse,
        ShiftSchedulesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/shift-schedules/${queryArg}` }),
        providesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerUpdate: build.mutation<
        ShiftSchedulesControllerUpdateApiResponse,
        ShiftSchedulesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateShiftScheduleDto,
        }),
        invalidatesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerRemove: build.mutation<
        ShiftSchedulesControllerRemoveApiResponse,
        ShiftSchedulesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerFindByStaff: build.query<
        ShiftSchedulesControllerFindByStaffApiResponse,
        ShiftSchedulesControllerFindByStaffApiArg
      >({
        query: (queryArg) => ({ url: `/shift-schedules/staff/${queryArg}` }),
        providesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerFindByDepartment: build.query<
        ShiftSchedulesControllerFindByDepartmentApiResponse,
        ShiftSchedulesControllerFindByDepartmentApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules/department/${queryArg}`,
        }),
        providesTags: ["ShiftSchedules"],
      }),
      shiftSchedulesControllerSwapShifts: build.mutation<
        ShiftSchedulesControllerSwapShiftsApiResponse,
        ShiftSchedulesControllerSwapShiftsApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-schedules/swap`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["ShiftSchedules"],
      }),
      shiftAttendancesControllerCreate: build.mutation<
        ShiftAttendancesControllerCreateApiResponse,
        ShiftAttendancesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerFindAll: build.query<
        ShiftAttendancesControllerFindAllApiResponse,
        ShiftAttendancesControllerFindAllApiArg
      >({
        query: () => ({ url: `/shift-attendances` }),
        providesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerFindOne: build.query<
        ShiftAttendancesControllerFindOneApiResponse,
        ShiftAttendancesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/shift-attendances/${queryArg}` }),
        providesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerUpdate: build.mutation<
        ShiftAttendancesControllerUpdateApiResponse,
        ShiftAttendancesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateShiftAttendanceDto,
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerRemove: build.mutation<
        ShiftAttendancesControllerRemoveApiResponse,
        ShiftAttendancesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerApprove: build.mutation<
        ShiftAttendancesControllerApproveApiResponse,
        ShiftAttendancesControllerApproveApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/${queryArg.id}/approve`,
          method: "POST",
          body: queryArg.body,
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerFindByShiftSchedule: build.query<
        ShiftAttendancesControllerFindByShiftScheduleApiResponse,
        ShiftAttendancesControllerFindByShiftScheduleApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/by-shift/${queryArg}`,
        }),
        providesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerClockIn: build.mutation<
        ShiftAttendancesControllerClockInApiResponse,
        ShiftAttendancesControllerClockInApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/clock-in/${queryArg}`,
          method: "POST",
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftAttendancesControllerClockOut: build.mutation<
        ShiftAttendancesControllerClockOutApiResponse,
        ShiftAttendancesControllerClockOutApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-attendances/clock-out/${queryArg}`,
          method: "POST",
        }),
        invalidatesTags: ["Shift Attendances"],
      }),
      shiftReportsControllerGetStaffHoursReport: build.query<
        ShiftReportsControllerGetStaffHoursReportApiResponse,
        ShiftReportsControllerGetStaffHoursReportApiArg
      >({
        query: (queryArg) => ({ url: `/shift-reports/staff/${queryArg}` }),
        providesTags: ["ShiftReports"],
      }),
      shiftReportsControllerGetDepartmentHoursReport: build.query<
        ShiftReportsControllerGetDepartmentHoursReportApiResponse,
        ShiftReportsControllerGetDepartmentHoursReportApiArg
      >({
        query: (queryArg) => ({ url: `/shift-reports/department/${queryArg}` }),
        providesTags: ["ShiftReports"],
      }),
      shiftReportsControllerGetOrganizationCoverageReport: build.query<
        ShiftReportsControllerGetOrganizationCoverageReportApiResponse,
        ShiftReportsControllerGetOrganizationCoverageReportApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-reports/organization/${queryArg}/coverage`,
        }),
        providesTags: ["ShiftReports"],
      }),
      shiftReportsControllerGetOvertimeReport: build.query<
        ShiftReportsControllerGetOvertimeReportApiResponse,
        ShiftReportsControllerGetOvertimeReportApiArg
      >({
        query: (queryArg) => ({
          url: `/shift-reports/organization/${queryArg}/overtime`,
        }),
        providesTags: ["ShiftReports"],
      }),
      paymentRulesControllerCreate: build.mutation<
        PaymentRulesControllerCreateApiResponse,
        PaymentRulesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["Payment Rules"],
      }),
      paymentRulesControllerFindAll: build.query<
        PaymentRulesControllerFindAllApiResponse,
        PaymentRulesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules`,
          params: {
            shiftTypeId: queryArg.shiftTypeId,
            roleId: queryArg.roleId,
            organizationId: queryArg.organizationId,
            paymentType: queryArg.paymentType,
            effectiveDate: queryArg.effectiveDate,
            active: queryArg.active,
            skip: queryArg.skip,
            take: queryArg.take,
          },
        }),
        providesTags: ["Payment Rules"],
      }),
      paymentRulesControllerFindOne: build.query<
        PaymentRulesControllerFindOneApiResponse,
        PaymentRulesControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/api/payment-rules/${queryArg}` }),
        providesTags: ["Payment Rules"],
      }),
      paymentRulesControllerUpdate: build.mutation<
        PaymentRulesControllerUpdateApiResponse,
        PaymentRulesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updatePaymentRuleDto,
        }),
        invalidatesTags: ["Payment Rules"],
      }),
      paymentRulesControllerRemove: build.mutation<
        PaymentRulesControllerRemoveApiResponse,
        PaymentRulesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Payment Rules"],
      }),
      paymentRulesControllerFindByOrganization: build.query<
        PaymentRulesControllerFindByOrganizationApiResponse,
        PaymentRulesControllerFindByOrganizationApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules/organization/${queryArg.organizationId}`,
          params: {
            take: queryArg.take,
            skip: queryArg.skip,
            active: queryArg.active,
            effectiveDate: queryArg.effectiveDate,
            paymentType: queryArg.paymentType,
            roleId: queryArg.roleId,
            shiftTypeId: queryArg.shiftTypeId,
          },
        }),
        providesTags: ["Payment Rules"],
      }),
      paymentRulesControllerFindByRole: build.query<
        PaymentRulesControllerFindByRoleApiResponse,
        PaymentRulesControllerFindByRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules/role/${queryArg.roleId}`,
          params: {
            take: queryArg.take,
            skip: queryArg.skip,
            active: queryArg.active,
            effectiveDate: queryArg.effectiveDate,
            paymentType: queryArg.paymentType,
            organizationId: queryArg.organizationId,
            shiftTypeId: queryArg.shiftTypeId,
          },
        }),
        providesTags: ["Payment Rules"],
      }),
      paymentRulesControllerFindByShiftType: build.query<
        PaymentRulesControllerFindByShiftTypeApiResponse,
        PaymentRulesControllerFindByShiftTypeApiArg
      >({
        query: (queryArg) => ({
          url: `/api/payment-rules/shift-type/${queryArg.shiftTypeId}`,
          params: {
            take: queryArg.take,
            skip: queryArg.skip,
            active: queryArg.active,
            effectiveDate: queryArg.effectiveDate,
            paymentType: queryArg.paymentType,
            organizationId: queryArg.organizationId,
            roleId: queryArg.roleId,
          },
        }),
        providesTags: ["Payment Rules"],
      }),
      shiftTypePremiumsControllerCreate: build.mutation<
        ShiftTypePremiumsControllerCreateApiResponse,
        ShiftTypePremiumsControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/shift-type-premiums`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["Shift Type Premiums"],
      }),
      shiftTypePremiumsControllerFindAll: build.query<
        ShiftTypePremiumsControllerFindAllApiResponse,
        ShiftTypePremiumsControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/api/shift-type-premiums`,
          params: {
            shiftTypeId: queryArg.shiftTypeId,
            compensationRateId: queryArg.compensationRateId,
            effectiveDate: queryArg.effectiveDate,
            active: queryArg.active,
            skip: queryArg.skip,
            take: queryArg.take,
          },
        }),
        providesTags: ["Shift Type Premiums"],
      }),
      shiftTypePremiumsControllerFindOne: build.query<
        ShiftTypePremiumsControllerFindOneApiResponse,
        ShiftTypePremiumsControllerFindOneApiArg
      >({
        query: (queryArg) => ({ url: `/api/shift-type-premiums/${queryArg}` }),
        providesTags: ["Shift Type Premiums"],
      }),
      shiftTypePremiumsControllerUpdate: build.mutation<
        ShiftTypePremiumsControllerUpdateApiResponse,
        ShiftTypePremiumsControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/shift-type-premiums/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateShiftTypePremiumDto,
        }),
        invalidatesTags: ["Shift Type Premiums"],
      }),
      shiftTypePremiumsControllerRemove: build.mutation<
        ShiftTypePremiumsControllerRemoveApiResponse,
        ShiftTypePremiumsControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/shift-type-premiums/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Shift Type Premiums"],
      }),
      shiftTypePremiumsControllerFindApplicablePremiums: build.query<
        ShiftTypePremiumsControllerFindApplicablePremiumsApiResponse,
        ShiftTypePremiumsControllerFindApplicablePremiumsApiArg
      >({
        query: (queryArg) => ({
          url: `/api/shift-type-premiums/applicable/${queryArg.staffProfileId}/${queryArg.departmentId}/${queryArg.shiftTypeId}`,
        }),
        providesTags: ["Shift Type Premiums"],
      }),
      staffCompensationRatesControllerCreate: build.mutation<
        StaffCompensationRatesControllerCreateApiResponse,
        StaffCompensationRatesControllerCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates`,
          method: "POST",
          body: queryArg,
        }),
        invalidatesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerFindAll: build.query<
        StaffCompensationRatesControllerFindAllApiResponse,
        StaffCompensationRatesControllerFindAllApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates`,
          params: {
            staffProfileId: queryArg.staffProfileId,
            departmentId: queryArg.departmentId,
            paymentType: queryArg.paymentType,
            effectiveDate: queryArg.effectiveDate,
            active: queryArg.active,
            includePremiums: queryArg.includePremiums,
            skip: queryArg.skip,
            take: queryArg.take,
          },
        }),
        providesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerFindOne: build.query<
        StaffCompensationRatesControllerFindOneApiResponse,
        StaffCompensationRatesControllerFindOneApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates/${queryArg.id}`,
          params: {
            includePremiums: queryArg.includePremiums,
          },
        }),
        providesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerUpdate: build.mutation<
        StaffCompensationRatesControllerUpdateApiResponse,
        StaffCompensationRatesControllerUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateStaffCompensationRateDto,
        }),
        invalidatesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerRemove: build.mutation<
        StaffCompensationRatesControllerRemoveApiResponse,
        StaffCompensationRatesControllerRemoveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates/${queryArg}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerFindCurrentRate: build.query<
        StaffCompensationRatesControllerFindCurrentRateApiResponse,
        StaffCompensationRatesControllerFindCurrentRateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates/staff/${queryArg.staffProfileId}/department/${queryArg.departmentId}`,
        }),
        providesTags: ["Staff Compensation Rates"],
      }),
      staffCompensationRatesControllerCalculateShiftPay: build.query<
        StaffCompensationRatesControllerCalculateShiftPayApiResponse,
        StaffCompensationRatesControllerCalculateShiftPayApiArg
      >({
        query: (queryArg) => ({
          url: `/api/staff-compensation-rates/calculate-pay`,
          params: {
            staffProfileId: queryArg.staffProfileId,
            departmentId: queryArg.departmentId,
            shiftTypeId: queryArg.shiftTypeId,
            hoursWorked: queryArg.hoursWorked,
          },
        }),
        providesTags: ["Staff Compensation Rates"],
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
export type ShiftTypesControllerFindAllApiArg = void;
export type ShiftTypesControllerFindOneApiResponse = unknown;
export type ShiftTypesControllerFindOneApiArg = string;
export type ShiftTypesControllerUpdateApiResponse = unknown;
export type ShiftTypesControllerUpdateApiArg = {
  id: string;
  updateShiftTypeDto: UpdateShiftTypeDto;
};
export type ShiftTypesControllerRemoveApiResponse = unknown;
export type ShiftTypesControllerRemoveApiArg = string;
export type ShiftTypesControllerCloneShiftTypeApiResponse = unknown;
export type ShiftTypesControllerCloneShiftTypeApiArg = string;
export type ShiftTypesControllerFindByOrganizationApiResponse = unknown;
export type ShiftTypesControllerFindByOrganizationApiArg = string;
export type ShiftSchedulesControllerCreateApiResponse = unknown;
export type ShiftSchedulesControllerCreateApiArg = CreateShiftScheduleDto;
export type ShiftSchedulesControllerFindAllApiResponse = unknown;
export type ShiftSchedulesControllerFindAllApiArg = void;
export type ShiftSchedulesControllerBulkCreateApiResponse = unknown;
export type ShiftSchedulesControllerBulkCreateApiArg =
  BulkCreateShiftScheduleDto;
export type ShiftSchedulesControllerFindOneApiResponse = unknown;
export type ShiftSchedulesControllerFindOneApiArg = string;
export type ShiftSchedulesControllerUpdateApiResponse = unknown;
export type ShiftSchedulesControllerUpdateApiArg = {
  id: string;
  updateShiftScheduleDto: UpdateShiftScheduleDto;
};
export type ShiftSchedulesControllerRemoveApiResponse = unknown;
export type ShiftSchedulesControllerRemoveApiArg = string;
export type ShiftSchedulesControllerFindByStaffApiResponse = unknown;
export type ShiftSchedulesControllerFindByStaffApiArg = string;
export type ShiftSchedulesControllerFindByDepartmentApiResponse = unknown;
export type ShiftSchedulesControllerFindByDepartmentApiArg = string;
export type ShiftSchedulesControllerSwapShiftsApiResponse = unknown;
export type ShiftSchedulesControllerSwapShiftsApiArg = SwapShiftDto;
export type ShiftAttendancesControllerCreateApiResponse =
  /** status 201 The shift attendance has been successfully created. */ ShiftAttendance;
export type ShiftAttendancesControllerCreateApiArg = CreateShiftAttendanceDto;
export type ShiftAttendancesControllerFindAllApiResponse =
  /** status 200 List of shift attendance records retrieved successfully. */ ShiftAttendance[];
export type ShiftAttendancesControllerFindAllApiArg = void;
export type ShiftAttendancesControllerFindOneApiResponse =
  /** status 200 The shift attendance record has been found. */ ShiftAttendance;
export type ShiftAttendancesControllerFindOneApiArg =
  /** The ID of the shift attendance record */ string;
export type ShiftAttendancesControllerUpdateApiResponse =
  /** status 200 The shift attendance record has been successfully updated. */ ShiftAttendance;
export type ShiftAttendancesControllerUpdateApiArg = {
  /** The ID of the shift attendance record to update */
  id: string;
  updateShiftAttendanceDto: UpdateShiftAttendanceDto;
};
export type ShiftAttendancesControllerRemoveApiResponse =
  /** status 200 The shift attendance record has been successfully deleted. */ ShiftAttendance;
export type ShiftAttendancesControllerRemoveApiArg =
  /** The ID of the shift attendance record to delete */ string;
export type ShiftAttendancesControllerApproveApiResponse =
  /** status 200 The shift attendance record has been successfully approved. */ ShiftAttendance;
export type ShiftAttendancesControllerApproveApiArg = {
  /** The ID of the shift attendance record to approve */
  id: string;
  body: {
    /** ID of the user approving the attendance */
    approvedById: string;
    /** Optional approval notes */
    notes?: string | null;
  };
};
export type ShiftAttendancesControllerFindByShiftScheduleApiResponse =
  /** status 200 The shift attendance record has been found. */ ShiftAttendance;
export type ShiftAttendancesControllerFindByShiftScheduleApiArg =
  /** The ID of the shift schedule */ string;
export type ShiftAttendancesControllerClockInApiResponse =
  /** status 200 Successfully clocked in for the shift. */ ShiftAttendance;
export type ShiftAttendancesControllerClockInApiArg =
  /** The ID of the shift schedule to clock in for */ string;
export type ShiftAttendancesControllerClockOutApiResponse =
  /** status 200 Successfully clocked out from the shift. */ ShiftAttendance;
export type ShiftAttendancesControllerClockOutApiArg =
  /** The ID of the shift schedule to clock out from */ string;
export type ShiftReportsControllerGetStaffHoursReportApiResponse = unknown;
export type ShiftReportsControllerGetStaffHoursReportApiArg = string;
export type ShiftReportsControllerGetDepartmentHoursReportApiResponse = unknown;
export type ShiftReportsControllerGetDepartmentHoursReportApiArg = string;
export type ShiftReportsControllerGetOrganizationCoverageReportApiResponse =
  unknown;
export type ShiftReportsControllerGetOrganizationCoverageReportApiArg = string;
export type ShiftReportsControllerGetOvertimeReportApiResponse = unknown;
export type ShiftReportsControllerGetOvertimeReportApiArg = string;
export type PaymentRulesControllerCreateApiResponse =
  /** status 201 The payment rule has been successfully created. */ PaymentRuleResponseDto;
export type PaymentRulesControllerCreateApiArg = CreatePaymentRuleDto;
export type PaymentRulesControllerFindAllApiResponse =
  /** status 200 Returns all payment rules that match the query. */ PaymentRuleResponseDto[];
export type PaymentRulesControllerFindAllApiArg = {
  /** Filter by shift type ID */
  shiftTypeId?: string;
  /** Filter by role ID */
  roleId?: string;
  /** Filter by organization ID */
  organizationId?: string;
  /** Filter by payment type */
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  /** Filter by effective date - returns rules effective at the specified date */
  effectiveDate?: string;
  /** Filter active rules only (rules with no end date or end date in the future) */
  active?: boolean;
  /** Number of records to skip for pagination */
  skip?: number;
  /** Number of records to take for pagination */
  take?: number;
};
export type PaymentRulesControllerFindOneApiResponse =
  /** status 200 Returns the payment rule with the given ID. */ PaymentRuleResponseDto;
export type PaymentRulesControllerFindOneApiArg =
  /** The payment rule ID */ string;
export type PaymentRulesControllerUpdateApiResponse =
  /** status 200 The payment rule has been successfully updated. */ PaymentRuleResponseDto;
export type PaymentRulesControllerUpdateApiArg = {
  /** The payment rule ID */
  id: string;
  updatePaymentRuleDto: UpdatePaymentRuleDto;
};
export type PaymentRulesControllerRemoveApiResponse =
  /** status 200 The payment rule has been successfully deleted. */ PaymentRuleResponseDto;
export type PaymentRulesControllerRemoveApiArg =
  /** The payment rule ID */ string;
export type PaymentRulesControllerFindByOrganizationApiResponse =
  /** status 200 Returns all payment rules for the given organization. */ PaymentRuleResponseDto[];
export type PaymentRulesControllerFindByOrganizationApiArg = {
  /** The organization ID */
  organizationId: string;
  take?: number;
  skip?: number;
  active?: boolean;
  effectiveDate?: string;
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  roleId?: string;
  shiftTypeId?: string;
};
export type PaymentRulesControllerFindByRoleApiResponse =
  /** status 200 Returns all payment rules for the given role. */ PaymentRuleResponseDto[];
export type PaymentRulesControllerFindByRoleApiArg = {
  /** The role ID */
  roleId: string;
  take?: number;
  skip?: number;
  active?: boolean;
  effectiveDate?: string;
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  organizationId?: string;
  shiftTypeId?: string;
};
export type PaymentRulesControllerFindByShiftTypeApiResponse =
  /** status 200 Returns all payment rules for the given shift type. */ PaymentRuleResponseDto[];
export type PaymentRulesControllerFindByShiftTypeApiArg = {
  /** The shift type ID */
  shiftTypeId: string;
  take?: number;
  skip?: number;
  active?: boolean;
  effectiveDate?: string;
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  organizationId?: string;
  roleId?: string;
};
export type ShiftTypePremiumsControllerCreateApiResponse =
  /** status 201 The shift premium has been successfully created. */ object;
export type ShiftTypePremiumsControllerCreateApiArg = CreateShiftTypePremiumDto;
export type ShiftTypePremiumsControllerFindAllApiResponse =
  /** status 200 Returns all shift premiums that match the query. */ object[];
export type ShiftTypePremiumsControllerFindAllApiArg = {
  /** Filter by shift type ID */
  shiftTypeId?: string;
  /** Filter by compensation rate ID */
  compensationRateId?: string;
  /** Filter by effective date - returns premiums effective at the specified date */
  effectiveDate?: string;
  /** Filter active premiums only (premiums with no end date or end date in the future) */
  active?: boolean;
  /** Number of records to skip for pagination */
  skip?: number;
  /** Number of records to take for pagination */
  take?: number;
};
export type ShiftTypePremiumsControllerFindOneApiResponse =
  /** status 200 Returns the shift premium with the given ID. */ object;
export type ShiftTypePremiumsControllerFindOneApiArg =
  /** The shift premium ID */ string;
export type ShiftTypePremiumsControllerUpdateApiResponse =
  /** status 200 The shift premium has been successfully updated. */ object;
export type ShiftTypePremiumsControllerUpdateApiArg = {
  /** The shift premium ID */
  id: string;
  updateShiftTypePremiumDto: UpdateShiftTypePremiumDto;
};
export type ShiftTypePremiumsControllerRemoveApiResponse =
  /** status 200 The shift premium has been successfully deleted. */ object;
export type ShiftTypePremiumsControllerRemoveApiArg =
  /** The shift premium ID */ string;
export type ShiftTypePremiumsControllerFindApplicablePremiumsApiResponse =
  /** status 200 Returns all applicable shift premiums. */ object[];
export type ShiftTypePremiumsControllerFindApplicablePremiumsApiArg = {
  /** The staff profile ID */
  staffProfileId: string;
  /** The department ID */
  departmentId: string;
  /** The shift type ID */
  shiftTypeId: string;
};
export type StaffCompensationRatesControllerCreateApiResponse =
  /** status 201 The compensation rate has been successfully created. */ object;
export type StaffCompensationRatesControllerCreateApiArg =
  CreateStaffCompensationRateDto;
export type StaffCompensationRatesControllerFindAllApiResponse =
  /** status 200 Returns all compensation rates that match the query. */ object[];
export type StaffCompensationRatesControllerFindAllApiArg = {
  /** Filter by staff profile ID */
  staffProfileId?: string;
  /** Filter by department ID */
  departmentId?: string;
  /** Filter by payment type */
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY";
  /** Filter by effective date - returns rates effective at the specified date */
  effectiveDate?: string;
  /** Filter active rates only (rates with no end date or end date in the future) */
  active?: boolean;
  /** Include shift type premiums in the response */
  includePremiums?: boolean;
  /** Number of records to skip for pagination */
  skip?: number;
  /** Number of records to take for pagination */
  take?: number;
};
export type StaffCompensationRatesControllerFindOneApiResponse =
  /** status 200 Returns the compensation rate with the given ID. */ object;
export type StaffCompensationRatesControllerFindOneApiArg = {
  /** The compensation rate ID */
  id: string;
  /** Include shift premiums in the response */
  includePremiums?: boolean;
};
export type StaffCompensationRatesControllerUpdateApiResponse =
  /** status 200 The compensation rate has been successfully updated. */ object;
export type StaffCompensationRatesControllerUpdateApiArg = {
  /** The compensation rate ID */
  id: string;
  updateStaffCompensationRateDto: UpdateStaffCompensationRateDto;
};
export type StaffCompensationRatesControllerRemoveApiResponse =
  /** status 200 The compensation rate has been successfully deleted. */ object;
export type StaffCompensationRatesControllerRemoveApiArg =
  /** The compensation rate ID */ string;
export type StaffCompensationRatesControllerFindCurrentRateApiResponse =
  /** status 200 Returns the current effective compensation rate. */ object;
export type StaffCompensationRatesControllerFindCurrentRateApiArg = {
  /** The staff profile ID */
  staffProfileId: string;
  /** The department ID */
  departmentId: string;
};
export type StaffCompensationRatesControllerCalculateShiftPayApiResponse =
  /** status 200 Returns the calculated payment details. */ object;
export type StaffCompensationRatesControllerCalculateShiftPayApiArg = {
  staffProfileId: string;
  departmentId: string;
  shiftTypeId: string;
  hoursWorked: number;
};
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
  /** User address */
  address?: object;
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
  /** User address */
  address?: object;
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
    | "HOSPITAL"
    | "CARE_HOME"
    | "STAFF_PROVIDER"
    | "SOFTWARE_COMPANY"
    | "MANUFACTURING"
    | "EDUCATION"
    | "RETAIL"
    | "LOGISTICS"
    | "CONSTRUCTION"
    | "FINANCIAL"
    | "HOSPITALITY"
    | "HEALTHCARE"
    | "OTHER";
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
  /** Shift type name */
  name: string;
  /** Shift type description */
  startTime?: string;
  /** Shift type description */
  endTime: string;
  /** Whether the shift type is overnight */
  isOvernight?: boolean;
  /** Shift type hours count */
  hoursCount: number;
  /** Shift type base pay multiplier */
  basePayMultiplier?: number;
  /** Shift type description */
  description?: string;
  /** Organization ID */
  organizationId: string;
};
export type UpdateShiftTypeDto = {};
export type CreateShiftScheduleDto = {};
export type BulkCreateShiftScheduleDto = {
  /** Array of shift schedules to be created */
  shifts: CreateShiftScheduleDto[];
};
export type UpdateShiftScheduleDto = {};
export type SwapShiftDto = {};
export type ShiftAttendance = {};
export type CreateShiftAttendanceDto = {};
export type UpdateShiftAttendanceDto = {};
export type PaymentRuleResponseDto = {
  /** Unique identifier for the payment rule */
  id: string;
  /** The ID of the shift type for this payment rule */
  shiftTypeId: string;
  /** The ID of the role for this payment rule */
  roleId: string;
  /** The type of payment */
  paymentType: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  /** The base payment rate */
  baseRate: number;
  /** Additional bonus for specialized skills */
  specialtyBonus: number;
  /** Multiplier applied based on experience level */
  experienceMultiplier: number;
  /** The date when this payment rule becomes effective */
  effectiveDate: string;
  /** The date when this payment rule expires */
  endDate?: string | null;
  /** The ID of the organization this payment rule belongs to */
  organizationId: string;
  /** When the payment rule was created */
  createdAt: string;
  /** When the payment rule was last updated */
  updatedAt: string;
  /** The related shift type details */
  shiftType?: object;
  /** The related role details */
  role?: object;
};
export type CreatePaymentRuleDto = {
  /** The ID of the shift type for this payment rule */
  shiftTypeId: string;
  /** The ID of the role for this payment rule */
  roleId: string;
  /** The type of payment (hourly, weekly, monthly, or per shift) */
  paymentType: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  /** The base payment rate */
  baseRate: number;
  /** Additional bonus for specialized skills (optional) */
  specialtyBonus?: number;
  /** Multiplier applied based on experience level (optional) */
  experienceMultiplier?: number;
  /** The date when this payment rule becomes effective */
  effectiveDate: string;
  /** The date when this payment rule expires (optional) */
  endDate?: string;
  /** The ID of the organization this payment rule belongs to */
  organizationId: string;
};
export type UpdatePaymentRuleDto = {
  /** The ID of the shift type for this payment rule */
  shiftTypeId?: string;
  /** The ID of the role for this payment rule */
  roleId?: string;
  /** The type of payment (hourly, weekly, monthly, or per shift) */
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY" | "PER_SHIFT";
  /** The base payment rate */
  baseRate?: number;
  /** Additional bonus for specialized skills */
  specialtyBonus?: number;
  /** Multiplier applied based on experience level */
  experienceMultiplier?: number;
  /** The date when this payment rule becomes effective */
  effectiveDate?: string;
  /** The date when this payment rule expires */
  endDate?: string | null;
};
export type CreateShiftTypePremiumDto = {
  /** The ID of the shift type this premium applies to */
  shiftTypeId: string;
  /** The ID of the compensation rate this premium applies to */
  compensationRateId: string;
  /** Whether the premium is calculated as a percentage (true) or fixed amount (false) */
  isPremiumPercentage: boolean;
  /** The premium value (percentage or fixed amount) */
  premiumValue: number;
  /** The date when this shift premium becomes effective */
  effectiveDate: string;
  /** The date when this shift premium expires (optional) */
  endDate?: string;
};
export type UpdateShiftTypePremiumDto = {
  /** Whether the premium is calculated as a percentage (true) or fixed amount (false) */
  isPremiumPercentage?: boolean;
  /** The premium value (percentage or fixed amount) */
  premiumValue?: number;
  /** The date when this shift premium becomes effective */
  effectiveDate?: string;
  /** The date when this shift premium expires */
  endDate?: string | null;
};
export type CreateStaffCompensationRateDto = {
  /** The ID of the staff profile this compensation applies to */
  staffProfileId: string;
  /** The ID of the department this compensation applies to */
  departmentId: string;
  /** The base compensation rate amount */
  baseRate: number;
  /** The type of payment (hourly, weekly, or monthly) */
  paymentType: "HOURLY" | "WEEKLY" | "MONTHLY";
  /** Additional bonus for specialized skills (optional) */
  specialtyBonus?: number;
  /** Multiplier applied based on experience level (optional) */
  experienceMultiplier?: number;
  /** The date when this compensation rate becomes effective */
  effectiveDate: string;
  /** The date when this compensation rate expires (optional) */
  endDate?: string;
};
export type UpdateStaffCompensationRateDto = {
  /** The base compensation rate amount */
  baseRate?: number;
  /** The type of payment (hourly, weekly, or monthly) */
  paymentType?: "HOURLY" | "WEEKLY" | "MONTHLY";
  /** Additional bonus for specialized skills */
  specialtyBonus?: number;
  /** Multiplier applied based on experience level */
  experienceMultiplier?: number;
  /** The date when this compensation rate becomes effective */
  effectiveDate?: string;
  /** The date when this compensation rate expires */
  endDate?: string | null;
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
  useShiftTypesControllerCloneShiftTypeMutation,
  useShiftTypesControllerFindByOrganizationQuery,
  useShiftSchedulesControllerCreateMutation,
  useShiftSchedulesControllerFindAllQuery,
  useShiftSchedulesControllerBulkCreateMutation,
  useShiftSchedulesControllerFindOneQuery,
  useShiftSchedulesControllerUpdateMutation,
  useShiftSchedulesControllerRemoveMutation,
  useShiftSchedulesControllerFindByStaffQuery,
  useShiftSchedulesControllerFindByDepartmentQuery,
  useShiftSchedulesControllerSwapShiftsMutation,
  useShiftAttendancesControllerCreateMutation,
  useShiftAttendancesControllerFindAllQuery,
  useShiftAttendancesControllerFindOneQuery,
  useShiftAttendancesControllerUpdateMutation,
  useShiftAttendancesControllerRemoveMutation,
  useShiftAttendancesControllerApproveMutation,
  useShiftAttendancesControllerFindByShiftScheduleQuery,
  useShiftAttendancesControllerClockInMutation,
  useShiftAttendancesControllerClockOutMutation,
  useShiftReportsControllerGetStaffHoursReportQuery,
  useShiftReportsControllerGetDepartmentHoursReportQuery,
  useShiftReportsControllerGetOrganizationCoverageReportQuery,
  useShiftReportsControllerGetOvertimeReportQuery,
  usePaymentRulesControllerCreateMutation,
  usePaymentRulesControllerFindAllQuery,
  usePaymentRulesControllerFindOneQuery,
  usePaymentRulesControllerUpdateMutation,
  usePaymentRulesControllerRemoveMutation,
  usePaymentRulesControllerFindByOrganizationQuery,
  usePaymentRulesControllerFindByRoleQuery,
  usePaymentRulesControllerFindByShiftTypeQuery,
  useShiftTypePremiumsControllerCreateMutation,
  useShiftTypePremiumsControllerFindAllQuery,
  useShiftTypePremiumsControllerFindOneQuery,
  useShiftTypePremiumsControllerUpdateMutation,
  useShiftTypePremiumsControllerRemoveMutation,
  useShiftTypePremiumsControllerFindApplicablePremiumsQuery,
  useStaffCompensationRatesControllerCreateMutation,
  useStaffCompensationRatesControllerFindAllQuery,
  useStaffCompensationRatesControllerFindOneQuery,
  useStaffCompensationRatesControllerUpdateMutation,
  useStaffCompensationRatesControllerRemoveMutation,
  useStaffCompensationRatesControllerFindCurrentRateQuery,
  useStaffCompensationRatesControllerCalculateShiftPayQuery,
} = injectedRtkApi;
