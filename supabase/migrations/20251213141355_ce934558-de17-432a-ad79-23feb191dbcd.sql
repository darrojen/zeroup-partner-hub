-- Fix 1: Secure the proof-uploads storage bucket
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view proof files" ON storage.objects;

-- Create a restricted SELECT policy: Only file owners and admins can view
CREATE POLICY "Owners and admins can view proof files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proof-uploads' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- Fix 2: Secure audit log insertion
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON storage.objects;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a SECURITY DEFINER function for inserting audit logs
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, NULL);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;