// src/redux/slices/timeFramesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimeFramesState {
  selectedMonth: number | null;
  selectedYear: number | null;
  selectedDay: number | null;
  selectedWeek: number | null; // Week of year
  startDate: string | null; // ISO string
  endDate: string | null; // ISO string
}

const currentDate = new Date();

const initialState: TimeFramesState = {
  selectedMonth: currentDate.getMonth() + 1, // 1-based month (January = 1)
  selectedYear: currentDate.getFullYear(),
  selectedDay: currentDate.getDate(),
  selectedWeek: null,
  startDate: null,
  endDate: null,
};

const timeFramesSlice = createSlice({
  name: 'timeFrames',
  initialState,
  reducers: {
    setSelectedMonth: (state, action: PayloadAction<number>) => {
      state.selectedMonth = action.payload;
    },
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
    setSelectedDay: (state, action: PayloadAction<number>) => {
      state.selectedDay = action.payload;
    },
    setSelectedWeek: (state, action: PayloadAction<number>) => {
      state.selectedWeek = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      const { startDate, endDate } = action.payload;
      state.startDate = startDate;
      state.endDate = endDate;
    },
    resetTimeFrames: (state) => {
      const today = new Date();
      state.selectedMonth = today.getMonth() + 1;
      state.selectedYear = today.getFullYear();
      state.selectedDay = today.getDate();
      state.selectedWeek = null;
      state.startDate = null;
      state.endDate = null;
    },
  },
});

export const {
  setSelectedMonth,
  setSelectedYear,
  setSelectedDay,
  setSelectedWeek,
  setDateRange,
  resetTimeFrames,
} = timeFramesSlice.actions;

export default timeFramesSlice.reducer;

// Selectors
export const selectSelectedMonth = (state: { timeFrames: TimeFramesState }) =>
  state.timeFrames.selectedMonth;

export const selectSelectedYear = (state: { timeFrames: TimeFramesState }) =>
  state.timeFrames.selectedYear;

export const selectSelectedDay = (state: { timeFrames: TimeFramesState }) =>
  state.timeFrames.selectedDay;

export const selectSelectedWeek = (state: { timeFrames: TimeFramesState }) =>
  state.timeFrames.selectedWeek;

export const selectDateRange = (state: { timeFrames: TimeFramesState }) => ({
  startDate: state.timeFrames.startDate,
  endDate: state.timeFrames.endDate,
});

// Computed selectors
export const selectFullDate = (state: { timeFrames: TimeFramesState }) => {
  const { selectedDay, selectedMonth, selectedYear } = state.timeFrames;

  if (!selectedDay || !selectedMonth || !selectedYear) {
    return null;
  }

  // Create a Date object (month is 0-indexed in JavaScript)
  const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
  return date;
};

export const selectDateString = (state: { timeFrames: TimeFramesState }) => {
  const date = selectFullDate(state);
  if (!date) return '';

  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};
