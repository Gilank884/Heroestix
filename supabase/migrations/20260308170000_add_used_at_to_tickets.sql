-- Migration: Add used_at column to tickets table
-- Purpose: Track check-in timestamps for real-time analytics

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;

-- Index for performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_tickets_used_at ON public.tickets (used_at) WHERE (status = 'used');
