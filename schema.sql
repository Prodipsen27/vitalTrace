-- VitalTrace Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize the tables and RPC functions.

-- 1. Enable the vector extension (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the biomarker_history table
CREATE TABLE IF NOT EXISTS biomarker_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    biomarker_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create an HNSW index for fast vector similarity search (optional, but highly recommended for performance)
CREATE INDEX IF NOT EXISTS biomarker_history_embedding_idx 
ON biomarker_history 
USING hnsw (embedding vector_cosine_ops);

-- 4. Create the RPC function search_biomarker_history for similarity-based history matching
CREATE OR REPLACE FUNCTION search_biomarker_history(
    query_embedding VECTOR(1536),
    match_patient_id TEXT,
    match_biomarker TEXT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    patient_id TEXT,
    report_id TEXT,
    report_date DATE,
    biomarker_name TEXT,
    value DOUBLE PRECISION,
    unit TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bh.id,
        bh.patient_id,
        bh.report_id,
        bh.report_date,
        bh.biomarker_name,
        bh.value,
        bh.unit,
        bh.status,
        bh.created_at,
        1 - (bh.embedding <=> query_embedding) AS similarity
    FROM biomarker_history bh
    WHERE bh.patient_id = match_patient_id
      AND bh.biomarker_name = match_biomarker
    ORDER BY bh.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. Enable Row Level Security (RLS) on the table
ALTER TABLE biomarker_history ENABLE ROW LEVEL SECURITY;

-- 6. Create a policy that allows authenticated users to access only their own data
-- Note: patient_id must match the authenticated user's UUID.
DROP POLICY IF EXISTS "Users can only access their own biomarker history" ON biomarker_history;
CREATE POLICY "Users can only access their own biomarker history"
ON biomarker_history
FOR ALL
TO authenticated
USING (auth.uid()::text = patient_id);

