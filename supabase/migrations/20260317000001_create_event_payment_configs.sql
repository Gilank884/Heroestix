-- Create event_payment_configs table
CREATE TABLE IF NOT EXISTS public.event_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    method_code TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    fee_type TEXT DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage')),
    fee_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, method_code)
);

-- Enable RLS
ALTER TABLE public.event_payment_configs ENABLE ROW LEVEL SECURITY;

-- Create policies (modify as needed for appropriate access)
CREATE POLICY "Public read event_payment_configs" ON public.event_payment_configs
    FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.event_payment_configs
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON TABLE public.event_payment_configs TO anon;
GRANT ALL ON TABLE public.event_payment_configs TO authenticated;
GRANT ALL ON TABLE public.event_payment_configs TO service_role;
