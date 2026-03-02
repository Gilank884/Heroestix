-- Add missing columns to transactions table for Bayarind integration
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_provider_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_tag_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS va_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Index for idempotency checks
CREATE INDEX IF NOT EXISTS idx_transactions_payment_tag_id ON transactions(payment_tag_id);
