-- Log in with a username: it is stored on the profile and mapped to the account's email

alter table public.work_profile
  add column username text
  check (username ~ '^[a-z0-9._-]{3,30}$');

create unique index work_profile_username on public.work_profile (username);

-- The login screen has no session yet, so this runs with the owner's rights
-- and returns only the email for an exact username match
create function public.login_email(login_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
  from auth.users u
  join public.work_profile p on p.user_id = u.id
  where p.username = lower(trim(login_name))
$$;

revoke all on function public.login_email(text) from public;
grant execute on function public.login_email(text) to anon, authenticated;
