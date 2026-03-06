-- SQL Script to setup Database Webhook for Order Fulfillment
-- This script should be run in your Supabase SQL Editor.

-- IMPORTANT: You must replace 'YOUR_PROJECT_REF' and 'YOUR_SERVICE_ROLE_KEY' 
-- with your actual Supabase Project Reference and Service Role Key.

-- 1. Ensure the necessary extensions are enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create the fulfillment trigger
-- This trigger will call the 'order-fulfillment' edge function whenever an order is marked as 'paid'
DROP TRIGGER IF EXISTS on_order_paid_fulfillment ON public.orders;
CREATE TRIGGER on_order_paid_fulfillment
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid'))
EXECUTE FUNCTION supabase_functions.http_request(
  'https://qftuhnkzyegcxfozdfyz.supabase.co/functions/v1/order-fulfillment',
  'POST',
  '{"Content-Type":"application/json", "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk2ODQ0MCwiZXhwIjoyMDg0NTQ0NDQwfQ.NV0zopPt792MtBVsE0ERekmlz9Mfio45yUHdNuNlYM4"}',
  '{}'
);

COMMENT ON TRIGGER on_order_paid_fulfillment ON public.orders IS 'Triggers order fulfillment (stock, earnings, email) when an order is paid.';
