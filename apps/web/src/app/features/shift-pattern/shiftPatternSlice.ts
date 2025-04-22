// src/redux/slices/shiftPatternsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IShiftPattern } from '@wyecare-monorepo/shared-types';
import { shiftPatternsApi } from './shiftPatternsApi';

interface ShiftPatternsState {
  currentShiftPattern: IShiftPattern | null;
  selectedCareHomeId: string | null;
  selectedStaffType: string | null;
  isEmergencyRate: boolean;
  filterOptions: {
    searchTerm: string;
    staffTypes: string[];
    timeRanges: string[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: ShiftPatternsState = {
  currentShiftPattern: null,
  selectedCareHomeId: null,
  selectedStaffType: null,
  isEmergencyRate: false,
  filterOptions: {
    searchTerm: '',
    staffTypes: [],
    timeRanges: [],
  },
  loading: false,
  error: null,
};

const shiftPatternsSlice = createSlice({
  name: 'shiftPatterns',
  initialState,
  reducers: {
    setCurrentShiftPattern: (
      state,
      action: PayloadAction<IShiftPattern | null>
    ) => {
      state.currentShiftPattern = action.payload;
    },
    setSelectedCareHomeId: (state, action: PayloadAction<string | null>) => {
      state.selectedCareHomeId = action.payload;
    },
    setSelectedStaffType: (state, action: PayloadAction<string | null>) => {
      state.selectedStaffType = action.payload;
    },
    toggleEmergencyRate: (state) => {
      state.isEmergencyRate = !state.isEmergencyRate;
    },
    setEmergencyRate: (state, action: PayloadAction<boolean>) => {
      state.isEmergencyRate = action.payload;
    },
    setFilterSearchTerm: (state, action: PayloadAction<string>) => {
      state.filterOptions.searchTerm = action.payload;
    },
    setFilterStaffTypes: (state, action: PayloadAction<string[]>) => {
      state.filterOptions.staffTypes = action.payload;
    },
    addFilterStaffType: (state, action: PayloadAction<string>) => {
      if (!state.filterOptions.staffTypes.includes(action.payload)) {
        state.filterOptions.staffTypes.push(action.payload);
      }
    },
    removeFilterStaffType: (state, action: PayloadAction<string>) => {
      state.filterOptions.staffTypes = state.filterOptions.staffTypes.filter(
        (type) => type !== action.payload
      );
    },
    setFilterTimeRanges: (state, action: PayloadAction<string[]>) => {
      state.filterOptions.timeRanges = action.payload;
    },
    resetFilters: (state) => {
      state.filterOptions = initialState.filterOptions;
    },
    clearShiftPatternState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle get shift pattern by ID
      .addMatcher(
        shiftPatternsApi.endpoints.getShiftPattern.matchFulfilled,
        (state, { payload }) => {
          state.currentShiftPattern = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.getShiftPattern.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to load shift pattern';
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.getShiftPattern.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      // Handle create shift pattern
      .addMatcher(
        shiftPatternsApi.endpoints.createShiftPattern.matchFulfilled,
        (state, { payload }) => {
          state.currentShiftPattern = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.createShiftPattern.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to create shift pattern';
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.createShiftPattern.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      // Handle create agency shift pattern
      .addMatcher(
        shiftPatternsApi.endpoints.createAgencyShiftPattern.matchFulfilled,
        (state, { payload }) => {
          state.currentShiftPattern = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.createAgencyShiftPattern.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to create agency shift pattern';
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.createAgencyShiftPattern.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      // Handle update shift pattern
      .addMatcher(
        shiftPatternsApi.endpoints.updateShiftPattern.matchFulfilled,
        (state, { payload }) => {
          state.currentShiftPattern = payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.updateShiftPattern.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error =
            payload?.data?.message || 'Failed to update shift pattern';
        }
      )
      .addMatcher(
        shiftPatternsApi.endpoints.updateShiftPattern.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      );
  },
});

export const {
  setCurrentShiftPattern,
  setSelectedCareHomeId,
  setSelectedStaffType,
  toggleEmergencyRate,
  setEmergencyRate,
  setFilterSearchTerm,
  setFilterStaffTypes,
  addFilterStaffType,
  removeFilterStaffType,
  setFilterTimeRanges,
  resetFilters,
  clearShiftPatternState,
} = shiftPatternsSlice.actions;

export default shiftPatternsSlice.reducer;

// Selectors
export const selectCurrentShiftPattern = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.currentShiftPattern;
export const selectSelectedCareHomeId = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.selectedCareHomeId;
export const selectSelectedStaffType = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.selectedStaffType;
export const selectIsEmergencyRate = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.isEmergencyRate;
export const selectShiftPatternFilterOptions = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.filterOptions;
export const selectShiftPatternLoading = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.loading;
export const selectShiftPatternError = (state: {
  shiftPatterns: ShiftPatternsState;
}) => state.shiftPatterns.error;

// Computed selectors
export const selectCurrentShiftPatternTimings = (state: {
  shiftPatterns: ShiftPatternsState;
}) => {
  const pattern = state.shiftPatterns.currentShiftPattern;
  const careHomeId = state.shiftPatterns.selectedCareHomeId;

  if (!pattern || !pattern.timings) return null;

  if (careHomeId) {
    return (
      pattern.timings.find((timing) => timing.careHomeId === careHomeId) || null
    );
  }

  return pattern.timings[0] || null;
};

export const selectCurrentShiftPatternRates = (state: {
  shiftPatterns: ShiftPatternsState;
}) => {
  const pattern = state.shiftPatterns.currentShiftPattern;
  const careHomeId = state.shiftPatterns.selectedCareHomeId;
  const staffType = state.shiftPatterns.selectedStaffType;

  if (!pattern || !pattern.rates) return null;

  let filteredRates = pattern.rates;

  if (careHomeId) {
    filteredRates = filteredRates.filter(
      (rate) => rate.careHomeId === careHomeId
    );
  }

  if (staffType) {
    filteredRates = filteredRates.filter((rate) => rate.userType === staffType);
  }

  return filteredRates.length > 0 ? filteredRates : null;
};

export const selectCurrentUserTypeRates = (state: {
  shiftPatterns: ShiftPatternsState;
}) => {
  const pattern = state.shiftPatterns.currentShiftPattern;
  const staffType = state.shiftPatterns.selectedStaffType;

  if (!pattern || !pattern.userTypeRates) return null;

  if (staffType) {
    return (
      pattern.userTypeRates.find((rate) => rate.userType === staffType) || null
    );
  }

  return pattern.userTypeRates[0] || null;
};
