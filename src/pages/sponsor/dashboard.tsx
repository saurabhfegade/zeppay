import React from "react";
import { Box, Heading, Text, Spinner } from "@chakra-ui/react";
import { useAuthStore } from "frontend/store/auth-store"; // <-- Import auth store hook
import type { User } from "common/types/db"; // Assuming User type is here
// TODO: Add hook import: import { useGetSponsorWallets } from '@/frontend/hooks/queries/use-get-sponsor-wallets';
// TODO: Add Layout import: import AppLayout from '@/frontend/components/layout/app-layout';

// TODO: Define or import the actual AuthState type if different
interface AuthState {
  user: User | null;
  // other state properties...
}

const SponsorDashboard = () => {
  // Access user from auth store with explicit state type
  const user = useAuthStore((state: AuthState) => state.user);

  // TODO: Uncomment and use actual query hook
  // const { data: wallets, isLoading, error } = useGetSponsorWallets();

  // Placeholder data and states for now
  const wallets = [
    {
      id: "mock-waas-1",
      wallet_address: "0xWaaS1234...abcd",
      usdc_balance: 0,
      gas_balance: 0,
      network_id: "base-sepolia",
    },
  ];
  const isLoadingWallets = false;
  const errorWallets = null;

  return (
    // TODO: Wrap with AppLayout
    <Box p={8}>
      <Heading mb={6}>Sponsor Dashboard</Heading>

      {/* Display User Details */}
      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={2}>
          Welcome, {user?.display_name || "Sponsor"}!
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
        Your WaaS Wallet
      </Heading>
      {isLoadingWallets ? (
        <Spinner />
      ) : errorWallets ? (
        <Box bg="red.100" p={4} borderRadius="md" mb={4}>
          <Text color="red.700" fontWeight="bold">
            Error Fetching Wallet:
          </Text>
          <Text color="red.600">
            {/* @ts-expect-error Property 'message' may not exist */}
            {errorWallets.message || "An unknown error occurred."}
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
          <Text>
            <strong>USDC Balance:</strong> {wallets[0].usdc_balance ?? "N/A"}{" "}
            (Mocked)
          </Text>
          <Text>
            <strong>Gas Balance:</strong> {wallets[0].gas_balance ?? "N/A"}{" "}
            (Mocked)
          </Text>
          {/* Add Onramp button/logic here later */}
        </Box>
      ) : (
        <Text>No WaaS wallet found or provisioned yet.</Text>
      )}

      {/* Add Sponsorship creation link/section later */}
    </Box>
    // </AppLayout>
  );
};

export default SponsorDashboard;
