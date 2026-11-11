-- Shared private family tree. Run in the Supabase SQL editor.
-- The owner-only invite-member Edge Function provisions family_members.

create table if not exists public.family_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.family_state (
  id smallint primary key default 1 check (id = 1),
  tree jsonb not null default '[]'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.family_state (id) values (1) on conflict (id) do nothing;

alter table public.family_members enable row level security;
alter table public.family_state enable row level security;

drop policy if exists "Members can see their own account" on public.family_members;
create policy "Members can see their own account"
  on public.family_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Family members can read the shared tree" on public.family_state;
create policy "Family members can read the shared tree"
  on public.family_state for select to authenticated
  using (exists (
    select 1 from public.family_members m
    where m.user_id = (select auth.uid())
  ));

drop policy if exists "Family members can update the shared tree" on public.family_state;
create policy "Family members can update the shared tree"
  on public.family_state for update to authenticated
  using (exists (
    select 1 from public.family_members m
    where m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.family_members m
    where m.user_id = (select auth.uid())
  ));

grant select on public.family_members to authenticated;
grant select, update on public.family_state to authenticated;
revoke all on public.family_state from anon;
revoke all on public.family_members from anon;

create or replace function public.save_family_tree(p_tree jsonb, p_expected_version bigint)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  update public.family_state
     set tree = p_tree,
         version = version + 1,
         updated_at = now()
   where id = 1
     and version = p_expected_version
  returning version;
$$;

revoke all on function public.save_family_tree(jsonb, bigint) from public, anon;
grant execute on function public.save_family_tree(jsonb, bigint) to authenticated;

