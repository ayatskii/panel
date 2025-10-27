import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import {
  useGetPageRulesQuery,
  useCreate404RedirectMutation,
  useCreateWwwRedirectMutation,
  useApplyRedirectRulesMutation,
  useGetRuleExpressionsQuery,
} from '@/store/api/integrationsApi'
import toast from 'react-hot-toast'
import type { Site } from '@/types'

interface PageRulesManagerProps {
  site: Site
  onRulesUpdated?: () => void
}

const PageRulesManager: React.FC<PageRulesManagerProps> = ({
  site,
  onRulesUpdated,
}) => {
  const [expressionsOpen, setExpressionsOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const { data: pageRules, isLoading: rulesLoading, refetch: refetchRules } = useGetPageRulesQuery({
    site_id: site.id
  })

  const { data: ruleExpressions } = useGetRuleExpressionsQuery({
    site_id: site.id
  })

  const [create404Redirect] = useCreate404RedirectMutation()
  const [createWwwRedirect] = useCreateWwwRedirectMutation()
  const [applyRedirectRules] = useApplyRedirectRulesMutation()

  const handle404RedirectToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const result = await create404Redirect({ site_id: site.id }).unwrap()
        if (result.success) {
          toast.success('404 redirect rule created successfully')
          refetchRules()
          onRulesUpdated?.()
        } else {
          toast.error(result.error || 'Failed to create 404 redirect rule')
        }
      } else {
        // TODO: Implement delete 404 redirect rule
        toast.info('404 redirect rule deletion not implemented yet')
      }
    } catch {
      toast.error('Failed to update 404 redirect rule')
    }
  }

  const handleWwwRedirectToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const result = await createWwwRedirect({ site_id: site.id }).unwrap()
        if (result.success) {
          toast.success('WWW redirect rule created successfully')
          refetchRules()
          onRulesUpdated?.()
        } else {
          toast.error(result.error || 'Failed to create WWW redirect rule')
        }
      } else {
        // TODO: Implement delete WWW redirect rule
        toast.info('WWW redirect rule deletion not implemented yet')
      }
    } catch {
      toast.error('Failed to update WWW redirect rule')
    }
  }

  const handleApplyAllRules = async () => {
    setIsApplying(true)
    try {
      const result = await applyRedirectRules({ site_id: site.id }).unwrap()
      
      if (result.success) {
        toast.success('All redirect rules applied successfully')
        refetchRules()
        onRulesUpdated?.()
      } else {
        const errorMessages = result.errors.map(e => e.error).join(', ')
        toast.error(`Failed to apply some rules: ${errorMessages}`)
      }
    } catch {
      toast.error('Failed to apply redirect rules')
    } finally {
      setIsApplying(false)
    }
  }

  const has404Rule = pageRules?.rules?.some(rule => 
    rule.actions.some(action => action.id === 'forwarding_url' && action.value?.url?.includes(site.domain))
  )

  const hasWwwRule = pageRules?.rules?.some(rule => 
    rule.targets.some(target => target.constraint.value.includes(`www.${site.domain}`))
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Page Rules & Redirects</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchRules()}
            disabled={rulesLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyAllRules}
            disabled={isApplying}
            startIcon={isApplying ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {isApplying ? 'Applying...' : 'Apply All Rules'}
          </Button>
        </Box>
      </Box>

      {rulesLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {pageRules?.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {pageRules.error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 404 Redirect Rule */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">404 Redirect to Home</Typography>
                <Typography variant="body2" color="text.secondary">
                  Redirect all 404 errors to the home page
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {has404Rule && (
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={has404Rule || false}
                      onChange={(e) => handle404RedirectToggle(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={has404Rule ? 'Enabled' : 'Disabled'}
                />
              </Box>
            </Box>
            
            {has404Rule && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Rule Expression:</strong>
                </Typography>
                <Box component="pre" sx={{ 
                  mt: 1, 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto'
                }}>
                  {ruleExpressions?.['404_redirect']}
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* WWW Redirect Rule */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">WWW Redirect</Typography>
                <Typography variant="body2" color="text.secondary">
                  Redirect www.{site.domain} to {site.domain}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {hasWwwRule && (
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={hasWwwRule || false}
                      onChange={(e) => handleWwwRedirectToggle(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={hasWwwRule ? 'Enabled' : 'Disabled'}
                />
              </Box>
            </Box>
            
            {hasWwwRule && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Rule Expression:</strong>
                </Typography>
                <Box component="pre" sx={{ 
                  mt: 1, 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto'
                }}>
                  {ruleExpressions?.['www_redirect']}
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Current Page Rules */}
        {pageRules?.rules && pageRules.rules.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Page Rules ({pageRules.rules.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pageRules.rules.map((rule, index) => (
                  <Accordion key={rule.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          Rule #{index + 1}
                        </Typography>
                        <Chip
                          label={rule.status}
                          size="small"
                          color={rule.status === 'active' ? 'success' : 'default'}
                        />
                        <Chip
                          label={`Priority: ${rule.priority}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Targets:
                          </Typography>
                          {rule.targets.map((target, i) => (
                            <Typography key={i} variant="body2" fontFamily="monospace" sx={{ ml: 2 }}>
                              {target.target}: {target.constraint.value}
                            </Typography>
                          ))}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Actions:
                          </Typography>
                          {rule.actions.map((action, i) => (
                            <Typography key={i} variant="body2" fontFamily="monospace" sx={{ ml: 2 }}>
                              {action.id}: {JSON.stringify(action.value)}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Rule Expressions Dialog */}
        <Dialog
          open={expressionsOpen}
          onClose={() => setExpressionsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Cloudflare Rule Expressions</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              These are the Cloudflare rule expressions that will be applied for your site:
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                404 Redirect Rule
              </Typography>
              <Box component="pre" sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
                {ruleExpressions?.['404_redirect']}
              </Box>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                WWW Redirect Rule
              </Typography>
              <Box component="pre" sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
                {ruleExpressions?.['www_redirect']}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpressionsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* View Expressions Button */}
        <Box display="flex" justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={() => setExpressionsOpen(true)}
          >
            View Rule Expressions
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default PageRulesManager
