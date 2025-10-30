import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import { apiSlice } from './api/apiSlice'
import { analyticsApi } from './api/analyticsApi'
import { performanceApi } from './api/performanceApi'
import { securityApi } from './api/securityApi'
import { backupApi } from './api/backupApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [performanceApi.reducerPath]: performanceApi.reducer,
    [securityApi.reducerPath]: securityApi.reducer,
    [backupApi.reducerPath]: backupApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      analyticsApi.middleware,
      performanceApi.middleware,
      securityApi.middleware,
      backupApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
