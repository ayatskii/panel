import { useState } from 'react'
import {
  Box,
  Chip,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material'
import { useGetTagsQuery } from '@/store/api/mediaApi'
import type { MediaTag } from '@/types'

interface MediaTagSelectorProps {
  selectedTags: MediaTag[]
  onChange: (tags: MediaTag[]) => void
  label?: string
  size?: 'small' | 'medium'
}

const MediaTagSelector = ({ 
  selectedTags, 
  onChange, 
  label = 'Tags',
  size = 'small' 
}: MediaTagSelectorProps) => {
  const { data: allTags, isLoading } = useGetTagsQuery()

  return (
    <Box>
      <Autocomplete
        multiple
        size={size}
        options={allTags || []}
        value={selectedTags}
        onChange={(_event, newValue) => {
          onChange(newValue)
        }}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Select tags..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.name}
              size="small"
              sx={{
                bgcolor: option.color,
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                  },
                },
              }}
            />
          ))
        }
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Chip
              label={option.name}
              size="small"
              sx={{
                bgcolor: option.color,
                color: 'white',
                fontWeight: 'bold',
                mr: 1,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              ({option.media_count} files)
            </Typography>
          </Box>
        )}
      />
    </Box>
  )
}

export default MediaTagSelector

