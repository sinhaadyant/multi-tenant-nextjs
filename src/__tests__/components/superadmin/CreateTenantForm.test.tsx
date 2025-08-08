import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateTenantForm } from '@/components/superadmin/CreateTenantForm'

describe('CreateTenantForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    loading: false,
    error: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<CreateTenantForm {...defaultProps} />)

      expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/domain/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/plan/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should display form title and description', () => {
      render(<CreateTenantForm {...defaultProps} />)

      expect(screen.getByText(/create new tenant/i)).toBeInTheDocument()
      expect(screen.getByText(/fill in the details below to create a new tenant/i)).toBeInTheDocument()
    })

    it('should display submit and cancel buttons', () => {
      render(<CreateTenantForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /create tenant/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      // Should show validation errors for required fields
      expect(screen.getByText(/tenant name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/subdomain is required/i)).toBeInTheDocument()
      expect(screen.getByText(/admin email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/admin name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/admin email/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    it('should validate password strength', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/admin password/i)
      await user.type(passwordInput, 'weak')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/admin password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      await user.type(passwordInput, 'strongpassword123')
      await user.type(confirmPasswordInput, 'differentpassword123')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    it('should validate subdomain format', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const subdomainInput = screen.getByLabelText(/subdomain/i)
      await user.type(subdomainInput, 'invalid subdomain')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(screen.getByText(/subdomain can only contain letters, numbers, and hyphens/i)).toBeInTheDocument()
    })

    it('should validate domain format', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const domainInput = screen.getByLabelText(/domain/i)
      await user.type(domainInput, 'invalid domain')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(screen.getByText(/please enter a valid domain/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      render(<CreateTenantForm {...defaultProps} onSubmit={mockOnSubmit} />)

      // Fill in all required fields
      await user.type(screen.getByLabelText(/tenant name/i), 'Test Tenant')
      await user.type(screen.getByLabelText(/subdomain/i), 'test-tenant')
      await user.type(screen.getByLabelText(/domain/i), 'test-tenant.example.com')
      await user.selectOptions(screen.getByLabelText(/plan/i), 'professional')
      await user.type(screen.getByLabelText(/admin email/i), 'admin@test-tenant.com')
      await user.type(screen.getByLabelText(/admin name/i), 'Admin User')
      await user.type(screen.getByLabelText(/admin password/i), 'strongpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'strongpassword123')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Tenant',
        subdomain: 'test-tenant',
        domain: 'test-tenant.example.com',
        plan: 'professional',
        adminEmail: 'admin@test-tenant.com',
        adminName: 'Admin User',
        adminPassword: 'strongpassword123',
      })
    })

    it('should not submit form with invalid data', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      render(<CreateTenantForm {...defaultProps} onSubmit={mockOnSubmit} />)

      // Fill in only some fields with invalid data
      await user.type(screen.getByLabelText(/tenant name/i), '')
      await user.type(screen.getByLabelText(/admin email/i), 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state when submitting', () => {
      render(<CreateTenantForm {...defaultProps} loading={true} />)

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/creating tenant/i)).toBeInTheDocument()
    })

    it('should disable form fields when loading', () => {
      render(<CreateTenantForm {...defaultProps} loading={true} />)

      const nameInput = screen.getByLabelText(/tenant name/i)
      const emailInput = screen.getByLabelText(/admin email/i)
      const submitButton = screen.getByRole('button', { name: /create tenant/i })

      expect(nameInput).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Failed to create tenant. Please try again.'
      render(<CreateTenantForm {...defaultProps} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should not display error message when no error', () => {
      render(<CreateTenantForm {...defaultProps} />)

      expect(screen.queryByText(/failed to create tenant/i)).not.toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnCancel = jest.fn()
      render(<CreateTenantForm {...defaultProps} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Plan Selection', () => {
    it('should display all plan options', () => {
      render(<CreateTenantForm {...defaultProps} />)

      const planSelect = screen.getByLabelText(/plan/i)
      expect(planSelect).toBeInTheDocument()

      // Check if all plan options are available
      expect(screen.getByText('Starter')).toBeInTheDocument()
      expect(screen.getByText('Professional')).toBeInTheDocument()
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
    })

    it('should allow selecting different plans', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const planSelect = screen.getByLabelText(/plan/i)
      await user.selectOptions(planSelect, 'enterprise')

      expect(planSelect).toHaveValue('enterprise')
    })
  })

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/admin password/i)
      await user.type(passwordInput, 'weak')

      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    })

    it('should show strong password indicator', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/admin password/i)
      await user.type(passwordInput, 'StrongPassword123!')

      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })
  })

  describe('Real-time Validation', () => {
    it('should validate email format in real-time', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/admin email/i)
      await user.type(emailInput, 'invalid-email')

      // Should show validation error immediately
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    it('should validate subdomain availability in real-time', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const subdomainInput = screen.getByLabelText(/subdomain/i)
      await user.type(subdomainInput, 'test-tenant')

      // Should check availability
      await waitFor(() => {
        expect(screen.getByText(/checking availability/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Reset', () => {
    it('should reset form when reset button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      // Fill in some fields
      await user.type(screen.getByLabelText(/tenant name/i), 'Test Tenant')
      await user.type(screen.getByLabelText(/admin email/i), 'admin@test.com')

      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      // Fields should be cleared
      expect(screen.getByLabelText(/tenant name/i)).toHaveValue('')
      expect(screen.getByLabelText(/admin email/i)).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CreateTenantForm {...defaultProps} />)

      expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      // Tab through form fields
      await user.tab()
      
      const nameInput = screen.getByLabelText(/tenant name/i)
      expect(nameInput).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<CreateTenantForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(submitButton)

      // Should have proper ARIA attributes for validation errors
      const nameInput = screen.getByLabelText(/tenant name/i)
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
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

      render(<CreateTenantForm {...defaultProps} />)

      // Should still display all form fields
      expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument()
    })
  })

  describe('Form Persistence', () => {
    it('should persist form data on page refresh', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      render(<CreateTenantForm {...defaultProps} />)

      // Should attempt to restore form data
      expect(mockLocalStorage.getItem).toHaveBeenCalled()
    })
  })
}) 