import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material'
import {
  useGetPromptsQuery, useDeletePromptMutation,
  useTestPromptMutation
} from '@/store/api/aiApi'
import toast from 'react-hot-toast'

const PromptsPage = () => {
  const navigate = useNavigate()
  const { data: prompts, isLoading } = useGetPromptsQuery({})
  const [deletePrompt] = useDeletePromptMutation()
  const [testPrompt, { data: testResult, isLoading: isTesting }] = useTestPromptMutation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null)
  const [testInput, setTestInput] = useState('')
  
  if (isLoading) return <CircularProgress />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">AI Prompts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/prompts/create')}
        >New Prompt</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Block Type</TableCell>
              <TableCell>AI Model</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts?.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.type_display || p.type}</TableCell>
                <TableCell>{p.block_type || '-'}</TableCell>
                <TableCell>{p.ai_model}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => {
                    setSelectedPromptId(p.id)
                    setDialogOpen(true)
                  }}>
                    <TestIcon />
                  </IconButton>
                  <IconButton onClick={() => navigate(`/prompts/${p.id}/edit`)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => deletePrompt(p.id).then(() => toast.success('Deleted'))}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Test Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Test Prompt</DialogTitle>
        <DialogContent>
          <TextField
            label="Input"
            fullWidth
            multiline
            rows={4}
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
          />
          {isTesting && <CircularProgress sx={{ mt:2 }} />}
          {testResult?.content && (
            <Paper sx={{ p:2, mt:2, bgcolor: 'grey.100' }}>
              <Typography>{testResult.content}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button onClick={() => {
            if (selectedPromptId) testPrompt({ id: selectedPromptId, input: testInput })
          }} variant="contained">Run</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PromptsPage
