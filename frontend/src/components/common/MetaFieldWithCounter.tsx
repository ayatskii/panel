import { useState, useEffect } from 'react'
import {
  TextField,
  Box,
  Typography,
  LinearProgress,
  Chip,
  TextFieldProps,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

interface MetaFieldWithCounterProps {
  label: string
  value: string
  onChange: (value: string) => void
  minLength: number
  maxLength: number
  helperText?: string
  multiline?: boolean
  rows?: number
  placeholder?: string
  required?: boolean
}

const MetaFieldWithCounter = ({
  label,
  value,
  onChange,
  minLength,
  maxLength,
  helperText,
  multiline = false,
  rows = 1,
  placeholder,
  required = false,
}: MetaFieldWithCounterProps) => {
  const [length, setLength] = useState(value?.length || 0)

  useEffect(() => {
    setLength(value?.length || 0)
  }, [value])

  const getStatus = () => {
    if (length === 0) return 'empty'
    if (length < minLength) return 'too-short'
    if (length > maxLength) return 'too-long'
    return 'good'
  }

  const getStatusColor = () => {
    const status = getStatus()
    if (status === 'good') return 'success'
    if (status === 'too-long') return 'error'
    if (status === 'too-short') return 'warning'
    return 'default'
  }

  const getStatusIcon = () => {
    const status = getStatus()
    if (status === 'good') return <CheckIcon fontSize="small" />
    if (status === 'too-long') return <ErrorIcon fontSize="small" />
    if (status === 'too-short') return <WarningIcon fontSize="small" />
    return null
  }

  const getStatusMessage = () => {
    const status = getStatus()
    if (status === 'empty') return 'Field is empty'
    if (status === 'too-short') return `Too short (min ${minLength} characters)`
    if (status === 'too-long') return `Too long (max ${maxLength} characters)`
    return 'Optimal length'
  }

  const getProgressValue = () => {
    if (length === 0) return 0
    const percentage = (length / maxLength) * 100
    return Math.min(percentage, 100)
  }

  const getProgressColor = (): 'success' | 'warning' | 'error' => {
    const status = getStatus()
    if (status === 'good') return 'success'
    if (status === 'too-long') return 'error'
    return 'warning'
  }

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        multiline={multiline}
        rows={rows}
        fullWidth
        placeholder={placeholder}
        required={required}
        error={getStatus() === 'too-long'}
        helperText={helperText}
      />

      {/* Character Counter & Status */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {length} / {maxLength} characters
          </Typography>
          <Chip
            icon={getStatusIcon()}
            label={getStatusMessage()}
            size="small"
            color={getStatusColor()}
            variant={getStatus() === 'good' ? 'filled' : 'outlined'}
          />
        </Box>

        {length >= minLength && length <= maxLength && (
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
            ✓ SEO Optimal
          </Typography>
        )}
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={getProgressValue()}
        color={getProgressColor()}
        sx={{ mt: 1, height: 6, borderRadius: 1 }}
      />

      {/* Length Guidance */}
      {length > 0 && (
        <Box sx={{ mt: 1 }}>
          {length < minLength && (
            <Typography variant="caption" color="warning.main">
              Add {minLength - length} more characters for better SEO
            </Typography>
          )}
          {length > maxLength && (
            <Typography variant="caption" color="error.main">
              Remove {length - maxLength} characters to avoid truncation in search results
            </Typography>
          )}
          {length >= minLength && length <= maxLength && (
            <Typography variant="caption" color="success.main">
              Perfect length for search engines! This will display well in search results.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default MetaFieldWithCounter

