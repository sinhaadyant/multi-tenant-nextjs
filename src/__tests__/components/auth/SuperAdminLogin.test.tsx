import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuperAdminLogin from '@/app/superadmin/login/page'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

// Mock the auth service
jest.mock('@/services/authService', () => ({
  login: jest.fn(),
}))

// Mock the token validation
jest.mock('@/lib/tokenValidation', () => ({
  validateToken: jest.fn(() => ({ isValid: true, error: null })),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SuperAdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Form Rendering', () => {
    it('should render login form with all fields', () => {
      render(<SuperAdminLogin />)

      expect(screen.getByText('SuperAdmin Sign In')).toBeInTheDocument()
      expect(screen.getByText('Welcome back! Please sign in to your account.')).toBeInTheDocument()
      
      // Form fields
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Forgot password link
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
    })

    it('should display form fields with proper labels', () => {
      render(<SuperAdminLogin />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    it('should accept valid email format', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'admin@example.com')

      // Should not show validation error for valid email
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const passwordInput = screen.getByLabelText('Password')
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password again
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should show correct eye icon based on password visibility', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

      // Initially should show eye icon (password hidden)
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()

      // Click to show password
      await user.click(toggleButton)
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()

      // Click to hide password again
      await user.click(toggleButton)
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login

      // Mock successful login response
      mockLogin.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      })

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Verify login service was called
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login

      // Mock delayed response
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle login success and redirect', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login
      const mockToast = require('react-hot-toast')

      // Mock successful login response
      mockLogin.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      })

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Wait for success handling
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Login successful!')
      })

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/superadmin/dashboard')
      })
    })

    it('should handle login failure', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login
      const mockToast = require('react-hot-toast')

      // Mock failed login response
      mockLogin.mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      })

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials')
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login
      const mockToast = require('react-hot-toast')

      // Mock network error
      mockLogin.mockRejectedValue(new Error('Network error'))

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })

      expect(mockToast.error).toHaveBeenCalledWith('Network error. Please check your connection and try again.')
    })
  })

  describe('Token Validation', () => {
    it('should validate token before storing', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login
      const mockValidateToken = require('@/lib/tokenValidation').validateToken

      // Mock invalid token
      mockValidateToken.mockReturnValue({ isValid: false, error: 'Token expired' })

      // Mock successful login response
      mockLogin.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com' },
          token: 'invalid-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      })

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should show token validation error
      await waitFor(() => {
        expect(screen.getByText(/Token validation failed/)).toBeInTheDocument()
      })
    })
  })

  describe('Storage and State Management', () => {
    it('should store tokens in browser storage', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login

      // Mock successful login response
      mockLogin.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com' },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      })

      // Mock localStorage and sessionStorage
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      })
      Object.defineProperty(window, 'sessionStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      })

      render(<SuperAdminLogin />)

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should store tokens
      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith('access_token', 'mock-jwt-token')
        expect(mockSetItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SuperAdminLogin />)

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      // Tab through form elements
      await user.tab()
      
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveFocus()

      await user.tab()
      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveFocus()

      await user.tab()
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should have proper ARIA attributes for validation errors
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Navigation', () => {
    it('should navigate to forgot password page', async () => {
      const user = userEvent.setup()
      render(<SuperAdminLogin />)

      const forgotPasswordLink = screen.getByText('Forgot your password?')
      expect(forgotPasswordLink).toHaveAttribute('href', '/superadmin/forgot-password')
    })
  })

  describe('Error Handling', () => {
    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const mockLogin = require('@/services/authService').login

      // Mock failed login
      mockLogin.mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      })

      render(<SuperAdminLogin />)

      // Fill in form and submit to trigger error
      await user.type(screen.getByLabelText('Email'), 'admin@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Start typing in email field
      await user.clear(screen.getByLabelText('Email'))
      await user.type(screen.getByLabelText('Email'), 'new@example.com')

      // Error should be cleared
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<SuperAdminLogin />)

      // Should still display all form elements
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })
}) 