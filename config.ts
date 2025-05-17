export const DATABASE_URL = process.env.DATABASE_URL;
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Non-public

export const NEXT_PUBLIC_CDP_PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
export const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID;
export const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET; // Non-public
export const CDP_WALLET_SECRET = process.env.CDP_WALLET_SECRET; // Non-public

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Non-public

export const BLOCKCHAIN_NETWORK_ID = process.env.BLOCKCHAIN_NETWORK_ID;
export const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL;

export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const coinbase_color = "#0052FF";

// Helper function to ensure critical environment variables are set
const ensureEnvVar = (varName: string, value?: string): string => {
  if (!value) {
    throw new Error(`Missing critical environment variable: ${varName}`);
  }
  return value;
};

// You might want to ensure critical server-side vars are loaded at startup
// For example, in a server initialization file or at the top of service files.
// This is just a conceptual example of ensuring they exist when accessed.
export const getSupabaseServiceKey = () =>
  ensureEnvVar("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
// Add similar getters for other critical non-public keys if needed.

// Note: process.env variables are strings. Convert to numbers or booleans if needed.
