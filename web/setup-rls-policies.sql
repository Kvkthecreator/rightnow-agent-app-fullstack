-- Supabase RLS Policies Setup for Testing
-- Run this in the Supabase SQL Editor

-- Enable RLS on basket_events table
ALTER TABLE basket_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all events (temporary for testing)
CREATE POLICY "Authenticated users can view events"
ON basket_events FOR SELECT
TO authenticated
USING (true);

-- Allow anon to see events (temporary for testing)
CREATE POLICY "Anon can view events temporarily"
ON basket_events FOR SELECT
TO anon
USING (true);

-- Optional: Allow insert for testing
CREATE POLICY "Authenticated users can insert events"
ON basket_events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anon can insert events temporarily"
ON basket_events FOR INSERT
TO anon
WITH CHECK (true);

-- Check if baskets table needs similar policies
ALTER TABLE baskets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all baskets (temporary for testing)
CREATE POLICY "Authenticated users can view baskets"
ON baskets FOR SELECT
TO authenticated
USING (true);

-- Allow anon to see baskets (temporary for testing)
CREATE POLICY "Anon can view baskets temporarily"
ON baskets FOR SELECT
TO anon
USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('basket_events', 'baskets');