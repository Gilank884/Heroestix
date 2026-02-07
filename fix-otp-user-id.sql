-- Fix OTP table user_id column to accept text instead of strict UUID
-- This allows more flexibility while maintaining foreign key relationship

ALTER TABLE otp ALTER COLUMN user_id TYPE text;
