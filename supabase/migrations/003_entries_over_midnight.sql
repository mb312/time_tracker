-- Work entries may end after midnight: an end time earlier than the start means the next day.
-- The entry counts for its start day (work_date).

alter table public.time_entries drop constraint end_after_start;

alter table public.time_entries drop column duration_min;

alter table public.time_entries add column duration_min integer generated always as (
  case when kind = 'work'
       then ((extract(epoch from (end_time - start_time)) / 60)::int + 1440) % 1440
       else credited_min end) stored;

alter table public.time_entries
  add constraint end_differs_from_start check (end_time is null or end_time <> start_time);
