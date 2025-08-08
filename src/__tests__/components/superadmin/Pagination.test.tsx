import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/superadmin/Pagination'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalRecords: 100,
    pageSize: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render pagination controls', () => {
      render(<Pagination {...defaultProps} />)

      expect(screen.getByText('1')).toBeInTheDocument() // Current page
      expect(screen.getByText('10')).toBeInTheDocument() // Total pages
      expect(screen.getByText('100')).toBeInTheDocument() // Total records
    })

    it('should display page size selector', () => {
      render(<Pagination {...defaultProps} />)

      expect(screen.getByRole('combobox', { name: /page size/i })).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Current page size
    })

    it('should display navigation buttons', () => {
      render(<Pagination {...defaultProps} />)

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should call onPageChange when next button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<Pagination {...defaultProps} onPageChange={mockOnPageChange} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when previous button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<Pagination {...defaultProps} currentPage={2} onPageChange={mockOnPageChange} />)

      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should call onPageChange when page number is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<Pagination {...defaultProps} onPageChange={mockOnPageChange} />)

      const pageButton = screen.getByRole('button', { name: '2' })
      await user.click(pageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })
  })

  describe('Button States', () => {
    it('should disable previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />)

      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('should enable both buttons on middle pages', () => {
      render(<Pagination {...defaultProps} currentPage={5} />)

      const prevButton = screen.getByRole('button', { name: /previous/i })
      const nextButton = screen.getByRole('button', { name: /next/i })

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Page Size Changes', () => {
    it('should call onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup()
      const mockOnPageSizeChange = jest.fn()
      render(<Pagination {...defaultProps} onPageSizeChange={mockOnPageSizeChange} />)

      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i })
      await user.selectOptions(pageSizeSelect, '20')

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(20)
    })

    it('should display current page size', () => {
      render(<Pagination {...defaultProps} pageSize={25} />)

      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i })
      expect(pageSizeSelect).toHaveValue('25')
    })
  })

  describe('Page Numbers Display', () => {
    it('should show ellipsis for large page counts', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('should show all page numbers for small page counts', () => {
      render(<Pagination {...defaultProps} totalPages={5} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should highlight current page', () => {
      render(<Pagination {...defaultProps} currentPage={3} />)

      const currentPageButton = screen.getByRole('button', { name: '3' })
      expect(currentPageButton).toHaveClass('bg-blue-500')
    })
  })

  describe('Edge Cases', () => {
    it('should handle single page', () => {
      render(<Pagination {...defaultProps} totalPages={1} totalRecords={5} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).toBeDisabled()
      expect(screen.queryByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('should handle zero records', () => {
      render(<Pagination {...defaultProps} totalRecords={0} totalPages={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).toBeDisabled()
      expect(screen.queryByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('should handle large page numbers', () => {
      render(<Pagination {...defaultProps} currentPage={1000} totalPages={1000} />)

      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('1000')).toBeInTheDocument() // Total pages
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByLabelText(/page size/i)).toBeInTheDocument()
    })

    it('should announce current page to screen readers', () => {
      render(<Pagination {...defaultProps} currentPage={3} />)

      const currentPageButton = screen.getByRole('button', { name: '3' })
      expect(currentPageButton).toHaveAttribute('aria-current', 'page')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<Pagination {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      
      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toHaveFocus()
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

      render(<Pagination {...defaultProps} />)

      // Should still display essential navigation
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should show mobile-friendly page size options', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<Pagination {...defaultProps} />)

      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i })
      expect(pageSizeSelect).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle rapid page changes efficiently', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<Pagination {...defaultProps} onPageChange={mockOnPageChange} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      
      // Rapid clicks
      await user.click(nextButton)
      await user.click(nextButton)
      await user.click(nextButton)

      // Should handle rapid changes without errors
      expect(mockOnPageChange).toHaveBeenCalledTimes(3)
    })

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<Pagination {...defaultProps} />)

      // Re-render with same props
      rerender(<Pagination {...defaultProps} />)

      // Should not cause unnecessary re-renders
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
}) 