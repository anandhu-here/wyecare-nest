// src/redux/api/employeeApplicationApi.ts
import { baseApi } from '@/redux/baseApi';
import {
  IEmployeeApplication,
  CreateEmployeeApplicationRequest,
  UpdateEmployeeApplicationRequest,
  SubmitEmployeeApplicationRequest,
  GetEmployeeApplicationsResponse,
  GetEmployeeApplicationByIdResponse,
  UpdateApplicationStatusRequest,
  AddQualificationRequest,
  UpdateQualificationRequest,
  AddTrainingRequest,
  UpdateTrainingRequest,
  AddWorkExperienceRequest,
  UpdateWorkExperienceRequest,
  AddReferenceRequest,
  UpdateReferenceRequest,
  AddLanguageRequest,
  UpdateLanguageRequest,
  AddCareSkillRequest,
  UpdateCareSkillRequest,
} from '@wyecare-monorepo/shared-types';

export const employeeApplicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get employee application (with optional carerId for admin users)
    getEmployeeApplication: builder.query<any, { carerId?: string }>({
      query: ({ carerId }) => {
        let url = 'employee-applications';
        if (carerId) {
          url += `?carerId=${carerId}`;
        }
        return url;
      },
      providesTags: ['EmployeeApplication'],
    }),

    // Get agency application
    getAgencyApplication: builder.query<
      any,
      { carerId: string; agencyOrgId: string }
    >({
      query: ({ carerId, agencyOrgId }) =>
        `employee-applications/agency-application?carerId=${carerId}&agencyOrgId=${agencyOrgId}`,
      providesTags: ['EmployeeApplication'],
    }),

    // Create or update application
    createOrUpdateApplication: builder.mutation<any, any>({
      query: (data) => ({
        url: 'employee-applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Update a section of the application
    updateSection: builder.mutation<
      any,
      {
        section: string;
        data: any;
        index?: number;
        carerId?: string;
      }
    >({
      query: ({ section, data, index, carerId }) => {
        let url = `employee-applications/${section}`;
        if (index !== undefined) {
          url += `/${index}`;
        } else {
          url += `/${null}`;
        }
        if (carerId) {
          url += `?carerId=${carerId}`;
        }
        return {
          url,
          method: 'PATCH',
          body: { data },
        };
      },
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Add item to an array in the application
    addToArray: builder.mutation<any, { arrayField: string; item: any }>({
      query: ({ arrayField, item }) => ({
        url: `employee-applications/${arrayField}`,
        method: 'POST',
        body: { item },
      }),
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Remove item from array in the application
    removeFromArray: builder.mutation<
      any,
      {
        arrayField: string;
        index: number;
        carerId?: string;
      }
    >({
      query: ({ arrayField, index, carerId }) => {
        let url = `employee-applications/${arrayField}/${index}`;
        if (carerId) {
          url += `?carerId=${carerId}`;
        }
        return {
          url,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Delete a document
    deleteDocument: builder.mutation<
      any,
      {
        section: string;
        index?: number;
        side?: 'front' | 'back';
        carerId?: string;
      }
    >({
      query: ({ section, index, side, carerId }) => {
        let url = `employee-applications/document/${section}`;
        if (index !== undefined) {
          url += `/${index}`;
        }
        let queryParams = [];
        if (side) {
          queryParams.push(`side=${side}`);
        }
        if (carerId) {
          queryParams.push(`carerId=${carerId}`);
        }
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        return {
          url,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Upload a document
    uploadDocument: builder.mutation<
      any,
      {
        file: File;
        section: string;
        documentType?: string;
        index?: number;
        side?: 'front' | 'back';
        carerId?: string;
      }
    >({
      query: ({ file, section, documentType, index, side, carerId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);
        if (documentType) {
          formData.append('documentType', documentType);
        }
        if (index !== undefined) {
          formData.append('index', index.toString());
        }
        if (side) {
          formData.append('side', side);
        }

        let url = 'employee-applications/upload-document';
        if (carerId) {
          url += `?carerId=${carerId}`;
        }

        return {
          url,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Upload multiple documents
    uploadDocuments: builder.mutation<
      any,
      { files: Record<string, File>; formData: any }
    >({
      query: ({ files, formData }) => {
        const uploadFormData = new FormData();

        // Append each file with its field name
        Object.keys(files).forEach((fieldName) => {
          uploadFormData.append(fieldName, files[fieldName]);
        });

        // Append other form data
        Object.keys(formData).forEach((key) => {
          uploadFormData.append(key, formData[key]);
        });

        return {
          url: 'employee-applications/upload-documents',
          method: 'POST',
          body: uploadFormData,
          formData: true,
        };
      },
      invalidatesTags: ['EmployeeApplication'],
    }),

    // Submit application
    submitApplication: builder.mutation<any, void>({
      query: () => ({
        url: 'employee-applications/submit',
        method: 'POST',
      }),
      invalidatesTags: ['EmployeeApplication', 'ApplicationStatus'],
    }),

    // Get application status
    getApplicationStatus: builder.query<any, { userId?: string }>({
      query: ({ userId }) => {
        let url = 'employee-applications/status';
        if (userId) {
          url += `?userId=${userId}`;
        }
        return url;
      },
      providesTags: ['ApplicationStatus'],
    }),
  }),
});

// Export hooks
export const {
  useGetEmployeeApplicationQuery,
  useGetAgencyApplicationQuery,
  useCreateOrUpdateApplicationMutation,
  useUpdateSectionMutation,
  useAddToArrayMutation,
  useRemoveFromArrayMutation,
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
  useUploadDocumentsMutation,
  useSubmitApplicationMutation,
  useGetApplicationStatusQuery,
} = employeeApplicationApi;
