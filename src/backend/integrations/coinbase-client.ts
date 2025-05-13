import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { v4 as uuidv4 } from "uuid";

// Environment Variables
const apiKeyName = process.env.COINBASE_API_KEY;
const privateKey = process.env.COINBASE_API_PRIVATE_KEY; // Renamed variable for clarity
// const waasPoolId = process.env.COINBASE_WAAS_POOL_ID; // Pool ID might not be needed for Wallet.create

if (!apiKeyName || !privateKey) {
  console.error(
    "Missing required Coinbase environment variables (API Key, Private Key)",
  );
  // Consider throwing an error or preventing startup
} else {
  // Initialize using the static configure method
  Coinbase.configure({
    apiKeyName: apiKeyName,
    privateKey: privateKey,
    // Network configuration might happen elsewhere or be default
  });
  console.log("[Coinbase Client] Coinbase SDK Configured.");
}

// --- WaaS Wallet Creation (Sponsor) ---

interface WaaSWalletDetails {
  coinbase_wallet_id: string; // The ID from WaaS SDK (wallet.getId())
  address: string; // The blockchain address
  network: string; // The network ID (e.g., 'base-sepolia')
}

/**
 * Creates a Coinbase WaaS wallet for a sponsor user using the SDK.
 * Assumes SDK configuration provides necessary context (like pool).
 */
export const createCoinbaseWaaSWallet = async (
  userId: string,
): Promise<WaaSWalletDetails> => {
  try {
    console.log(`[Coinbase Client] Creating WaaS wallet for user: ${userId}`);

    const wallet = await Wallet.create();

    const walletId = wallet.getId();
    if (!walletId) {
      throw new Error("Created wallet is missing an ID.");
    }
    console.log(`[Coinbase Client] Wallet created with ID: ${walletId}`);

    // Get the default address object
    const addressObject = await wallet.getDefaultAddress();
    // Try calling .toString() for the address string
    const addressString = addressObject.toString();

    const network = wallet.getNetworkId() || "base-sepolia";

    console.log(
      `[Coinbase Client] Default address obtained: ${addressString} on network ${network}`,
    );

    if (!addressString) {
      throw new Error(
        "Default address string could not be retrieved for the created wallet.",
      );
    }

    return {
      coinbase_wallet_id: walletId,
      address: addressString,
      network: network,
    };
  } catch (error) {
    let errorMessage = "Unknown error during WaaS wallet creation";
    let errorCause: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorCause = error.cause; // error.cause is often where richer context is
    }

    console.error(
      "[Coinbase Client] Error creating WaaS wallet:",
      errorMessage,
      errorCause ? `Cause: ${JSON.stringify(errorCause, null, 2)}` : "",
    );
    throw new Error(
      `Failed to create WaaS wallet via Coinbase SDK: ${errorMessage}`,
    );
  }
};

// --- Vendor Smart Wallet (Placeholder) ---

interface MockSmartWallet {
  wallet_address: string;
  network_id: string;
  is_platform_created: boolean;
}
/**
 * MOCK IMPLEMENTATION - Placeholder
 * Creating non-custodial smart wallets (like Base Smart Wallets) usually requires
 * direct interaction with the blockchain via libraries like ethers.js or viem,
 * potentially using SDKs specific to the smart wallet implementation (e.g., Base).
 * This function remains a placeholder.
 */
export const createVendorSmartWallet = async (
  userId: string,
  network: string = "base-sepolia",
): Promise<MockSmartWallet> => {
  console.warn(
    `[Mock Coinbase Client] Simulating Smart Wallet creation for user: ${userId} on network: ${network}. Needs actual implementation using Base/ethers/viem.`,
  );
  const mockAddress = `0xSmart${userId.substring(0, 7)}...${uuidv4().substring(
    0,
    4,
  )}`;
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    wallet_address: mockAddress,
    network_id: network,
    is_platform_created: true,
  };
};

// Export the configured Coinbase object (or Wallet class) if needed elsewhere
// export { Coinbase, Wallet }; // Exporting classes might be more useful
