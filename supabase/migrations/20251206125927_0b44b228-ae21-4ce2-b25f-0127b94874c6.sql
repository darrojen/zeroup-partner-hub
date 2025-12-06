-- Add policy to allow authenticated users to view partner info for leaderboard
CREATE POLICY "Authenticated users can view partners for leaderboard"
ON public.partners
FOR SELECT
USING (auth.uid() IS NOT NULL);
