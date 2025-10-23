import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit' 
import type { User } from '@/types' 

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; access: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.access
      state.isAuthenticated = true
      localStorage.setItem('access_token', action.payload.access)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
