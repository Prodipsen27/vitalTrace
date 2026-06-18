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
