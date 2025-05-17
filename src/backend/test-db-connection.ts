import { healthCheck, supabase } from './lib/db';

async function main() {
  console.log('Testing database connection...');
  
  try {
    // Test PostgreSQL connection
    const dbHealthy = await healthCheck();
    console.log(`PostgreSQL Connection: ${dbHealthy ? 'SUCCESS' : 'FAILED'}`);

    // Test Supabase connection
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase Connection Error:', error);
    } else {
      console.log('Supabase Connection: SUCCESS');
      console.log('Categories count:', count || 0);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

main(); 