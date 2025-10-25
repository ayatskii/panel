import { useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Autocomplete,
} from '@mui/material'
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useGetTagsQuery } from '@/store/api/mediaApi'

export interface MediaFilters {
  search?: string
  type?: 'image' | 'video' | 'document' | ''
  tags?: number[]
  minSize?: number // MB
  maxSize?: number // MB
  dateFrom?: Date | null
  dateTo?: Date | null
  minWidth?: number
  minHeight?: number
}

interface AdvancedFiltersProps {
  open: boolean
  onClose: () => void
  filters: MediaFilters
  onChange: (filters: MediaFilters) => void
  onApply: () => void
  onClear: () => void
}

const AdvancedFilters = ({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onClear,
}: AdvancedFiltersProps) => {
  const { data: tags } = useGetTagsQuery()
  const [localFilters, setLocalFilters] = useState<MediaFilters>(filters)

  const handleChange = (key: keyof MediaFilters, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleApply = () => {
    onChange(localFilters)
    onApply()
    onClose()
  }

  const handleClear = () => {
    const emptyFilters: MediaFilters = {
      search: '',
      type: '',
      tags: [],
      minSize: undefined,
      maxSize: undefined,
      dateFrom: null,
      dateTo: null,
      minWidth: undefined,
      minHeight: undefined,
    }
    setLocalFilters(emptyFilters)
    onChange(emptyFilters)
    onClear()
  }

  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'tags') return Array.isArray(value) && value.length > 0
    if (key === 'type') return value && value !== ''
    return value !== undefined && value !== null && value !== ''
  }).length

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, p: 3 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">Advanced Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Search */}
        <TextField
          label="Search"
          fullWidth
          value={localFilters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search by filename, alt text..."
          helperText="Search in filenames and descriptions"
        />

        <Divider />

        {/* File Type */}
        <FormControl fullWidth>
          <InputLabel>File Type</InputLabel>
          <Select
            value={localFilters.type || ''}
            label="File Type"
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="video">Videos</MenuItem>
            <MenuItem value="document">Documents</MenuItem>
          </Select>
        </FormControl>

        <Divider />

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tags
          </Typography>
          <Autocomplete
            multiple
            options={tags || []}
            value={tags?.filter(t => localFilters.tags?.includes(t.id)) || []}
            onChange={(_, newValue) => {
              handleChange('tags', newValue.map(t => t.id))
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select tags..." size="small" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{
                    bgcolor: option.color,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              ))
            }
          />
        </Box>

        <Divider />

        {/* Date Range */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Upload Date Range
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DatePicker
                label="From Date"
                value={localFilters.dateFrom}
                onChange={(date) => handleChange('dateFrom', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <DatePicker
                label="To Date"
                value={localFilters.dateTo}
                onChange={(date) => handleChange('dateTo', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
          </Box>
        </LocalizationProvider>

        <Divider />

        {/* File Size Range */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            File Size (MB)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={localFilters.minSize || ''}
              onChange={(e) => handleChange('minSize', e.target.value ? Number(e.target.value) : undefined)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              value={localFilters.maxSize || ''}
              onChange={(e) => handleChange('maxSize', e.target.value ? Number(e.target.value) : undefined)}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Image Dimensions (for images only) */}
        {(localFilters.type === 'image' || !localFilters.type) && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Minimum Dimensions (px)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Min Width"
                  type="number"
                  size="small"
                  value={localFilters.minWidth || ''}
                  onChange={(e) => handleChange('minWidth', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ flex: 1 }}
                  placeholder="e.g. 1920"
                />
                <TextField
                  label="Min Height"
                  type="number"
                  size="small"
                  value={localFilters.minHeight || ''}
                  onChange={(e) => handleChange('minHeight', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ flex: 1 }}
                  placeholder="e.g. 1080"
                />
              </Box>
            </Box>
            <Divider />
          </>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClear}
          startIcon={<ClearIcon />}
          fullWidth
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          fullWidth
        >
          Apply Filters
        </Button>
      </Box>
    </Drawer>
  )
}

export default AdvancedFilters

