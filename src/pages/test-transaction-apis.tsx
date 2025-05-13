import { useState } from 'react';
import axios from 'axios';

export default function TestTransactionApis() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [jwt, setJwt] = useState<string>('');
  const [role, setRole] = useState<string>('vendor'); // 'vendor' or 'sponsor'
  
  // Request parameters
  const [beneficiaryPhone, setBeneficiaryPhone] = useState<string>('+1234567890');
  const [amount, setAmount] = useState<string>('10');
  const [categoryId, setCategoryId] = useState<string>('7bf2ab8b-b02f-4f83-85fb-8309df38b2ce');  // Groceries
  const [notes, setNotes] = useState<string>('Test transaction');
  const [pendingTransactionId, setPendingTransactionId] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('0x1234567890123456789012345678901234567890');

  // Test the simple unprotected API route
  const testSimpleApi = async () => {
    try {
      setLoading(true);
      setResult('Testing simple API...');
      
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/test-route`);
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Simple API', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the GET /api/sponsors/transactions endpoint
  const getSponsorTransactions = async () => {
    try {
      setLoading(true);
      setResult('Fetching sponsor transactions...');
      
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/sponsors/transactions`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Sponsor Transactions', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the GET /api/vendors/transactions endpoint
  const getVendorTransactions = async () => {
    try {
      setLoading(true);
      setResult('Fetching vendor transactions...');
      
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/vendors/transactions`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Vendor Transactions', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the POST /api/vendors/transactions/initiate endpoint
  const initiateTransaction = async () => {
    try {
      setLoading(true);
      setResult('Initiating transaction...');
      
      const baseUrl = window.location.origin;
      const response = await axios.post(
        `${baseUrl}/api/vendors/transactions/initiate`,
        {
          beneficiary_phone_number: beneficiaryPhone,
          amount_usdc: parseFloat(amount),
          category_id: categoryId,
          vendor_notes: notes || undefined
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      // Store the pending transaction ID for confirm step
      if (response.data.pending_transaction_id) {
        setPendingTransactionId(response.data.pending_transaction_id);
        
        // If there's an OTP for testing, save it
        if (response.data.otp) {
          setOtp(response.data.otp);
        }
      }
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Initiate Transaction', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the POST /api/vendors/transactions/confirm endpoint
  const confirmTransaction = async () => {
    try {
      setLoading(true);
      setResult('Confirming transaction...');
      
      const baseUrl = window.location.origin;
      const response = await axios.post(
        `${baseUrl}/api/vendors/transactions/confirm`,
        {
          pending_transaction_id: pendingTransactionId,
          otp: otp
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Confirm Transaction', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the POST /api/vendors/coinbase/offramp/initialize endpoint
  const initiateOfframp = async () => {
    try {
      setLoading(true);
      setResult('Initiating offramp...');
      
      const baseUrl = window.location.origin;
      const response = await axios.post(
        `${baseUrl}/api/vendors/coinbase/offramp/initialize`,
        {
          amount_usdc: parseFloat(amount),
          source_smart_wallet_address: walletAddress
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError('Initiate Offramp', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for error handling
  const handleApiError = (apiName: string, error: any) => {
    console.error(`${apiName} error:`, error);
    
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      errorMessage = `${errorMessage}\nStatus: ${error.response?.status || 'N/A'}\nData: ${JSON.stringify(error.response?.data || {})}`;
      
      console.error('Detailed error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
    }
    
    setResult(`${apiName} Error: ${errorMessage}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ZepPay Transaction API Test Page</h1>
      
      {/* JWT Token Input */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication</h2>
        <div className="flex space-x-2 mb-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="vendor"
              checked={role === 'vendor'}
              onChange={() => setRole('vendor')}
              className="mr-1"
            />
            <span>Vendor</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="sponsor"
              checked={role === 'sponsor'}
              onChange={() => setRole('sponsor')}
              className="mr-1"
            />
            <span>Sponsor</span>
          </label>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">JWT Token:</label>
          <input 
            type="text" 
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Paste JWT token here"
          />
        </div>
      </div>
      
      {/* Transaction Parameters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Transaction Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Beneficiary Phone:</label>
            <input 
              type="text" 
              value={beneficiaryPhone}
              onChange={(e) => setBeneficiaryPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount USDC:</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category ID:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="7bf2ab8b-b02f-4f83-85fb-8309df38b2ce">Groceries</option>
              <option value="7e565954-bf30-4681-b6c8-05e65cace292">Transportation</option>
              <option value="8b1a036e-c9e4-4d6b-8663-48727a0cdbdd">Education</option>
              <option value="8dff9284-7e23-4b13-ba04-e604f26de673">Healthcare</option>
              <option value="aff04e3a-e5ae-4ddb-a1de-69cb84bb9a70">Food</option>
              <option value="bcea25ea-4464-46cb-a1f4-8c1367cf1e1d">Communication</option>
              <option value="c1fb8ee2-588e-425f-90f5-6f774bfb85ee">Clothing</option>
              <option value="d96a40c0-c9a4-4515-bf78-9ef44ce312d6">Housing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes:</label>
            <input 
              type="text" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Transaction Confirmation Parameters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Transaction Confirmation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pending Transaction ID:</label>
            <input 
              type="text" 
              value={pendingTransactionId}
              onChange={(e) => setPendingTransactionId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">OTP:</label>
            <input 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              maxLength={6}
            />
          </div>
        </div>
      </div>
      
      {/* Offramp Parameters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Offramp Parameters</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Smart Wallet Address:</label>
          <input 
            type="text" 
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      {/* API Test Buttons */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">API Test Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testSimpleApi}
            disabled={loading}
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Test Simple API
          </button>
          
          {role === 'sponsor' && (
            <button
              onClick={getSponsorTransactions}
              disabled={loading || !jwt}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              Get Sponsor Transactions
            </button>
          )}
          
          {role === 'vendor' && (
            <>
              <button
                onClick={getVendorTransactions}
                disabled={loading || !jwt}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Get Vendor Transactions
              </button>
              
              <button
                onClick={initiateTransaction}
                disabled={loading || !jwt}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Initiate Transaction
              </button>
              
              <button
                onClick={confirmTransaction}
                disabled={loading || !jwt || !pendingTransactionId || !otp}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Confirm Transaction
              </button>
              
              <button
                onClick={initiateOfframp}
                disabled={loading || !jwt || !walletAddress}
                className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Initiate Offramp
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Result Display */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="whitespace-pre-wrap">{result || 'No result yet'}</pre>
        </div>
      </div>
    </div>
  );
} 