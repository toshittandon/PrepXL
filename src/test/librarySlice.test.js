/**
 * Tests for library slice and related functionality
 */

import { configureStore } from '@reduxjs/toolkit'
import librarySlice, {
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  setQuestions,
  clearFilters,
  addQuestion,
  updateQuestion,
  removeQuestion,
  selectFilteredQuestions,
  selectCategories,
  selectRoles,
  selectHasActiveFilters,
  selectFilteredQuestionsCount
} from '../store/slices/librarySlice.js'

// Mock questions data for testing
const mockQuestions = [
  {
    id: '1',
    questionText: 'Tell me about yourself',
    category: 'Behavioral',
    role: 'Software Engineer',
    suggestedAnswer: 'This is a sample answer about yourself...'
  },
  {
    id: '2',
    questionText: 'What is your experience with React?',
    category: 'Technical',
    role: 'Frontend Developer',
    suggestedAnswer: 'I have extensive experience with React...'
  },
  {
    id: '3',
    questionText: 'How do you handle conflict in a team?',
    category: 'Behavioral',
    role: 'Team Lead',
    suggestedAnswer: 'I approach conflict resolution by...'
  },
  {
    id: '4',
    questionText: 'Explain the concept of closures in JavaScript',
    category: 'Technical',
    role: 'Software Engineer',
    suggestedAnswer: 'Closures in JavaScript are...'
  }
]

// Helper function to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      library: librarySlice
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
        categories: [],
        roles: [],
        ...initialState
      }
    }
  })
}

describe('Library Slice', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().library
      expect(state.questions).toEqual([])
      expect(state.filteredQuestions).toEqual([])
      expect(state.searchTerm).toBe('')
      expect(state.selectedCategory).toBe('')
      expect(state.selectedRole).toBe('')
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.categories).toEqual([])
      expect(state.roles).toEqual([])
    })
  })

  describe('Questions Management', () => {
    it('should set questions and extract categories/roles', () => {
      store.dispatch(setQuestions(mockQuestions))
      
      const state = store.getState().library
      expect(state.questions).toEqual(mockQuestions)
      expect(state.filteredQuestions).toEqual(mockQuestions)
      expect(state.categories).toEqual(['Behavioral', 'Technical'])
      expect(state.roles).toEqual(['Frontend Developer', 'Software Engineer', 'Team Lead'])
    })

    it('should add a new question', () => {
      store.dispatch(setQuestions(mockQuestions))
      
      const newQuestion = {
        id: '5',
        questionText: 'What is your greatest weakness?',
        category: 'Behavioral',
        role: 'Manager',
        suggestedAnswer: 'My greatest weakness is...'
      }
      
      store.dispatch(addQuestion(newQuestion))
      
      const state = store.getState().library
      expect(state.questions).toHaveLength(5)
      expect(state.questions[4]).toEqual(newQuestion)
      expect(state.roles).toContain('Manager')
    })

    it('should update an existing question', () => {
      store.dispatch(setQuestions(mockQuestions))
      
      const updatedQuestion = {
        ...mockQuestions[0],
        questionText: 'Updated: Tell me about yourself'
      }
      
      store.dispatch(updateQuestion(updatedQuestion))
      
      const state = store.getState().library
      expect(state.questions[0].questionText).toBe('Updated: Tell me about yourself')
    })

    it('should remove a question', () => {
      store.dispatch(setQuestions(mockQuestions))
      
      store.dispatch(removeQuestion('1'))
      
      const state = store.getState().library
      expect(state.questions).toHaveLength(3)
      expect(state.questions.find(q => q.id === '1')).toBeUndefined()
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      store.dispatch(setQuestions(mockQuestions))
    })

    it('should filter by search term', () => {
      store.dispatch(setSearchTerm('React'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].questionText).toContain('React')
    })

    it('should filter by category', () => {
      store.dispatch(setSelectedCategory('Behavioral'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(2)
      expect(state.filteredQuestions.every(q => q.category === 'Behavioral')).toBe(true)
    })

    it('should filter by role', () => {
      store.dispatch(setSelectedRole('Software Engineer'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(2)
      expect(state.filteredQuestions.every(q => q.role === 'Software Engineer')).toBe(true)
    })

    it('should apply multiple filters', () => {
      store.dispatch(setSelectedCategory('Technical'))
      store.dispatch(setSelectedRole('Software Engineer'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].id).toBe('4')
    })

    it('should clear all filters', () => {
      store.dispatch(setSearchTerm('React'))
      store.dispatch(setSelectedCategory('Technical'))
      store.dispatch(setSelectedRole('Frontend Developer'))
      
      store.dispatch(clearFilters())
      
      const state = store.getState().library
      expect(state.searchTerm).toBe('')
      expect(state.selectedCategory).toBe('')
      expect(state.selectedRole).toBe('')
      expect(state.filteredQuestions).toEqual(mockQuestions)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      store.dispatch(setQuestions(mockQuestions))
    })

    it('should select filtered questions', () => {
      store.dispatch(setSelectedCategory('Behavioral'))
      
      const state = store.getState()
      const filteredQuestions = selectFilteredQuestions(state)
      
      expect(filteredQuestions).toHaveLength(2)
      expect(filteredQuestions.every(q => q.category === 'Behavioral')).toBe(true)
    })

    it('should select categories', () => {
      const state = store.getState()
      const categories = selectCategories(state)
      
      expect(categories).toEqual(['Behavioral', 'Technical'])
    })

    it('should select roles', () => {
      const state = store.getState()
      const roles = selectRoles(state)
      
      expect(roles).toEqual(['Frontend Developer', 'Software Engineer', 'Team Lead'])
    })

    it('should detect active filters', () => {
      let state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(false)
      
      store.dispatch(setSearchTerm('React'))
      state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(true)
      
      store.dispatch(clearFilters())
      store.dispatch(setSelectedCategory('Technical'))
      state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(true)
    })

    it('should count filtered questions', () => {
      store.dispatch(setSelectedCategory('Technical'))
      
      const state = store.getState()
      const count = selectFilteredQuestionsCount(state)
      
      expect(count).toBe(2)
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      store.dispatch(setQuestions(mockQuestions))
    })

    it('should search in question text', () => {
      store.dispatch(setSearchTerm('yourself'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].questionText).toContain('yourself')
    })

    it('should search in category', () => {
      store.dispatch(setSearchTerm('behavioral'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(2)
      expect(state.filteredQuestions.every(q => q.category === 'Behavioral')).toBe(true)
    })

    it('should search in role', () => {
      store.dispatch(setSearchTerm('frontend'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].role).toContain('Frontend')
    })

    it('should search in suggested answer', () => {
      store.dispatch(setSearchTerm('extensive experience'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].suggestedAnswer).toContain('extensive experience')
    })

    it('should be case insensitive', () => {
      store.dispatch(setSearchTerm('REACT'))
      
      const state = store.getState().library
      expect(state.filteredQuestions).toHaveLength(1)
      expect(state.filteredQuestions[0].questionText).toContain('React')
    })
  })

  describe('Error Handling', () => {
    it('should handle empty questions array', () => {
      store.dispatch(setQuestions([]))
      
      const state = store.getState().library
      expect(state.questions).toEqual([])
      expect(state.filteredQuestions).toEqual([])
      expect(state.categories).toEqual([])
      expect(state.roles).toEqual([])
    })

    it('should handle questions with missing fields', () => {
      const incompleteQuestions = [
        {
          id: '1',
          questionText: 'Test question',
          // Missing category, role, suggestedAnswer
        }
      ]
      
      store.dispatch(setQuestions(incompleteQuestions))
      
      const state = store.getState().library
      expect(state.questions).toEqual(incompleteQuestions)
      expect(state.categories).toEqual([])
      expect(state.roles).toEqual([])
    })

    it('should handle null/undefined values gracefully', () => {
      const questionsWithNulls = [
        {
          id: '1',
          questionText: 'Test question',
          category: null,
          role: undefined,
          suggestedAnswer: ''
        }
      ]
      
      store.dispatch(setQuestions(questionsWithNulls))
      
      const state = store.getState().library
      expect(state.categories).toEqual([])
      expect(state.roles).toEqual([])
    })
  })
})

// Export for use in other test files
export { mockQuestions, createTestStore }