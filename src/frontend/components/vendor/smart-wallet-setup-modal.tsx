import { useEffect, useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, StepTitle, StepDescription, StepSeparator, 
  Box, Text, VStack, useToast, Tag
} from '@chakra-ui/react';
import { useVendorSetupStore, useVendorSetupActions } from '@/frontend/store/vendor-setup-store';
import { useRegisterVendorWalletMutation } from '@/frontend/hooks/mutations/use-register-vendor-wallet-mutation';
import { useConnect, useAccount } from 'wagmi';
import { cbWalletConnector } from '@/common/lib/wagmi'; // Assuming this is the correct path

const setupSteps = [
  { title: 'Connect Wallet', description: 'Create or connect your Smart Wallet via Coinbase.' },
  { title: 'Register Wallet', description: 'Confirm and register this wallet with ZepPay.' },
];

export const SmartWalletSetupModal = () => {
  const isModalOpen = useVendorSetupStore((state) => state.isSetupModalOpen);
  const currentStep = useVendorSetupStore((state) => state.setupStep);
  const generatedAddress = useVendorSetupStore((state) => state.generatedWalletAddress);
  const { setSetupStep, setGeneratedWalletAddress } = useVendorSetupActions(); // Removed closeSetupModal as it's handled by mutation success

  const toast = useToast();
  const { connect, isPending: isConnecting, error: connectError, connectors } = useConnect();
  const { address: connectedAddress, isConnected, status: accountStatus } = useAccount();
  
  const { mutate: registerWallet, isPending: isRegistering } = useRegisterVendorWalletMutation();

  const [localConnectError, setLocalConnectError] = useState<string | null>(null);

  // Handle wallet connection via Wagmi
  const handleConnectWallet = () => {
    setLocalConnectError(null);
    // Find the Coinbase Wallet connector if multiple are provided by wagmi
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK' || c.name.toLowerCase().includes('coinbase'));
    if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
    } else {
        // Fallback or error if specific Coinbase connector isn't found directly by cbWalletConnector
        // This might happen if cbWalletConnector is not the specific instance but a more generic one.
        // For now, we assume cbWalletConnector is the correct one if the specific find fails.
        connect({ connector: cbWalletConnector }); 
        console.warn('Direct cbWalletConnector used as specific Coinbase connector was not found in list. Ensure cbWalletConnector is specific.')
    }
  };

  // Effect to process Wagmi connection result
  useEffect(() => {
    if (isConnected && connectedAddress) {
      setGeneratedWalletAddress(connectedAddress);
      setSetupStep(1); // Move to next step (Register Wallet)
      setLocalConnectError(null);
    } else if (accountStatus === 'disconnected' && currentStep === 0 && !isConnecting) {
      setGeneratedWalletAddress(null);
    }
  }, [isConnected, connectedAddress, accountStatus, setGeneratedWalletAddress, setSetupStep, currentStep, isConnecting]);

  // Effect to handle Wagmi connect hook errors
  useEffect(() => {
    if (connectError) {
      const wagmiErrorMsg = connectError.message || 'Failed to connect wallet.';
      console.error('Wagmi Connect Error:', connectError);
      setLocalConnectError(wagmiErrorMsg);
      toast({ title: 'Wallet Connection Error', description: wagmiErrorMsg, status: 'error', duration: 7000, isClosable: true });
    }
  }, [connectError, toast]);

  const handleRegisterWallet = () => {
    if (generatedAddress) {
      registerWallet({
        wallet_address: generatedAddress,
        // network_id: 'base-sepolia', // Will be set by backend if not provided
      });
      // On successful registration, the mutation hook will close the modal and update hasWallet state.
    } else {
      toast({ title: 'Error', description: 'No wallet address to register.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  // The modal is non-dismissible by click or escape key
  return (
    <Modal isOpen={isModalOpen} onClose={() => { /* No direct close */ }} closeOnOverlayClick={false} closeOnEsc={false} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Vendor Smart Wallet Setup</ModalHeader>
        <ModalBody pb={6}>
          <Stepper index={currentStep} colorScheme="teal" mb={6} orientation="horizontal">
            {setupSteps.map((step, index) => (
              <Step key={index}>
                <StepIndicator><StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} /></StepIndicator>
                <Box flexShrink='0'><StepTitle>{step.title}</StepTitle><StepDescription>{step.description}</StepDescription></Box>
                {index < setupSteps.length - 1 && <StepSeparator />}
              </Step>
            ))}
          </Stepper>

          {currentStep === 0 && (
            <VStack spacing={4} align="center" textAlign="center" p={4}>
              <Text fontSize="lg">Welcome, Vendor!</Text>
              <Text>To receive payments on ZepPay, you need a Smart Wallet.</Text>
              <Text>We&apos;ll help you create or connect one securely using Coinbase.</Text>
              <Button 
                colorScheme="teal" 
                onClick={handleConnectWallet} 
                isLoading={isConnecting}
                loadingText="Connecting to Coinbase Wallet..."
                size="lg"
                mt={4}
                px={8}
              >
                Create or Connect Smart Wallet
              </Button>
              {isConnecting && <Text fontSize="sm" color="gray.500" mt={2}>Please follow the prompts from Coinbase Wallet...</Text>}
              {localConnectError && (
                <Text color="red.500" mt={2} fontWeight="medium">Error: {localConnectError}</Text>
              )}
            </VStack>
          )}

          {currentStep === 1 && (
            <VStack spacing={4} align="stretch" p={4}>
              <Text fontSize="lg">Confirm Your Wallet</Text>
              <Text>Your Smart Wallet has been connected successfully:</Text>
              <Box borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                <Tag size="md" colorScheme="green" mb={2}>Connected Wallet Address</Tag>
                <Text fontWeight="bold" fontSize="lg" isTruncated maxWidth="100%">{generatedAddress || 'Fetching address...'}</Text>
              </Box>
              <Text mt={2}>Please confirm this is the correct wallet address you wish to use for receiving payments on ZepPay.</Text>
              <Button 
                colorScheme="green" 
                onClick={handleRegisterWallet} 
                isLoading={isRegistering}
                loadingText="Registering Wallet..."
                isDisabled={!generatedAddress || isRegistering}
                size="lg"
                mt={4}
                px={8}
              >
                Confirm and Register This Wallet
              </Button>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="gray.200" justifyContent="center">
            <Text fontSize="xs" color="gray.500">
                Note: Wallet setup is required to access vendor features. 
            </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
