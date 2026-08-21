create table if not exists guided_search_usage (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists guided_search_usage_ip_created_idx
  on guided_search_usage (ip_hash, created_at);

-- Only service_role may insert/select; anon gets nothing
alter table guided_search_usage enable row level security;
