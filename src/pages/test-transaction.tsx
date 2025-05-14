"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { TransactionFlow } from '../frontend/components/TransactionFlow';

export default function TestTransaction() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [jwt, setJwt] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');

  // Login as Vendor
  const loginVendor = async () => {
    try {
      setStatus('logging-in');
      setMessage('Logging in...');
      
      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password
      });
      
      setJwt(response.data.session.access_token);
      setMessage('Logged in successfully! You can now process transactions.');
      setStatus('logged-in');
      setIsLoggedIn(true);
    } catch (err) {
      setStatus('error');
      setMessage(`Error logging in: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setStatus('logging-out');
      setMessage('Logging out...');
      
      if (jwt) {
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
      }
      
      setJwt('');
      setStatus('idle');
      setMessage('Logged out successfully.');
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Error logging out:', err);
      // Even if logout fails on the server, we'll clear the local state
      setJwt('');
      setStatus('idle');
      setMessage('Logged out locally.');
      setIsLoggedIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">ZepPay Vendor Transactions</h1>
              {isLoggedIn && (
                <button 
                  onClick={logout}
                  className="px-4 py-2 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition"
                >
                  Logout
                </button>
              )}
            </div>
            <p className="text-blue-100 mt-2">
              Test the transaction flow with OTP alerts
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isLoggedIn ? (
              <div className="space-y-6">                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Email:</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                      placeholder="vendor@example.com"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Password:</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={loginVendor}
                      disabled={!email || !password || status === 'logging-in'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {status === 'logging-in' ? 'Logging in...' : 'Login'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <TransactionFlow jwt={jwt} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 