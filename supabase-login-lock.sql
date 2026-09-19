create table if not exists public.lcb_login_locks (
  email text not null,
  device_id text not null,
  failures integer not null default 0 check (failures between 0 and 5),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (email, device_id)
);

alter table public.lcb_login_locks enable row level security;
revoke all on table public.lcb_login_locks from anon, authenticated;
grant all on table public.lcb_login_locks to service_role;

create or replace function public.lcb_record_login_failure(p_email text, p_device_id text)
returns table(failures integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  current_row public.lcb_login_locks%rowtype;
  next_failures integer;
  next_locked_until timestamptz;
begin
  if normalized_email = '' or coalesce(trim(p_device_id), '') = '' then
    raise exception 'email and device are required';
  end if;

  select * into current_row
  from public.lcb_login_locks
  where email = normalized_email and device_id = p_device_id
  for update;

  if not found or (current_row.locked_until is not null and current_row.locked_until <= now()) then
    next_failures := 1;
  elsif current_row.locked_until is not null then
    return query select current_row.failures, current_row.locked_until;
    return;
  else
    next_failures := least(current_row.failures + 1, 5);
  end if;

  next_locked_until := case when next_failures >= 5 then now() + interval '5 minutes' else null end;

  insert into public.lcb_login_locks(email, device_id, failures, locked_until, updated_at)
  values (normalized_email, p_device_id, next_failures, next_locked_until, now())
  on conflict (email, device_id) do update
  set failures = excluded.failures,
      locked_until = excluded.locked_until,
      updated_at = excluded.updated_at;

  return query select next_failures, next_locked_until;
end;
$$;

revoke all on function public.lcb_record_login_failure(text, text) from public, anon, authenticated;
grant execute on function public.lcb_record_login_failure(text, text) to service_role;

-- Run this with the requested account email whenever Benson asks for an unlock:
-- delete from public.lcb_login_locks where email = lower('person@example.com');
