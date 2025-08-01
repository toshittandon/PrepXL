import { baseApi } from './baseApi.js';
import { databaseService } from '../../services/appwrite/database.js';
import { storageService } from '../../services/appwrite/storage.js';
import { resumeAnalysisService } from '../../services/ai/resumeAnalysis.js';

// Resume API slice extending the base API
export const resumeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Upload resume file
    uploadResume: builder.mutation({
      queryFn: async ({ file, userId }) => {
        try {
          // Upload file to storage
          const uploadResult = await storageService.uploadResume(file, userId);
          
          if (!uploadResult.success) {
            return { error: uploadResult.error };
          }

          // Create resume record in database
          const resumeData = {
            userId,
            fileId: uploadResult.data.id,
            fileName: uploadResult.data.name,
            fileSize: uploadResult.data.size,
            mimeType: uploadResult.data.mimeType,
            uploadedAt: uploadResult.data.createdAt,
            analysisResults: null,
            analysisStatus: 'pending'
          };

          const dbResult = await databaseService.createResume(resumeData);
          
          if (!dbResult.success) {
            // If database creation fails, clean up uploaded file
            await storageService.deleteFile(uploadResult.data.id);
            return { error: dbResult.error };
          }

          return {
            data: {
              ...dbResult.data,
              downloadUrl: uploadResult.data.downloadUrl
            }
          };
        } catch (error) {
          return { error: { message: error.message || 'Upload failed' } };
        }
      },
      invalidatesTags: ['Resume', 'Dashboard'],
    }),

    // Analyze resume
    analyzeResume: builder.mutation({
      queryFn: async ({ resumeId, resumeText }) => {
        try {
          // Validate resume text
          resumeAnalysisService.validateResumeContent(resumeText);

          // Perform AI analysis
          const analysisResult = await resumeAnalysisService.analyzeResume(resumeText);
          
          if (!analysisResult.success) {
            return { error: analysisResult.error };
          }

          // Update resume record with analysis results
          const updateData = {
            analysisResults: analysisResult.data.analysisResults,
            analysisStatus: 'completed',
            analyzedAt: new Date().toISOString()
          };

          const dbResult = await databaseService.updateResume(resumeId, updateData);
          
          if (!dbResult.success) {
            return { error: dbResult.error };
          }

          return {
            data: {
              resumeId,
              analysisResults: analysisResult.data.analysisResults
            }
          };
        } catch (error) {
          // Update resume status to failed
          await databaseService.updateResume(resumeId, {
            analysisStatus: 'failed',
            analysisError: error.message
          });

          return { error: { message: error.message || 'Analysis failed' } };
        }
      },
      invalidatesTags: (result, error, { resumeId }) => [
        { type: 'Resume', id: resumeId },
        'Dashboard'
      ],
    }),

    // Upload and analyze resume in one step
    uploadAndAnalyzeResume: builder.mutation({
      queryFn: async ({ file, userId }) => {
        try {
          // Step 1: Upload file
          const uploadResult = await storageService.uploadResume(file, userId);
          
          if (!uploadResult.success) {
            return { error: uploadResult.error };
          }

          // Step 2: Create resume record
          const resumeData = {
            userId,
            fileId: uploadResult.data.id,
            fileName: uploadResult.data.name,
            fileSize: uploadResult.data.size,
            mimeType: uploadResult.data.mimeType,
            uploadedAt: uploadResult.data.createdAt,
            analysisResults: null,
            analysisStatus: 'analyzing'
          };

          const dbResult = await databaseService.createResume(resumeData);
          
          if (!dbResult.success) {
            await storageService.deleteFile(uploadResult.data.id);
            return { error: dbResult.error };
          }

          // Step 3: Extract text from file
          let resumeText;
          try {
            resumeText = await resumeAnalysisService.extractTextFromFile(file);
          } catch (textError) {
            // Update status to failed
            await databaseService.updateResume(dbResult.data.id, {
              analysisStatus: 'failed',
              analysisError: 'Failed to extract text from file'
            });
            return { error: { message: 'Failed to extract text from file' } };
          }

          // Step 4: Analyze resume
          const analysisResult = await resumeAnalysisService.analyzeResume(resumeText);
          
          if (!analysisResult.success) {
            await databaseService.updateResume(dbResult.data.id, {
              analysisStatus: 'failed',
              analysisError: analysisResult.error?.message || 'Analysis failed'
            });
            return { error: analysisResult.error };
          }

          // Step 5: Update resume with analysis results
          const finalUpdateData = {
            analysisResults: analysisResult.data.analysisResults,
            analysisStatus: 'completed',
            analyzedAt: new Date().toISOString()
          };

          const finalDbResult = await databaseService.updateResume(dbResult.data.id, finalUpdateData);
          
          if (!finalDbResult.success) {
            return { error: finalDbResult.error };
          }

          return {
            data: {
              ...finalDbResult.data,
              downloadUrl: uploadResult.data.downloadUrl
            }
          };
        } catch (error) {
          return { error: { message: error.message || 'Upload and analysis failed' } };
        }
      },
      invalidatesTags: ['Resume', 'Dashboard'],
    }),

    // Get user's resumes
    getUserResumes: builder.query({
      queryFn: async (userId) => {
        try {
          const result = await databaseService.getUserResumes(userId);
          
          if (!result.success) {
            return { error: result.error };
          }

          return { data: result.data };
        } catch (error) {
          return { error: { message: error.message || 'Failed to fetch resumes' } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Resume', id })),
              { type: 'Resume', id: 'LIST' },
            ]
          : [{ type: 'Resume', id: 'LIST' }],
    }),

    // Get single resume
    getResume: builder.query({
      queryFn: async (resumeId) => {
        try {
          const result = await databaseService.getResume(resumeId);
          
          if (!result.success) {
            return { error: result.error };
          }

          return { data: result.data };
        } catch (error) {
          return { error: { message: error.message || 'Failed to fetch resume' } };
        }
      },
      providesTags: (result, error, resumeId) => [{ type: 'Resume', id: resumeId }],
    }),

    // Delete resume
    deleteResume: builder.mutation({
      queryFn: async ({ resumeId, fileId }) => {
        try {
          // Delete from database first
          const dbResult = await databaseService.deleteResume(resumeId);
          
          if (!dbResult.success) {
            return { error: dbResult.error };
          }

          // Delete file from storage
          if (fileId) {
            const storageResult = await storageService.deleteFile(fileId);
            if (!storageResult.success) {
              console.warn('Failed to delete file from storage:', storageResult.error);
              // Don't fail the entire operation if storage deletion fails
            }
          }

          return { data: { message: 'Resume deleted successfully' } };
        } catch (error) {
          return { error: { message: error.message || 'Failed to delete resume' } };
        }
      },
      invalidatesTags: (result, error, { resumeId }) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
        'Dashboard'
      ],
    }),

    // Get resume download URL
    getResumeDownloadUrl: builder.query({
      queryFn: async (fileId) => {
        try {
          const result = storageService.getFileDownload(fileId);
          
          if (!result.success) {
            return { error: result.error };
          }

          return { data: result.data };
        } catch (error) {
          return { error: { message: error.message || 'Failed to get download URL' } };
        }
      },
    }),

    // Extract text from uploaded file
    extractResumeText: builder.mutation({
      queryFn: async ({ fileId }) => {
        try {
          const result = await storageService.extractTextFromFile(fileId);
          
          if (!result.success) {
            return { error: result.error };
          }

          return { data: { text: result.data } };
        } catch (error) {
          return { error: { message: error.message || 'Failed to extract text' } };
        }
      },
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useUploadResumeMutation,
  useAnalyzeResumeMutation,
  useUploadAndAnalyzeResumeMutation,
  useGetUserResumesQuery,
  useGetResumeQuery,
  useDeleteResumeMutation,
  useGetResumeDownloadUrlQuery,
  useExtractResumeTextMutation,
} = resumeApi;