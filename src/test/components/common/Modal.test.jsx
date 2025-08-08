import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import Modal from '../../../components/common/Modal.jsx'

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('Modal Component', () => {
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

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn()
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
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
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
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
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} size="lg" title="Large Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    const modalDialog = screen.getByRole('dialog')
    expect(modalDialog).toHaveClass('max-w-4xl')
  })

  it('renders with footer', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    )
    
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Modal with Footer" footer={footer}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('prevents body scroll when open', () => {
    const { rerender } = render(
      <TestWrapper>
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(document.body.style.overflow).toBe('')
    
    rerender(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(
      <TestWrapper>
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(document.body.style.overflow).toBe('')
  })

  it('focuses modal when opened', () => {
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveFocus()
  })

  it('traps focus within modal', () => {
    render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <input data-testid="first-input" />
          <input data-testid="second-input" />
        </Modal>
      </TestWrapper>
    )
    
    const firstInput = screen.getByTestId('first-input')
    const secondInput = screen.getByTestId('second-input')
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    // Tab should cycle through focusable elements
    fireEvent.keyDown(document.activeElement, { key: 'Tab' })
    expect(closeButton).toHaveFocus()
    
    fireEvent.keyDown(document.activeElement, { key: 'Tab' })
    expect(firstInput).toHaveFocus()
    
    fireEvent.keyDown(document.activeElement, { key: 'Tab' })
    expect(secondInput).toHaveFocus()
  })
})