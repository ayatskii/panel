import { Box, Paper, Typography, LinearProgress, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as ScoreIcon,
} from '@mui/icons-material'

interface SEOScoreCardProps {
  title: string
  metaDescription: string
  h1Tag: string
  slug: string
  keywords?: string
}

interface SEOCheck {
  label: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  points: number
}

const SEOScoreCard = ({
  title,
  metaDescription,
  h1Tag,
  slug,
  keywords,
}: SEOScoreCardProps) => {
  const calculateSEO = (): { checks: SEOCheck[]; score: number; maxScore: number } => {
    const checks: SEOCheck[] = []
    let totalPoints = 0
    const maxPoints = 100

    // Meta Title Check (20 points)
    if (!title || title.length === 0) {
      checks.push({
        label: 'Meta Title',
        status: 'fail',
        message: 'Missing meta title',
        points: 0,
      })
    } else if (title.length < 30) {
      checks.push({
        label: 'Meta Title',
        status: 'warning',
        message: `Title too short (${title.length}/30 min)`,
        points: 10,
      })
      totalPoints += 10
    } else if (title.length > 60) {
      checks.push({
        label: 'Meta Title',
        status: 'warning',
        message: `Title too long (${title.length}/60 max)`,
        points: 15,
      })
      totalPoints += 15
    } else {
      checks.push({
        label: 'Meta Title',
        status: 'pass',
        message: `Perfect length (${title.length} characters)`,
        points: 20,
      })
      totalPoints += 20
    }

    // Meta Description Check (20 points)
    if (!metaDescription || metaDescription.length === 0) {
      checks.push({
        label: 'Meta Description',
        status: 'fail',
        message: 'Missing meta description',
        points: 0,
      })
    } else if (metaDescription.length < 50) {
      checks.push({
        label: 'Meta Description',
        status: 'warning',
        message: `Description too short (${metaDescription.length}/50 min)`,
        points: 10,
      })
      totalPoints += 10
    } else if (metaDescription.length > 160) {
      checks.push({
        label: 'Meta Description',
        status: 'warning',
        message: `Description too long (${metaDescription.length}/160 max)`,
        points: 15,
      })
      totalPoints += 15
    } else {
      checks.push({
        label: 'Meta Description',
        status: 'pass',
        message: `Perfect length (${metaDescription.length} characters)`,
        points: 20,
      })
      totalPoints += 20
    }

    // H1 Tag Check (15 points)
    if (!h1Tag || h1Tag.length === 0) {
      checks.push({
        label: 'H1 Tag',
        status: 'fail',
        message: 'Missing H1 tag',
        points: 0,
      })
    } else if (h1Tag.length > 70) {
      checks.push({
        label: 'H1 Tag',
        status: 'warning',
        message: `H1 too long (${h1Tag.length}/70 max)`,
        points: 10,
      })
      totalPoints += 10
    } else {
      checks.push({
        label: 'H1 Tag',
        status: 'pass',
        message: `Good length (${h1Tag.length} characters)`,
        points: 15,
      })
      totalPoints += 15
    }

    // URL Slug Check (15 points)
    if (!slug || slug.length === 0) {
      checks.push({
        label: 'URL Slug',
        status: 'fail',
        message: 'Missing URL slug',
        points: 0,
      })
    } else if (slug.length > 60) {
      checks.push({
        label: 'URL Slug',
        status: 'warning',
        message: 'Slug too long (keep under 60 chars)',
        points: 10,
      })
      totalPoints += 10
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      checks.push({
        label: 'URL Slug',
        status: 'warning',
        message: 'Use only lowercase, numbers, and hyphens',
        points: 10,
      })
      totalPoints += 10
    } else {
      checks.push({
        label: 'URL Slug',
        status: 'pass',
        message: 'SEO-friendly slug',
        points: 15,
      })
      totalPoints += 15
    }

    // Keywords Check (15 points)
    if (!keywords || keywords.trim().length === 0) {
      checks.push({
        label: 'Keywords',
        status: 'warning',
        message: 'No keywords defined',
        points: 5,
      })
      totalPoints += 5
    } else {
      const keywordList = keywords.split('\n').filter(k => k.trim())
      if (keywordList.length < 3) {
        checks.push({
          label: 'Keywords',
          status: 'warning',
          message: `Add more keywords (${keywordList.length}/3+ recommended)`,
          points: 10,
        })
        totalPoints += 10
      } else {
        checks.push({
          label: 'Keywords',
          status: 'pass',
          message: `${keywordList.length} keywords defined`,
          points: 15,
        })
        totalPoints += 15
      }
    }

    // Title-Description Consistency (15 points)
    if (title && metaDescription) {
      const titleWords = title.toLowerCase().split(/\s+/)
      const descWords = metaDescription.toLowerCase().split(/\s+/)
      const commonWords = titleWords.filter(word => 
        word.length > 3 && descWords.some(dw => dw.includes(word) || word.includes(dw))
      )
      
      if (commonWords.length >= 2) {
        checks.push({
          label: 'Title-Description Match',
          status: 'pass',
          message: 'Good keyword consistency',
          points: 15,
        })
        totalPoints += 15
      } else {
        checks.push({
          label: 'Title-Description Match',
          status: 'warning',
          message: 'Low keyword overlap between title and description',
          points: 8,
        })
        totalPoints += 8
      }
    } else {
      checks.push({
        label: 'Title-Description Match',
        status: 'fail',
        message: 'Cannot check (missing title or description)',
        points: 0,
      })
    }

    return { checks, score: totalPoints, maxScore: maxPoints }
  }

  const { checks, score, maxScore } = calculateSEO()
  const percentage = Math.round((score / maxScore) * 100)

  const getScoreColor = () => {
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  const getScoreLabel = () => {
    if (percentage >= 90) return 'Excellent'
    if (percentage >= 80) return 'Good'
    if (percentage >= 60) return 'Fair'
    if (percentage >= 40) return 'Poor'
    return 'Needs Work'
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScoreIcon />
          SEO Score
        </Typography>
        <Chip
          label={`${percentage}%`}
          color={getScoreColor()}
          sx={{ fontSize: '1.1rem', fontWeight: 'bold', px: 1 }}
        />
      </Box>

      {/* Score Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {getScoreLabel()}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {score} / {maxScore} points
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={getScoreColor()}
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>

      {/* Checks List */}
      <List dense>
        {checks.map((check, index) => (
          <ListItem key={index} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {check.status === 'pass' && <CheckIcon color="success" />}
              {check.status === 'fail' && <ErrorIcon color="error" />}
              {check.status === 'warning' && <WarningIcon color="warning" />}
            </ListItemIcon>
            <ListItemText
              primary={check.label}
              secondary={check.message}
              secondaryTypographyProps={{
                color: check.status === 'pass' ? 'success.main' : check.status === 'fail' ? 'error.main' : 'warning.main'
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {check.points} pts
            </Typography>
          </ListItem>
        ))}
      </List>

      {/* Recommendations */}
      {percentage < 80 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Recommendations:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {percentage < 40 && 'Start by adding a meta title and description with appropriate lengths.'}
            {percentage >= 40 && percentage < 60 && 'Improve your meta tags to meet the recommended character counts.'}
            {percentage >= 60 && percentage < 80 && 'You\'re close! Fine-tune your title and description lengths for optimal SEO.'}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default SEOScoreCard

