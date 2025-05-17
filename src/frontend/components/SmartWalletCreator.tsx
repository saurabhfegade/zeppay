"use client";

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { cbWalletConnector } from '../../common/lib/wagmi';

interface SmartWalletCreatorProps {
  onWalletCreated: (address: string) => void;
}

export function SmartWalletCreator({ onWalletCreated }: SmartWalletCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  
  // Watch for account changes and report the address when available
  useEffect(() => {
    if (isCreating && isConnected && address) {
      onWalletCreated(address);
      setIsCreating(false);
    }
  }, [isConnected, address, isCreating, onWalletCreated]);
  
  // When the user clicks the create button, use the Coinbase Wallet connector to create a smart wallet
  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Connect to the wallet
      await connect({ connector: cbWalletConnector });
      
      // Account hook will update with the address and trigger the useEffect
      // If no address is detected within 5 seconds, show an error
      setTimeout(() => {
        if (isCreating) {
          setError('Failed to get wallet address after connection');
          setIsCreating(false);
        }
      }, 5000);
    } catch (err) {
      console.error('Error creating smart wallet:', err);
      setError(`Failed to create wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsCreating(false);
    }
  };
  
  // If already connected, show the wallet address
  if (isConnected && address) {
    return (
      <div className="p-4 border rounded-lg mb-4">
        <h3 className="text-lg font-medium mb-2">Smart Wallet Created</h3>
        <p className="mb-2">Your smart wallet address:</p>
        <code className="block p-2 bg-gray-100 rounded">{address}</code>
      </div>
    );
  }
  
  // Otherwise, show the create button
  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">Create Your Smart Wallet</h3>
      <p className="mb-4">
        A smart wallet gives you a secure way to receive payments from sponsors.
        No seed phrases or private keys to manage!
      </p>
      
      <button
        onClick={handleCreateWallet}
        disabled={isCreating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isCreating ? 'Creating...' : 'Create Smart Wallet'}
      </button>
      
      {error && (
        <p className="mt-2 text-red-600">{error}</p>
      )}
    </div>
  );
} 