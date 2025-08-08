import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuperAdminSignUpForm from '@/components/auth/SuperAdminSignUpForm'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

// Mock the auth service
jest.mock('@/services/authService', () => ({
  authService: {
    signup: jest.fn(),
  },
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

// Mock Redux
const mockDispatch = jest.fn()
jest.mock('@/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

describe('SuperAdminSignUpForm', () => {
  const defaultProps = {
    token: 'valid-invite-token',
    inviteEmail: 'admin@example.com',
  }

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
    it('should render signup form with all fields', () => {
      render(<SuperAdminSignUpForm {...defaultProps} />)

      expect(screen.getByText('Create SuperAdmin Account')).toBeInTheDocument()
      expect(screen.getByText('Complete your account setup')).toBeInTheDocument()
      
      // Form fields
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      
      // Back to login link
      expect(screen.getByText('← Back to login')).toBeInTheDocument()
    })

    it('should pre-fill email field with invite email', () => {
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveValue('admin@example.com')
      expect(emailInput).toBeDisabled() // Email should be read-only
    })

    it('should display form fields with proper attributes', () => {
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')

      expect(nameInput).toHaveAttribute('type', 'text')
      expect(nameInput).toHaveAttribute('placeholder', 'Enter your full name')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(screen.getByText('Full name is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })

    it('should validate full name length', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const nameInput = screen.getByLabelText('Full Name')
      await user.type(nameInput, 'Jo')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(screen.getByText('Full name must be at least 3 characters')).toBeInTheDocument()
    })

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'weak')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument()
      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument()
      expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument()
    })

    it('should validate password confirmation matches', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'StrongPassword123!')
      await user.type(confirmPasswordInput, 'DifferentPassword123!')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('should accept valid form data', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in valid data
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Should not show validation errors
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Please confirm your password')).not.toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      const passwordToggle = screen.getAllByRole('button')[1] // First toggle button

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password again
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
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

  describe('Password Strength Indicator', () => {
    it('should show password strength requirements', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'weak')

      expect(screen.getByText('Password strength:')).toBeInTheDocument()
      expect(screen.getByText('✓ At least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('✓ One uppercase letter')).toBeInTheDocument()
      expect(screen.getByText('✓ One lowercase letter')).toBeInTheDocument()
      expect(screen.getByText('✓ One number')).toBeInTheDocument()
      expect(screen.getByText('✓ One special character')).toBeInTheDocument()
    })

    it('should show green checkmarks for met requirements', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'StrongPassword123!')

      // All requirements should be met (green)
      const requirements = screen.getAllByText(/✓/)
      requirements.forEach(requirement => {
        expect(requirement).toHaveClass('text-green-600')
      })
    })

    it('should show red checkmarks for unmet requirements', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'weak')

      // Requirements should be unmet (red)
      const requirements = screen.getAllByText(/✓/)
      requirements.forEach(requirement => {
        expect(requirement).toHaveClass('text-red-600')
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock successful response
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'John Doe' },
          token: 'mock-jwt-token',
        },
      })

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form with valid data
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Verify service was called
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'admin@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        token: 'valid-invite-token',
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock delayed response
      mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle successful signup', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup
      const mockToast = require('react-hot-toast')

      // Mock successful response
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'John Doe' },
          token: 'mock-jwt-token',
        },
      })

      // Mock localStorage
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      })

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should handle success
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Account created successfully!')
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
          type: expect.stringContaining('auth/loginSuccess'),
          payload: {
            user: { id: '1', email: 'admin@example.com', name: 'John Doe' },
            token: 'mock-jwt-token',
          },
        }))
      })

      // Should store tokens and redirect
      expect(mockSetItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token')
      expect(mockSetItem).toHaveBeenCalledWith('auth_user', JSON.stringify({ id: '1', email: 'admin@example.com', name: 'John Doe' }))
      expect(mockPush).toHaveBeenCalledWith('/superadmin/dashboard')
    })

    it('should handle signup failure', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup
      const mockToast = require('react-hot-toast')

      // Mock failed response
      mockSignup.mockResolvedValue({
        success: false,
        message: 'Email already exists',
      })

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Email already exists')
      })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup
      const mockToast = require('react-hot-toast')

      // Mock network error
      mockSignup.mockRejectedValue(new Error('Network error'))

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Signup failed')
      })
    })
  })

  describe('Token Handling', () => {
    it('should include token in signup request', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock successful response
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'John Doe' },
          token: 'mock-jwt-token',
        },
      })

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Verify token is included in request
      expect(mockSignup).toHaveBeenCalledWith(expect.objectContaining({
        token: 'valid-invite-token',
      }))
    })

    it('should work with different token values', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock successful response
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', email: 'admin@example.com', name: 'John Doe' },
          token: 'mock-jwt-token',
        },
      })

      render(<SuperAdminSignUpForm token="different-token" inviteEmail="admin@example.com" />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Verify different token is included
      expect(mockSignup).toHaveBeenCalledWith(expect.objectContaining({
        token: 'different-token',
      }))
    })
  })

  describe('Navigation', () => {
    it('should navigate back to login page', () => {
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const backLink = screen.getByText('← Back to login')
      expect(backLink).toHaveAttribute('href', '/superadmin/login')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SuperAdminSignUpForm {...defaultProps} />)

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Tab through form elements
      await user.tab()
      
      const nameInput = screen.getByLabelText('Full Name')
      expect(nameInput).toHaveFocus()

      await user.tab()
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveFocus()

      await user.tab()
      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveFocus()

      await user.tab()
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      expect(confirmPasswordInput).toHaveFocus()

      await user.tab()
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should have proper ARIA attributes for validation errors
      const nameInput = screen.getByLabelText('Full Name')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')

      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Error Handling', () => {
    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup()
      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show validation errors
      expect(screen.getByText('Full name is required')).toBeInTheDocument()

      // Start typing in name field
      await user.type(screen.getByLabelText('Full Name'), 'John')

      // Error should be cleared
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument()
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

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Should still display all form elements
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  describe('Form State Management', () => {
    it('should disable form during submission', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock delayed response
      mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Form should be disabled during submission
      expect(screen.getByLabelText('Full Name')).toBeDisabled()
      expect(screen.getByLabelText('Email')).toBeDisabled()
      expect(screen.getByLabelText('Password')).toBeDisabled()
      expect(screen.getByLabelText('Confirm Password')).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })

    it('should re-enable form after error', async () => {
      const user = userEvent.setup()
      const mockSignup = require('@/services/authService').authService.signup

      // Mock failed response
      mockSignup.mockResolvedValue({
        success: false,
        message: 'Email already exists',
      })

      render(<SuperAdminSignUpForm {...defaultProps} />)

      // Fill in form and submit
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Wait for error to be handled
      await waitFor(() => {
        expect(require('react-hot-toast').error).toHaveBeenCalled()
      })

      // Form should be re-enabled
      expect(screen.getByLabelText('Full Name')).not.toBeDisabled()
      expect(screen.getByLabelText('Email')).not.toBeDisabled()
      expect(screen.getByLabelText('Password')).not.toBeDisabled()
      expect(screen.getByLabelText('Confirm Password')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
    })
  })
}) 