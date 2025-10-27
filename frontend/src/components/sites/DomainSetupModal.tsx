import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useGetCloudflareTokensQuery } from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'

// interface CloudflareToken {
//   id: number
//   name: string
//   token: string
//   account_id: string
//   sites: string[]
// }

interface DomainSetupModalProps {
  open: boolean
  onClose: () => void
  onContinue: (tokenId: number, nameservers: string[]) => void
  domain: string
}

const DomainSetupModal = ({ open, onClose, onContinue, domain }: DomainSetupModalProps) => {
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [nameservers, setNameservers] = useState<string[]>([])
  const [loadingNameservers, setLoadingNameservers] = useState(false)
  const [domainVerified, setDomainVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const { data: tokens, isLoading: tokensLoading } = useGetCloudflareTokensQuery()

  const selectedToken = tokens?.find(token => token.id === selectedTokenId)

  const handleTokenSelect = async (tokenId: number) => {
    setSelectedTokenId(tokenId)
    setLoadingNameservers(true)
    setVerificationError(null)
    
    try {
      // Get nameservers for the domain using the selected token
      const response = await fetch(`/api/integrations/cloudflare-tokens/${tokenId}/get_nameservers/?domain=${domain}`)
      const data = await response.json()
      
      if (response.ok) {
        setNameservers(data.nameservers || [])
        setDomainVerified(true)
      } else {
        setVerificationError(data.error || 'Failed to get nameservers')
        setDomainVerified(false)
      }
    } catch {
      setVerificationError('Failed to verify domain')
      setDomainVerified(false)
    } finally {
      setLoadingNameservers(false)
    }
  }

  const handleCopyNameserver = (nameserver: string) => {
    navigator.clipboard.writeText(nameserver)
    toast.success('Nameserver copied to clipboard')
  }

  const handleCopyAllNameservers = () => {
    const nameserverList = nameservers.join('\n')
    navigator.clipboard.writeText(nameserverList)
    toast.success('All nameservers copied to clipboard')
  }

  const handleContinue = () => {
    if (selectedTokenId && nameservers.length > 0) {
      onContinue(selectedTokenId, nameservers)
      onClose()
    }
  }

  const handleRefresh = () => {
    if (selectedTokenId) {
      handleTokenSelect(selectedTokenId)
    }
  }

  const canContinue = selectedTokenId && nameservers.length > 0 && domainVerified

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Setup Domain: {domain}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a Cloudflare token to manage this domain. The system will retrieve the nameservers 
            that need to be configured at your domain registrar.
          </Typography>
        </Box>

        {tokensLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Available Cloudflare Tokens
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Token Name</TableCell>
                    <TableCell>Account ID</TableCell>
                    <TableCell>Associated Sites</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens?.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTokenId === token.id}
                          onChange={() => handleTokenSelect(token.id)}
                        />
                      </TableCell>
                      <TableCell>{token.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {token.account_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {token.sites?.slice(0, 3).map((site, index) => (
                            <Chip 
                              key={index} 
                              label={site} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                          {token.sites?.length > 3 && (
                            <Chip 
                              label={`+${token.sites.length - 3} more`} 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {selectedTokenId === token.id ? (
                          loadingNameservers ? (
                            <CircularProgress size={20} />
                          ) : domainVerified ? (
                            <CheckIcon color="success" />
                          ) : verificationError ? (
                            <ErrorIcon color="error" />
                          ) : null
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {verificationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {verificationError}
                <Button 
                  size="small" 
                  onClick={handleRefresh}
                  sx={{ ml: 1 }}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
              </Alert>
            )}

            {selectedToken && nameservers.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Nameservers for {domain}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyAllNameservers}
                  >
                    Copy All
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Configure these nameservers at your domain registrar to complete the setup:
                  </Typography>
                </Alert>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nameserver</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nameservers.map((nameserver, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {nameserver}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Copy nameserver">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyNameserver(nameserver)}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Important:</strong> After configuring the nameservers at your registrar, 
                    it may take up to 24 hours for the changes to propagate. You can continue with 
                    site creation now, but the domain may not be accessible until DNS propagation is complete.
                  </Typography>
                </Alert>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!canContinue}
          startIcon={canContinue ? <CheckIcon /> : null}
        >
          Continue Creation
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DomainSetupModal
