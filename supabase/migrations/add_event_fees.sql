-- Migration to add customizable Platform Fee and Payment Method Fees to events
-- This allows creators to set their own fees, similar to Entertainment Tax (Pajak Hiburan).

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS platform_fee_type text DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS platform_fee_value numeric DEFAULT 5000,
ADD COLUMN IF NOT EXISTS payment_fees jsonb DEFAULT '{
  "BNI": {"type": "fixed", "value": 5000},
  "BRI": {"type": "fixed", "value": 5000},
  "MANDIRI": {"type": "fixed", "value": 5000},
  "QRIS": {"type": "fixed", "value": 3000},
  "OVO": {"type": "fixed", "value": 3500},
  "SHOPEEPAY": {"type": "fixed", "value": 3500},
  "LINKAJA": {"type": "fixed", "value": 5000}
}'::jsonb;

-- Add constraint for platform_fee_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_platform_fee_type_check') THEN
        ALTER TABLE public.events
        ADD CONSTRAINT events_platform_fee_type_check 
        CHECK (platform_fee_type = ANY (ARRAY['fixed'::text, 'percentage'::text]));
    END IF;
END $$;

-- Populate existing events
UPDATE public.events 
SET 
  platform_fee_type = 'fixed',
  platform_fee_value = 5000,
  payment_fees = '{
    "BNI": {"type": "fixed", "value": 5000},
    "BRI": {"type": "fixed", "value": 5000},
    "MANDIRI": {"type": "fixed", "value": 5000},
    "QRIS": {"type": "fixed", "value": 3000},
    "OVO": {"type": "fixed", "value": 3500},
    "SHOPEEPAY": {"type": "fixed", "value": 3500},
    "LINKAJA": {"type": "fixed", "value": 5000}
  }'::jsonb
WHERE platform_fee_value IS NULL;

COMMENT ON COLUMN public.events.platform_fee_value IS 'Base platform fee set by the creator.';
COMMENT ON COLUMN public.events.payment_fees IS 'JSON mapping of payment methods to their specific fees.';
