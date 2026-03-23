-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-assets', 'creator-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for authenticated users to upload and select
DO $$
BEGIN
  -- We'll just define basic RLS policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT USING (bucket_id = 'creator-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anon Up'
  ) THEN
    CREATE POLICY "Anon Up" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'creator-assets');
  END IF;
END $$;
