-- Add missing policies for orders table to prevent 403 errors on frontend
-- Allow users to insert orders (required during checkout)
CREATE POLICY "Users can create own orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own orders (if needed, e.g. for cancellation or status updates)
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure anon users can also see their own orders if they are not fully logged in 
-- (optional, but sometimes needed if session is weak during redirect)
-- For now, let's keep it to authenticated first.

-- Also, if the user was using 'anon' role for anything, we might need a policy for it.
-- But since Checkout.jsx checks for currentUser, we should be fine with 'authenticated'.
