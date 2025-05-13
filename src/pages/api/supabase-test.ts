import { supabaseAdmin } from 'backend/lib/supabase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple query to test connection: get current timestamp from Postgres
  const { data, error } = await supabaseAdmin.rpc('now');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, data });
} 