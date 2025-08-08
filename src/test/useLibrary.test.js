/**
 * Tests for library data management functionality
 */

import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import librarySlice, {
  setQuestions,
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  clearFilters,
  selectFilteredQuestions,
  selectCategories,
  selectRoles,
  selectHasActiveFilters
} from '../store/slices/librarySlice.js'

// Mock questions data
const mockQuestions = [
  {
    id: '1',
    questionText: 'Tell me about yourself',
    category: 'Behavioral',
    role: 'Software Engineer',
    suggestedAnswer: 'This is a sample answer...'
  },
  {
    id: '2',
    questionText: 'What is your experience with React?',
    category: 'Technical',
    role: 'Frontend Developer',
    suggestedAnswer: 'I have extensive experience...'
  },
  {
    id: '3',
    questionText: 'How do you handle conflict?',
    category: 'Behavioral',
    role: 'Team Lead',
    suggestedAnswer: 'I approach conflict by...'
  }
]

// Helper to create test store
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

describe('Library Data Management', () => {
  describe('Question Data Integration', () => {
    it('should integrate with RTK Query data correctly', () => {
      const store = createTestStore()
      
      // Simulate RTK Query data loading
      store.dispatch(setQuestions(mockQuestions))
      
      const state = store.getState()
      expect(selectFilteredQuestions(state)).toEqual(mockQuestions)
      expect(selectCategories(state)).toEqual(['Behavioral', 'Technical'])
      expect(selectRoles(state)).toEqual(['Frontend Developer', 'Software Engineer', 'Team Lead'])
    })

    it('should handle empty data gracefully', () => {
      const store = createTestStore()
      
      store.dispatch(setQuestions([]))
      
      const state = store.getState()
      expect(selectFilteredQuestions(state)).toEqual([])
      expect(selectCategories(state)).toEqual([])
      expect(selectRoles(state)).toEqual([])
    })
  })

  describe('Search and Filter Integration', () => {
    it('should combine search and category filters', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      // Apply both search and category filter
      store.dispatch(setSearchTerm('conflict'))
      store.dispatch(setSelectedCategory('Behavioral'))
      
      const state = store.getState()
      const filtered = selectFilteredQuestions(state)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].questionText).toContain('conflict')
      expect(filtered[0].category).toBe('Behavioral')
    })

    it('should combine search and role filters', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      // Apply both search and role filter
      store.dispatch(setSearchTerm('React'))
      store.dispatch(setSelectedRole('Frontend Developer'))
      
      const state = store.getState()
      const filtered = selectFilteredQuestions(state)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].questionText).toContain('React')
      expect(filtered[0].role).toBe('Frontend Developer')
    })

    it('should apply all three filters together', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      // Apply search, category, and role filters
      store.dispatch(setSearchTerm('yourself'))
      store.dispatch(setSelectedCategory('Behavioral'))
      store.dispatch(setSelectedRole('Software Engineer'))
      
      const state = store.getState()
      const filtered = selectFilteredQuestions(state)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].questionText).toContain('yourself')
      expect(filtered[0].category).toBe('Behavioral')
      expect(filtered[0].role).toBe('Software Engineer')
    })

    it('should detect when filters are active', () => {
      const store = createTestStore()
      
      let state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(false)
      
      store.dispatch(setSearchTerm('React'))
      state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(true)
      
      store.dispatch(clearFilters())
      store.dispatch(setSelectedCategory('Technical'))
      state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(true)
      
      store.dispatch(clearFilters())
      store.dispatch(setSelectedRole('Developer'))
      state = store.getState()
      expect(selectHasActiveFilters(state)).toBe(true)
    })
  })

  describe('Data Validation and Error Handling', () => {
    it('should handle malformed question data', () => {
      const store = createTestStore()
      
      const malformedQuestions = [
        {
          id: '1',
          questionText: 'Valid question',
          category: 'Behavioral',
          role: 'Engineer',
          suggestedAnswer: 'Valid answer'
        },
        {
          id: '2',
          // Missing required fields
          questionText: null,
          category: undefined,
          role: '',
          suggestedAnswer: ''
        }
      ]
      
      store.dispatch(setQuestions(malformedQuestions))
      
      const state = store.getState()
      expect(state.library.questions).toEqual(malformedQuestions)
      
      // Categories and roles should only include valid values
      expect(selectCategories(state)).toEqual(['Behavioral'])
      expect(selectRoles(state)).toEqual(['Engineer'])
    })

    it('should handle search with special characters', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      // Test search with special regex characters that don't match anything
      store.dispatch(setSearchTerm('xyz?'))
      
      const state = store.getState()
      const filtered = selectFilteredQuestions(state)
      
      // Should not crash and should return empty results
      expect(filtered).toHaveLength(0)
    })

    it('should handle case-insensitive search correctly', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      // Test various case combinations
      const searchTerms = ['react', 'REACT', 'React', 'rEaCt']
      
      searchTerms.forEach(term => {
        store.dispatch(setSearchTerm(term))
        const state = store.getState()
        const filtered = selectFilteredQuestions(state)
        expect(filtered).toHaveLength(1)
        expect(filtered[0].questionText).toContain('React')
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const store = createTestStore()
      
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        questionText: `Question ${i + 1} about ${i % 2 === 0 ? 'React' : 'JavaScript'}`,
        category: i % 3 === 0 ? 'Technical' : 'Behavioral',
        role: i % 4 === 0 ? 'Senior Engineer' : 'Junior Developer',
        suggestedAnswer: `Answer ${i + 1}`
      }))
      
      const startTime = performance.now()
      store.dispatch(setQuestions(largeDataset))
      
      // Apply filters
      store.dispatch(setSearchTerm('React'))
      store.dispatch(setSelectedCategory('Technical'))
      
      const state = store.getState()
      const filtered = selectFilteredQuestions(state)
      const endTime = performance.now()
      
      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Should return correct filtered results
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(q => q.questionText.includes('React'))).toBe(true)
      expect(filtered.every(q => q.category === 'Technical')).toBe(true)
    })

    it('should maintain referential equality for unchanged data', () => {
      const store = createTestStore()
      store.dispatch(setQuestions(mockQuestions))
      
      const state1 = store.getState()
      const categories1 = selectCategories(state1)
      const roles1 = selectRoles(state1)
      
      // Dispatch an action that doesn't change the questions
      store.dispatch(setSearchTerm(''))
      
      const state2 = store.getState()
      const categories2 = selectCategories(state2)
      const roles2 = selectRoles(state2)
      
      // Categories and roles should maintain referential equality
      expect(categories1).toBe(categories2)
      expect(roles1).toBe(roles2)
    })
  })
})