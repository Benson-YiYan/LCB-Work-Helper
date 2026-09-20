create or replace function public.lcb_store_matters_if_current(payload jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
  matter_id text;
  expected_at timestamptz;
  next_at timestamptz;
begin
  if public.lcb_team_id() is null then
    raise exception 'unknown team member';
  end if;

  for item in select value from jsonb_array_elements(coalesce(payload, '[]'::jsonb)) loop
    matter_id := item ->> 'id';
    expected_at := nullif(item ->> 'expected_updated_at', '')::timestamptz;
    next_at := (item ->> 'updated_at')::timestamptz;

    if expected_at is null then
      update public.matters
      set data = item -> 'data', updated_at = next_at
      where id = matter_id and data ->> 'encrypted' = 'lcb-e2ee-pending';
    else
      update public.matters
      set data = item -> 'data', updated_at = next_at
      where id = matter_id and updated_at = expected_at;
    end if;

    if not found then
      raise exception 'matter_conflict:%', matter_id using errcode = 'P0001';
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.lcb_store_matters_if_current(jsonb) from public, anon;
grant execute on function public.lcb_store_matters_if_current(jsonb) to authenticated;
