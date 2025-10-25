import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

export const securityApi = createApi({
  reducerPath: 'securityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/security/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['SecurityAccessControl'],
  endpoints: (builder) => ({
    // Password Validation
    validatePassword: builder.mutation<{
      success: boolean
      score: number
      strength_level: string
      feedback: string[]
      is_valid: boolean
    }, {
      password: string
    }>({
      query: (data) => ({
        url: 'validate_password/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // User Management
    createUser: builder.mutation<{
      success: boolean
      user_id: number
      username: string
      email: string
      verification_required: boolean
      created_at: string
    }, {
      username: string
      email: string
      password: string
      first_name?: string
      last_name?: string
      is_staff?: boolean
    }>({
      query: (data) => ({
        url: 'create_user/',
        method: 'POST',
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<{
      success: boolean
      user_id: number
      username: string
      email: string
      verified_at: string
    }, {
      verification_token: string
    }>({
      query: (data) => ({
        url: 'verify_email/',
        method: 'POST',
        body: data,
      }),
    }),
    authenticate: builder.mutation<{
      success: boolean
      user_id: number
      username: string
      email: string
      session_token: string
      is_staff: boolean
      last_login: string
    }, {
      username: string
      password: string
    }>({
      query: (data) => ({
        url: 'authenticate/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Role-Based Access Control
    assignRole: builder.mutation<{
      success: boolean
      user_id: number
      username: string
      role: string
      site_id?: number
      assigned_at: string
    }, {
      user_id: number
      role: string
      site_id?: number
    }>({
      query: (data) => ({
        url: 'assign_role/',
        method: 'POST',
        body: data,
      }),
    }),
    checkPermission: builder.query<{
      success: boolean
      user_id: number
      username: string
      permission: string
      site_id?: number
      role: string
      has_permission: boolean
      checked_at: string
    }, {
      user_id: number
      permission: string
      site_id?: number
    }>({
      query: (params) => ({
        url: 'check_permission/',
        params,
      }),
    }),
    
    // Security Monitoring
    getSecurityEvents: builder.query<{
      success: boolean
      events: Array<{
        id: number
        event_type: string
        user_id?: number
        username?: string
        ip_address: string
        user_agent: string
        timestamp: string
        site_id?: number
        details: string
      }>
      total_count: number
      filtered_by: {
        user_id?: number
        site_id?: number
      }
      retrieved_at: string
    }, {
      user_id?: number
      site_id?: number
      limit?: number
    }>({
      query: (params) => ({
        url: 'get_security_events/',
        params,
      }),
    }),
    detectThreats: builder.query<{
      success: boolean
      threats: Array<{
        type: string
        severity: string
        description: string
        recommendation: string
      }>
      threat_count: number
      high_severity: number
      medium_severity: number
      low_severity: number
      analyzed_at: string
    }, void>({
      query: () => ({
        url: 'detect_threats/',
      }),
    }),
    
    // Data Encryption
    encryptData: builder.mutation<{
      success: boolean
      encrypted_data: string
      encryption_method: string
      encrypted_at: string
    }, {
      data: string
      key?: string
    }>({
      query: (data) => ({
        url: 'encrypt_data/',
        method: 'POST',
        body: data,
      }),
    }),
    decryptData: builder.mutation<{
      success: boolean
      decrypted_data: string
      decryption_method: string
      decrypted_at: string
    }, {
      encrypted_data: string
      key?: string
    }>({
      query: (data) => ({
        url: 'decrypt_data/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Compliance Management
    getComplianceStatus: builder.query<{
      success: boolean
      site_id: number
      site_domain: string
      compliance: {
        gdpr: {
          compliant: boolean
          score: number
          issues: string[]
          recommendations: string[]
        }
        ccpa: {
          compliant: boolean
          score: number
          issues: string[]
          recommendations: string[]
        }
        security: {
          compliant: boolean
          score: number
          issues: string[]
          recommendations: string[]
        }
      }
      overall_score: number
      checked_at: string
    }, {
      site_id: number
    }>({
      query: (params) => ({
        url: 'get_compliance_status/',
        params,
      }),
    }),
  }),
})

export const {
  useValidatePasswordMutation,
  useCreateUserMutation,
  useVerifyEmailMutation,
  useAuthenticateMutation,
  useAssignRoleMutation,
  useCheckPermissionQuery,
  useGetSecurityEventsQuery,
  useDetectThreatsQuery,
  useEncryptDataMutation,
  useDecryptDataMutation,
  useGetComplianceStatusQuery,
} = securityApi
