-- Migration to add scanned_by column to tickets table
ALTER TABLE "public"."tickets" ADD COLUMN IF NOT EXISTS "scanned_by" text;
