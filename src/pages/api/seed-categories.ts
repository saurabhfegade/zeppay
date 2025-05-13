import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../backend/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Initial categories for the platform
const initialCategories = [
  { id: uuidv4(), name: 'Groceries', description: 'Food and household essentials' },
  { id: uuidv4(), name: 'Education', description: 'Books, tuition, and school supplies' },
  { id: uuidv4(), name: 'Healthcare', description: 'Medical services and supplies' },
  { id: uuidv4(), name: 'Housing', description: 'Rent, utilities, and home maintenance' },
  { id: uuidv4(), name: 'Transportation', description: 'Public transport, fuel, and vehicle maintenance' },
  { id: uuidv4(), name: 'Clothing', description: 'Clothing and footwear' },
  { id: uuidv4(), name: 'Communication', description: 'Phone and internet services' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if categories already exist
    const { count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
      
    if (count && count > 0) {
      return res.status(409).json({
        message: 'Categories already exist',
        count
      });
    }
    
    // Insert categories
    const { data, error } = await supabase
      .from('categories')
      .insert(initialCategories)
      .select();
      
    if (error) {
      return res.status(500).json({
        error: 'Failed to seed categories',
        details: error.message
      });
    }
    
    return res.status(201).json({
      message: 'Categories seeded successfully',
      categories: data
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Seeding failed',
      details: error?.message || 'Unknown error'
    });
  }
} 