import React from "react";
import { Box, Heading, Text, Spinner } from "@chakra-ui/react";
import { useAuthStore } from "frontend/store/auth-store"; // <-- Import auth store hook
import type { User } from "common/types/db"; // Assuming User type is here

// TODO: Define or import the actual AuthState type if different
interface AuthState {
  user: User | null;
  // other state properties...
}

// TODO: Add hook import: import { useGetVendorWallets } from '@/frontend/hooks/queries/use-get-vendor-wallets';
// TODO: Add Layout import: import AppLayout from '@/frontend/components/layout/app-layout';

const VendorDashboard = () => {
  // Access user from auth store
  const user = useAuthStore((state: AuthState) => state.user);

  // TODO: Uncomment and use actual query hook
  // const { data: wallets, isLoading, error } = useGetVendorWallets();

  // Placeholder data and states for now
  const wallets = [
    {
      id: "mock-smart-1",
      wallet_address: "0xSmartVendor789...wxyz",
      network_id: "base-sepolia",
    },
  ];
  const isLoadingWallets = false; // Renamed for clarity
  const errorWallets = null; // Set back to null for normal state
  // To test error display, set errorWallets to an object, e.g.:
  // const errorWallets = { message: "Failed to load wallets." };

  return (
    // TODO: Wrap with AppLayout
    <Box p={8}>
      <Heading mb={6}>Vendor Dashboard</Heading>

      {/* Display User Details */}
      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={2}>
          Welcome, {user?.display_name || "Vendor"}!
        </Heading>
        <Text>
          <strong>Email:</strong> {user?.email || "N/A"}
        </Text>
        <Text>
          <strong>Phone:</strong> {user?.phone_number || "N/A"}
        </Text>
      </Box>

      {/* Display Wallet Details */}
      <Heading size="md" mb={4}>
        Your Smart Wallet
      </Heading>
      {isLoadingWallets ? (
        <Spinner />
      ) : errorWallets ? (
        <Box bg="red.100" p={4} borderRadius="md" mb={4}>
          <Text color="red.700" fontWeight="bold">
            Error Fetching Wallet (Placeholder)
          </Text>
        </Box>
      ) : wallets && wallets.length > 0 ? (
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Text>
            <strong>Wallet Address:</strong> {wallets[0].wallet_address}
          </Text>
          <Text>
            <strong>Network:</strong> {wallets[0].network_id}
          </Text>
          {/* Add Offramp button/logic here later */}
        </Box>
      ) : (
        <Text>No Smart wallet found or provisioned yet.</Text>
      )}

      {/* Add Transaction initiation link/section later */}
    </Box>
    // </AppLayout>
  );
};

export default VendorDashboard;
