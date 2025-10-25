import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

export const backupApi = createApi({
  reducerPath: 'backupApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/backup/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['BackupRecovery'],
  endpoints: (builder) => ({
    // Database Backup
    createDatabaseBackup: builder.mutation<{
      success: boolean
      backup_name: string
      backup_path: string
      backup_size: number
      backup_checksum: string
      created_at: string
      backup_type: string
    }, {
      backup_name?: string
    }>({
      query: (data) => ({
        url: 'create_database_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    restoreDatabaseBackup: builder.mutation<{
      success: boolean
      backup_name: string
      restored_at: string
      backup_type: string
    }, {
      backup_name: string
    }>({
      query: (data) => ({
        url: 'restore_database_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Filesystem Backup
    createFilesystemBackup: builder.mutation<{
      success: boolean
      backup_name: string
      backup_path: string
      backup_size: number
      backup_checksum: string
      created_at: string
      backup_type: string
      include_media: boolean
    }, {
      backup_name?: string
      include_media?: boolean
    }>({
      query: (data) => ({
        url: 'create_filesystem_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    restoreFilesystemBackup: builder.mutation<{
      success: boolean
      backup_name: string
      restored_at: string
      backup_type: string
    }, {
      backup_name: string
    }>({
      query: (data) => ({
        url: 'restore_filesystem_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Complete Backup
    createCompleteBackup: builder.mutation<{
      success: boolean
      backup_name: string
      database_backup: string
      filesystem_backup: string
      total_size: number
      created_at: string
      backup_type: string
    }, {
      backup_name?: string
    }>({
      query: (data) => ({
        url: 'create_complete_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    restoreCompleteBackup: builder.mutation<{
      success: boolean
      backup_name: string
      restored_at: string
      backup_type: string
    }, {
      backup_name: string
    }>({
      query: (data) => ({
        url: 'restore_complete_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Backup Management
    listBackups: builder.query<{
      success: boolean
      backups: Array<{
        backup_name: string
        backup_type: string
        backup_size: number
        created_at: string
        status: string
        backup_file: string
      }>
      total_count: number
      filtered_by?: string
    }, {
      backup_type?: string
    }>({
      query: (params) => ({
        url: 'list_backups/',
        params,
      }),
    }),
    deleteBackup: builder.mutation<{
      success: boolean
      backup_name: string
      deleted_files: string[]
      deleted_at: string
    }, {
      backup_name: string
    }>({
      query: (data) => ({
        url: 'delete_backup/',
        method: 'DELETE',
        body: data,
      }),
    }),
    cleanupOldBackups: builder.mutation<{
      success: boolean
      deleted_backups: string[]
      deleted_count: number
      cleanup_date: string
    }, void>({
      query: () => ({
        url: 'cleanup_old_backups/',
        method: 'POST',
      }),
    }),
    
    // Cloud Storage
    uploadToCloud: builder.mutation<{
      success: boolean
      backup_name: string
      uploaded_files: string[]
      bucket: string
      uploaded_at: string
    }, {
      backup_name: string
      cloud_provider?: string
    }>({
      query: (data) => ({
        url: 'upload_to_cloud/',
        method: 'POST',
        body: data,
      }),
    }),
    downloadFromCloud: builder.mutation<{
      success: boolean
      backup_name: string
      downloaded_files: string[]
      downloaded_at: string
    }, {
      backup_name: string
      cloud_provider?: string
    }>({
      query: (data) => ({
        url: 'download_from_cloud/',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Backup Scheduling
    scheduleBackup: builder.mutation<{
      success: boolean
      schedule_id: number
      backup_type: string
      schedule_time: string
      scheduled_at: string
    }, {
      backup_type: string
      schedule_time: string
      backup_name?: string
    }>({
      query: (data) => ({
        url: 'schedule_backup/',
        method: 'POST',
        body: data,
      }),
    }),
    getBackupSchedule: builder.query<{
      success: boolean
      schedules: Array<{
        backup_type: string
        schedule_time: string
        backup_name?: string
        created_at: string
        status: string
      }>
      total_count: number
    }, void>({
      query: () => ({
        url: 'get_backup_schedule/',
      }),
    }),
    
    // Backup Analytics
    getBackupAnalytics: builder.query<{
      success: boolean
      analytics: {
        total_backups: number
        total_size: number
        total_size_mb: number
        by_type: {
          [key: string]: {
            count: number
            size: number
          }
        }
        recent_backups: number
        backup_frequency: number
        retention_days: number
        max_backups: number
        backup_dir: string
      }
      generated_at: string
    }, void>({
      query: () => ({
        url: 'get_backup_analytics/',
      }),
    }),
  }),
})

export const {
  useCreateDatabaseBackupMutation,
  useRestoreDatabaseBackupMutation,
  useCreateFilesystemBackupMutation,
  useRestoreFilesystemBackupMutation,
  useCreateCompleteBackupMutation,
  useRestoreCompleteBackupMutation,
  useListBackupsQuery,
  useDeleteBackupMutation,
  useCleanupOldBackupsMutation,
  useUploadToCloudMutation,
  useDownloadFromCloudMutation,
  useScheduleBackupMutation,
  useGetBackupScheduleQuery,
  useGetBackupAnalyticsQuery,
} = backupApi
