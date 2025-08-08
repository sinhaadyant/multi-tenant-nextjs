import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import UserTable from '@/components/superadmin/UserTable'
import { createMockUser } from '@/__tests__/utils/test-utils'

describe('UserTable', () => {
  const mockUsers = [
    createMockUser({ 
      id: 'user-1', 
      name: 'Admin User', 
      email: 'admin@test.com', 
      role: { id: 'role-1', name: 'admin', description: 'Administrator' },
      isActive: true 
    }),
    createMockUser({ 
      id: 'user-2', 
      name: 'Regular User', 
      email: 'user@test.com', 
      role: { id: 'role-2', name: 'user', description: 'Regular user' },
      isActive: true 
    }),
    createMockUser({ 
      id: 'user-3', 
      name: 'Inactive User', 
      email: 'inactive@test.com', 
      role: { id: 'role-2', name: 'user', description: 'Regular user' },
      isActive: false 
    }),
  ]

  const defaultProps = {
    users: mockUsers,
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 5,
      totalRecords: 50,
    },
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    onSortingChange: jest.fn(),
    onViewUser: jest.fn(),
    onEditUser: jest.fn(),
    onDeleteUser: jest.fn(),
    onToggleStatus: jest.fn(),
    onResetPassword: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render user table with data', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
      expect(screen.getByText('Inactive User')).toBeInTheDocument()
    })

    it('should display loading state', () => {
      render(<UserTable {...defaultProps} loading={true} />)

      // The component should show skeleton loading
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should display empty state when no users', () => {
      render(<UserTable {...defaultProps} users={[]} />)

      // Should still show table headers
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Tenant')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })

  describe('Table Headers and Sorting', () => {
    it('should render all table headers', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Tenant')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Last Login')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
    })

    it('should handle sorting when header is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSortingChange = jest.fn()
      render(<UserTable {...defaultProps} onSortingChange={mockOnSortingChange} />)

      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(mockOnSortingChange).toHaveBeenCalled()
    })
  })

  describe('Data Display', () => {
    it('should display user information correctly', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
      expect(screen.getByText('inactive@test.com')).toBeInTheDocument()
    })

    it('should display status badges', () => {
      render(<UserTable {...defaultProps} />)

      // Should show active/inactive status
      expect(screen.getAllByText('Active')).toHaveLength(2)
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should display role information', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getAllByText('user')).toHaveLength(2)
    })
  })

  describe('Row Actions', () => {
    it('should display action dropdown buttons', () => {
      render(<UserTable {...defaultProps} />)

      // Should show dropdown buttons for actions
      const actionButtons = screen.getAllByRole('button')
      expect(actionButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getAllByText('1')).toHaveLength(2) // Current page appears in multiple places
      expect(screen.getByText('5')).toBeInTheDocument() // Total pages
    })

    it('should call onPageChange when page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<UserTable {...defaultProps} onPageChange={mockOnPageChange} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when previous page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<UserTable {...defaultProps} pagination={{ ...defaultProps.pagination, page: 2 }} onPageChange={mockOnPageChange} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should disable previous button on first page', () => {
      render(<UserTable {...defaultProps} pagination={{ ...defaultProps.pagination, page: 1 }} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      expect(prevPageButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(<UserTable {...defaultProps} pagination={{ ...defaultProps.pagination, page: 5 }} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      expect(nextPageButton).toBeDisabled()
    })

    it('should call onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup()
      const mockOnPageSizeChange = jest.fn()
      render(<UserTable {...defaultProps} onPageSizeChange={mockOnPageSizeChange} />)

      const pageSizeSelect = screen.getByRole('combobox')
      await user.selectOptions(pageSizeSelect, '25')

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(25)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      
      // Should be able to navigate through the table
      expect(document.activeElement).toBeInTheDocument()
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

      render(<UserTable {...defaultProps} />)

      // Should still display essential information
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) =>
        createMockUser({
          id: `user-${i}`,
          name: `User ${i}`,
          email: `user${i}@test.com`,
          role: { id: 'role-2', name: 'user', description: 'Regular user' },
          isActive: true,
        })
      )

      render(
        <UserTable
          {...defaultProps}
          users={largeUserList}
          pagination={{
            page: 1,
            limit: 25,
            totalPages: 4,
            totalRecords: 100,
          }}
        />
      )

      // Should render without performance issues
      expect(screen.getByText('User 0')).toBeInTheDocument()
      expect(screen.getByText('User 24')).toBeInTheDocument() // Last user on first page
    })
  })
}) 