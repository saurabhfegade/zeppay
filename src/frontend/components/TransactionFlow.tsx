"use client";

import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface TransactionFlowProps {
  jwt: string;
}

// Define a proper type for status
type TransactionStatus = 
  | 'idle' 
  | 'initiating' 
  | 'pending_otp' 
  | 'confirming' 
  | 'completed' 
  | 'error';

export function TransactionFlow({ jwt }: TransactionFlowProps) {
  const [beneficiaryPhone, setBeneficiaryPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [pendingTransactionId, setPendingTransactionId] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [transactionResult, setTransactionResult] = useState<any>(null);

  // Test the unauthenticated API endpoint
  const testUnauthenticatedApi = async () => {
    try {
      setStatus('initiating');
      setMessage('Testing unauthenticated API...');
      
      // Try with absolute URL
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/vendors/test-transactions`;
      
      console.log(`Testing unauthenticated API: ${apiUrl}`);
      
      // Test the non-authenticated transaction API
      const response = await axios.post(apiUrl, 
        {
          beneficiary_phone_number: beneficiaryPhone,
          amount_usdc: parseFloat(amount),
          category_id: categoryId,
          vendor_notes: notes || undefined
        }
      );
      
      console.log('Unauthenticated API response:', response.data);
      setMessage(`Unauthenticated API test successful`);
      
      // Continue with regular flow
      initiateTransaction();
    } catch (err) {
      setStatus('error');
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Extract more details from Axios errors
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        errorMessage = `${errorMessage} | Status: ${axiosError.response?.status || 'N/A'} | 
          Response: ${JSON.stringify(axiosError.response?.data || {})}}`;
          
        // Log detailed axios error
        console.error('Unauthenticated API Axios error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers,
          }
        });
      }
      
      setMessage(`Error with unauthenticated API: ${errorMessage}`);
      console.error('Error with unauthenticated API:', err);
    }
  };

  // Initiate a transaction with full URL option for testing
  const initiateTransaction = async () => {
    try {
      setStatus('initiating');
      setMessage('Initiating transaction...');
      
      // Clear previous transaction state
      setPendingTransactionId('');
      setOtp('');
      setTransactionResult(null);
      
      // Try with absolute URL
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/vendors/transactions/initiate`;
      
      console.log(`Initiating transaction to: ${apiUrl} with auth token length: ${jwt.length}`);
      
      const response = await axios.post(apiUrl, 
        {
          beneficiary_phone_number: beneficiaryPhone,
          amount_usdc: parseFloat(amount),
          category_id: categoryId,
          vendor_notes: notes || undefined
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          } 
        }
      );
      
      // Store the pending transaction ID
      setPendingTransactionId(response.data.pending_transaction_id);
      
      // Show the OTP message in an alert
      alert(response.data.otp_message_to_display);
      
      // For development testing, also pre-fill the OTP input
      if (response.data.otp) {
        setOtp(response.data.otp);
      }
      
      setStatus('pending_otp');
      setMessage('Transaction initiated! Please enter the OTP shown in the alert.');
    } catch (err) {
      setStatus('error');
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Extract more details from Axios errors
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        errorMessage = `${errorMessage} | Status: ${axiosError.response?.status || 'N/A'} | 
          Response: ${JSON.stringify(axiosError.response?.data || {})}}`;
          
        // Log detailed axios error
        console.error('Axios error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers,
          }
        });
      }
      
      setMessage(`Error initiating transaction: ${errorMessage}`);
      console.error('Error initiating transaction:', err);
    }
  };
  
  // Confirm transaction with OTP
  const confirmTransaction = async () => {
    try {
      setStatus('confirming');
      setMessage('Confirming transaction...');
      
      // Try with absolute URL
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/vendors/transactions/confirm`;
      
      console.log(`Confirming transaction to: ${apiUrl} with token length: ${jwt.length}`);
      
      const response = await axios.post(apiUrl, 
        {
          pending_transaction_id: pendingTransactionId,
          otp: otp
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          } 
        }
      );
      
      setTransactionResult(response.data);
      setStatus('completed');
      setMessage('Transaction confirmed! USDC transfer is being processed.');
    } catch (err) {
      setStatus('error');
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Extract more details from Axios errors
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        errorMessage = `${errorMessage} | Status: ${axiosError.response?.status || 'N/A'} | 
          Response: ${JSON.stringify(axiosError.response?.data || {})}}`;
          
        // Log detailed axios error
        console.error('Confirm Transaction Axios error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers,
          }
        });
      }
      
      setMessage(`Error confirming transaction: ${errorMessage}`);
      console.error('Error confirming transaction:', err);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">ZepPay Vendor Transaction</h2>
      
      {/* Status indicator */}
      <div className={`p-3 mb-4 rounded-md ${
        status === 'error' ? 'bg-red-100 text-red-700' : 
        status === 'completed' ? 'bg-green-100 text-green-700' : 
        'bg-blue-100 text-blue-700'
      }`}>
        <p><strong>Status:</strong> {status}</p>
        <p>{message}</p>
      </div>
      
      {/* Step 1: Initiate Transaction */}
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Initiate Transaction</h3>
          
          <div>
            <label className="block mb-1 text-gray-700">Beneficiary Phone Number:</label>
            <input 
              type="text" 
              value={beneficiaryPhone}
              onChange={(e) => setBeneficiaryPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., +1234567890"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-gray-700">Amount (USDC):</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., 10.50"
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-gray-700">Category ID:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a category</option>
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
            <label className="block mb-1 text-gray-700">Notes (Optional):</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Additional transaction notes"
              rows={2}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={initiateTransaction}
              disabled={!beneficiaryPhone || !amount || !categoryId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            >
              {/* Use a different approach to avoid type errors */}
              Initiate Transaction
            </button>
            
            <button
              onClick={testUnauthenticatedApi}
              disabled={!beneficiaryPhone || !amount || !categoryId}
              className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400"
            >
              Test API First
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Confirm Transaction with OTP */}
      {status === 'pending_otp' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Confirm Transaction</h3>
          <p className="text-gray-700">
            An OTP has been generated and shown in an alert. Please enter it below to confirm the transaction.
          </p>
          
          <div>
            <label className="block mb-1 text-gray-700">OTP:</label>
            <input 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
          </div>
          
          <button
            onClick={confirmTransaction}
            disabled={!otp || otp.length !== 6}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
          >
            {/* Use a different approach to avoid type errors */}
            Confirm Transaction
          </button>
        </div>
      )}
      
      {/* Step 3: Transaction Result */}
      {status === 'completed' && transactionResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Transaction Completed</h3>
          
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Transaction Details:</h4>
            
            <div className="space-y-2">
              {Object.entries(transactionResult.transaction || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2">
                  <span className="text-gray-700 font-medium">{key.replace(/_/g, ' ')}:</span>
                  <span className="col-span-2">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => {
              setStatus('idle');
              setMessage('');
              setBeneficiaryPhone('');
              setAmount('');
              setNotes('');
              setPendingTransactionId('');
              setOtp('');
              setTransactionResult(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Start New Transaction
          </button>
        </div>
      )}
    </div>
  );
} 