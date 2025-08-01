import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resumeAnalysisService } from '../../../services/ai/resumeAnalysis.js';

// Mock fetch
global.fetch = vi.fn();

describe.skip('resumeAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    import.meta.env.VITE_AI_API_BASE_URL = 'https://api.example.com';
  });

  describe('analyzeResume', () => {
    const mockResumeText = `
      John Doe
      Software Engineer
      
      Experience:
      - Developed web applications using React and Node.js
      - Implemented REST APIs for mobile applications
      - Collaborated with cross-functional teams
      
      Skills: JavaScript, React, Node.js, Python, SQL
    `;

    const mockAnalysisResponse = {
      atsKeywords: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'REST APIs'],
      actionVerbs: ['Developed', 'Implemented', 'Collaborated'],
      quantificationSuggestions: [
        'Add specific metrics to "Developed web applications"',
        'Include team size for "Collaborated with cross-functional teams"',
        'Specify number of APIs implemented',
      ],
      overallScore: 75,
      recommendations: [
        'Include more quantifiable achievements',
        'Add specific technologies and frameworks',
        'Mention project outcomes and impact',
      ],
    };

    it('should analyze resume successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysisResponse }),
      });

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/analyze-resume',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resumeText: mockResumeText }),
        }
      );

      expect(result).toEqual({
        success: true,
        data: mockAnalysisResponse,
      });
    });

    it('should handle API error response', async () => {
      const errorResponse = {
        success: false,
        error: 'Invalid resume format',
        code: 'INVALID_FORMAT',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Invalid resume format',
        code: 'INVALID_FORMAT',
      });
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred while analyzing resume',
      });
    });

    it('should handle empty resume text', async () => {
      const result = await resumeAnalysisService.analyzeResume('');

      expect(result).toEqual({
        success: false,
        error: 'Resume text is required',
      });
    });

    it('should handle null resume text', async () => {
      const result = await resumeAnalysisService.analyzeResume(null);

      expect(result).toEqual({
        success: false,
        error: 'Resume text is required',
      });
    });

    it('should handle undefined resume text', async () => {
      const result = await resumeAnalysisService.analyzeResume(undefined);

      expect(result).toEqual({
        success: false,
        error: 'Resume text is required',
      });
    });

    it('should handle API timeout', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred while analyzing resume',
      });
    });

    it('should handle malformed JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Invalid response format from analysis service',
      });
    });

    it('should handle missing API base URL', async () => {
      import.meta.env.VITE_AI_API_BASE_URL = undefined;

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'AI API configuration is missing',
      });
    });

    it('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      });

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 60,
      });
    });

    it('should handle server errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error',
        }),
      });

      const result = await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(result).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should include request headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysisResponse }),
      });

      await resumeAnalysisService.analyzeResume(mockResumeText);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle very long resume text', async () => {
      const longResumeText = 'A'.repeat(50000); // 50KB of text

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysisResponse }),
      });

      const result = await resumeAnalysisService.analyzeResume(longResumeText);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ resumeText: longResumeText }),
        })
      );
    });

    it('should handle special characters in resume text', async () => {
      const specialCharResumeText = 'Resume with émojis 🚀 and spëcial chars: <>&"\'';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysisResponse }),
      });

      const result = await resumeAnalysisService.analyzeResume(specialCharResumeText);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ resumeText: specialCharResumeText }),
        })
      );
    });
  });

  describe('getAnalysisHistory', () => {
    it('should get analysis history for user', async () => {
      const mockHistory = [
        {
          id: 'analysis1',
          resumeId: 'resume1',
          createdAt: '2024-01-01T00:00:00Z',
          score: 85,
        },
        {
          id: 'analysis2',
          resumeId: 'resume2',
          createdAt: '2024-01-02T00:00:00Z',
          score: 78,
        },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHistory }),
      });

      const result = await resumeAnalysisService.getAnalysisHistory('user123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/analysis-history/user123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        success: true,
        data: mockHistory,
      });
    });

    it('should handle missing user ID', async () => {
      const result = await resumeAnalysisService.getAnalysisHistory();

      expect(result).toEqual({
        success: false,
        error: 'User ID is required',
      });
    });
  });

  describe('getAnalysisById', () => {
    it('should get specific analysis by ID', async () => {
      const mockAnalysis = {
        id: 'analysis123',
        resumeId: 'resume123',
        analysisResults: mockAnalysisResponse,
        createdAt: '2024-01-01T00:00:00Z',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysis }),
      });

      const result = await resumeAnalysisService.getAnalysisById('analysis123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/analysis/analysis123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        success: true,
        data: mockAnalysis,
      });
    });

    it('should handle analysis not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Analysis not found',
        }),
      });

      const result = await resumeAnalysisService.getAnalysisById('nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Analysis not found',
      });
    });
  });

  describe('error handling utilities', () => {
    it('should format error responses consistently', async () => {
      const errorCases = [
        { status: 400, message: 'Bad Request' },
        { status: 401, message: 'Unauthorized' },
        { status: 403, message: 'Forbidden' },
        { status: 404, message: 'Not Found' },
        { status: 500, message: 'Internal Server Error' },
      ];

      for (const errorCase of errorCases) {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: errorCase.status,
          json: async () => ({
            success: false,
            error: errorCase.message,
          }),
        });

        const result = await resumeAnalysisService.analyzeResume('test');
        expect(result.success).toBe(false);
        expect(result.error).toBe(errorCase.message);
      }
    });

    it('should handle fetch abort', async () => {
      fetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      const result = await resumeAnalysisService.analyzeResume('test');

      expect(result).toEqual({
        success: false,
        error: 'Request was cancelled',
      });
    });
  });
});