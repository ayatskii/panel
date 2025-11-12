import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Radio,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Domain as DomainIcon,
  Cloud as CloudIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import { useGetAvailableCloudflareTokensQuery, useGetNameserversQuery } from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'

interface TokenSelectionModalProps {
  open: boolean
  onClose: () => void
  onTokenSelected: (tokenId: number, tokenName: string) => void
  selectedDomain?: string
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  open,
  onClose,
  onTokenSelected,
  selectedDomain,
}) => {
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [selectedTokenName, setSelectedTokenName] = useState<string>('')

  const { data: tokens, isLoading, error } = useGetAvailableCloudflareTokensQuery()
  const { data: nameserversData } = useGetNameserversQuery(
    { domain: selectedDomain || '', token_id: selectedTokenId || 0 },
    { skip: !selectedDomain || !selectedTokenId }
  )

  const handleTokenSelect = (tokenId: number, tokenName: string) => {
    setSelectedTokenId(tokenId)
    setSelectedTokenName(tokenName)
  }

  const handleConfirm = () => {
    if (selectedTokenId && selectedTokenName) {
      onTokenSelected(selectedTokenId, selectedTokenName)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedTokenId(null)
    setSelectedTokenName('')
    onClose()
  }

  if (isLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Select Cloudflare Token</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Select Cloudflare Token</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Failed to load Cloudflare tokens. Please try again.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudIcon />
          <Typography variant="h6">Select Cloudflare Token</Typography>
        </Box>
        {selectedDomain && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            For domain: <strong>{selectedDomain}</strong>
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a Cloudflare token to use for this site. The token will be used for DNS management and Pages deployment.
        </Typography>

        {tokens && tokens.length === 0 ? (
          <Alert severity="warning">
            No Cloudflare tokens are available. Please configure a Cloudflare token in Settings first.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Select</TableCell>
                  <TableCell>Token Name</TableCell>
                  <TableCell>Account ID</TableCell>
                  <TableCell>Zone ID</TableCell>
                  <TableCell>Associated Sites</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens?.map((token) => (
                  <TableRow key={token.id} hover>
                    <TableCell padding="checkbox">
                      <Radio
                        checked={selectedTokenId === token.id}
                        onChange={() => handleTokenSelect(token.id, token.name)}
                        value={token.id}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{token.name}</Typography>
                        {token.account_id && (
                          <Typography variant="caption" color="text.secondary">
                            Account: {token.account_id}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {token.account_id || 'Not set'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {token.zone_id || 'Not set'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip
                          label={`${token.site_count || 0} site${(token.site_count || 0) !== 1 ? 's' : ''}`}
                          size="small"
                          color={(token.site_count || 0) > 0 ? 'primary' : 'default'}
                        />
                        {token.sites && token.sites.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {token.sites.map((site: { id: number; domain?: string; brand_name?: string; deployed_at?: string }) => (
                              <Box
                                key={site.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  py: 0.25,
                                }}
                              >
                                <DomainIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ flex: 1 }}
                                >
                                  {site.domain || site.brand_name}
                                </Typography>
                                {site.deployed_at && (
                                  <Chip
                                    label="Deployed"
                                    size="small"
                                    color="success"
                                    sx={{ height: 16, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        {(!token.sites || token.sites.length === 0) && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No sites yet
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {token.is_available ? (
                          <>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2" color="success.main">
                              Available
                            </Typography>
                          </>
                        ) : (
                          <>
                            <CancelIcon color="error" fontSize="small" />
                            <Typography variant="body2" color="error.main">
                              Inactive
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {selectedTokenId && selectedDomain && nameserversData?.success && nameserversData.nameservers && nameserversData.nameservers.length > 0 && (
        <DialogContent>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Nameservers for {selectedDomain}:
              </Typography>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={() => {
                  const allNs = nameserversData.nameservers.join('\n')
                  navigator.clipboard.writeText(allNs)
                  toast.success('All nameservers copied to clipboard')
                }}
              >
                Copy All
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Update your domain's nameservers to these Cloudflare nameservers:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {nameserversData.nameservers.map((ns, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'white',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      flex: 1,
                    }}
                  >
                    {ns}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(ns)
                      toast.success(`Copied: ${ns}`)
                    }}
                    sx={{ ml: 2 }}
                  >
                    Copy
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedTokenId}
        >
          Continue with Selected Token
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TokenSelectionModal
