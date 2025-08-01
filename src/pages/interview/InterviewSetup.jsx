import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { databaseService } from '../../services/appwrite/database.js';
import { startSession, setLoading, setError } from '../../store/slices/interviewSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { selectInterviewLoading, selectInterviewError } from '../../store/slices/interviewSlice.js';
import { SESSION_TYPES } from '../../constants/index.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { interviewSetupSchema } from '../../utils/validationSchemas.js';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormField from '../../components/forms/FormField.jsx';
import FormRadioGroup from '../../components/forms/FormRadioGroup.jsx';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const loading = useSelector(selectInterviewLoading);
  const error = useSelector(selectInterviewError);

  const commonRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'UX/UI Designer',
    'DevOps Engineer',
    'Marketing Manager',
    'Sales Representative',
    'Business Analyst',
    'Project Manager',
    'Other'
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'lead', label: 'Lead/Principal (10+ years)' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Media & Entertainment',
    'Government',
    'Non-profit',
    'Other'
  ];

  const getSessionTypeDescription = (type) => {
    switch (type) {
      case SESSION_TYPES.BEHAVIORAL:
        return 'Focus on past experiences, soft skills, and situational questions';
      case SESSION_TYPES.TECHNICAL:
        return 'Technical questions related to your role and industry';
      case SESSION_TYPES.CASE_STUDY:
        return 'Problem-solving scenarios and business case analysis';
      default:
        return '';
    }
  };

  const sessionTypeOptions = Object.values(SESSION_TYPES).map(type => ({
    value: type,
    label: type,
    description: getSessionTypeDescription(type)
  }));

  const handleFormSubmit = async (data) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    dispatch(setLoading(true));

    try {
      // Prepare session data with all required fields for Appwrite collection
      const sessionData = {
        name: `${data.sessionType} Interview - ${data.role === 'Other' ? data.customRole : data.role}`,
        userId: user.id,
        title: `${data.sessionType} Interview - ${data.role === 'Other' ? data.customRole : data.role}`,
        description: `Interview session for ${data.role === 'Other' ? data.customRole : data.role} position`,
        status: 'active',
        role: data.role === 'Other' ? data.customRole : data.role,
        sessionType: data.sessionType,
        experienceLevel: data.experienceLevel,
        industry: data.industry || '',
        startedAt: new Date().toISOString(),
        finalScore: null,
        completedAt: null,
        content: JSON.stringify({
          role: data.role === 'Other' ? data.customRole : data.role,
          sessionType: data.sessionType,
          experienceLevel: data.experienceLevel,
          industry: data.industry,
          status: 'active',
          startedAt: new Date().toISOString(),
          finalScore: null,
          completedAt: null
        })
      };

      // Create session in database
      const result = await databaseService.createInterviewSession(sessionData);

      if (result.success) {
        // Update Redux state
        dispatch(startSession(result.data));
        
        // Navigate to live interview
        navigate(`/interview/live/${result.data.id}`);
      } else {
        throw new Error(result.error || 'Failed to create interview session');
      }
    } catch (err) {
      throw new Error(err.message || 'An unexpected error occurred');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    isSubmitting,
    submitError,
    getFieldError,
    isFieldTouched
  } = useFormValidation({
    schema: interviewSetupSchema,
    defaultValues: {
      role: '',
      sessionType: SESSION_TYPES.BEHAVIORAL,
      experienceLevel: 'mid',
      industry: '',
      customRole: ''
    },
    onSubmit: handleFormSubmit
  });

  const watchRole = watch('role');
  const watchSessionType = watch('sessionType');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Interview Setup
            </h1>
            <p className="text-gray-600">
              Configure your interview session parameters to get personalized questions.
            </p>
          </div>

          {(error || submitError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                {error || submitError || 'An error occurred'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <FormSelect
              label="Target Role"
              name="role"
              options={commonRoles}
              placeholder="Select a role..."
              error={getFieldError('role')}
              touched={isFieldTouched('role')}
              required
              showValidIcon
              {...register('role')}
            />

            {/* Custom Role Input */}
            {watchRole === 'Other' && (
              <FormField
                label="Custom Role"
                name="customRole"
                type="text"
                placeholder="Enter the specific role title"
                error={getFieldError('customRole')}
                touched={isFieldTouched('customRole')}
                required
                showValidIcon
                {...register('customRole')}
              />
            )}

            {/* Experience Level */}
            <FormSelect
              label="Experience Level"
              name="experienceLevel"
              options={experienceLevels}
              error={getFieldError('experienceLevel')}
              touched={isFieldTouched('experienceLevel')}
              required
              showValidIcon
              {...register('experienceLevel')}
            />

            {/* Industry */}
            <FormSelect
              label="Industry"
              name="industry"
              options={industries}
              placeholder="Select industry (optional)..."
              error={getFieldError('industry')}
              touched={isFieldTouched('industry')}
              showValidIcon
              {...register('industry')}
            />

            {/* Session Type */}
            <FormRadioGroup
              label="Interview Type"
              name="sessionType"
              options={sessionTypeOptions}
              error={getFieldError('sessionType')}
              touched={isFieldTouched('sessionType')}
              required
              {...register('sessionType')}
            />

            {/* Session Preview */}
            {watchRole && watchSessionType && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Session Preview</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Role:</span> {watchRole === 'Other' ? 'Custom Role' : watchRole}</p>
                  <p><span className="font-medium">Type:</span> {watchSessionType}</p>
                  <p className="text-blue-600 mt-2">
                    You'll receive personalized questions based on these parameters.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {(loading || isSubmitting) && <LoadingSpinner size="sm" inline />}
                <span>{(loading || isSubmitting) ? 'Creating Session...' : 'Start Interview'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;