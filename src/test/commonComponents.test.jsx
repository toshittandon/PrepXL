import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../contexts/ThemeContext.jsx'
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  LoadingSpinner,
  Modal,
  ProgressBar,
  Select,
  SuccessMessage
} from '../components/common/index.js'

// Wrapper component for theme context
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('Common UI Components', () => {
  it('renders Button component with different variants', () => {
    render(
      <TestWrapper>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="danger">Danger Button</Button>
      </TestWrapper>
    )
    
    expect(screen.getByText('Primary Button')).toBeInTheDocument()
    expect(screen.getByText('Secondary Button')).toBeInTheDocument()
    expect(screen.getByText('Danger Button')).toBeInTheDocument()
  })

  it('renders Card component', () => {
    render(
      <TestWrapper>
        <Card>
          <p>Card content</p>
        </Card>
      </TestWrapper>
    )
    
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders ErrorMessage component', () => {
    render(
      <TestWrapper>
        <ErrorMessage message="This is an error message" />
      </TestWrapper>
    )
    
    expect(screen.getByText('This is an error message')).toBeInTheDocument()
  })

  it('renders SuccessMessage component', () => {
    render(
      <TestWrapper>
        <SuccessMessage message="This is a success message" />
      </TestWrapper>
    )
    
    expect(screen.getByText('This is a success message')).toBeInTheDocument()
  })

  it('renders Input component', () => {
    render(
      <TestWrapper>
        <Input 
          label="Test Input" 
          placeholder="Enter text here"
          data-testid="test-input"
        />
      </TestWrapper>
    )
    
    expect(screen.getByText('Test Input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument()
  })

  it('renders Select component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]

    render(
      <TestWrapper>
        <Select 
          label="Test Select" 
          options={options}
          placeholder="Select an option"
        />
      </TestWrapper>
    )
    
    expect(screen.getByText('Test Select')).toBeInTheDocument()
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('renders LoadingSpinner component', () => {
    const { container } = render(
      <TestWrapper>
        <LoadingSpinner />
      </TestWrapper>
    )
    
    // Check for the SVG element which is the main part of the spinner
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders ProgressBar component', () => {
    render(
      <TestWrapper>
        <ProgressBar 
          value={50} 
          max={100} 
          label="Progress" 
          showLabel={true}
          showPercentage={true}
        />
      </TestWrapper>
    )
    
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders Modal component when open', () => {
    render(
      <TestWrapper>
        <Modal 
          isOpen={true} 
          onClose={() => {}} 
          title="Test Modal"
        >
          <p>Modal content</p>
        </Modal>
      </TestWrapper>
    )
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })
})