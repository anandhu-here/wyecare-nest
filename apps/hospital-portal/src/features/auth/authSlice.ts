import { createSlice, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { Organization } from '@/lib/types';
import { generatedApi } from '../generatedApi';

// Define the auth state interface
export interface AuthState {
  token: string | null;
  user: any | null;
  currentOrganization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  currentOrganization: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set auth error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Set the user
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    // Set the token
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },

    // Logout - clear the auth state
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle pending API calls
      .addMatcher(
        isAnyOf(
          generatedApi.endpoints.authControllerLogin.matchPending,
          generatedApi.endpoints.authControllerGetProfile.matchPending
        ),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )

      //check profile error and set authentication state accordingly

      .addMatcher(
        generatedApi.endpoints.authControllerGetProfile.matchRejected,
        (state, action) => {
          console.log('Profile error:', action.error);
          if (action.payload?.status === 401) {
            console.log('Unauthorized access, logging out...');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
          }
        }
      )

      // Handle successful login
      .addMatcher(
        generatedApi.endpoints.authControllerLogin.matchFulfilled,
        (state, { payload }) => {
          console.log('Login payload:', payload);
          state.token = payload.access_token;
          state.isAuthenticated = true;
          state.isLoading = false;
          localStorage.setItem('token', payload.access_token);

          // If user data is included in the response
          if (payload.user) {
            state.user = payload.user;
          }

          console.log(payload.user);
        }
      )

      // Handle successful profile fetch
      .addMatcher(
        generatedApi.endpoints.authControllerGetProfile.matchFulfilled,
        (state, { payload }) => {
          console.log('Profile payload:', payload);
          state.user = payload;
          state.currentOrganization = payload.currentOrganization;
          state.isAuthenticated = true;
          state.isLoading = false;
        }
      )

      // Handle API failures
      .addMatcher(
        isAnyOf(
          generatedApi.endpoints.authControllerLogin.matchRejected,
          generatedApi.endpoints.authControllerGetProfile.matchRejected
        ),
        (state, action) => {
          state.isLoading = false;

          // Handle 401 Unauthorized - clear auth state
          if (action.payload?.status === 401) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
          }

          // Set error message
          const errorMessage =
            action.payload?.data?.message ||
            action.error?.message ||
            'Authentication failed';
          state.error = errorMessage;
        }
      );
  },
});

// Export actions
export const { setLoading, setError, setUser, setToken, logout, clearError } =
  authSlice.actions;

// Export selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectToken = (state: RootState) => state.auth.token;

export const selectCurrentOrganization = (state: RootState) =>
  state.auth.currentOrganization;

// Export reducer
export default authSlice.reducer;
