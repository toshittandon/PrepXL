import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base query with common configuration
const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers, { getState }) => {
    // Add authentication headers if user is logged in
    const token = getState().auth.session?.access_token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Base API slice that other API slices will extend
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Resume', 
    'InterviewSession',
    'Interaction',
    'Dashboard',
    'Report',
  ],
  endpoints: () => ({}),
});

// Export hooks for usage in functional components
export const {
  // This will be populated by injected endpoints
} = baseApi;