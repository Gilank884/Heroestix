-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Ensure replica identity is FULL for reliable realtime updates
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to view their own orders
-- This is required for Realtime to send the payload to the specific user
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Also allow service role to manage everything (safety)
CREATE POLICY "Service role can manage all orders" 
ON orders USING (auth.jwt() ->> 'role' = 'service_role');
