
-- Function to check if the current user has connected their GitHub account
CREATE OR REPLACE FUNCTION public.check_github_connection()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  connection_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.github_connections 
    WHERE user_id = auth.uid()
  ) INTO connection_exists;
  
  RETURN connection_exists;
END;
$$;

-- Function to disconnect the current user's GitHub account
CREATE OR REPLACE FUNCTION public.disconnect_github()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.github_connections
  WHERE user_id = auth.uid();
END;
$$;
