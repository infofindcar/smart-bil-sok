-- Data retention: nightly cleanup av loggtabeller (90 dagar)
-- Kräver pg_cron (aktiverat i Supabase Pro+)

select cron.schedule(
  'delete-old-analytics-events',
  '0 3 * * *',
  $$delete from analytics_events where created_at < now() - interval '90 days'$$
);

select cron.schedule(
  'delete-old-listing-analyses',
  '0 3 * * *',
  $$delete from listing_analyses where created_at < now() - interval '90 days'$$
);

select cron.schedule(
  'delete-old-guided-search-usage',
  '0 3 * * *',
  $$delete from guided_search_usage where created_at < now() - interval '90 days'$$
);
