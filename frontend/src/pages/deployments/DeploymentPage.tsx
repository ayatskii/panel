import { useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Button, CircularProgress, Dialog, DialogTitle, DialogContent } from '@mui/material'
import { useGetDeploymentsQuery, useTriggerDeploymentMutation, useGetDeploymentLogsQuery } from '@/store/api/deploymentsApi'
import toast from 'react-hot-toast'

const DeploymentsPage = () => {
  const { data: deps, isLoading } = useGetDeploymentsQuery({})
  const [trigger] = useTriggerDeploymentMutation()
  const [logsOpen, setLogsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (isLoading) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Deployments</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Site</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deps?.map(d => (
              <TableRow key={d.id} hover>
                <TableCell>{d.site_brand_name}</TableCell>
                <TableCell>{d.status}</TableCell>
                <TableCell>
                  {d.url ? <a href={d.url} target="_blank">{d.url}</a> : '—'}
                </TableCell>
                <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedId(d.id)
                      setLogsOpen(true)
                    }}
                  >Logs</Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      trigger(d.id).unwrap().then(() => toast.success('Deployment triggered'))
                    }}
                  >Deploy</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Logs Dialog */}
      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Deployment Logs</DialogTitle>
        <DialogContent>
          {selectedId && (
            <Logs id={selectedId} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

const Logs = ({ id }: { id: number }) => {
  const { data, isLoading, error } = useGetDeploymentLogsQuery(id)

  if (isLoading) return <CircularProgress />
  
  if (error) return <Typography color="error">Failed to load logs</Typography>

  // Ensure logs is an array before calling join
  const logs = data?.logs || []
  const logText = Array.isArray(logs) ? logs.join('\n') : 'No logs available'

  return (
    <Box component="pre" sx={{ maxHeight: 400, overflow: 'auto' }}>
      {logText}
    </Box>
  )
}

export default DeploymentsPage
