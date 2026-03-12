-- Migration: Add missing transaction columns
-- Purpose: Support all fields used in payment functions and customer data storage

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_channel text,
ADD COLUMN IF NOT EXISTS insert_id text,
ADD COLUMN IF NOT EXISTS provider_raw_response jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_response_code text,
ADD COLUMN IF NOT EXISTS trx_message text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS paid_amount numeric,
ADD COLUMN IF NOT EXISTS bank_trx_id text,
ADD COLUMN IF NOT EXISTS bank_reference text,
ADD COLUMN IF NOT EXISTS transaction_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS reference_no text,
ADD COLUMN IF NOT EXISTS trx_status text,
ADD COLUMN IF NOT EXISTS last_inquiry_request_id text,
ADD COLUMN IF NOT EXISTS last_webhook_received_at timestamp with time zone;

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_transactions_insert_id ON public.transactions (insert_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_no ON public.transactions (reference_no);
