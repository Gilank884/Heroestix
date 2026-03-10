-- Migration: Add unique constraint to external_id column in transactions table
-- Purpose: Enforce idempotency at the database level

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_external_id_unique UNIQUE (external_id);
