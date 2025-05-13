import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📥 API: /api/vendors/test-transactions received request', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Just echo back the request body as a test
    return res.status(200).json({
      success: true,
      received_data: req.body,
      message: 'Test transactions endpoint working'
    });
  } catch (error) {
    console.error('Error in test transactions API route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 