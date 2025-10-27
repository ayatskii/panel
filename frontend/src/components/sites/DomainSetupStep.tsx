import React, { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Domain as DomainIcon,
  Cloud as CloudIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import TokenSelectionModal from './TokenSelectionModal'
import type { SiteFormData } from '@/types'

interface DomainSetupStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

interface NSRecord {
  name: string
  type: string
  content: string
  ttl: number
}

const DomainSetupStep: React.FC<DomainSetupStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [nsRecords, setNsRecords] = useState<NSRecord[]>([])
  const [isValidatingDomain, setIsValidatingDomain] = useState(false)
  const [domainValidationError, setDomainValidationError] = useState<string>('')
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)

  const handleDomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const domain = event.target.value
    onChange({ domain })
    setDomainValidationError('')
  }

  const handleValidateDomain = async () => {
    if (!data.domain) return

    setIsValidatingDomain(true)
    setDomainValidationError('')

    try {
      // TODO: Implement domain validation API call
      // This would check if domain is available and get NS records
      
      // Mock implementation for now
      setTimeout(() => {
        const mockNsRecords: NSRecord[] = [
          { name: 'ns1.cloudflare.com', type: 'NS', content: 'ns1.cloudflare.com', ttl: 3600 },
          { name: 'ns2.cloudflare.com', type: 'NS', content: 'ns2.cloudflare.com', ttl: 3600 },
        ]
        setNsRecords(mockNsRecords)
        setIsValidatingDomain(false)
      }, 1500)
    } catch {
      setDomainValidationError('Failed to validate domain. Please check the domain name.')
      setIsValidatingDomain(false)
    }
  }

  const handleTokenSelected = (tokenId: number, tokenName: string) => {
    onChange({ 
      cloudflare_token_id: tokenId,
      cloudflare_token_name: tokenName 
    })
  }

  const handleCopyRecord = (record: string) => {
    navigator.clipboard.writeText(record)
    setCopiedRecord(record)
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  const copyAllRecords = () => {
    const allRecords = nsRecords.map(record => 
      `${record.name}\t${record.type}\t${record.content}\t${record.ttl}`
    ).join('\n')
    navigator.clipboard.writeText(allRecords)
    setCopiedRecord('all')
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Domain Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your domain name and select a Cloudflare token for DNS management and deployment.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Domain Name"
          placeholder="example.com"
          value={data.domain || ''}
          onChange={handleDomainChange}
          error={!!errors.domain}
          helperText={errors.domain || 'Enter the domain name for your site'}
          InputProps={{
            startAdornment: <DomainIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="outlined"
          onClick={handleValidateDomain}
          disabled={!data.domain || isValidatingDomain}
          startIcon={isValidatingDomain ? <RefreshIcon /> : <DomainIcon />}
          sx={{ minWidth: 140 }}
        >
          {isValidatingDomain ? 'Validating...' : 'Validate'}
        </Button>
      </Box>

      {domainValidationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {domainValidationError}
        </Alert>
      )}

      {nsRecords.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Nameserver Records
              </Typography>
              <Button
                size="small"
                onClick={copyAllRecords}
                startIcon={copiedRecord === 'all' ? <CheckIcon /> : <CopyIcon />}
              >
                {copiedRecord === 'all' ? 'Copied!' : 'Copy All'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add these nameserver records to your domain registrar:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {nsRecords.map((record, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" component="span">
                      {record.name}
                    </Typography>
                    <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                      {record.type}
                    </Typography>
                    <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                      {record.content}
                    </Typography>
                    <Typography variant="body2" component="span" color="text.secondary">
                      TTL: {record.ttl}
                    </Typography>
                  </Box>
                  <Tooltip title={copiedRecord === record.content ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyRecord(record.content)}
                    >
                      {copiedRecord === record.content ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cloudflare Token
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a Cloudflare token to use for DNS management and Pages deployment.
        </Typography>

        {data.cloudflare_token_id ? (
          <Card sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CloudIcon color="success" />
              <Box>
                <Typography variant="subtitle1">
                  {data.cloudflare_token_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Token ID: {data.cloudflare_token_id}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setTokenModalOpen(true)}
                sx={{ ml: 'auto' }}
              >
                Change
              </Button>
            </Box>
          </Card>
        ) : (
          <Button
            variant="outlined"
            onClick={() => setTokenModalOpen(true)}
            startIcon={<CloudIcon />}
            fullWidth
            sx={{ py: 2 }}
          >
            Select Cloudflare Token
          </Button>
        )}
      </Box>

      <TokenSelectionModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onTokenSelected={handleTokenSelected}
        selectedDomain={data.domain}
      />
    </Box>
  )
}

export default DomainSetupStep
