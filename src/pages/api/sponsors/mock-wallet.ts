import { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../backend/middlewares/auth.middleware";
import { supabase } from "../../../backend/lib/db";
import { v4 as uuidv4 } from "uuid";
import { BLOCKCHAIN_NETWORK_ID } from "../../../../config";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  // Ensure user is authenticated and is a sponsor
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "sponsor") {
    return res
      .status(403)
      .json({ error: "Only sponsors can access this endpoint" });
  }

  try {
    // Check if user already has a wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from("waas_wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("network_id", BLOCKCHAIN_NETWORK_ID || "base-sepolia")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking for existing mock wallet:", fetchError);
      return res.status(500).json({
        error: "Error checking for existing wallet",
        details: fetchError.message,
      });
    }

    if (existingWallet) {
      console.log(
        `Returning existing mock wallet for user ${req.user.id}:`,
        existingWallet,
      );
      return res.status(200).json(existingWallet);
    }

    // Create a new mock wallet
    const mockWalletId = `mock_waas_${uuidv4()}`;
    const mockWalletAddress = `0x${Buffer.from(
      req.user.id.substring(0, 10) + "mockwaas",
    )
      .toString("hex")
      .padStart(40, "0")}`;
    const now = new Date().toISOString();

    const newMockWallet = {
      id: uuidv4(),
      user_id: req.user.id,
      coinbase_wallet_id: mockWalletId,
      wallet_address: mockWalletAddress,
      network_id: BLOCKCHAIN_NETWORK_ID || "base-sepolia",
      usdc_balance: 1000, // Mock initial balance
      gas_balance: 0.1, // Mock initial gas
      last_balance_sync_at: now,
      created_at: now,
      updated_at: now,
    };

    const { data: insertedWallet, error: insertError } = await supabase
      .from("waas_wallets")
      .insert(newMockWallet)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating mock WaaS wallet:", insertError);
      return res.status(500).json({
        error: "Failed to create mock wallet",
        details: insertError.message,
      });
    }

    console.log(
      `Created new mock wallet for user ${req.user.id}:`,
      insertedWallet,
    );
    return res.status(201).json(insertedWallet);
  } catch (error) {
    console.error("Unexpected error in mock-wallet handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: errorMessage });
  }
}

export default withAuth(handler, ["sponsor"]);
