-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.missions enable row level security;
alter table public.votes enable row level security;
alter table public.fuel_ledger enable row level security;
alter table public.markets enable row level security;
alter table public.stakes enable row level security;
alter table public.pledges enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- profiles
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- questions
create policy "questions_select_public" on public.questions
  for select using (
    status != 'removed'
    or author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

create policy "questions_insert_authenticated" on public.questions
  for insert with check (auth.uid() = author_id);

create policy "questions_update_author_or_mod" on public.questions
  for update using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

-- missions
create policy "missions_select_public" on public.missions
  for select using (
    status != 'removed'
    or author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

create policy "missions_insert_authenticated" on public.missions
  for insert with check (auth.uid() = author_id);

create policy "missions_update_author_or_mod" on public.missions
  for update using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

-- votes
create policy "votes_select_all" on public.votes
  for select using (true);

create policy "votes_insert_own" on public.votes
  for insert with check (auth.uid() = user_id);

create policy "votes_update_own" on public.votes
  for update using (auth.uid() = user_id);

create policy "votes_delete_own" on public.votes
  for delete using (auth.uid() = user_id);

-- fuel_ledger: read-only for all, mutations via RPC only
create policy "fuel_ledger_select_own" on public.fuel_ledger
  for select using (auth.uid() = user_id);

-- markets: select for all, mutations via RPC
create policy "markets_select_all" on public.markets
  for select using (true);

-- stakes: select for all, mutations via RPC
create policy "stakes_select_all" on public.stakes
  for select using (true);

-- pledges
create policy "pledges_select_all" on public.pledges
  for select using (true);

create policy "pledges_insert_own" on public.pledges
  for insert with check (auth.uid() = user_id);

create policy "pledges_update_own" on public.pledges
  for update using (auth.uid() = user_id);

-- comments
create policy "comments_select_public" on public.comments
  for select using (
    status != 'removed'
    or author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

create policy "comments_insert_authenticated" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "comments_update_author_or_mod" on public.comments
  for update using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

-- reports: insert for authenticated, select for mods
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_select_mods" on public.reports
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );

create policy "reports_update_mods" on public.reports
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
  );
