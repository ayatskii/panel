import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'
import { useRegisterMutation } from '@/store/api/authApi'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: ''
  })
  const [register, { isLoading }] = useRegisterMutation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await register(formData).unwrap();
      // Store tokens from the response
      if (response.tokens) {
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
      }
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      console.error('Registration error:', apiError);
      toast.error(apiError.data?.message || t('auth.registerFailed'));
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          {t('auth.register')}
        </Typography>
        

        
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('auth.username')}
            name="username"
            fullWidth
            margin="normal"
            value={formData.username}
            onChange={handleChange}
            required
            autoFocus
          />
          
          <TextField
            label={t('auth.email')}
            name="email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <TextField
            label={t('auth.password')}
            name="password"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <TextField
            label={t('auth.confirmPassword')}
            name="password_confirm"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password_confirm}
            onChange={handleChange}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : t('auth.registerButton')}
          </Button>
        </form>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default RegisterPage
