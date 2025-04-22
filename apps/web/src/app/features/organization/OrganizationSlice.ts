// src/redux/slices/organizationSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { organizationApi } from './organizationApi';
import { IOrganization } from '@wyecare-monorepo/shared-types';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode?: string;
  email?: string;
}

interface StaffInvitation {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationId: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  invitedBy: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationState {
  currentOrganization: IOrganization | null;
  staffInvitations: {
    invitations: StaffInvitation[];
    total: number;
  };
  staff: any[];
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  currentOrganization: null,
  staffInvitations: {
    invitations: [],
    total: 0,
  },
  staff: [],
  loading: false,
  error: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<IOrganization>) => {
      state.currentOrganization = action.payload as any;
    },
    clearOrganizationData: (state) => {
      state.currentOrganization = null;
      state.staffInvitations = {
        invitations: [],
        total: 0,
      };
      state.staff = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get organization handlers
      .addMatcher(
        organizationApi.endpoints.getOrganization.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        organizationApi.endpoints.getOrganization.matchFulfilled,
        (state, { payload }) => {
          state.loading = false;
          state.currentOrganization = payload.data;
        }
      )
      .addMatcher(
        organizationApi.endpoints.getOrganization.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to fetch organization';
        }
      )

      // Create organization handlers
      .addMatcher(
        organizationApi.endpoints.createOrganization.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        organizationApi.endpoints.createOrganization.matchFulfilled,
        (state, { payload }) => {
          state.loading = false;
          state.currentOrganization = payload.data;
        }
      )
      .addMatcher(
        organizationApi.endpoints.createOrganization.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to create organization';
        }
      )

      // Update organization handlers
      .addMatcher(
        organizationApi.endpoints.updateOrganization.matchFulfilled,
        (state, { payload }) => {
          state.currentOrganization = payload.data;
        }
      )

      // Staff invitations handlers
      .addMatcher(
        organizationApi.endpoints.getStaffInvitations.matchFulfilled,
        (state, { payload }) => {
          state.staffInvitations = payload;
        }
      )

      // Organization staff handlers
      .addMatcher(
        organizationApi.endpoints.getOrganizationStaff.matchFulfilled,
        (state, { payload }) => {
          state.staff = payload.staff;
        }
      )
      .addMatcher(
        organizationApi.endpoints.getAdminStaff.matchFulfilled,
        (state, { payload }) => {
          // Handle admin staff if needed
        }
      )
      .addMatcher(
        organizationApi.endpoints.getCareStaff.matchFulfilled,
        (state, { payload }) => {
          // Handle care staff if needed
        }
      );
  },
});

export const { setCurrentOrganization, clearOrganizationData } =
  organizationSlice.actions;

export default organizationSlice.reducer;

// Selectors
export const selectCurrentOrganization = (state: {
  organization: OrganizationState;
}) => state.organization.currentOrganization;
export const selectStaffInvitations = (state: {
  organization: OrganizationState;
}) => state.organization.staffInvitations;
export const selectOrganizationStaff = (state: {
  organization: OrganizationState;
}) => state.organization.staff;
export const selectOrganizationLoading = (state: {
  organization: OrganizationState;
}) => state.organization.loading;
export const selectOrganizationError = (state: {
  organization: OrganizationState;
}) => state.organization.error;
