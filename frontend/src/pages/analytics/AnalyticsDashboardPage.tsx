import { useState } from 'react'
import { Box, Typography, Paper, TextField, Button, CircularProgress } from '@mui/material'
import { Bar } from 'react-chartjs-2'
import { formatDate } from '@/utils/formatDate'
import { useGetSiteAnalyticsQuery } from '@/store/api/analyticsApi'

const AnalyticsDashboardPage = () => {
  const [params, setParams] = useState({ site: '', start: '', end: '' })
  const { data, isLoading } = useGetSiteAnalyticsQuery({
    site_id: params.site ? Number(params.site) : undefined
  })

  const chartData = {
    labels: data?.map(d => d.date ? formatDate(d.date, 'MMM dd') : '') || [],
    datasets: [{ label: 'Page Views', data: data?.map(d => d.page_views) || [], backgroundColor: '#3f51b5' }]
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Analytics Dashboard</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Site ID"
          value={params.site}
          onChange={e => setParams({...params, site: e.target.value})}
          size="small"
        />
        <TextField
          label="Start Date"
          type="date"
          value={params.start}
          onChange={e => setParams({...params, start: e.target.value})}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End Date"
          type="date"
          value={params.end}
          onChange={e => setParams({...params, end: e.target.value})}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Button variant="contained" onClick={() => {/* triggers refetch */}}>Filter</Button>
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ p: 3 }}>
          <Bar data={chartData} />
        </Paper>
      )}
    </Box>
  )
}

export default AnalyticsDashboardPage
