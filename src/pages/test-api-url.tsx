import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TestApiUrl() {
  const [apiUrl, setApiUrl] = useState<string>('/api/test-route');
  const [result, setResult] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    // Get the base URL of the application
    setBaseUrl(window.location.origin);
  }, []);

  const testApiEndpoint = async () => {
    try {
      setResult('Testing API...');
      const fullUrl = baseUrl ? `${baseUrl}${apiUrl}` : apiUrl;
      console.log('Sending request to:', fullUrl);
      
      const response = await axios.get(apiUrl);
      setResult(`Success! Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('API test error:', error);
      let errorMessage = 'Unknown error';
      
      if (axios.isAxiosError(error)) {
        errorMessage = `Error: ${error.message} | Status: ${error.response?.status || 'N/A'} | URL: ${error.config?.url}`;
      }
      
      setResult(`Failed: ${errorMessage}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API URL Test</h1>
      
      <div className="mb-4">
        <p>Current base URL: {baseUrl || 'Loading...'}</p>
        
        <div className="mt-4">
          <label className="block mb-2">API URL to test:</label>
          <input 
            type="text" 
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          
          <button
            onClick={testApiEndpoint}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Test API Endpoint
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <p>{result}</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Quick Test URLs:</h2>
        <div className="space-y-2">
          <button 
            onClick={() => setApiUrl('/api/test-route')} 
            className="px-3 py-1 bg-gray-200 rounded mr-2"
          >
            Test Route
          </button>
          <button 
            onClick={() => setApiUrl('/api/vendors/test-transactions')} 
            className="px-3 py-1 bg-gray-200 rounded mr-2"
          >
            Test Transactions
          </button>
          <button 
            onClick={() => setApiUrl('/api/vendors/transactions/initiate')} 
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Transaction Initiate
          </button>
        </div>
      </div>
    </div>
  );
} 