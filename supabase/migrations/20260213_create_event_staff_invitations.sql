-- Create event_staff_invitations table
CREATE TABLE IF NOT EXISTS public.event_staff_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_staff_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT event_staff_invitations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_staff_invitations_token_unique UNIQUE (token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_staff_invitations_token ON public.event_staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_event_staff_invitations_email ON public.event_staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_event_staff_invitations_event_id ON public.event_staff_invitations(event_id);

-- Enable RLS
ALTER TABLE public.event_staff_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_staff_invitations
-- 1. Event creators can view invitations for their events
CREATE POLICY "Creators can view their event invitations"
  ON public.event_staff_invitations
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE creator_id IN (
        SELECT id FROM public.creators WHERE id = auth.uid()
      )
    )
  );

-- 2. Event creators can insert invitations for their events
CREATE POLICY "Creators can create invitations for their events"
  ON public.event_staff_invitations
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE creator_id IN (
        SELECT id FROM public.creators WHERE id = auth.uid()
      )
    )
  );

-- 3. Event creators can update invitations for their events
CREATE POLICY "Creators can update their event invitations"
  ON public.event_staff_invitations
  FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE creator_id IN (
        SELECT id FROM public.creators WHERE id = auth.uid()
      )
    )
  );

-- 4. Event creators can delete invitations for their events
CREATE POLICY "Creators can delete their event invitations"
  ON public.event_staff_invitations
  FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE creator_id IN (
        SELECT id FROM public.creators WHERE id = auth.uid()
      )
    )
  );

-- 5. Allow service role to manage all invitations (for Edge Functions)
CREATE POLICY "Service role can manage all invitations"
  ON public.event_staff_invitations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
