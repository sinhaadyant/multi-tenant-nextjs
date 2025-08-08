import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPassword from '@/app/superadmin/reset-password/page'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

// Mock the auth service
jest.mock('@/services/authService', () => ({
  resetPassword: jest.fn(),
}))

// Mock Next.js router and search params
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    server.listen()
    mockSearchParams.clear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Token Validation', () => {
    it('should show error for missing token', () => {
      render(<ResetPassword />)

      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument()
      expect(screen.getByText('Invalid reset link. Please request a new password reset.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /request new reset link/i })).toBeInTheDocument()
    })

    it('should render form when valid token is provided', () => {
      mockSearchParams.set('token', 'valid-reset-token')
      render(<ResetPassword />)

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    })
  })

  describe('Form Rendering', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should render reset password form with all fields', () => {
      render(<ResetPassword />)

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
      expect(screen.getByText('Enter your new password to secure your account')).toBeInTheDocument()
      
      // Form fields
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
      
      // Back to login link
      expect(screen.getByText('← Back to login')).toBeInTheDocument()
    })

    it('should display password fields with proper attributes', () => {
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')

      expect(newPasswordInput).toHaveAttribute('type', 'password')
      expect(newPasswordInput).toHaveAttribute('placeholder', 'Enter your new password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', 'Confirm your new password')
    })
  })

  describe('Password Visibility Toggle', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should toggle new password visibility', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      const newPasswordToggle = screen.getAllByRole('button')[1] // First toggle button

      // Initially password should be hidden
      expect(newPasswordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(newPasswordToggle)
      expect(newPasswordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password again
      await user.click(newPasswordToggle)
      expect(newPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      const confirmPasswordToggle = screen.getAllByRole('button')[2] // Second toggle button

      // Initially password should be hidden
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password again
      await user.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
    })

    it('should validate password length', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'short')

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
    })

    it('should validate password contains uppercase letter', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument()
    })

    it('should validate password contains number', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'PasswordABC')

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument()
    })

    it('should validate password confirmation matches', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')

      await user.type(newPasswordInput, 'Password123')
      await user.type(confirmPasswordInput, 'DifferentPassword123')

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  describe('Password Strength Indicator', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should show password strength requirements', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'weak')

      expect(screen.getByText('Password strength:')).toBeInTheDocument()
      expect(screen.getByText('✓ At least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('✓ One uppercase letter')).toBeInTheDocument()
      expect(screen.getByText('✓ One number')).toBeInTheDocument()
      expect(screen.getByText('✓ One lowercase letter')).toBeInTheDocument()
    })

    it('should show green checkmarks for met requirements', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'StrongPassword123')

      // All requirements should be met (green)
      const requirements = screen.getAllByText(/✓/)
      requirements.forEach(requirement => {
        expect(requirement).toHaveClass('text-green-600')
      })
    })

    it('should show red checkmarks for unmet requirements', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText('New Password')
      await user.type(newPasswordInput, 'weak')

      // Requirements should be unmet (red)
      const requirements = screen.getAllByText(/✓/)
      requirements.forEach(requirement => {
        expect(requirement).toHaveClass('text-red-600')
      })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock successful response
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password updated successfully',
      })

      render(<ResetPassword />)

      // Fill in form with valid password
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Verify service was called
      expect(mockResetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'StrongPassword123',
        'StrongPassword123'
      )
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock delayed response
      mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<ResetPassword />)

      // Fill in form
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Updating Password...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle successful password reset', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock successful response
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password updated successfully',
      })

      render(<ResetPassword />)

      // Fill in form
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Password Updated Successfully')).toBeInTheDocument()
        expect(screen.getByText('Your password has been successfully updated. You can now log in with your new password.')).toBeInTheDocument()
      })

      // Should redirect to login page after delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/superadmin/login?message=password-reset-success')
      }, { timeout: 3000 })
    })

    it('should handle password reset failure', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock failed response
      mockResetPassword.mockResolvedValue({
        success: false,
        message: 'Invalid or expired token',
      })

      render(<ResetPassword />)

      // Fill in form
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock network error
      mockResetPassword.mockRejectedValue(new Error('Network error'))

      render(<ResetPassword />)

      // Fill in form
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Success State', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should display success message', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock successful response
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password updated successfully',
      })

      render(<ResetPassword />)

      // Fill in form and submit
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Password Updated Successfully')).toBeInTheDocument()
        expect(screen.getByText(/Redirecting to login page/)).toBeInTheDocument()
      })
    })

    it('should show success icon', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock successful response
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password updated successfully',
      })

      render(<ResetPassword />)

      // Fill in form and submit
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      // Should show success icon
      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate back to login page', () => {
      render(<ResetPassword />)

      const backLink = screen.getByText('← Back to login')
      expect(backLink).toHaveAttribute('href', '/superadmin/login')
    })

    it('should navigate to forgot password page from invalid token state', () => {
      render(<ResetPassword />)

      const requestNewLinkButton = screen.getByRole('button', { name: /request new reset link/i })
      expect(requestNewLinkButton).toHaveAttribute('href', '/superadmin/forgot-password')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should have proper ARIA labels', () => {
      render(<ResetPassword />)

      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      // Tab through form elements
      await user.tab()
      
      const newPasswordInput = screen.getByLabelText('New Password')
      expect(newPasswordInput).toHaveFocus()

      await user.tab()
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      expect(confirmPasswordInput).toHaveFocus()

      await user.tab()
      const submitButton = screen.getByRole('button', { name: /update password/i })
      expect(submitButton).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Should have proper ARIA attributes for validation errors
      const newPasswordInput = screen.getByLabelText('New Password')
      expect(newPasswordInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock failed response
      mockResetPassword.mockResolvedValue({
        success: false,
        message: 'Invalid token',
      })

      render(<ResetPassword />)

      // Fill in form and submit to trigger error
      await user.type(screen.getByLabelText('New Password'), 'WeakPassword')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Invalid token')).toBeInTheDocument()
      })

      // Start typing in password field
      await user.clear(screen.getByLabelText('New Password'))
      await user.type(screen.getByLabelText('New Password'), 'NewPassword123')

      // Error should be cleared
      expect(screen.queryByText('Invalid token')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should be responsive on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<ResetPassword />)

      // Should still display all form elements
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
    })
  })

  describe('Form State Management', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token')
    })

    it('should disable form during submission', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock delayed response
      mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<ResetPassword />)

      // Fill in form
      await user.type(screen.getByLabelText('New Password'), 'StrongPassword123')
      await user.type(screen.getByLabelText('Confirm New Password'), 'StrongPassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i })
      await user.click(submitButton)

      // Form should be disabled during submission
      expect(screen.getByLabelText('New Password')).toBeDisabled()
      expect(screen.getByLabelText('Confirm New Password')).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })

    it('should re-enable form after error', async () => {
      const user = userEvent.setup()
      const mockResetPassword = require('@/services/authService').resetPassword

      // Mock failed response
      mockResetPassword.mockResolvedValue({
        success: false,
        message: 'Invalid token',
      })

      render(<ResetPassword />)

      // Fill in form and submit
      await user.type(screen.getByLabelText('New Password'), 'WeakPassword')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Invalid token')).toBeInTheDocument()
      })

      // Form should be re-enabled
      expect(screen.getByLabelText('New Password')).not.toBeDisabled()
      expect(screen.getByLabelText('Confirm New Password')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /update password/i })).not.toBeDisabled()
    })
  })
}) 