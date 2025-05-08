import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../app/store';

// Define the base URL for API requests
const API_BASE_URL = import.meta.env.NX_API_URL || 'http://localhost:3333/api';

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

// Create the base API with authentication headers
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers, { getState }) => {
      // Get the token from the auth state
      const token = await localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');

      return headers;
    },
  }),
  // Define tags for cache invalidation
  tagTypes: [
    ...addTagTypes,
    'User',
    'Users',
    'Role',
    'Roles',
    'Organization',
    'Organizations',
    'Patient',
    'Patients',
    'Department',
    'Departments',
    'Permission',
    'Permissions',
    'Invitation',
    'Invitations',
    'StaffProfile',
    'ShiftType',
    'ShiftSchedule',
    'ShiftAttendance',
    'PayPeriod',
    'StaffPayment',
  ],
  // The endpoints will be injected in the specific API files
  endpoints: () => ({}),
});

// Export the middleware to be included in the store
export const apiMiddleware = api.middleware;
