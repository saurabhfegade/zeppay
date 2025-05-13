"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Providers } from '../../frontend/components/Providers';
import { SmartWalletCreator } from '../../frontend/components/SmartWalletCreator';
import axios from 'axios';

export default function VendorWalletSetup() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Check if the vendor already has a wallet
  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        const response = await axios.get('/api/vendors/smart-wallets');
        
        if (response.data && response.data.length > 0) {
          setSuccess(`You already have a registered wallet: ${response.data[0].wallet_address}`);
        }
      } catch (err) {
        console.error('Error checking existing wallet:', err);
        // Don't show error if it's just that the vendor doesn't have a wallet yet
      }
    };
    
    checkExistingWallet();
  }, []);
  
  // Register the smart wallet address with our backend
  const handleWalletCreated = async (address: string) => {
    setIsRegistering(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/vendors/register-wallet', {
        wallet_address: address,
      });
      
      setSuccess('Smart wallet registered successfully! You can now receive payments from sponsors.');
      
      // Redirect to vendor dashboard after a delay
      setTimeout(() => {
        router.push('/vendor/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Error registering wallet:', err);
      setError('Failed to register wallet with our system. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <Providers>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Vendor Smart Wallet Setup</h1>
        
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">What is a Smart Wallet?</h2>
          <p className="mb-4">
            A Smart Wallet is a secure, user-friendly way to receive payments on blockchain
            without dealing with seed phrases or private keys. It uses passkeys technology
            for authentication, making it as easy as using Face ID or Touch ID.
          </p>
        </div>
        
        {!success && (
          <SmartWalletCreator onWalletCreated={handleWalletCreated} />
        )}
        
        {isRegistering && (
          <div className="mt-4">Registering your wallet...</div>
        )}
      </div>
    </Providers>
  );
} 