import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiHostname } from '../config/api';

const shiftTags = [
  'ShiftPatterns',
  'ShiftPattern',
  'OtherShiftPatterns',
  'Shifts',
  'Shift',
  'ShiftsByDate',
  'HomeShifts',
  'AgencyShifts',
  'ShiftAssignments',
  'ShiftAssignment',
  'UserAssignments',
];

// Create a wrapper for the base query
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${apiHostname}/api/v1`,
  prepareHeaders: async (headers, { getState }) => {
    const token = await localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Create an error handling wrapper
const baseQueryWithErrorHandler = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  const result: any = await baseQueryWithAuth(args, api, extraOptions);

  if (result?.error) {
    console.error('Error:', result);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandler,
  endpoints: () => ({}),
});

// Export types if needed
export type BaseApiType = typeof baseApi;
