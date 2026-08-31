begin;

create or replace function public.generate_club_member_code()
returns text
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_code text;
begin
  loop
    v_code := 'CC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.club_members where member_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

grant execute on function public.generate_club_member_code() to authenticated;

commit;
