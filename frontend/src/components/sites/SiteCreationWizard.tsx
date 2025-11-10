import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import DomainSetupStep from './DomainSetupStep'
import BasicConfigStep from './BasicConfigStep'
import SEOSettingsStep from './SEOSettingsStep'
import MediaAssetsStep from './MediaAssetsStep'
import PageStructureStep from './PageStructureStep'
import type { SiteFormData } from '@/types'

interface SiteCreationWizardProps {
  open: boolean
  onClose: () => void
  onSiteCreated: (siteId: number) => void
}

interface WizardStep {
  id: string
  label: string
  component: React.ComponentType<{
    data: Partial<SiteFormData>
    onChange: (data: Partial<SiteFormData>) => void
    errors: Record<string, string>
  }>
  validation?: (data: Partial<SiteFormData>) => boolean
}

const SiteCreationWizard: React.FC<SiteCreationWizardProps> = ({
  open,
  onClose,
  onSiteCreated,
}) => {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<SiteFormData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps: WizardStep[] = [
    {
      id: 'domain',
      label: 'Domain & Token',
      component: DomainSetupStep,
      validation: (data) => !!(data.domain && data.cloudflare_token),
    },
    {
      id: 'config',
      label: t('wizard.basicConfiguration'),
      component: BasicConfigStep,
      validation: (data) => !!(data.brand_name && data.language_code && data.template_id),
    },
    {
      id: 'seo',
      label: t('wizard.seoSettings'),
      component: SEOSettingsStep,
      validation: () => true, // Optional step
    },
    {
      id: 'media',
      label: t('wizard.mediaAssets'),
      component: MediaAssetsStep,
      validation: () => true, // Optional step
    },
    {
      id: 'pages',
      label: t('wizard.pageStructure'),
      component: PageStructureStep,
      validation: (data) => !!(data.pages && data.pages.length > 0),
    },
  ]

  const handleNext = () => {
    const currentStep = steps[activeStep]
    const isValid = currentStep.validation ? currentStep.validation(formData) : true

    if (isValid) {
      setErrors({})
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1)
      } else {
        handleCreateSite()
      }
    } else {
      setErrors({ general: 'Please complete all required fields before continuing.' })
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
      setErrors({})
    }
  }

  const handleDataChange = (stepData: Partial<SiteFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    setErrors({})
  }

  const handleCreateSite = async () => {
    setIsCreating(true)
    try {
      // TODO: Implement site creation API call
      // const response = await createSite(formData)
      // onSiteCreated(response.id)
      
      // Mock implementation for now
      console.log('Creating site with data:', formData)
      setTimeout(() => {
        setIsCreating(false)
        onSiteCreated(1) // Mock site ID
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to create site:', error)
      setErrors({ general: 'Failed to create site. Please try again.' })
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setActiveStep(0)
    setFormData({})
    setErrors({})
    setIsCreating(false)
    onClose()
  }

  const canProceed = steps[activeStep]?.validation ? steps[activeStep].validation(formData) : true
  const isLastStep = activeStep === steps.length - 1

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create New Site</Typography>
          <Button
            onClick={handleClose}
            startIcon={<CloseIcon />}
            disabled={isCreating}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <Box sx={{ minHeight: '400px' }}>
          {steps[activeStep] && React.createElement(steps[activeStep].component, {
            data: formData,
            onChange: handleDataChange,
            errors: errors
          })}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || isCreating}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={!canProceed || isCreating}
          endIcon={isCreating ? <CircularProgress size={16} /> : <ArrowForwardIcon />}
        >
          {isCreating 
            ? t('wizard.creatingSite') 
            : isLastStep 
              ? t('wizard.createSite') 
              : t('wizard.next')
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SiteCreationWizard
