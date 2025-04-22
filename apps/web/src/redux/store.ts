import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import authReducer from '../app/features/auth/AuthSlice';
import organizationReducer from '../app/features/organization/OrganizationSlice';
import timeFrameReducer from '../app/features/shift/calendarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    organization: organizationReducer,
    timeFrames: timeFrameReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

store.dispatch({ type: 'app/initialized' });
