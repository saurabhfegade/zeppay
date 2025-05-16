"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Providers } from '../frontend/components/Providers';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { cbWalletConnector } from '../common/lib/wagmi';

// Modify the CSS first to add bright logout button styles
const styles = `
  /* Base styles */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
  .min-h-screen { min-height: 100vh; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-white { background-color: white; }
  .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .p-6 { padding: 1.5rem; }
  .p-3 { padding: 0.75rem; }
  .p-2 { padding: 0.5rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1.5rem; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .ml-2 { margin-left: 0.5rem; }
  .mr-1 { margin-right: 0.25rem; }
  .mr-2 { margin-right: 0.5rem; }
  .mr-3 { margin-right: 0.75rem; }
  
  /* Text styles */
  .text-3xl { font-size: 1.875rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-xl { font-size: 1.25rem; }
  .text-lg { font-size: 1.125rem; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }
  .text-white { color: white; }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }
  .text-gray-800 { color: #1f2937; }
  .text-blue-100 { color: #dbeafe; }
  .text-blue-600 { color: #2563eb; }
  .text-blue-700 { color: #1d4ed8; }
  .text-blue-800 { color: #1e40af; }
  .text-green-500 { color: #10b981; }
  .text-green-700 { color: #047857; }
  .text-red-500 { color: #ef4444; }
  .text-red-600 { color: #dc2626; }
  .text-yellow-900 { color: #713f12; }
  
  /* Layout styles */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-end { justify-content: flex-end; }
  .space-y-3 > * + * { margin-top: 0.75rem; }
  .space-y-6 > * + * { margin-top: 1.5rem; }
  .flex-shrink-0 { flex-shrink: 0; }
  .flex-1 { flex: 1 1 0%; }
  
  /* Border styles */
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-full { border-radius: 9999px; }
  .border { border-width: 1px; }
  .border-2 { border-width: 2px; }
  .border-b { border-bottom-width: 1px; }
  .border-gray-100 { border-color: #f3f4f6; }
  .border-gray-200 { border-color: #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }
  .border-blue-300 { border-color: #93c5fd; }
  .border-green-200 { border-color: #a7f3d0; }
  .border-yellow-400 { border-color: #facc15; }
  
  /* Background styles */
  .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
  .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(37 99 235 / 0)); }
  .to-blue-800 { --tw-gradient-to: #1e40af; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-blue-500 { background-color: #3b82f6; }
  .bg-blue-600 { background-color: #2563eb; }
  .bg-blue-700 { background-color: #1d4ed8; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-gray-200 { background-color: #e5e7eb; }
  .bg-gray-300 { background-color: #d1d5db; }
  .bg-green-50 { background-color: #ecfdf5; }
  .bg-green-500 { background-color: #10b981; }
  .bg-red-500 { background-color: #ef4444; }
  .bg-red-600 { background-color: #dc2626; }
  .bg-red-700 { background-color: #b91c1c; }
  .bg-yellow-400 { background-color: #facc15; }
  
  /* Shadow styles */
  .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
  .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  
  /* Utility styles */
  .overflow-hidden { overflow: hidden; }
  .overflow-auto { overflow: auto; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .break-all { word-break: break-all; }
  .transition { transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
  .hover\\:bg-blue-50:hover { background-color: #eff6ff; }
  .hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
  .hover\\:bg-red-700:hover { background-color: #b91c1c; }
  .hover\\:bg-yellow-500:hover { background-color: #eab308; }
  .disabled\\:bg-gray-300:disabled { background-color: #d1d5db; }
  .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
  .relative { position: relative; }
  .absolute { position: absolute; }
  .sticky { position: sticky; }
  .top-0 { top: 0; }
  .block { display: block; }
  .w-3 { width: 0.75rem; }
  .w-5 { width: 1.25rem; }
  .w-6 { width: 1.5rem; }
  .w-8 { width: 2rem; }
  .w-10 { width: 2.5rem; }
  .w-32 { width: 8rem; }
  .w-full { width: 100%; }
  .h-2 { height: 0.5rem; }
  .h-3 { height: 0.75rem; }
  .h-4 { height: 1rem; }
  .h-5 { height: 1.25rem; }
  .h-6 { height: 1.5rem; }
  .h-8 { height: 2rem; }
  .h-10 { height: 2.5rem; }
  .opacity-60 { opacity: 0.6; }
  
  /* Animation styles */
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  
  /* Custom styles for logout button */
  .logout-button {
    position: fixed;
    top: 20px; 
    right: 20px;
    background-color: #facc15; /* yellow-400 */
    color: #713f12; /* yellow-900 */
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    border: 2px solid #facc15;
    z-index: 100;
    cursor: pointer;
  }
  
  .logout-button:hover {
    background-color: #eab308; /* yellow-500 */
  }
  
  .logout-button svg {
    margin-right: 8px;
  }
`;

// This component will be wrapped by Providers
function SmartWalletTest() {
  const [status, setStatus] = useState<string>('idle');
  const [message, setMessage] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [vendorEmail, setVendorEmail] = useState<string>('');
  const [vendorPassword, setVendorPassword] = useState<string>('');
  const [jwt, setJwt] = useState<string>('');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

  // Now these hooks are used within the WagmiProvider context
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Watch for account changes
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      setStatus('wallet-created');
      setMessage(`Smart Wallet created with address: ${address}`);
    }
  }, [isConnected, address]);

  // Load categories when the status changes to wallet-registered
  useEffect(() => {
    if (status === 'wallet-registered' && jwt) {
      fetchCategories();
    }
  }, [status, jwt]);

  // Fetch available categories
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      
      const categoriesResponse = await axios.get('/api/categories', 
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      if (categoriesResponse.data && categoriesResponse.data.length > 0) {
        setCategories(categoriesResponse.data);
        // Default select first 2 categories if available
        if (categoriesResponse.data.length >= 2) {
          setSelectedCategories([
            categoriesResponse.data[0].id,
            categoriesResponse.data[1].id
          ]);
        } else if (categoriesResponse.data.length === 1) {
          setSelectedCategories([categoriesResponse.data[0].id]);
        }
      } else {
        // Fallback to hardcoded categories matching Supabase if API returns empty
        const fallbackCategories = [
          { id: "7bf2ab8b-b02f-4f83-85fb-8309df38b2ce", name: "Groceries" },
          { id: "7e565954-bf30-4681-b6c8-05e65cace292", name: "Transportation" },
          { id: "8b1a036e-c9e4-4d6b-8663-48727a0cdbdd", name: "Education" },
          { id: "8dff9284-7e23-4b13-ba04-e604f26de673", name: "Healthcare" },
          { id: "aff04e3a-e5ae-4ddb-a1de-69cb84bb9a70", name: "Food" },
          { id: "bcea25ea-4464-46cb-a1f4-8c1367cf1e1d", name: "Communication" },
          { id: "c1fb8ee2-588e-425f-90f5-6f774bfb85ee", name: "Clothing" },
          { id: "d96a40c0-c9a4-4515-bf78-9ef44ce312d6", name: "Housing" }
        ];
        
        setCategories(fallbackCategories);
        
        // Default select first 2 categories
        setSelectedCategories([
          fallbackCategories[0].id,
          fallbackCategories[1].id
        ]);
        
        console.log("Using fallback categories since API returned empty array");
      }
      
      setIsLoadingCategories(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      
      // Fallback to hardcoded categories matching Supabase if API fails
      const fallbackCategories = [
        { id: "7bf2ab8b-b02f-4f83-85fb-8309df38b2ce", name: "Groceries" },
        { id: "7e565954-bf30-4681-b6c8-05e65cace292", name: "Transportation" },
        { id: "8b1a036e-c9e4-4d6b-8663-48727a0cdbdd", name: "Education" },
        { id: "8dff9284-7e23-4b13-ba04-e604f26de673", name: "Healthcare" },
        { id: "aff04e3a-e5ae-4ddb-a1de-69cb84bb9a70", name: "Food" },
        { id: "bcea25ea-4464-46cb-a1f4-8c1367cf1e1d", name: "Communication" },
        { id: "c1fb8ee2-588e-425f-90f5-6f774bfb85ee", name: "Clothing" },
        { id: "d96a40c0-c9a4-4515-bf78-9ef44ce312d6", name: "Housing" }
      ];
      
      setCategories(fallbackCategories);
      
      // Default select first 2 categories
      setSelectedCategories([
        fallbackCategories[0].id,
        fallbackCategories[1].id
      ]);
      
      console.log("Using fallback categories due to API error:", err);
      setIsLoadingCategories(false);
    }
  };

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId);
      } else {
        return [...prevSelected, categoryId];
      }
    });
  };

  // Create Vendor Account
  const createVendor = async () => {
    try {
      setStatus('creating-vendor');
      setMessage('Creating vendor account...');
      
      const response = await axios.post('/api/auth/signup', {
        email: vendorEmail,
        password: vendorPassword,
        role: 'vendor',
        display_name: 'Test Vendor',
        phone_number: '+1' + Math.floor(Math.random() * 9000000000 + 1000000000)
      });
      
      console.log('Vendor creation response:', response.data);
      setMessage('Vendor account created! You can now log in.');
      setStatus('vendor-created');
    } catch (err) {
      setStatus('error');
      setMessage(`Error creating vendor: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Login as Vendor
  const loginVendor = async () => {
    try {
      setStatus('logging-in');
      setMessage('Logging in...');
      
      const response = await axios.post('/api/auth/login', {
        email: vendorEmail,
        password: vendorPassword
      });
      
      setJwt(response.data.session.access_token);
      setMessage('Logged in successfully! You can now create a Smart Wallet.');
      setStatus('logged-in');
    } catch (err) {
      setStatus('error');
      setMessage(`Error logging in: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Logout
  const logoutVendor = async () => {
    try {
      setStatus('logging-out');
      setMessage('Logging out...');
      
      // Disconnect wallet if connected
      if (isConnected) {
        disconnect();
      }

      // Clear wallet address
      setWalletAddress('');
      
      if (jwt) {
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
      }
      
      setJwt('');
      setSelectedCategories([]);
      setCategories([]);
      setStatus('idle');
      setMessage('Logged out successfully.');
    } catch (err) {
      console.error('Error logging out:', err);
      // Even if logout fails on the server, we'll clear the local state
      setWalletAddress('');
      setJwt('');
      setSelectedCategories([]);
      setCategories([]);
      setStatus('idle');
      setMessage('Logged out locally.');
    }
  };

  // Create Smart Wallet
  const createSmartWallet = async () => {
    try {
      setStatus('creating-wallet');
      setMessage('Creating Smart Wallet through Coinbase SDK...');
      
      await connect({ connector: cbWalletConnector });
      
      // The useEffect will update the state when the address is available
    } catch (err) {
      setStatus('error');
      setMessage(`Error creating Smart Wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Register wallet with backend
  const registerWallet = async () => {
    try {
      setStatus('registering-wallet');
      setMessage('Registering wallet with backend...');
      
      const response = await axios.post('/api/vendors/register-wallet', 
        { wallet_address: walletAddress },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      console.log('Wallet registration response:', response.data);
      setStatus('wallet-registered');
      setMessage('Smart Wallet registered successfully with backend!');
    } catch (err) {
      setStatus('error');
      setMessage(`Error registering wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Assign categories to vendor
  const assignCategories = async () => {
    try {
      setStatus('assigning-categories');
      setMessage('Assigning categories to vendor...');
      
      if (selectedCategories.length === 0) {
        setStatus('error');
        setMessage('Please select at least one category');
        return;
      }
      
      // Assign categories to vendor
      const response = await axios.post('/api/vendors/categories',
        { category_ids: selectedCategories },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      console.log('Assign categories response:', response.data);
      setStatus('ready');
      setMessage('Categories assigned! Vendor setup complete and ready for testing.');
    } catch (err) {
      setStatus('error');
      setMessage(`Error assigning categories: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Helper function to get the current step
  const getCurrentStep = () => {
    switch (status) {
      case 'idle':
        return 1;
      case 'vendor-created':
        return 2;
      case 'logged-in':
        return 3;
      case 'wallet-created':
        return 4;
      case 'wallet-registered':
        return 5;
      case 'ready':
        return 6;
      default:
        return 1;
    }
  };

  // Check if step is active
  const isStepActive = (stepNum: number) => {
    return getCurrentStep() >= stepNum;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Add a fixed position logout button at the top right */}
      <button 
        onClick={logoutVendor}
        className="logout-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        LOGOUT
      </button>
      
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">ZepPay Vendor Setup</h1>
              {jwt && (
                <button 
                  onClick={logoutVendor}
                  className="px-4 py-2 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                </button>
              )}
            </div>
            <p className="text-blue-100 mt-2">
              Setup a vendor account with Smart Wallet for testing
            </p>
          </div>
          
          {/* Current Status */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <h2 className="text-lg font-medium">Current Status: <span className="font-semibold">{status}</span></h2>
              </div>
              
              {/* Add a more prominent logout button in the status section */}
              {jwt && status !== 'idle' && (
                <button 
                  onClick={logoutVendor}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout & Reset
                  </span>
                </button>
              )}
            </div>
            <p className={`${status === 'error' ? 'text-red-600' : 'text-gray-700'} mb-2`}>{message}</p>
            
            {walletAddress && (
              <div className="mt-4 bg-gray-50 p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Wallet Address:</span>
                </div>
                <code className="block p-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-800 overflow-auto break-all">{walletAddress}</code>
                
                {/* Add Manage Wallet button */}
                <div className="mt-3 flex justify-between items-center">
                  <a 
                    href={`https://sepolia.basescan.org/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on BaseScan
                  </a>
                  
                  <button 
                    onClick={() => {
                      // Open Coinbase Wallet extension with this wallet
                      window.open(`https://wallet.coinbase.com/onramp/app?appType=smart`, '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Manage Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Steps Navigator */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between">
              {[
                {num: 1, label: "Create Account"},
                {num: 2, label: "Login"},
                {num: 3, label: "Create Wallet"},
                {num: 4, label: "Register Wallet"},
                {num: 5, label: "Assign Categories"}
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 text-white font-medium
                      ${getCurrentStep() > step.num ? 'bg-green-500' : 
                        getCurrentStep() === step.num ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    {getCurrentStep() > step.num ? 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> : step.num
                    }
                  </div>
                  <div className={`text-xs font-medium text-center ${getCurrentStep() >= step.num ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className="absolute h-2 bg-blue-500 rounded-full" 
                style={{ width: `${(Math.max(0, getCurrentStep() - 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Step 1: Create Vendor */}
              <div className={`p-6 rounded-lg border-2 transition-all ${isStepActive(1) ? 'border-blue-300 bg-white shadow-md' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${getCurrentStep() > 1 ? 'bg-green-500 text-white' : 
                      getCurrentStep() === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {getCurrentStep() > 1 ? '✓' : '1'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Create Vendor Account</h2>
                    <p className="text-gray-600 mb-4">First, create a vendor account with your email and password</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 font-medium text-gray-700">Email:</label>
                        <input 
                          type="email" 
                          value={vendorEmail}
                          onChange={(e) => setVendorEmail(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                          placeholder="vendor@example.com"
                          disabled={getCurrentStep() > 1}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium text-gray-700">Password:</label>
                        <input 
                          type="password" 
                          value={vendorPassword}
                          onChange={(e) => setVendorPassword(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                          placeholder="Enter password (8+ characters)"
                          disabled={getCurrentStep() > 1}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={createVendor}
                    disabled={status === 'creating-vendor' || getCurrentStep() > 1 || !vendorEmail || !vendorPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {status === 'creating-vendor' ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span> : 
                      'Create Account'
                    }
                  </button>
                </div>
              </div>
              
              {/* Step 2: Login */}
              <div className={`p-6 rounded-lg border-2 transition-all ${isStepActive(2) ? 'border-blue-300 bg-white shadow-md' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${getCurrentStep() > 2 ? 'bg-green-500 text-white' : 
                      getCurrentStep() === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {getCurrentStep() > 2 ? '✓' : '2'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Login as Vendor</h2>
                    <p className="text-gray-600 mb-4">Login with the vendor account you just created</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={loginVendor}
                    disabled={getCurrentStep() !== 2 || status === 'logging-in'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {status === 'logging-in' ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </span> : 
                      'Login'
                    }
                  </button>
                </div>
              </div>
              
              {/* Step 3: Create Smart Wallet */}
              <div className={`p-6 rounded-lg border-2 transition-all ${isStepActive(3) ? 'border-blue-300 bg-white shadow-md' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${getCurrentStep() > 3 ? 'bg-green-500 text-white' : 
                      getCurrentStep() === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {getCurrentStep() > 3 ? '✓' : '3'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Create Smart Wallet</h2>
                    <p className="text-gray-600 mb-4">Create a Smart Wallet using Coinbase Wallet SDK. This will open a dialog to create your wallet.</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={createSmartWallet}
                    disabled={getCurrentStep() !== 3 || status === 'creating-wallet'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {status === 'creating-wallet' ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span> : 
                      'Create Smart Wallet'
                    }
                  </button>
                </div>
              </div>
              
              {/* Step 4: Register Wallet */}
              <div className={`p-6 rounded-lg border-2 transition-all ${isStepActive(4) ? 'border-blue-300 bg-white shadow-md' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${getCurrentStep() > 4 ? 'bg-green-500 text-white' : 
                      getCurrentStep() === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {getCurrentStep() > 4 ? '✓' : '4'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Register Wallet</h2>
                    <p className="text-gray-600 mb-4">Register your Smart Wallet address with the ZepPay platform to receive payments.</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={registerWallet}
                    disabled={getCurrentStep() !== 4 || status === 'registering-wallet'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {status === 'registering-wallet' ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </span> : 
                      'Register Wallet'
                    }
                  </button>
                </div>
              </div>
              
              {/* Step 5: Assign Categories */}
              <div className={`p-6 rounded-lg border-2 transition-all ${isStepActive(5) ? 'border-blue-300 bg-white shadow-md' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${getCurrentStep() > 5 ? 'bg-green-500 text-white' : 
                      getCurrentStep() === 5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {getCurrentStep() > 5 ? '✓' : '5'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Assign Categories</h2>
                    <p className="text-gray-600 mb-4">Select product/service categories that your vendor account supports.</p>
                    
                    {isLoadingCategories ? (
                      <div className="flex items-center text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading categories...
                      </div>
                    ) : categories.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <p className="font-medium text-gray-700">Available Categories:</p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {categories.map(category => (
                            <div 
                              key={category.id} 
                              className={`border rounded-lg p-3 cursor-pointer transition-all 
                                ${selectedCategories.includes(category.id) 
                                  ? 'bg-blue-50 border-blue-300' 
                                  : 'bg-white border-gray-200 hover:border-blue-200'}`}
                              onClick={() => getCurrentStep() === 5 && handleCategoryChange(category.id)}
                            >
                              <div className="flex items-center">
                                <input 
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 rounded"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={() => {}}
                                  disabled={getCurrentStep() !== 5}
                                />
                                <label className="ml-2 block font-medium text-gray-700">
                                  {category.name}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Selected: {selectedCategories.length} of {categories.length} categories
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 mb-4">
                        No categories found. Categories will need to be created in the database.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={assignCategories}
                    disabled={getCurrentStep() !== 5 || status === 'assigning-categories' || selectedCategories.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {status === 'assigning-categories' ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Assigning...
                      </span> : 
                      'Assign Selected Categories'
                    }
                  </button>
                </div>
              </div>
              
              {/* Final Success */}
              {status === 'ready' && (
                <div className="p-6 rounded-lg bg-green-50 border-2 border-green-200">
                  <div className="flex items-center mb-4 text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold">Setup Complete!</h2>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Your vendor account is fully set up with a Smart Wallet and categories assigned. 
                    You can now test the vendor transaction APIs in Postman.
                  </p>
                  
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-lg mb-3 text-gray-800">Postman Testing Information</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <div className="w-32 font-medium text-gray-700">Vendor Email:</div>
                        <code className="flex-1 px-2 py-1 bg-gray-100 rounded">{vendorEmail}</code>
                      </div>
                      <div className="flex">
                        <div className="w-32 font-medium text-gray-700">Auth Token:</div>
                        <div className="flex-1 px-2 py-1 bg-gray-100 rounded overflow-hidden text-ellipsis">
                          {jwt ? (
                            <div className="text-xs overflow-hidden truncate">{jwt}</div>
                          ) : "(JWT token stored in variable)"}
                        </div>
                      </div>
                      <div className="flex">
                        <div className="w-32 font-medium text-gray-700">Wallet Address:</div>
                        <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs break-all">{walletAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the default component that wraps SmartWalletTest with the Providers
export default function TestSmartWallet() {
  return (
    <Providers>
      <SmartWalletTest />
    </Providers>
  );
} 