
-- =========================================================
-- event_interests: owner-only SELECT + public counts function
-- =========================================================
DROP POLICY IF EXISTS "interest viewable by authenticated" ON public.event_interests;
DROP POLICY IF EXISTS "interest counts viewable by anyone" ON public.event_interests;

CREATE POLICY "users view own event interest"
  ON public.event_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE SELECT ON public.event_interests FROM anon;

CREATE OR REPLACE FUNCTION public.get_event_interest_counts()
RETURNS TABLE (event_id uuid, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_id, COUNT(*)::bigint
  FROM public.event_interests
  GROUP BY event_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_interest_counts() TO anon, authenticated;

-- =========================================================
-- profiles: own-only SELECT + matches function (limited fields)
-- =========================================================
DROP POLICY IF EXISTS "users view profiles with shared interests" ON public.profiles;
DROP POLICY IF EXISTS "users view own profile" ON public.profiles;

CREATE POLICY "users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.get_my_matches()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_emoji text,
  year text,
  interests text[],
  shared_interests text[],
  shared_event_count bigint,
  score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.id, p.interests
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ),
  my_events AS (
    SELECT ei.event_id FROM public.event_interests ei WHERE ei.user_id = auth.uid()
  )
  SELECT
    p.id,
    p.display_name,
    p.avatar_emoji,
    p.year,
    p.interests,
    ARRAY(SELECT UNNEST(p.interests) INTERSECT SELECT UNNEST((SELECT interests FROM me))) AS shared_interests,
    COALESCE((
      SELECT COUNT(*)::bigint
      FROM public.event_interests ei
      WHERE ei.user_id = p.id
        AND ei.event_id IN (SELECT event_id FROM my_events)
    ), 0) AS shared_event_count,
    (
      CARDINALITY(ARRAY(SELECT UNNEST(p.interests) INTERSECT SELECT UNNEST((SELECT interests FROM me)))) * 2
      + COALESCE((
          SELECT COUNT(*)::int
          FROM public.event_interests ei
          WHERE ei.user_id = p.id
            AND ei.event_id IN (SELECT event_id FROM my_events)
        ), 0) * 3
    ) AS score
  FROM public.profiles p, me
  WHERE p.id <> me.id
    AND p.interests && me.interests
  ORDER BY score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_matches() TO authenticated;
