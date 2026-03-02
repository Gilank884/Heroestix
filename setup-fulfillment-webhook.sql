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
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/order-fulfillment',
  'POST',
  '{"Content-Type":"application/json", "Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}'
);

COMMENT ON TRIGGER on_order_paid_fulfillment ON public.orders IS 'Triggers order fulfillment (stock, earnings, email) when an order is paid.';
