import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useFormValidation from '../../hooks/useFormValidation.js'
import * as yup from 'yup'

// Test schema
const testSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required')
})

describe('useFormValidation Hook', () => {
  let mockOnSubmit

  beforeEach(() => {
    mockOnSubmit = vi.fn()
  })

  it('should initialize with empty values and no errors', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    expect(result.current.values).toEqual({})
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isValid).toBe(false)
  })

  it('should initialize with provided initial values', () => {
    const initialValues = {
      email: 'test@example.com',
      name: 'John Doe'
    }

    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit, initialValues)
    )

    expect(result.current.values).toEqual(initialValues)
  })

  it('should handle value changes', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    act(() => {
      result.current.handleChange('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.touched.email).toBe(true)
  })

  it('should validate field on blur', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    await act(async () => {
      result.current.handleBlur('email')
    })

    expect(result.current.errors.email).toBe('Email is required')
    expect(result.current.touched.email).toBe(true)
  })

  it('should validate field with invalid value', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    act(() => {
      result.current.handleChange('email', 'invalid-email')
    })

    await act(async () => {
      result.current.handleBlur('email')
    })

    expect(result.current.errors.email).toBe('Invalid email')
  })

  it('should clear error when field becomes valid', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    // Set invalid value first
    act(() => {
      result.current.handleChange('email', 'invalid-email')
    })

    await act(async () => {
      result.current.handleBlur('email')
    })

    expect(result.current.errors.email).toBe('Invalid email')

    // Fix the value
    act(() => {
      result.current.handleChange('email', 'valid@example.com')
    })

    await act(async () => {
      result.current.handleBlur('email')
    })

    expect(result.current.errors.email).toBeUndefined()
  })

  it('should handle form submission with valid data', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    const validData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe'
    }

    // Set valid values
    act(() => {
      Object.entries(validData).forEach(([key, value]) => {
        result.current.handleChange(key, value)
      })
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).toHaveBeenCalledWith(validData)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should prevent submission with invalid data', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    const invalidData = {
      email: 'invalid-email',
      password: '123', // too short
      name: 'J' // too short
    }

    // Set invalid values
    act(() => {
      Object.entries(invalidData).forEach(([key, value]) => {
        result.current.handleChange(key, value)
      })
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.email).toBe('Invalid email')
    expect(result.current.errors.password).toBe('Password must be at least 6 characters')
    expect(result.current.errors.name).toBe('Name must be at least 2 characters')
  })

  it('should set isSubmitting during submission', async () => {
    const slowOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, slowOnSubmit)
    )

    const validData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe'
    }

    // Set valid values
    act(() => {
      Object.entries(validData).forEach(([key, value]) => {
        result.current.handleChange(key, value)
      })
    })

    // Start submission
    const submitPromise = act(async () => {
      await result.current.handleSubmit()
    })

    // Check that isSubmitting is true during submission
    expect(result.current.isSubmitting).toBe(true)

    // Wait for submission to complete
    await submitPromise

    expect(result.current.isSubmitting).toBe(false)
    expect(slowOnSubmit).toHaveBeenCalled()
  })

  it('should handle submission errors', async () => {
    const errorOnSubmit = vi.fn(() => {
      throw new Error('Submission failed')
    })
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, errorOnSubmit)
    )

    const validData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe'
    }

    // Set valid values
    act(() => {
      Object.entries(validData).forEach(([key, value]) => {
        result.current.handleChange(key, value)
      })
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.isSubmitting).toBe(false)
    expect(errorOnSubmit).toHaveBeenCalled()
  })

  it('should reset form', () => {
    const initialValues = {
      email: 'initial@example.com',
      name: 'Initial Name'
    }

    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit, initialValues)
    )

    // Change values and add errors
    act(() => {
      result.current.handleChange('email', 'changed@example.com')
      result.current.handleChange('name', 'Changed Name')
    })

    act(() => {
      result.current.handleBlur('password') // This will add an error
    })

    // Reset form
    act(() => {
      result.current.resetForm()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('should reset form to new values', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    const newValues = {
      email: 'new@example.com',
      name: 'New Name'
    }

    act(() => {
      result.current.resetForm(newValues)
    })

    expect(result.current.values).toEqual(newValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('should set field error manually', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    act(() => {
      result.current.setFieldError('email', 'Custom error message')
    })

    expect(result.current.errors.email).toBe('Custom error message')
  })

  it('should set field value manually', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    act(() => {
      result.current.setFieldValue('email', 'manual@example.com')
    })

    expect(result.current.values.email).toBe('manual@example.com')
    expect(result.current.touched.email).toBe(true)
  })

  it('should calculate isValid correctly', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, mockOnSubmit)
    )

    // Initially invalid (no values)
    expect(result.current.isValid).toBe(false)

    // Set valid values
    act(() => {
      result.current.handleChange('email', 'test@example.com')
      result.current.handleChange('password', 'password123')
      result.current.handleChange('name', 'John Doe')
    })

    // Should be valid now
    expect(result.current.isValid).toBe(true)

    // Set invalid value
    act(() => {
      result.current.handleChange('email', 'invalid-email')
    })

    await act(async () => {
      result.current.handleBlur('email')
    })

    // Should be invalid now
    expect(result.current.isValid).toBe(false)
  })

  it('should handle nested object validation', () => {
    const nestedSchema = yup.object({
      user: yup.object({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email').required('Email is required')
      })
    })

    const { result } = renderHook(() => 
      useFormValidation(nestedSchema, mockOnSubmit)
    )

    act(() => {
      result.current.handleChange('user.name', 'John Doe')
      result.current.handleChange('user.email', 'john@example.com')
    })

    expect(result.current.values).toEqual({
      user: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })
  })

  it('should handle array validation', () => {
    const arraySchema = yup.object({
      tags: yup.array().of(yup.string().required()).min(1, 'At least one tag is required')
    })

    const { result } = renderHook(() => 
      useFormValidation(arraySchema, mockOnSubmit)
    )

    act(() => {
      result.current.handleChange('tags', ['tag1', 'tag2'])
    })

    expect(result.current.values.tags).toEqual(['tag1', 'tag2'])
  })
})