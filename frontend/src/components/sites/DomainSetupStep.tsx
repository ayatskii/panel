import React, { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material'
import {
  Domain as DomainIcon,
  Cloud as CloudIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import TokenSelectionModal from './TokenSelectionModal'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import type { SiteFormData } from '@/types'

interface DomainSetupStepProps {
  data: Partial<SiteFormData>
  onChange: (data: Partial<SiteFormData>) => void
  errors: Record<string, string>
}

const DomainSetupStep: React.FC<DomainSetupStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation()
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [isValidatingDomain, setIsValidatingDomain] = useState(false)
  const [domainValidationError, setDomainValidationError] = useState<string>('')
  const [tokenName, setTokenName] = useState<string>('')

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
      // Nameservers are now displayed in the TokenSelectionModal
      
      // Mock implementation for now
      setTimeout(() => {
        setIsValidatingDomain(false)
      }, 1500)
    } catch {
      setDomainValidationError('Failed to validate domain. Please check the domain name.')
      setIsValidatingDomain(false)
    }
  }

  const handleTokenSelected = (tokenId: number, tokenName: string) => {
    setTokenName(tokenName)
    onChange({ 
      cloudflare_token: tokenId
    })
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('common.domainSetup')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('common.domainSetupDescription')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label={t('common.domainName')}
          placeholder={t('common.enterDomain')}
          value={data.domain || ''}
          onChange={handleDomainChange}
          error={!!errors.domain}
          helperText={errors.domain || t('common.domainHelper')}
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
          {isValidatingDomain ? t('common.validating') : t('common.validate')}
        </Button>
      </Box>

      {domainValidationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {domainValidationError}
        </Alert>
      )}

      {data.cloudflare_token && data.domain && (
        <Card sx={{ mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {t('domains.nameserverRecords')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('domains.addNsRecordsInstruction')}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  // Nameservers will be displayed in the TokenSelectionModal
                  toast(t('domains.nameserversAfterToken'), { icon: 'ℹ️' })
                }}
                startIcon={<CopyIcon />}
              >
                {t('common.loadNameservers')}
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Nameservers will be displayed in the token selection modal after you select a Cloudflare token.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('domains.cloudflareToken')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('domains.cloudflareTokenDescription')}
        </Typography>

        {data.cloudflare_token ? (
          <Card sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CloudIcon color="success" />
              <Box>
                <Typography variant="subtitle1">
                  {tokenName || `Token ${data.cloudflare_token}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('domains.tokenId')}: {data.cloudflare_token}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setTokenModalOpen(true)}
                sx={{ ml: 'auto' }}
              >
                {t('common.change')}
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
            {t('domains.selectCloudflareToken')}
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
