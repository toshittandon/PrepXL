import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base query configuration for RTK Query
const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers, { getState }) => {
    // Add authentication headers if user is logged in
    const token = getState().auth.session?.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    headers.set('content-type', 'application/json')
    return headers
  },
})

// Base query with error handling and retry logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  
  // Handle authentication errors
  if (result.error && result.error.status === 401) {
    // Dispatch logout action if unauthorized
    api.dispatch({ type: 'auth/logout' })
  }
  
  return result
}

// Create base API slice
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Resume', 
    'InterviewSession',
    'Interaction',
    'Question',
    'Analytics'
  ],
  endpoints: () => ({})
})

export default baseApi