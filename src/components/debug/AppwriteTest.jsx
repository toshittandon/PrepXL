import { useState } from 'react';
import { testAppwriteConnection, printSetupInstructions } from '../../utils/appwriteSetup.js';
import { testAppwriteConnection as testConnection, testAppwriteAuth } from '../../utils/appwriteTest.js';

const AppwriteTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [authTestResult, setAuthTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await testAppwriteConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        message: 'Test failed with exception'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        message: 'Connection test failed with exception'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthTest = async () => {
    setAuthLoading(true);
    try {
      const result = await testAppwriteAuth();
      setAuthTestResult(result);
    } catch (error) {
      setAuthTestResult({
        success: false,
        error: error.message,
        message: 'Auth test failed with exception'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePrintInstructions = () => {
    printSetupInstructions();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Appwrite Connection Test</h1>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleConnectionTest}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={handleAuthTest}
            disabled={authLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {authLoading ? 'Testing Auth...' : 'Test Authentication'}
          </button>
          
          <button
            onClick={handlePrintInstructions}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Print Setup Instructions
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              Connection Test: {testResult.success ? '✅ Success' : '❌ Failed'}
            </h3>
            <p className={`mt-2 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message || (testResult.authenticated ? 'Connected and authenticated' : 'Connected but not authenticated')}
            </p>
            
            {testResult.error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}

            {testResult.success && testResult.collections && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800">Collections Found:</h4>
                <ul className="mt-2 text-sm text-green-700">
                  {testResult.collections.map(collection => (
                    <li key={collection.$id} className="flex justify-between">
                      <span>{collection.name}</span>
                      <span className="font-mono text-xs">{collection.$id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.success && testResult.buckets && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800">Storage Buckets Found:</h4>
                <ul className="mt-2 text-sm text-green-700">
                  {testResult.buckets.map(bucket => (
                    <li key={bucket.$id} className="flex justify-between">
                      <span>{bucket.name}</span>
                      <span className="font-mono text-xs">{bucket.$id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {authTestResult && (
          <div className={`p-4 rounded-lg ${authTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold ${authTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
              Authentication Test: {authTestResult.success ? '✅ Success' : '❌ Failed'}
            </h3>
            <p className={`mt-2 ${authTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {authTestResult.message}
            </p>
            
            {authTestResult.error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm">
                <strong>Error:</strong> {authTestResult.error}
                {authTestResult.code && <span className="ml-2">Code: {authTestResult.code}</span>}
                {authTestResult.type && <span className="ml-2">Type: {authTestResult.type}</span>}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to your Appwrite Console at <a href="https://fra.cloud.appwrite.io" target="_blank" rel="noopener noreferrer" className="underline">https://fra.cloud.appwrite.io</a></li>
            <li>2. Click "Print Setup Instructions" button above to see detailed setup requirements</li>
            <li>3. Create the database, collections, and storage bucket as specified</li>
            <li>4. Click "Test Connection" to verify everything is working</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AppwriteTest;