import { format } from 'date-fns';
import {
  Invoice as IInvoice,
  ShiftSummaryItem,
  InvoiceStatus,
  IProcessedTimesheet,
  IShiftSummary,
  IInvoiceCalculationResponse,
  GetInvoicesParams,
  ICalculateInvoiceParams,
  ICreateInvoiceParams,
  IUpdateInvoiceStatusParams,
} from '@wyecare-monorepo/shared-types';
import { baseApi } from '@/redux/baseApi';

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create invoice
    createInvoice: builder.mutation<IInvoice, ICreateInvoiceParams>({
      query: (data) => ({
        url: 'invoices',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoices', 'Timesheets'],
    }),

    deleteinvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoices'],
    }),

    getInvoices: builder.query<
      { items: IInvoice[]; total: number; page: number; limit: number },
      GetInvoicesParams
    >({
      query: (params) => ({
        url: '/invoices',
        method: 'GET',
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          status: params?.status,
          search: params?.search,
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      }),
      providesTags: ['Invoices'],
    }),

    getInvoiceById: builder.query<IInvoice, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: ['Invoices'],
    }),

    updateInvoiceStatus: builder.mutation<IInvoice, IUpdateInvoiceStatusParams>(
      {
        query: ({ invoiceId, status }) => ({
          url: `/invoices/${invoiceId}/status`,
          method: 'PATCH',
          body: { status },
        }),
        invalidatesTags: ['Invoices'],
      }
    ),

    calculateInvoice: builder.query<
      IInvoiceCalculationResponse,
      ICalculateInvoiceParams & { holidays?: Date[] }
    >({
      query: ({ homeId, startDate, endDate, holidays }) => ({
        url: 'invoices/calculate',
        params: {
          homeId,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          holidays: holidays
            ?.map((date) => format(date, 'yyyy-MM-dd'))
            .join(','),
        },
      }),
      providesTags: ['Invoices'],
    }),
  }),
});

export const {
  useCreateInvoiceMutation,
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useLazyGetInvoiceByIdQuery,
  useUpdateInvoiceStatusMutation,
  useCalculateInvoiceQuery,
  useLazyCalculateInvoiceQuery,
  useDeleteinvoiceMutation,
} = invoicesApi;
