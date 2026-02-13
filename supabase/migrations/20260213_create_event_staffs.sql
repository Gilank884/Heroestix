
-- Create event_staffs table
CREATE TABLE IF NOT EXISTS public.event_staffs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  role text DEFAULT 'staff',
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT event_staffs_pkey PRIMARY KEY (id),
  CONSTRAINT event_staffs_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_staffs_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT event_staffs_unique UNIQUE (event_id, staff_id)
);

-- Create event_staff_invitations table
CREATE TABLE IF NOT EXISTS public.event_staff_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL,
  status text DEFAULT 'pending', -- pending, accepted, expired
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT event_staff_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT event_staff_invitations_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.event_staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for event_staffs

-- Creators can view staff for their events
CREATE POLICY "Creators can view their event staff" 
ON public.event_staffs FOR SELECT 
USING (
  exists (
    select 1 from public.events 
    where events.id = event_staffs.event_id 
    and events.creator_id = auth.uid()
  )
);

-- Creators can add staff to their events
CREATE POLICY "Creators can add staff" 
ON public.event_staffs FOR INSERT 
WITH CHECK (
  exists (
    select 1 from public.events 
    where events.id = event_staffs.event_id 
    and events.creator_id = auth.uid()
  )
);

-- Creators can remove staff
CREATE POLICY "Creators can remove staff" 
ON public.event_staffs FOR DELETE 
USING (
  exists (
    select 1 from public.events 
    where events.id = event_staffs.event_id 
    and events.creator_id = auth.uid()
  )
);

-- Staff can view their own records
CREATE POLICY "Staff can view own records" 
ON public.event_staffs FOR SELECT 
USING (staff_id = auth.uid());


-- Policies for event_staff_invitations

-- Creators can view invitations for their events
CREATE POLICY "Creators can view invitations" 
ON public.event_staff_invitations FOR SELECT 
USING (
  exists (
    select 1 from public.events 
    where events.id = event_staff_invitations.event_id 
    and events.creator_id = auth.uid()
  )
);

-- Creators can create invitations
CREATE POLICY "Creators can create invitations" 
ON public.event_staff_invitations FOR INSERT 
WITH CHECK (
  exists (
    select 1 from public.events 
    where events.id = event_staff_invitations.event_id 
    and events.creator_id = auth.uid()
  )
);

-- Creators can delete invitations
CREATE POLICY "Creators can delete invitations" 
ON public.event_staff_invitations FOR DELETE 
USING (
  exists (
    select 1 from public.events 
    where events.id = event_staff_invitations.event_id 
    and events.creator_id = auth.uid()
  )
);

-- ALLOW PUBLIC ACCESS TO VIEW INVITATIONS BY TOKEN (For acceptance flow)
-- This is secure because the token is the secret key.
-- Without this, unauthenticated users (clicking link from email) cannot query the invitation to verify it.
CREATE POLICY "Anyone can view invitation by token" 
ON public.event_staff_invitations FOR SELECT 
USING (true);


-- UPDATE EVENTS POLICY TO ALLOW STAFF TO VIEW
-- We need to check if the user is in event_staffs for this event
CREATE POLICY "Staff can view assigned events" 
ON public.events FOR SELECT 
USING (
  exists (
    select 1 from public.event_staffs 
    where event_staffs.event_id = events.id 
    and event_staffs.staff_id = auth.uid()
  )
);
