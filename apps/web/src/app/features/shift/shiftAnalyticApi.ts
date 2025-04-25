import { baseApi } from '@/redux/baseApi';

export const shiftDataAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get analytics based on user role
    getAnalyticsByRole: builder.query({
      query: (dateRange) => {
        // Serialize dates before they enter the Redux store
        const serializedParams = {
          startDate: dateRange?.startDate ? dateRange.startDate : undefined,
          endDate: dateRange?.endDate ? dateRange.endDate : undefined,
        };

        return {
          url: 'shift-analytics',
          method: 'GET',
          params: serializedParams,
        };
      },

      providesTags: ['Analytics'],
    }),

    // Staff analytics endpoint
    getStaffAnalytics: builder.query({
      query: (dateRange) => ({
        url: 'shift-analytics/staff',
        method: 'GET',
        params: {
          startDate: dateRange?.startDate?.toISOString(),
          endDate: dateRange?.endDate?.toISOString(),
        },
      }),
      providesTags: ['StaffAnalytics'],
    }),

    // Agency analytics endpoint
    getAgencyAnalytics: builder.query({
      query: (dateRange) => ({
        url: 'shift-analytics/agency',
        method: 'GET',
        params: {
          startDate: dateRange?.startDate?.toISOString(),
          endDate: dateRange?.endDate?.toISOString(),
        },
      }),
      providesTags: ['AgencyAnalytics'],
    }),

    // Care home analytics endpoint
    getCareHomeAnalytics: builder.query({
      query: (dateRange) => ({
        url: 'shift-analytics/care-home',
        method: 'GET',
        params: {
          startDate: dateRange?.startDate?.toISOString(),
          endDate: dateRange?.endDate?.toISOString(),
        },
      }),
      providesTags: ['CareHomeAnalytics'],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetAnalyticsByRoleQuery,
  useLazyGetAnalyticsByRoleQuery,
  useGetStaffAnalyticsQuery,
  useLazyGetStaffAnalyticsQuery,
  useGetAgencyAnalyticsQuery,
  useLazyGetAgencyAnalyticsQuery,
  useGetCareHomeAnalyticsQuery,
  useLazyGetCareHomeAnalyticsQuery,
} = shiftDataAnalyticsApi;
