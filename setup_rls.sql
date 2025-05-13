-- Create a function to help with setting up RLS
CREATE OR REPLACE FUNCTION setup_users_rls()
RETURNS text AS $$
BEGIN
  -- Disable RLS temporarily to make changes
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read their own data" ON users;
  DROP POLICY IF EXISTS "Users can update their own data" ON users;
  DROP POLICY IF EXISTS "Admin can do everything" ON users;
  
  -- Create policies for users table
  CREATE POLICY "Users can read their own data" 
    ON users 
    FOR SELECT 
    USING (auth.uid() = id);
  
  CREATE POLICY "Users can update their own data" 
    ON users 
    FOR UPDATE 
    USING (auth.uid() = id);
    
  CREATE POLICY "Service role can do anything" 
    ON users 
    USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- Same for waas_wallets
  ALTER TABLE waas_wallets DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service role can do anything" ON waas_wallets;
  CREATE POLICY "Service role can do anything" 
    ON waas_wallets 
    USING (auth.jwt() ->> 'role' = 'service_role');
  CREATE POLICY "Users can view their own wallets" 
    ON waas_wallets 
    FOR SELECT 
    USING (auth.uid() = user_id);
  ALTER TABLE waas_wallets ENABLE ROW LEVEL SECURITY;
  
  -- Same for smart_wallets
  ALTER TABLE smart_wallets DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service role can do anything" ON smart_wallets;
  CREATE POLICY "Service role can do anything" 
    ON smart_wallets 
    USING (auth.jwt() ->> 'role' = 'service_role');
  CREATE POLICY "Users can view their own wallets" 
    ON smart_wallets 
    FOR SELECT 
    USING (auth.uid() = user_id);
  ALTER TABLE smart_wallets ENABLE ROW LEVEL SECURITY;
  
  RETURN 'RLS policies configured successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For quick testing, you can call the function directly
-- SELECT setup_users_rls();

-- To disable RLS for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY; 