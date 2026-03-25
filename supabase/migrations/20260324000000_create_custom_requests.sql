-- Create custom_orders table
CREATE TABLE IF NOT EXISTS public.custom_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    items TEXT[] NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, completed, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Creators can view own orders" ON public.custom_orders
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own orders" ON public.custom_orders
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can view all orders" ON public.custom_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
        )
    );

CREATE POLICY "Admins can update orders" ON public.custom_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
        )
    );
