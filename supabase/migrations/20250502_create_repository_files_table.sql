
-- Create a table for repository files
CREATE TABLE IF NOT EXISTS public.repository_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on repository_name and file_path for faster lookups
CREATE INDEX IF NOT EXISTS repository_files_repo_path_idx ON public.repository_files(repository_name, file_path);

-- Create index on session_id for faster lookups by conversation
CREATE INDEX IF NOT EXISTS repository_files_session_id_idx ON public.repository_files(session_id);

-- Create index on user_id for user-specific lookups
CREATE INDEX IF NOT EXISTS repository_files_user_id_idx ON public.repository_files(user_id);

-- Enable Row Level Security
ALTER TABLE public.repository_files ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to select their own repository files
CREATE POLICY "Users can view their own repository files"
ON public.repository_files
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create a policy that allows authenticated users to insert repository files
CREATE POLICY "Users can insert repository files"
ON public.repository_files
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER set_repository_files_updated_at
BEFORE UPDATE ON public.repository_files
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();
