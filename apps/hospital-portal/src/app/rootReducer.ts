import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { api } from '../features/api';

// Combine all reducers into a single root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  // Add the API reducer to the store
  [api.reducerPath]: api.reducer,
});

export default rootReducer;
