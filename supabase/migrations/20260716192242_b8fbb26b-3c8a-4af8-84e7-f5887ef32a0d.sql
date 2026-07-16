
-- event_interests: remove anon read access
DROP POLICY IF EXISTS "interest counts viewable by anyone" ON public.event_interests;
CREATE POLICY "interest viewable by authenticated"
  ON public.event_interests FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.event_interests FROM anon;

-- profiles: restrict blanket visibility to own profile + users sharing an interest
DROP POLICY IF EXISTS "profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users view profiles with shared interests"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid()
        AND me.interests && profiles.interests
    )
  );
