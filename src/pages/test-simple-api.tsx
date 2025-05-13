import { useState } from 'react';
import axios from 'axios';

export default function TestSimpleApi() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');

  const testApi = async () => {
    try {
      setLoading(true);
      setResult('Testing API...');
      
      // Test our simple API route
      const response = await axios.get('/api/test-route');
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('API test error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testTransactionApi = async () => {
    try {
      setLoading(true);
      setResult('Testing transaction API...');
      
      // Test the transaction initiate API
      const response = await axios.post('/api/vendors/transactions/initiate', 
        {
          beneficiary_phone_number: "123456789",
          amount_usdc: 10,
          category_id: "7bf2ab8b-b02f-4f83-85fb-8309df38b2ce",
          vendor_notes: "Test note"
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      );
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Transaction API test error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testUnauthenticatedApi = async () => {
    try {
      setLoading(true);
      setResult('Testing unauthenticated API...');
      
      // Test the non-authenticated transaction API
      const response = await axios.post('/api/vendors/test-transactions', 
        {
          beneficiary_phone_number: "123456789",
          amount_usdc: 10,
          category_id: "7bf2ab8b-b02f-4f83-85fb-8309df38b2ce",
          vendor_notes: "Test note"
        },
        { 
          headers: { 
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Unauthenticated API test error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Testing Page</h1>
      
      <div className="mb-4">
        <button
          onClick={testApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          Test Simple API
        </button>
        
        <button
          onClick={testUnauthenticatedApi}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded mr-2"
        >
          Test Unauthenticated API
        </button>
        
        <div className="mt-4">
          <label className="block mb-2">JWT Token for Authentication:</label>
          <input 
            type="text" 
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
            placeholder="Paste JWT token here"
          />
          
          <button
            onClick={testTransactionApi}
            disabled={loading || !token}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Test Transaction API
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {result || 'No result yet'}
        </pre>
      </div>
    </div>
  );
} 