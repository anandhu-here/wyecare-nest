import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  AvailabilityResponse,
  AvailabilityListResponse,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  GetAvailabilityQueryDto,
  SingleDateAvailabilityDto,
  GetAvailableEmployeesQueryDto,
  AvailableEmployeesResponse,
} from '@wyecare-monorepo/shared-types';
import { apiHostname } from '@/config/api';
import { baseApi } from '@/redux/baseApi';

/**
 * RTK Query API for employee availability management
 */
export const employeeAvailabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create or update availability
    createOrUpdateAvailability: builder.mutation<
      AvailabilityResponse,
      CreateAvailabilityDto
    >({
      query: (data) => ({
        url: '/employee-availability',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Availability', 'EmployeeAvailability'],
    }),

    // Get availability for a date range
    getAvailability: builder.query<
      AvailabilityListResponse,
      GetAvailabilityQueryDto
    >({
      query: (params) => ({
        url: '/employee-availability',
        method: 'GET',
        params,
      }),
      providesTags: ['Availability'],
    }),

    // Get current user's availability
    getCurrentUserAvailability: builder.query<
      AvailabilityListResponse,
      Omit<GetAvailabilityQueryDto, 'userId'>
    >({
      query: (params) => ({
        url: '/employee-availability/me',
        method: 'GET',
        params,
      }),
      providesTags: ['Availability'],
    }),

    // Update full availability data
    updateAvailability: builder.mutation<
      AvailabilityResponse,
      UpdateAvailabilityDto
    >({
      query: (data) => ({
        url: '/employee-availability/update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Availability', 'EmployeeAvailability'],
    }),

    // Update single date availability
    updateSingleDateAvailability: builder.mutation<
      AvailabilityResponse,
      SingleDateAvailabilityDto
    >({
      query: (data) => ({
        url: '/employee-availability/date',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Availability', 'EmployeeAvailability'],
    }),

    // Get availability for a specific employee
    getEmployeeAvailability: builder.query<AvailabilityListResponse, string>({
      query: (userId) => ({
        url: `/employee-availability/employee/${userId}`,
        method: 'GET',
      }),
      providesTags: (result, error, userId) => [
        { type: 'EmployeeAvailability', id: userId },
      ],
    }),

    // Delete an availability record
    deleteAvailability: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/employee-availability/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Availability', 'EmployeeAvailability'],
    }),

    // Get available employees for a specific date and shift
    getAvailableEmployees: builder.query<
      AvailableEmployeesResponse,
      GetAvailableEmployeesQueryDto
    >({
      query: (params) => ({
        url: '/employee-availability/available',
        method: 'GET',
        params,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateOrUpdateAvailabilityMutation,
  useGetAvailabilityQuery,
  useGetCurrentUserAvailabilityQuery,
  useUpdateAvailabilityMutation,
  useUpdateSingleDateAvailabilityMutation,
  useGetEmployeeAvailabilityQuery,
  useDeleteAvailabilityMutation,
  useGetAvailableEmployeesQuery,
} = employeeAvailabilityApi;
