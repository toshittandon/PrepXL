import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectResumes, 
  selectCurrentAnalysis, 
  selectResumeLoading, 
  selectResumeError,
  fetchUserResumesThunk,
  setCurrentAnalysis
} from '../../store/slices/resumeSlice';
import { selectUser } from '../../store/slices/authSlice';
import { AnalysisCard } from '../../components/resume';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ResumeAnalysis = () => {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const user = useSelector(selectUser);
  const resumes = useSelector(selectResumes);
  const currentAnalysis = useSelector(selectCurrentAnalysis);
  const loading = useSelector(selectResumeLoading);
  const error = useSelector(selectResumeError);
  
  const [resume, setResume] = useState(null);

  // Get resume ID from params or location state
  const targetResumeId = resumeId || location.state?.resumeId;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If we don't have resumes loaded, fetch them
    if (resumes.length === 0) {
      dispatch(fetchUserResumesThunk(user.id));
    }
  }, [user, resumes.length, dispatch, navigate]);

  useEffect(() => {
    if (targetResumeId && resumes.length > 0) {
      const foundResume = resumes.find(r => r.id === targetResumeId);
      if (foundResume) {
        setResume(foundResume);
        if (foundResume.analysisResults) {
          dispatch(setCurrentAnalysis(foundResume.analysisResults));
        }
      }
    }
  }, [targetResumeId, resumes, dispatch]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToUpload = () => {
    navigate('/resume/upload');
  };

  if (loading) {
    return <LoadingSpinner message="Loading resume analysis..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analysis</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleBackToUpload}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Upload New Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Resume Not Found</h2>
              <p className="text-gray-600 mb-4">The requested resume could not be found.</p>
              <div className="space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleBackToUpload}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Upload New Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentAnalysis || !resume.analysisResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-yellow-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Pending</h2>
              <p className="text-gray-600 mb-4">
                Your resume "{resume.fileName}" is still being analyzed. Please check back in a few moments.
              </p>
              <div className="space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analysis = currentAnalysis;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resume Analysis Results
              </h1>
              <p className="text-gray-600 mt-1">
                Analysis for "{resume.fileName}"
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Analyzed on {new Date(resume.analyzedAt || resume.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleBackToUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload New Resume
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="lg:col-span-1">
            <AnalysisCard
              title="Overall Score"
              type="score"
              score={analysis.overallScore}
              description="Based on ATS compatibility, keyword optimization, and content quality"
              variant="info"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* ATS Compatibility */}
          <div className="lg:col-span-2">
            <AnalysisCard
              title="ATS Compatibility"
              type="score"
              score={analysis.atsCompatibility?.score || 0}
              description="How well your resume works with Applicant Tracking Systems"
              variant={analysis.atsCompatibility?.score >= 80 ? 'success' : analysis.atsCompatibility?.score >= 60 ? 'warning' : 'error'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Main Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* ATS Keywords */}
          <AnalysisCard
            title="ATS Keywords"
            items={analysis.atsKeywords || []}
            variant="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />

          {/* Action Verbs */}
          <AnalysisCard
            title="Strong Action Verbs"
            items={analysis.actionVerbs || []}
            variant="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          {/* Strengths */}
          <AnalysisCard
            title="Strengths"
            items={analysis.strengths || []}
            variant="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            }
          />

          {/* Areas for Improvement */}
          <AnalysisCard
            title="Areas for Improvement"
            items={analysis.improvements || []}
            variant="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
        </div>

        {/* Quantification Suggestions */}
        <div className="mt-6">
          <AnalysisCard
            title="Quantification Suggestions"
            items={analysis.quantificationSuggestions || []}
            variant="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
        </div>

        {/* ATS Issues */}
        {analysis.atsCompatibility?.issues && analysis.atsCompatibility.issues.length > 0 && (
          <div className="mt-6">
            <AnalysisCard
              title="ATS Compatibility Issues"
              items={analysis.atsCompatibility.issues}
              variant="error"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBackToUpload}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Updated Resume
              </button>
              <button
                onClick={() => navigate('/interview/setup')}
                className="px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Interview Practice
              </button>
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;