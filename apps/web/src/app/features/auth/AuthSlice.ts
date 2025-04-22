// src/redux/slices/authSlice.ts
import { IOrganization, IUser } from '@wyecare-monorepo/shared-types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from './authApi';
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: Partial<IUser> | null;
  currentOrganization: IOrganization | null;
  permissions: string[];
  redirectUrl: string | null;
  organizationRoles: any[] | null;
  pendingJoinRequest: any | null;
  staffType: string | null;
  unReadNotificationCount: number;
  totalOrgRoles: number;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  user: null,
  currentOrganization: null,
  permissions: [],
  redirectUrl: null,
  organizationRoles: null,
  pendingJoinRequest: null,
  staffType: null,
  unReadNotificationCount: 0,
  totalOrgRoles: 0,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        user: { id: string; email: string; role: string };
      }>
    ) => {
      const { token, user } = action.payload;
      state.isAuthenticated = true;
      state.token = token;
      state.user = {
        _id: user.id,
        email: user.email,
        role: user.role,
      } as any;
      localStorage.setItem('token', token);
    },
    clearCredentials: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.currentOrganization = null;
      state.permissions = [];
      state.redirectUrl = null;
      state.organizationRoles = null;
      state.pendingJoinRequest = null;
      state.staffType = null;
      localStorage.removeItem('token');
    },
    setUserProfile: (state, action: PayloadAction<any>) => {
      const {
        user,
        currentOrganization,
        permissions,
        redirectUrl,
        organizationRoles,
        pendingJoinRequest,
        staffType,
        unReadNotificationCount,
        totalOrgRoles,
      } = action.payload;

      state.user = user;
      state.currentOrganization = currentOrganization;
      state.permissions = permissions || [];
      state.redirectUrl = redirectUrl;
      state.organizationRoles = organizationRoles;
      state.pendingJoinRequest = pendingJoinRequest;
      state.staffType = staffType;
      state.unReadNotificationCount = unReadNotificationCount || 0;
      state.totalOrgRoles = totalOrgRoles || 0;
      state.isAuthenticated = true;
    },
    updateOrganization: (state, action: PayloadAction<IOrganization>) => {
      state.currentOrganization = action.payload as any;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login mutation
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          console.log('Login payload:', payload);
          state.isAuthenticated = true;
          state.token = payload.token;
          state.user = {
            _id: payload.user.id,
            email: payload.user.email,
            role: payload.user.role,
          } as any;
          localStorage.setItem('token', payload.token);
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        authApi.endpoints.login.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Authentication failed';
        }
      )
      .addMatcher(authApi.endpoints.login.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Handle profile query
      .addMatcher(
        authApi.endpoints.profile.matchFulfilled,
        (state, { payload }) => {
          const {
            user,
            currentOrganization,
            permissions,
            redirectUrl,
            organizationRoles,
            pendingJoinRequest,
            staffType,
            unReadNotificationCount,
            totalOrgRoles,
          } = payload;

          state.user = user;
          state.currentOrganization = currentOrganization;
          state.permissions = permissions || [];
          state.redirectUrl = redirectUrl;
          state.organizationRoles = organizationRoles;
          state.pendingJoinRequest = pendingJoinRequest;
          state.staffType = staffType;
          state.unReadNotificationCount = unReadNotificationCount || 0;
          state.totalOrgRoles = totalOrgRoles || 0;
          state.isAuthenticated = true;
          state.loading = false;
        }
      )
      .addMatcher(
        authApi.endpoints.profile.matchRejected,
        (state, { payload }) => {
          // If unauthorized, clear auth state
          if (payload?.status === 401) {
            state.isAuthenticated = false;
            state.token = null;
            state.user = null;
            state.currentOrganization = null;
            state.permissions = [];
            localStorage.removeItem('token');
          }
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to load profile';
        }
      )
      .addMatcher(authApi.endpoints.profile.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Handle logout on all 401 errors from any endpoint
      .addMatcher(
        (action) => action.error?.status === 401,
        (state) => {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          state.currentOrganization = null;
          state.permissions = [];
          state.redirectUrl = null;
          state.organizationRoles = null;
          state.pendingJoinRequest = null;
          state.staffType = null;
          localStorage.removeItem('token');
        }
      );
  },
});

export const {
  setCredentials,
  clearCredentials,
  setUserProfile,
  updateOrganization,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state?.auth?.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state?.auth?.token;
export const selectUser = (state: { auth: AuthState }) => state?.auth?.user;
export const selectCurrentOrganization = (state: { auth: AuthState }) =>
  state?.auth?.currentOrganization;
export const selectPermissions = (state: { auth: AuthState }) =>
  state?.auth?.permissions;
export const selectRedirectUrl = (state: { auth: AuthState }) =>
  state?.auth?.redirectUrl;
export const selectHasPermission =
  (permission: string) => (state: { auth: AuthState }) =>
    state?.auth?.permissions.includes(permission);
export const selectIsOrganizationAdmin = (state: { auth: AuthState }) =>
  state?.auth?.permissions.some((p) =>
    ['delete_organization', 'edit_organization'].includes(p)
  );
export const selectStaffType = (state: { auth: AuthState }) =>
  state?.auth?.staffType;
export const selectUnreadNotificationCount = (state: { auth: AuthState }) =>
  state?.auth?.unReadNotificationCount;
