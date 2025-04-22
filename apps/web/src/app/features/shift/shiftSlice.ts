// src/redux/slices/shiftsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IShift, IShiftAssignment } from '@wyecare-monorepo/shared-types';
import { shiftsApi } from './shiftApi';

interface FilterOptions {
  startDate: string | null;
  endDate: string | null;
  status: string[];
  searchTerm: string;
  homeId: string | null;
  agencyId: string | null;
  staffType: string | null;
  emergency: boolean | null;
}

interface ShiftsState {
  currentShift: IShift | null;
  selectedDate: string | null;
  selectedHomeId: string | null;
  selectedAgencyId: string | null;
  currentAssignments: IShiftAssignment[] | null;
  filterOptions: FilterOptions;
  calendarView: 'month' | 'week' | 'day';
  loading: boolean;
  error: string | null;
}

const initialState: ShiftsState = {
  currentShift: null,
  selectedDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  selectedHomeId: null,
  selectedAgencyId: null,
  currentAssignments: null,
  filterOptions: {
    startDate: null,
    endDate: null,
    status: [],
    searchTerm: '',
    homeId: null,
    agencyId: null,
    staffType: null,
    emergency: null,
  },
  calendarView: 'month',
  loading: false,
  error: null,
};

const shiftsSlice = createSlice({
  name: 'shifts',
  initialState,
  reducers: {
    setCurrentShift: (state, action: PayloadAction<IShift | null>) => {
      state.currentShift = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedHomeId: (state, action: PayloadAction<string | null>) => {
      state.selectedHomeId = action.payload;
    },
    setSelectedAgencyId: (state, action: PayloadAction<string | null>) => {
      state.selectedAgencyId = action.payload;
    },
    setCurrentAssignments: (
      state,
      action: PayloadAction<IShiftAssignment[] | null>
    ) => {
      state.currentAssignments = action.payload;
    },
    setCalendarView: (
      state,
      action: PayloadAction<'month' | 'week' | 'day'>
    ) => {
      state.calendarView = action.payload;
    },
    setFilterStartDate: (state, action: PayloadAction<string | null>) => {
      state.filterOptions.startDate = action.payload;
    },
    setFilterEndDate: (state, action: PayloadAction<string | null>) => {
      state.filterOptions.endDate = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string[]>) => {
      state.filterOptions.status = action.payload;
    },
    addFilterStatus: (state, action: PayloadAction<string>) => {
      if (!state.filterOptions.status.includes(action.payload)) {
        state.filterOptions.status.push(action.payload);
      }
    },
    removeFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterOptions.status = state.filterOptions.status.filter(
        (status) => status !== action.payload
      );
    },
    setFilterSearchTerm: (state, action: PayloadAction<string>) => {
      state.filterOptions.searchTerm = action.payload;
    },
    setFilterHomeId: (state, action: PayloadAction<string | null>) => {
      state.filterOptions.homeId = action.payload;
    },
    setFilterAgencyId: (state, action: PayloadAction<string | null>) => {
      state.filterOptions.agencyId = action.payload;
    },
    setFilterStaffType: (state, action: PayloadAction<string | null>) => {
      state.filterOptions.staffType = action.payload;
    },
    setFilterEmergency: (state, action: PayloadAction<boolean | null>) => {
      state.filterOptions.emergency = action.payload;
    },
    resetFilters: (state) => {
      state.filterOptions = initialState.filterOptions;
    },
    clearShiftState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle get shift by ID
      .addMatcher(
        shiftsApi.endpoints.getShift.matchFulfilled,
        (state, { payload }) => {
          state.currentShift = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.getShift.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to load shift';
        }
      )
      .addMatcher(shiftsApi.endpoints.getShift.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Handle get shift assignments for current shift
      .addMatcher(
        shiftsApi.endpoints.getShiftAssignments.matchFulfilled,
        (state, { payload }) => {
          state.currentAssignments = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.getShiftAssignments.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to load shift assignments';
        }
      )
      .addMatcher(
        shiftsApi.endpoints.getShiftAssignments.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      // Handle shift creation
      .addMatcher(
        shiftsApi.endpoints.createShift.matchFulfilled,
        (state, { payload }) => {
          state.currentShift = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.createShift.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to create shift';
        }
      )
      .addMatcher(shiftsApi.endpoints.createShift.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Handle shift update
      .addMatcher(
        shiftsApi.endpoints.updateShift.matchFulfilled,
        (state, { payload }) => {
          state.currentShift = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.updateShift.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to update shift';
        }
      )
      .addMatcher(shiftsApi.endpoints.updateShift.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Handle shift acceptance/rejection
      .addMatcher(
        shiftsApi.endpoints.acceptShift.matchFulfilled,
        (state, { payload }) => {
          state.currentShift = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.rejectShift.matchFulfilled,
        (state, { payload }) => {
          state.currentShift = payload;
          state.loading = false;
          state.error = null;
        }
      )

      // Handle shift assignment creation
      .addMatcher(
        shiftsApi.endpoints.createShiftAssignment.matchFulfilled,
        (state) => {
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftsApi.endpoints.createShiftAssignment.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to create assignment';
        }
      )
      .addMatcher(
        shiftsApi.endpoints.createShiftAssignment.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      );
  },
});

export const {
  setCurrentShift,
  setSelectedDate,
  setSelectedHomeId,
  setSelectedAgencyId,
  setCurrentAssignments,
  setCalendarView,
  setFilterStartDate,
  setFilterEndDate,
  setFilterStatus,
  addFilterStatus,
  removeFilterStatus,
  setFilterSearchTerm,
  setFilterHomeId,
  setFilterAgencyId,
  setFilterStaffType,
  setFilterEmergency,
  resetFilters,
  clearShiftState,
} = shiftsSlice.actions;

export default shiftsSlice.reducer;

// Selectors
export const selectCurrentShift = (state: { shifts: ShiftsState }) =>
  state.shifts.currentShift;
export const selectSelectedDate = (state: { shifts: ShiftsState }) =>
  state.shifts.selectedDate;
export const selectSelectedHomeId = (state: { shifts: ShiftsState }) =>
  state.shifts.selectedHomeId;
export const selectSelectedAgencyId = (state: { shifts: ShiftsState }) =>
  state.shifts.selectedAgencyId;
export const selectCurrentAssignments = (state: { shifts: ShiftsState }) =>
  state.shifts.currentAssignments;
export const selectCalendarView = (state: { shifts: ShiftsState }) =>
  state.shifts.calendarView;
export const selectShiftFilterOptions = (state: { shifts: ShiftsState }) =>
  state.shifts.filterOptions;
export const selectShiftLoading = (state: { shifts: ShiftsState }) =>
  state.shifts.loading;
export const selectShiftError = (state: { shifts: ShiftsState }) =>
  state.shifts.error;

// Computed selectors
export const selectIsCurrentShiftEmergency = (state: { shifts: ShiftsState }) =>
  state.shifts.currentShift?.emergency ||
  state.shifts.currentShift?.isEmergency ||
  false;

export const selectAssignmentStatus = (
  state: { shifts: ShiftsState },
  userId: string
) => {
  const assignments = state.shifts.currentAssignments;
  if (!assignments || !userId) return null;

  const userAssignment = assignments.find(
    (assignment) => assignment.user.toString() === userId
  );
  return userAssignment ? userAssignment.status : null;
};
