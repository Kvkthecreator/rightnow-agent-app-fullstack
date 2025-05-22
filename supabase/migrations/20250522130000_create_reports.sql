-- V005__create_reports.sql
-- Migration: Create reports table

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_id TEXT NOT NULL,
  inputs JSONB NOT NULL,
  output_json JSONB,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);