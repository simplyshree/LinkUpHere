
DROP FUNCTION IF EXISTS public.get_event_interest_counts();
DROP FUNCTION IF EXISTS public.get_my_matches();

CREATE VIEW public.event_interest_counts AS
  SELECT event_id, COUNT(*)::bigint AS count
  FROM public.event_interests
  GROUP BY event_id;

GRANT SELECT ON public.event_interest_counts TO anon, authenticated;

CREATE VIEW public.my_matches AS
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
    AND p.interests && me.interests;

GRANT SELECT ON public.my_matches TO authenticated;
