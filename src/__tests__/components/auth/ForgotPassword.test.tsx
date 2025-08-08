import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPassword from '@/app/superadmin/forgot-password/page'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

// Mock the auth service
jest.mock('@/services/authService', () => ({
  requestPasswordReset: jest.fn(),
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('ForgotPassword', () => {
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
    it('should render forgot password form', () => {
      render(<ForgotPassword />)

      expect(screen.getByText('Forgot Password?')).toBeInTheDocument()
      expect(screen.getByText('Enter your email address and we\'ll send you instructions to reset your password')).toBeInTheDocument()
      
      // Form elements
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument()
      
      // Back to login link
      expect(screen.getByText('← Back to login')).toBeInTheDocument()
    })

    it('should display email field with proper attributes', () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email Address')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address')
    })
  })

  describe('Form Validation', () => {
    it('should validate required email field', async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    it('should accept valid email format', async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'admin@example.com')

      // Should not show validation error for valid email
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock successful response
      mockRequestPasswordReset.mockResolvedValue({
        success: true,
        token: 'mock-reset-token',
      })

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Verify service was called
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('admin@example.com')
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock delayed response
      mockRequestPasswordReset.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Sending Instructions...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle successful password reset request', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock successful response
      mockRequestPasswordReset.mockResolvedValue({
        success: true,
        token: 'mock-reset-token',
      })

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
        expect(screen.getByText(/We've sent password reset instructions to/)).toBeInTheDocument()
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      })

      // Should redirect to reset password page after delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/superadmin/reset-password?token=mock-reset-token')
      }, { timeout: 3000 })
    })

    it('should handle password reset request failure', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock failed response
      mockRequestPasswordReset.mockResolvedValue({
        success: false,
        message: 'Email not found',
      })

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'nonexistent@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock network error
      mockRequestPasswordReset.mockRejectedValue(new Error('Network error'))

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Success State', () => {
    it('should display success message with correct email', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock successful response
      mockRequestPasswordReset.mockResolvedValue({
        success: true,
        token: 'mock-reset-token',
      })

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
        expect(screen.getByText(/Redirecting to reset password page for demo purposes/)).toBeInTheDocument()
      })
    })

    it('should show success icon', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock successful response
      mockRequestPasswordReset.mockResolvedValue({
        success: true,
        token: 'mock-reset-token',
      })

      render(<ForgotPassword />)

      // Fill in email and submit
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')
      await user.click(screen.getByRole('button', { name: /send reset instructions/i }))

      // Should show success icon
      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate back to login page', () => {
      render(<ForgotPassword />)

      const backLink = screen.getByText('← Back to login')
      expect(backLink).toHaveAttribute('href', '/superadmin/login')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ForgotPassword />)

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      // Tab through form elements
      await user.tab()
      
      const emailInput = screen.getByLabelText('Email Address')
      expect(emailInput).toHaveFocus()

      await user.tab()
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      expect(submitButton).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Should have proper ARIA attributes for validation errors
      const emailInput = screen.getByLabelText('Email Address')
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Error Handling', () => {
    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock failed request
      mockRequestPasswordReset.mockResolvedValue({
        success: false,
        message: 'Email not found',
      })

      render(<ForgotPassword />)

      // Fill in email and submit to trigger error
      await user.type(screen.getByLabelText('Email Address'), 'nonexistent@example.com')
      await user.click(screen.getByRole('button', { name: /send reset instructions/i }))

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })

      // Start typing in email field
      await user.clear(screen.getByLabelText('Email Address'))
      await user.type(screen.getByLabelText('Email Address'), 'new@example.com')

      // Error should be cleared
      expect(screen.queryByText('Email not found')).not.toBeInTheDocument()
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

      render(<ForgotPassword />)

      // Should still display all form elements
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument()
    })
  })

  describe('Form State Management', () => {
    it('should disable form during submission', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock delayed response
      mockRequestPasswordReset.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<ForgotPassword />)

      // Fill in email
      await user.type(screen.getByLabelText('Email Address'), 'admin@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      await user.click(submitButton)

      // Form should be disabled during submission
      expect(screen.getByLabelText('Email Address')).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })

    it('should re-enable form after error', async () => {
      const user = userEvent.setup()
      const mockRequestPasswordReset = require('@/services/authService').requestPasswordReset

      // Mock failed response
      mockRequestPasswordReset.mockResolvedValue({
        success: false,
        message: 'Email not found',
      })

      render(<ForgotPassword />)

      // Fill in email and submit
      await user.type(screen.getByLabelText('Email Address'), 'nonexistent@example.com')
      await user.click(screen.getByRole('button', { name: /send reset instructions/i }))

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })

      // Form should be re-enabled
      expect(screen.getByLabelText('Email Address')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /send reset instructions/i })).not.toBeDisabled()
    })
  })
}) 