import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "backend/middlewares/with-auth";
import { handleError } from "backend/lib/error-handler";
import { supabaseAdmin } from "backend/lib/supabase-admin"; // Using admin for direct lookup
import { Database } from "common/types/db";

export type VendorSmartWalletsResponse =
  Database["public"]["Tables"]["smart_wallets"]["Row"][];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VendorSmartWalletsResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const userId = req.userId; // Extracted by withAuth middleware
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { data, error } = await supabaseAdmin
      .from("smart_wallets")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error(
        `Error fetching Smart Wallets for vendor ${userId}:`,
        error,
      );
      return handleError(res, error);
    }

    if (!data) {
      return res
        .status(404)
        .json({ error: "No Smart Wallets found for this vendor." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(
      "An unexpected error occurred while fetching vendor Smart Wallets:",
      err,
    );
    handleError(res, err);
  }
}

export default withAuth(handler);
