import { http, createConfig } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

// Create a Coinbase Wallet connector with Smart Wallet configuration
export const cbWalletConnector = coinbaseWallet({
  appName: "ZepPay Vendor Wallet",
  preference: "smartWalletOnly", // Force Smart Wallet only mode
});

// Create Wagmi config with Base Sepolia testnet
export const config = createConfig({
  chains: [baseSepolia, base],
  multiInjectedProviderDiscovery: false, // Disable other wallet providers
  connectors: [cbWalletConnector],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

// Type definitions for TypeScript
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
