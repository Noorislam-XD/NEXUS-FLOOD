-- ==============================================================================
-- NEXUS FLOOD — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Complete schema for incidents, evidence, AI analysis, response actions,
--              resources, incident updates, and profiles with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'first_responder', 'coordinator', 'admin')),
    organization TEXT,
    phone TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. INCIDENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL DEFAULT 'flood' CHECK (
        incident_type IN ('flood', 'flash_flood', 'infrastructure_damage', 'rescue_needed', 'road_closure', 'other')
    ),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'critical', 'unassessed')
    ),
    verification_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (
        verification_status IN ('verified', 'unconfirmed', 'conflicting', 'unknown')
    ),
    incident_status TEXT NOT NULL DEFAULT 'reported' CHECK (
        incident_status IN ('reported', 'investigating', 'responding', 'resolved', 'closed')
    ),
    source_type TEXT NOT NULL DEFAULT 'community_report',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'responders_only', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_priority ON public.incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_verification ON public.incidents(verification_status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(incident_status);
CREATE INDEX IF NOT EXISTS idx_incidents_coords ON public.incidents(latitude, longitude);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public incidents are viewable by anyone" 
    ON public.incidents FOR SELECT 
    USING (visibility = 'public' OR auth.role() = 'service_role');

CREATE POLICY "Anyone can report an incident" 
    ON public.incidents FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Authenticated users or service role can update incidents" 
    ON public.incidents FOR UPDATE 
    USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 3. EVIDENCE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    file_path TEXT,
    file_type TEXT,
    source_type TEXT NOT NULL DEFAULT 'community_upload' CHECK (
        source_type IN ('photo', 'audio_recording', 'video', 'document', 'official_bulletin', 'news_report', 'sensor', 'community_upload')
    ),
    source_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (
        verification_status IN ('verified', 'unconfirmed', 'conflicting', 'unknown')
    ),
    verification_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON public.evidence(incident_id);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence viewable by public" 
    ON public.evidence FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can submit evidence" 
    ON public.evidence FOR INSERT 
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. AI_ANALYSIS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    analysis_json JSONB NOT NULL,
    confidence_score NUMERIC(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_incident_id ON public.ai_analysis(incident_id);

ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI analysis viewable by public" 
    ON public.ai_analysis FOR SELECT 
    USING (true);

CREATE POLICY "Service role can insert AI analysis" 
    ON public.ai_analysis FOR INSERT 
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. RESPONSE_ACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.response_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'suggested' CHECK (
        status IN ('suggested', 'awaiting_approval', 'approved', 'in_progress', 'completed', 'rejected')
    ),
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    supporting_evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_response_actions_status ON public.response_actions(status);

ALTER TABLE public.response_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Response actions viewable by public" 
    ON public.response_actions FOR SELECT 
    USING (true);

CREATE POLICY "Responders or service role can manage response actions" 
    ON public.response_actions FOR ALL 
    USING (true);

-- ------------------------------------------------------------------------------
-- 6. RESOURCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('emergency_services', 'shelter', 'medical', 'community_org', 'relief_distribution', 'information_center')
    ),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone TEXT,
    contact_information JSONB,
    official_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (
        verification_status IN ('verified', 'unconfirmed', 'closed', 'inactive')
    ),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources viewable by public" 
    ON public.resources FOR SELECT 
    USING (true);

-- ------------------------------------------------------------------------------
-- 7. INCIDENT_UPDATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    update_text TEXT NOT NULL,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON public.incident_updates(incident_id);

ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Incident updates viewable by public" 
    ON public.incident_updates FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can post updates" 
    ON public.incident_updates FOR INSERT 
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKETS (Private by default)
-- ------------------------------------------------------------------------------
-- Insert bucket for incident evidence files if storage schema exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('nexus-evidence', 'nexus-evidence', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
