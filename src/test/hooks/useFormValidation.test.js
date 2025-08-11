import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../../hooks/useFormValidation.js'
import * as yup from 'yup'

// Mock validation schemas
const mockLoginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
})

const mockSignupSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required')
})

describe('useFormValidation Hook', () => {
  describe('Basic Functionality', () => {
    it('initializes with empty values and no errors', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      expect(result.current.values).toEqual({ email: '', password: '' })
      expect(result.current.errors).toEqual({})
      expect(result.current.isValid).toBe(false)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('initializes with provided initial values', () => {
      const initialValues = { email: 'test@example.com', password: 'password123' }
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, initialValues)
      )
      
      expect(result.current.values).toEqual(initialValues)
    })
  })

  describe('Value Updates', () => {
    it('updates single field value', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      act(() => {
        result.current.setValue('email', 'test@example.com')
      })
      
      expect(result.current.values.email).toBe('test@example.com')
      expect(result.current.values.password).toBe('')
    })

    it('updates multiple field values', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      const newValues = { email: 'test@example.com', password: 'password123' }
      
      act(() => {
        result.current.setValues(newValues)
      })
      
      expect(result.current.values).toEqual(newValues)
    })

    it('handles field change events', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      const mockEvent = {
        target: {
          name: 'email',
          value: 'test@example.com'
        }
      }
      
      act(() => {
        result.current.handleChange(mockEvent)
      })
      
      expect(result.current.values.email).toBe('test@example.com')
    })
  })

  describe('Validation', () => {
    it('validates single field', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      await act(async () => {
        await result.current.validateField('email', 'invalid-email')
      })
      
      expect(result.current.errors.email).toBe('Invalid email')
    })

    it('clears field error when validation passes', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      // First set an error
      await act(async () => {
        await result.current.validateField('email', 'invalid-email')
      })
      
      expect(result.current.errors.email).toBe('Invalid email')
      
      // Then clear it with valid value
      await act(async () => {
        await result.current.validateField('email', 'test@example.com')
      })
      
      expect(result.current.errors.email).toBeUndefined()
    })

    it('validates all fields', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'invalid', password: '123' })
      )
      
      await act(async () => {
        await result.current.validateAll()
      })
      
      expect(result.current.errors.email).toBe('Invalid email')
      expect(result.current.errors.password).toBe('Password must be at least 6 characters')
      expect(result.current.isValid).toBe(false)
    })

    it('sets isValid to true when all validations pass', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'test@example.com', password: 'password123' })
      )
      
      await act(async () => {
        await result.current.validateAll()
      })
      
      expect(result.current.errors).toEqual({})
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      const mockSubmit = vi.fn().mockResolvedValue({ success: true })
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'test@example.com', password: 'password123' })
      )
      
      await act(async () => {
        await result.current.handleSubmit(mockSubmit)
      })
      
      expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
      expect(result.current.isSubmitting).toBe(false)
    })

    it('prevents submission when form is invalid', async () => {
      const mockSubmit = vi.fn()
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'invalid', password: '123' })
      )
      
      await act(async () => {
        await result.current.handleSubmit(mockSubmit)
      })
      
      expect(mockSubmit).not.toHaveBeenCalled()
      expect(result.current.errors.email).toBe('Invalid email')
      expect(result.current.errors.password).toBe('Password must be at least 6 characters')
    })

    it('sets isSubmitting during submission', async () => {
      let resolveSubmit
      const mockSubmit = vi.fn(() => new Promise(resolve => {
        resolveSubmit = resolve
      }))
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'test@example.com', password: 'password123' })
      )
      
      act(() => {
        result.current.handleSubmit(mockSubmit)
      })
      
      expect(result.current.isSubmitting).toBe(true)
      
      await act(async () => {
        resolveSubmit({ success: true })
      })
      
      expect(result.current.isSubmitting).toBe(false)
    })

    it('handles submission errors', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'))
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: 'test@example.com', password: 'password123' })
      )
      
      await act(async () => {
        await result.current.handleSubmit(mockSubmit)
      })
      
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.errors.submit).toBe('Submission failed')
    })
  })

  describe('Form Reset', () => {
    it('resets form to initial values', () => {
      const initialValues = { email: '', password: '' }
      
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, initialValues)
      )
      
      // Change values and add errors
      act(() => {
        result.current.setValues({ email: 'test@example.com', password: 'password123' })
        result.current.setErrors({ email: 'Some error' })
      })
      
      // Reset form
      act(() => {
        result.current.resetForm()
      })
      
      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.isValid).toBe(false)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('resets form to new values when provided', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      const newValues = { email: 'new@example.com', password: 'newpassword' }
      
      act(() => {
        result.current.resetForm(newValues)
      })
      
      expect(result.current.values).toEqual(newValues)
      expect(result.current.errors).toEqual({})
    })
  })

  describe('Complex Validation Scenarios', () => {
    it('handles password confirmation validation', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockSignupSchema, {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different'
        })
      )
      
      await act(async () => {
        await result.current.validateAll()
      })
      
      expect(result.current.errors.confirmPassword).toBe('Passwords must match')
    })

    it('validates dependent fields correctly', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockSignupSchema, {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      )
      
      await act(async () => {
        await result.current.validateAll()
      })
      
      expect(result.current.errors).toEqual({})
      expect(result.current.isValid).toBe(true)
    })

    it('revalidates dependent fields when password changes', async () => {
      const { result } = renderHook(() => 
        useFormValidation(mockSignupSchema, {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      )
      
      // Initially valid
      await act(async () => {
        await result.current.validateAll()
      })
      expect(result.current.isValid).toBe(true)
      
      // Change password
      act(() => {
        result.current.setValue('password', 'newpassword')
      })
      
      await act(async () => {
        await result.current.validateAll()
      })
      
      expect(result.current.errors.confirmPassword).toBe('Passwords must match')
    })
  })

  describe('Error Handling', () => {
    it('handles validation schema errors gracefully', async () => {
      const invalidSchema = null
      
      const { result } = renderHook(() => 
        useFormValidation(invalidSchema, { email: '', password: '' })
      )
      
      await act(async () => {
        await result.current.validateField('email', 'test@example.com')
      })
      
      // Should not crash and should not set any errors
      expect(result.current.errors).toEqual({})
    })

    it('handles missing field names in handleChange', () => {
      const { result } = renderHook(() => 
        useFormValidation(mockLoginSchema, { email: '', password: '' })
      )
      
      const mockEvent = {
        target: {
          value: 'test@example.com'
          // Missing name property
        }
      }
      
      act(() => {
        result.current.handleChange(mockEvent)
      })
      
      // Should not crash and values should remain unchanged
      expect(result.current.values).toEqual({ email: '', password: '' })
    })
  })
})