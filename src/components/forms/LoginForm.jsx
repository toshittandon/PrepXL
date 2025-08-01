import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, selectAuthLoading, selectAuthError } from '../../store/slices/authSlice.js';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { loginSchema } from '../../utils/validationSchemas.js';
import { getErrorMessage } from '../../utils/errorHandling.js';
import FormField from './FormField.jsx';

const LoginForm = ({ onSuccess, onSwitchToSignup }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const handleFormSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(loginUser({
      email: data.email,
      password: data.password
    })).unwrap();
    
    if (onSuccess) {
      onSuccess(result);
    }
  };

  const {
    register,
    handleSubmit,
    isSubmitting,
    submitError,
    getFieldError,
    isFieldTouched,
    resetForm
  } = useFormValidation({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: ''
    },
    onSubmit: handleFormSubmit
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Sign In
          </h2>
          <p className="text-gray-600 text-center mt-2">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {(error || submitError) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {getErrorMessage(error || submitError, 'An error occurred during login')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email"
            error={getFieldError('email')}
            touched={isFieldTouched('email')}
            required
            showValidIcon
            {...register('email')}
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            error={getFieldError('password')}
            touched={isFieldTouched('password')}
            required
            showValidIcon
            {...register('password')}
          />

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {(loading || isSubmitting) ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>


      </div>
    </div>
  );
};

export default LoginForm;