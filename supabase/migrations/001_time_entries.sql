-- Entries: work (from/to) and vacation (credited minutes)

create table public.time_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  work_date    date not null,
  kind         text not null default 'work' check (kind in ('work', 'vacation')),
  start_time   time,
  end_time     time,
  credited_min integer,
  description  text not null default '',
  duration_min integer generated always as (
                 case when kind = 'work'
                      then (extract(epoch from (end_time - start_time)) / 60)::int
                      else credited_min end) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint work_has_start  check (kind <> 'work' or start_time is not null),
  constraint end_after_start check (end_time is null or end_time > start_time),
  constraint vacation_credit check (kind <> 'vacation' or credited_min is not null)
);

create index time_entries_user_date on public.time_entries (user_id, work_date);

create unique index one_vacation_per_day
  on public.time_entries (user_id, work_date) where kind = 'vacation';

alter table public.time_entries enable row level security;

create policy "own entries" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keeps updated_at current (also used by work_profile)
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

-- Suggestions: how often and how recently each description was used
create view public.description_stats
with (security_invoker = true) as
select description,
       count(*)       as times_used,
       max(work_date) as last_used
from public.time_entries
where kind = 'work' and description <> ''
group by description;
