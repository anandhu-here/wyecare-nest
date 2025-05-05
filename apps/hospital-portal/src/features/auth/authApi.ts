import { api } from '../api';
import { setToken, setUser, logout, setError } from './authSlice';

// This file will be extended once we generate the RTK Query API
// It will use the endpoints from the generated API, but add custom behavior

// Create a custom API slice for auth-related endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // After successful login, set the token and user in the store
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Store token
          dispatch(setToken(data.accessToken));

          // Fetch user profile with the token
          // This will be replaced with the generated API call
          const userResponse = await fetch(
            'http://localhost:3000/api/auth/profile',
            {
              headers: {
                Authorization: `Bearer ${data.accessToken}`,
              },
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            dispatch(setUser(userData));
          }
        } catch (error: any) {
          dispatch(setError(error.message || 'Login failed'));
        }
      },
    }),

    // Get current user profile
    getProfile: builder.query({
      query: () => '/auth/profile',
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch (error: any) {
          // If unauthorized, log out
          if (error.status === 401) {
            dispatch(logout());
          }
        }
      },
    }),

    // Logout endpoint
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      // After successful logout, clear the auth state
      async onQueryStarted(_, { dispatch }) {
        dispatch(logout());
      },
    }),
  }),
  overrideExisting: false,
});

// Export the generated hooks
export const { useLoginMutation, useGetProfileQuery, useLogoutMutation } =
  authApi;
