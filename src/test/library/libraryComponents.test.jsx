import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import libraryReducer from '../../store/slices/librarySlice.js'
import { SearchFilters, QuestionAccordion, QuestionCard } from '../../components/library'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  X: () => <div data-testid="x-icon">X</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Briefcase: () => <div data-testid="briefcase-icon">Briefcase</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  Lightbulb: () => <div data-testid="lightbulb-icon">Lightbulb</div>,
}))

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      library: libraryReducer,
    },
    preloadedState: {
      library: {
        questions: [],
        filteredQuestions: [],
        searchTerm: '',
        selectedCategory: '',
        selectedRole: '',
        loading: false,
        error: null,
        categories: ['Technical', 'Behavioral'],
        roles: ['Frontend Developer', 'Backend Developer'],
        ...initialState,
      },
    },
  })
}

const renderWithProvider = (component, initialState = {}) => {
  const store = createTestStore(initialState)
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('SearchFilters', () => {
  it('renders search input and filter dropdowns', () => {
    renderWithProvider(<SearchFilters />)
    
    expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument()
    expect(screen.getByText('All Categories')).toBeInTheDocument()
    expect(screen.getByText('All Roles')).toBeInTheDocument()
  })

  it('shows clear filters button when filters are active', () => {
    const initialState = {
      searchTerm: 'test',
    }
    renderWithProvider(<SearchFilters />, initialState)
    
    // The clear filters button should be present when there are active filters
    expect(screen.queryByText('Clear Filters')).toBeInTheDocument()
  })

  it('shows active filter indicators', () => {
    const initialState = {
      searchTerm: 'test',
      selectedCategory: 'Technical',
    }
    renderWithProvider(<SearchFilters />, initialState)
    
    // Active filter indicators should be shown
    expect(screen.queryByText('Active filters:')).toBeInTheDocument()
  })
})

describe('QuestionCard', () => {
  const mockQuestion = {
    id: '1',
    questionText: 'What is React?',
    category: 'Technical',
    role: 'Frontend Developer',
    suggestedAnswer: 'React is a JavaScript library for building user interfaces.',
  }

  it('renders question information correctly', () => {
    render(<QuestionCard question={mockQuestion} />)
    
    expect(screen.getByText('What is React?')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('React is a JavaScript library for building user interfaces.')).toBeInTheDocument()
  })

  it('handles missing question gracefully', () => {
    const { container } = render(<QuestionCard question={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('QuestionAccordion', () => {
  const mockQuestions = [
    {
      id: '1',
      questionText: 'What is React?',
      category: 'Technical',
      role: 'Frontend Developer',
      suggestedAnswer: 'React is a JavaScript library for building user interfaces.',
    },
    {
      id: '2',
      questionText: 'Tell me about yourself',
      category: 'Behavioral',
      role: 'Frontend Developer',
      suggestedAnswer: 'This is a common opening question...',
    },
  ]

  it('renders list of questions', () => {
    render(<QuestionAccordion questions={mockQuestions} />)
    
    expect(screen.getByText('What is React?')).toBeInTheDocument()
    expect(screen.getByText('Tell me about yourself')).toBeInTheDocument()
  })

  it('shows expand/collapse all button for multiple questions', () => {
    render(<QuestionAccordion questions={mockQuestions} />)
    
    expect(screen.getByText('Expand All')).toBeInTheDocument()
  })

  it('expands question when clicked', () => {
    render(<QuestionAccordion questions={mockQuestions} />)
    
    const questionButton = screen.getByText('What is React?').closest('button')
    fireEvent.click(questionButton)
    
    expect(screen.getByText('React is a JavaScript library for building user interfaces.')).toBeInTheDocument()
  })

  it('shows empty state when no questions provided', () => {
    render(<QuestionAccordion questions={[]} />)
    
    expect(screen.getByText('No Questions Found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search or filter criteria to find questions.')).toBeInTheDocument()
  })

  it('handles undefined questions array', () => {
    render(<QuestionAccordion questions={undefined} />)
    
    expect(screen.getByText('No Questions Found')).toBeInTheDocument()
  })
})