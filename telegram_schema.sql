-- Create telegram_chat_mappings table
CREATE TABLE IF NOT EXISTS telegram_chat_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    chat_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_chat_mappings_phone_number ON telegram_chat_mappings(phone_number);

-- Add RLS policies
ALTER TABLE telegram_chat_mappings ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role can do anything" 
    ON telegram_chat_mappings 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_telegram_chat_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_telegram_chat_mappings_updated_at
    BEFORE UPDATE ON telegram_chat_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_chat_mappings_updated_at(); 