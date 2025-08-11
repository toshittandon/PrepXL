import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import Modal from '../../components/common/Modal.jsx'

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn()
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    // Click on backdrop (the overlay div)
    const backdrop = screen.getByTestId('modal-backdrop')
    fireEvent.click(backdrop)
    
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', () => {
    const handleClose = vi.fn()
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    fireEvent.click(screen.getByText('Modal content'))
    
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('renders without title when not provided', () => {
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByText('Modal content')).toBeInTheDocument()
    // Should not have a title element
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <Modal 
          isOpen={true} 
          onClose={() => {}} 
          title="Test Modal"
          className="custom-modal"
        >
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('custom-modal')
  })

  it('supports different sizes', () => {
    const { rerender } = render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} size="sm">
          <p>Small modal</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
    
    rerender(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} size="lg">
          <p>Large modal</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl')
  })
})