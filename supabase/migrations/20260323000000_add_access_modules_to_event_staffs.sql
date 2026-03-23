-- Add access_modules to event_staff_invitations
ALTER TABLE "public"."event_staff_invitations"
ADD COLUMN IF NOT EXISTS "access_modules" jsonb DEFAULT '[]'::jsonb;

-- Add access_modules to event_staffs
ALTER TABLE "public"."event_staffs"
ADD COLUMN IF NOT EXISTS "access_modules" jsonb DEFAULT '[]'::jsonb;
