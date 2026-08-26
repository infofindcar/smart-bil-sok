-- Datalagring: automatisk rensning av forbattringar (90 dagar) och leads (2 år)

select cron.schedule(
  'delete-old-forbattringar',
  '0 3 * * *',
  $$delete from forbattringar where created_at < now() - interval '90 days'$$
);

select cron.schedule(
  'delete-old-leads',
  '0 3 * * *',
  $$delete from leads where created_at < now() - interval '2 years'$$
);
