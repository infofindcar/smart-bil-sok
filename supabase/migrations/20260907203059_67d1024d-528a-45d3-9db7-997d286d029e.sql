CREATE OR REPLACE FUNCTION public.admin_car_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM "Lovable" WHERE is_active IS DISTINCT FROM false),
    'makes', (SELECT count(DISTINCT make) FROM "Lovable" WHERE make IS NOT NULL),
    'cities', (SELECT count(DISTINCT city) FROM "Lovable" WHERE city IS NOT NULL),
    'new_24h', (SELECT count(*) FROM "Lovable" WHERE created_at > now() - interval '24 hours'),
    'last_import', (SELECT max(last_seen_at) FROM "Lovable"),
    'last_created', (SELECT max(created_at) FROM "Lovable"),
    'with_gallery', (SELECT count(*) FROM "Lovable" WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 1),
    'with_image', (SELECT count(*) FROM "Lovable" WHERE image_thumb_url IS NOT NULL),
    'missing_info', (SELECT count(*) FROM "Lovable" WHERE horsepower IS NULL OR horsepower = 0
                      OR body_type IS NULL OR body_type IN ('Okänd','Unknown')
                      OR drivetrain IS NULL OR drivetrain = 'Unknown'),
    'partner_cars', (SELECT count(*) FROM avtal_bilar WHERE is_active IS DISTINCT FROM false)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_car_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_car_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_car_stats() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_traffic_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH views AS (
    SELECT * FROM analytics_events
    WHERE event_name = 'page_view' AND created_at > now() - interval '30 days'
  )
  SELECT jsonb_build_object(
    'visitors_today', (SELECT count(DISTINCT coalesce(visitor_hash, id::text)) FROM views WHERE created_at::date = (now() AT TIME ZONE 'Europe/Stockholm')::date),
    'visitors_7d', (SELECT count(DISTINCT coalesce(visitor_hash, id::text)) FROM views WHERE created_at > now() - interval '7 days'),
    'visitors_30d', (SELECT count(DISTINCT coalesce(visitor_hash, id::text)) FROM views),
    'pageviews_today', (SELECT count(*) FROM views WHERE created_at::date = (now() AT TIME ZONE 'Europe/Stockholm')::date),
    'pageviews_7d', (SELECT count(*) FROM views WHERE created_at > now() - interval '7 days'),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'pageviews', pageviews) ORDER BY day), '[]'::jsonb) FROM (
        SELECT to_char(created_at AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD') AS day,
               count(DISTINCT coalesce(visitor_hash, id::text)) AS visitors,
               count(*) AS pageviews
        FROM views GROUP BY 1
      ) x
    ),
    'top_pages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('page', page, 'views', views_count) ORDER BY views_count DESC), '[]'::jsonb) FROM (
        SELECT coalesce(page_path, '(okänd)') AS page, count(*) AS views_count
        FROM views GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      ) y
    ),
    'devices', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('device', device_name, 'views', views_count) ORDER BY views_count DESC), '[]'::jsonb) FROM (
        SELECT coalesce(device, 'okänd') AS device_name, count(*) AS views_count
        FROM views GROUP BY 1 ORDER BY 2 DESC
      ) z
    ),
    'referrers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', src, 'views', views_count) ORDER BY views_count DESC), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(referrer, ''), 'direkt') AS src, count(*) AS views_count
        FROM views GROUP BY 1 ORDER BY 2 DESC LIMIT 8
      ) w
    ),
    'searches_today', (SELECT count(*) FROM analytics_events WHERE event_name = 'search_started' AND created_at::date = (now() AT TIME ZONE 'Europe/Stockholm')::date),
    'searches_7d', (SELECT count(*) FROM analytics_events WHERE event_name = 'search_started' AND created_at > now() - interval '7 days'),
    'searches_daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'searches', searches) ORDER BY day), '[]'::jsonb) FROM (
        SELECT to_char(created_at AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD') AS day, count(*) AS searches
        FROM analytics_events
        WHERE event_name = 'search_started' AND created_at > now() - interval '30 days'
        GROUP BY 1
      ) s
    ),
    'no_results_7d', (SELECT count(*) FROM analytics_events WHERE event_name = 'search_no_results' AND created_at > now() - interval '7 days'),
    'results_7d', (SELECT count(*) FROM analytics_events WHERE event_name = 'search_results' AND created_at > now() - interval '7 days'),
    'car_views_7d', (SELECT count(*) FROM analytics_events WHERE event_name = 'car_view' AND created_at > now() - interval '7 days'),
    'shares_30d', (SELECT count(*) FROM analytics_events WHERE event_name = 'car_share' AND created_at > now() - interval '30 days')
  );
$$;

REVOKE ALL ON FUNCTION public.admin_traffic_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_traffic_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_traffic_stats() TO service_role;