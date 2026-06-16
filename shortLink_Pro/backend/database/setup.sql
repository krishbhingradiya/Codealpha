-- ============================================
-- ShortLink Pro — Database Setup Script
-- ============================================

-- Create the urls table
CREATE TABLE IF NOT EXISTS public.urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_visited TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON public.urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_is_active ON public.urls(is_active);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON public.urls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON public.urls(user_id);

-- Trigram index for fuzzy search capability on long URLs and short codes
-- Requires pg_trgm extension, which is usually pre-installed in Supabase
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_urls_search_original ON public.urls USING gin (original_url gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_urls_search_code ON public.urls USING gin (short_code gin_trgm_ops);

-- Automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_urls_modtime
    BEFORE UPDATE ON public.urls
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security (RLS) Configuration
-- We enable RLS on the table to protect the database structure,
-- and add permissive policies so the anonymous REST API client can perform CRUD.
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view URLs (public redirects)
CREATE POLICY "Allow public read access" 
ON public.urls FOR SELECT 
TO public 
USING (true);

-- Insert policy: Allow anyone to create shortened links
CREATE POLICY "Allow public insert access" 
ON public.urls FOR INSERT 
TO public 
WITH CHECK (true);

-- Update policy: Allow anyone to update urls (click increments & status toggling)
CREATE POLICY "Allow public update access" 
ON public.urls FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- Delete policy: Allow public deletions (required for url management)
CREATE POLICY "Allow public delete access" 
ON public.urls FOR DELETE 
TO public 
USING (true);
