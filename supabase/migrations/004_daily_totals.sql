-- One row per day with work and vacation minutes, for month and period totals

create view public.daily_totals
with (security_invoker = true) as
select work_date,
       coalesce(sum(duration_min) filter (where kind = 'work'), 0)::int     as work_min,
       coalesce(sum(duration_min) filter (where kind = 'vacation'), 0)::int as vacation_min
from public.time_entries
group by work_date;
