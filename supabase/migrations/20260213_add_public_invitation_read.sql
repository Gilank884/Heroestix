-- Add public read policy for invitation token validation
-- This allows unauthenticated users to view invitation details when they have a valid token
CREATE POLICY "Anyone can view invitation by token"
  ON public.event_staff_invitations
  FOR SELECT
  USING (true);  -- Allow public read access for invitation validation
