-- Migration: Add external_id column to transactions table
-- Purpose: Track external IDs for idempotency and conflict check

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS external_id text;

-- Index for performance on external_id lookups
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions (external_id);
