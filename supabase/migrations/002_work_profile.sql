-- One row per user: contract data for targets and vacation

create table public.work_profile (
  user_id                  uuid primary key default auth.uid()
                             references auth.users on delete cascade,
  employment_start         date not null,
  weekly_hours             numeric(4,2) not null default 38.5,
  work_days                smallint[] not null default '{1,2,3,4,5}',  -- ISO weekdays, 1 = Monday
  vacation_days_per_year   numeric(4,1) not null default 25,
  vacation_year            text not null default 'calendar'
                             check (vacation_year in ('calendar', 'anniversary')),
  first_year_rounding      text not null default 'up'
                             check (first_year_rounding in ('up', 'half', 'exact')),
  half_days_dec_24_31      boolean not null default true,
  tracking_start           date not null default current_date,
  hours_before_app         numeric(8,2) not null default 0,
  balance_before_app       numeric(6,2) not null default 0,
  vacation_used_before_app numeric(4,1) not null default 0,
  updated_at               timestamptz not null default now()
);

alter table public.work_profile enable row level security;

create policy "own profile" on public.work_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger work_profile_updated_at
  before update on public.work_profile
  for each row execute function public.set_updated_at();
