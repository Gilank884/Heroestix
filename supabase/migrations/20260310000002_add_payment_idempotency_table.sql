-- Migration: Create payment_idempotency table
-- Purpose: Store X-EXTERNAL-ID from payment callbacks for idempotency check

CREATE TABLE IF NOT EXISTS public.payment_idempotency (
    external_id text PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    payload jsonb
);

-- Index for cleanup (optional, but good for management)
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_created_at ON public.payment_idempotency (created_at);

-- Set owner
ALTER TABLE public.payment_idempotency OWNER TO postgres;

-- Add permissions
GRANT ALL ON TABLE public.payment_idempotency TO anon;
GRANT ALL ON TABLE public.payment_idempotency TO authenticated;
GRANT ALL ON TABLE public.payment_idempotency TO service_role;
