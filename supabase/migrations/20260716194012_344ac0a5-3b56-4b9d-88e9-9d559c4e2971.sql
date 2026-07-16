
DROP VIEW IF EXISTS public.my_matches;
DROP VIEW IF EXISTS public.event_interest_counts;
DROP FUNCTION IF EXISTS public.get_event_interest_counts();
DROP FUNCTION IF EXISTS public.get_my_matches();
DROP FUNCTION IF EXISTS public.get_matches_for(uuid);

CREATE FUNCTION public.get_event_interest_counts()
RETURNS TABLE(event_id uuid, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_id, COUNT(*)::bigint
  FROM public.event_interests
  GROUP BY event_id;
$$;

CREATE FUNCTION public.get_matches_for(_user_id uuid)
RETURNS TABLE(
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
    WHERE p.id = _user_id
  ),
  my_events AS (
    SELECT ei.event_id FROM public.event_interests ei WHERE ei.user_id = _user_id
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
  WHERE p.id <> _user_id
    AND p.interests && me.interests
  ORDER BY score DESC;
$$;

REVOKE ALL ON FUNCTION public.get_event_interest_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_matches_for(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_event_interest_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_matches_for(uuid) TO service_role;
