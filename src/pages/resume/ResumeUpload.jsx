import { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectUploading, 
  selectUploadProgress, 
  selectResumeError,
  clearError,
  setError,
  uploadAndAnalyzeResumeThunk
} from '../../store/slices/resumeSlice';
import { selectUser } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const user = useSelector(selectUser);
  const uploading = useSelector(selectUploading);
  const uploadProgress = useSelector(selectUploadProgress);
  const error = useSelector(selectResumeError);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // File validation constants
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
    }
    
    if (file.size > MAX_SIZE) {
      throw new Error('File size too large. Please upload a file smaller than 5MB.');
    }
    
    return true;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return '📄';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '📝';
      case 'text/plain':
        return '📃';
      default:
        return '📄';
    }
  };

  const handleFileSelect = useCallback((file) => {
    dispatch(clearError());
    
    try {
      validateFile(file);
      setSelectedFile(file);
      
      // Create file preview
      setFilePreview({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        icon: getFileIcon(file.type),
        lastModified: new Date(file.lastModified).toLocaleDateString()
      });
    } catch (err) {
      dispatch(setError(err.message));
      setSelectedFile(null);
      setFilePreview(null);
    }
  }, [dispatch]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      const result = await dispatch(uploadAndAnalyzeResumeThunk({
        file: selectedFile,
        userId: user.id
      })).unwrap();

      // Navigate to analysis page after successful upload and analysis
      setTimeout(() => {
        navigate('/resume/analysis', { state: { resumeId: result.id } });
      }, 1000);
    } catch (err) {
      // Error is already handled by the thunk and stored in state
      console.error('Upload failed:', err);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFilePreview(null);
    dispatch(clearError());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (uploading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Uploading Resume...</h2>
              <p className="text-gray-600 mb-4">Please wait while we upload your resume.</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resume Upload
              </h1>
              <p className="text-gray-600 mt-1">
                Upload your resume for AI-powered analysis and feedback.
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => dispatch(clearError())}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              className={`mt-8 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop your resume here' : 'Upload your resume'}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop your file here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supports PDF, DOC, DOCX, TXT files up to 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            /* File Preview */
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Preview</h3>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                    {filePreview.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {filePreview.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {filePreview.size} • {filePreview.lastModified}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {filePreview.type}
                  </p>
                </div>
                <div className="flex-shrink-0 flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="px-4 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upload & Analyze
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Guidelines */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Upload Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Supported formats: PDF, DOC, DOCX, TXT</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Ensure your resume contains clear sections for experience, skills, and education</li>
              <li>• Remove any sensitive personal information before uploading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;