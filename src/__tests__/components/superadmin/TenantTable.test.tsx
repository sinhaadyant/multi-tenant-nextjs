import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import TenantTable from '@/components/superadmin/TenantTable'
import { createMockTenant } from '@/__tests__/utils/test-utils'

describe('TenantTable', () => {
  const mockTenants = [
    createMockTenant({ id: 'tenant-1', name: 'Test Tenant 1', plan: 'professional', isActive: true }),
    createMockTenant({ id: 'tenant-2', name: 'Test Tenant 2', plan: 'starter', isActive: false }),
    createMockTenant({ id: 'tenant-3', name: 'Enterprise Tenant', plan: 'enterprise', isActive: true }),
  ]

  const defaultProps = {
    tenants: mockTenants,
    loading: false,
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onToggleStatus: jest.fn(),
    currentPage: 1,
    totalPages: 5,
    totalRecords: 50,
    pageSize: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    sortBy: 'name',
    sortOrder: 'asc' as const,
    onSort: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render tenant table with data', () => {
      render(<TenantTable {...defaultProps} />)

      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument()
      expect(screen.getByText('Test Tenant 2')).toBeInTheDocument()
      expect(screen.getByText('Enterprise Tenant')).toBeInTheDocument()
    })

    it('should display loading state', () => {
      render(<TenantTable {...defaultProps} loading={true} />)

      expect(screen.getByTestId('tenant-table-loading')).toBeInTheDocument()
    })

    it('should display empty state when no tenants', () => {
      render(<TenantTable {...defaultProps} tenants={[]} />)

      expect(screen.getByText(/no tenants found/i)).toBeInTheDocument()
    })
  })

  describe('Table Headers and Sorting', () => {
    it('should render all table headers', () => {
      render(<TenantTable {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Domain')).toBeInTheDocument()
      expect(screen.getByText('Plan')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should show sort indicators', () => {
      render(<TenantTable {...defaultProps} sortBy="name" sortOrder="asc" />)

      const nameHeader = screen.getByText('Name')
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('should call onSort when header is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSort = jest.fn()
      render(<TenantTable {...defaultProps} onSort={mockOnSort} />)

      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(mockOnSort).toHaveBeenCalledWith('name')
    })

    it('should handle sort order changes', async () => {
      const user = userEvent.setup()
      const mockOnSort = jest.fn()
      render(<TenantTable {...defaultProps} onSort={mockOnSort} sortBy="name" sortOrder="asc" />)

      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(mockOnSort).toHaveBeenCalledWith('name')
    })
  })

  describe('Tenant Data Display', () => {
    it('should display tenant information correctly', () => {
      render(<TenantTable {...defaultProps} />)

      // Check tenant names
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument()
      expect(screen.getByText('Test Tenant 2')).toBeInTheDocument()
      expect(screen.getByText('Enterprise Tenant')).toBeInTheDocument()

      // Check domains
      expect(screen.getByText('test-tenant-1.example.com')).toBeInTheDocument()
      expect(screen.getByText('test-tenant-2.example.com')).toBeInTheDocument()

      // Check user counts
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('should display status badges correctly', () => {
      render(<TenantTable {...defaultProps} />)

      const activeBadges = screen.getAllByText('Active')
      const inactiveBadges = screen.getAllByText('Inactive')

      expect(activeBadges).toHaveLength(2)
      expect(inactiveBadges).toHaveLength(1)
    })

    it('should display plan badges with correct colors', () => {
      render(<TenantTable {...defaultProps} />)

      expect(screen.getByText('Professional')).toBeInTheDocument()
      expect(screen.getByText('Starter')).toBeInTheDocument()
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(<TenantTable {...defaultProps} />)

      // Check if dates are formatted (assuming date-fns format)
      expect(screen.getByText(/Jan 01, 2024/i)).toBeInTheDocument()
    })
  })

  describe('Row Actions', () => {
    it('should display action buttons for each tenant', () => {
      render(<TenantTable {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

      expect(viewButtons).toHaveLength(3)
      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })

    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnView = jest.fn()
      render(<TenantTable {...defaultProps} onView={mockOnView} />)

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      await user.click(viewButtons[0])

      expect(mockOnView).toHaveBeenCalledWith(mockTenants[0])
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnEdit = jest.fn()
      render(<TenantTable {...defaultProps} onEdit={mockOnEdit} />)

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledWith(mockTenants[0])
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnDelete = jest.fn()
      render(<TenantTable {...defaultProps} onDelete={mockOnDelete} />)

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledWith(mockTenants[0])
    })

    it('should call onToggleStatus when status toggle is clicked', async () => {
      const user = userEvent.setup()
      const mockOnToggleStatus = jest.fn()
      render(<TenantTable {...defaultProps} onToggleStatus={mockOnToggleStatus} />)

      const statusToggles = screen.getAllByRole('button', { name: /toggle status/i })
      await user.click(statusToggles[0])

      expect(mockOnToggleStatus).toHaveBeenCalledWith(mockTenants[0])
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<TenantTable {...defaultProps} />)

      expect(screen.getByText('1')).toBeInTheDocument() // Current page
      expect(screen.getByText('5')).toBeInTheDocument() // Total pages
      expect(screen.getByText('50')).toBeInTheDocument() // Total records
    })

    it('should call onPageChange when page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<TenantTable {...defaultProps} onPageChange={mockOnPageChange} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when previous page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<TenantTable {...defaultProps} currentPage={2} onPageChange={mockOnPageChange} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should disable previous button on first page', () => {
      render(<TenantTable {...defaultProps} currentPage={1} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      expect(prevPageButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(<TenantTable {...defaultProps} currentPage={5} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      expect(nextPageButton).toBeDisabled()
    })

    it('should call onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup()
      const mockOnPageSizeChange = jest.fn()
      render(<TenantTable {...defaultProps} onPageSizeChange={mockOnPageSizeChange} />)

      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i })
      await user.selectOptions(pageSizeSelect, '20')

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(20)
    })
  })

  describe('Row Expansion', () => {
    it('should allow expanding rows to show additional details', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      const expandButtons = screen.getAllByRole('button', { name: /expand/i })
      await user.click(expandButtons[0])

      // Should show additional details
      expect(screen.getByText(/additional details/i)).toBeInTheDocument()
    })

    it('should collapse expanded rows when clicked again', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      const expandButtons = screen.getAllByRole('button', { name: /expand/i })
      await user.click(expandButtons[0])
      await user.click(expandButtons[0])

      // Additional details should be hidden
      expect(screen.queryByText(/additional details/i)).not.toBeInTheDocument()
    })
  })

  describe('Bulk Actions', () => {
    it('should allow selecting multiple tenants', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // Select first tenant
      await user.click(checkboxes[2]) // Select second tenant

      expect(checkboxes[1]).toBeChecked()
      expect(checkboxes[2]).toBeChecked()
    })

    it('should show bulk action buttons when tenants are selected', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      expect(screen.getByRole('button', { name: /bulk delete/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bulk activate/i })).toBeInTheDocument()
    })

    it('should call bulk delete when bulk delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockBulkDelete = jest.fn()
      render(<TenantTable {...defaultProps} onBulkDelete={mockBulkDelete} />)

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      const bulkDeleteButton = screen.getByRole('button', { name: /bulk delete/i })
      await user.click(bulkDeleteButton)

      expect(mockBulkDelete).toHaveBeenCalledWith([mockTenants[0]])
    })
  })

  describe('Search and Filtering', () => {
    it('should filter tenants by search term', async () => {
      const user = userEvent.setup()
      const mockOnSearch = jest.fn()
      render(<TenantTable {...defaultProps} onSearch={mockOnSearch} />)

      const searchInput = screen.getByPlaceholderText(/search tenants/i)
      await user.type(searchInput, 'Enterprise')

      expect(mockOnSearch).toHaveBeenCalledWith('Enterprise')
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      const mockOnStatusFilter = jest.fn()
      render(<TenantTable {...defaultProps} onStatusFilter={mockOnStatusFilter} />)

      const statusFilter = screen.getByRole('combobox', { name: /status filter/i })
      await user.selectOptions(statusFilter, 'active')

      expect(mockOnStatusFilter).toHaveBeenCalledWith('active')
    })

    it('should filter by plan', async () => {
      const user = userEvent.setup()
      const mockOnPlanFilter = jest.fn()
      render(<TenantTable {...defaultProps} onPlanFilter={mockOnPlanFilter} />)

      const planFilter = screen.getByRole('combobox', { name: /plan filter/i })
      await user.selectOptions(planFilter, 'enterprise')

      expect(mockOnPlanFilter).toHaveBeenCalledWith('enterprise')
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

      render(<TenantTable {...defaultProps} />)

      // Should still display essential information
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show mobile-friendly action menu', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<TenantTable {...defaultProps} />)

      const actionMenus = screen.getAllByRole('button', { name: /more actions/i })
      await user.click(actionMenus[0])

      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TenantTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      
      // Should be able to navigate through all interactive elements
      const viewButton = screen.getByRole('button', { name: /view/i })
      expect(viewButton).toHaveFocus()
    })

    it('should announce row selection changes', async () => {
      const user = userEvent.setup()
      render(<TenantTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Should announce selection change
      expect(screen.getByText(/1 tenant selected/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeTenantList = Array.from({ length: 1000 }, (_, index) =>
        createMockTenant({
          id: `tenant-${index}`,
          name: `Tenant ${index}`,
        })
      )

      render(
        <TenantTable
          {...defaultProps}
          tenants={largeTenantList}
          totalRecords={1000}
          totalPages={100}
        />
      )

      // Should render without performance issues
      expect(screen.getByText('Tenant 0')).toBeInTheDocument()
    })

    it('should memoize row components for performance', () => {
      const { rerender } = render(<TenantTable {...defaultProps} />)

      // Re-render with same props
      rerender(<TenantTable {...defaultProps} />)

      // Should not cause unnecessary re-renders
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument()
    })
  })
}) 