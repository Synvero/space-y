create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default 'Anonymous Crew',
  bio text,
  fuel bigint not null default 0,
  reputation int not null default 0,
  role text not null default 'crew' check (role in ('crew','mod','admin')),
  last_checkin_at date,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  author_id uuid not null references public.profiles(id),
  title text not null check (title ~* '^why\s' and char_length(title) between 10 and 140),
  body text check (char_length(body) <= 4000),
  orbit text not null default 'leo'
    check (orbit in ('leo','geo','moon','mars','deep_space')),
  tags text[] not null default '{}',
  absurdity numeric(4,2),
  vote_count int not null default 0,
  status text not null default 'open'
    check (status in ('open','landed','archived','removed')),
  created_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 5 and 140),
  body text not null check (char_length(body) <= 16000),
  rigor numeric(4,2),
  vote_count int not null default 0,
  score int not null default 0,
  status text not null default 'proposed'
    check (status in ('proposed','building','landing_claimed','landed','removed')),
  proof_url text,
  proof_note text,
  scored_bonus_paid boolean not null default false,
  landed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  target_type text not null check (target_type in ('question','mission')),
  target_id uuid not null,
  dimension text not null check (dimension in ('absurdity','rigor')),
  value int not null check (value between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, dimension)
);

create table public.fuel_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id),
  delta bigint not null,
  reason text not null check (reason in
    ('signup','daily_checkin','stake','payout','refund','score_bonus','landing_bonus','admin_adjust')),
  ref_id uuid,
  created_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions(id) on delete cascade,
  question_text text not null,
  status text not null default 'open' check (status in ('open','resolved','void')),
  resolves_at timestamptz not null,
  outcome boolean,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.stakes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id),
  user_id uuid not null references public.profiles(id),
  side boolean not null,
  amount bigint not null check (amount > 0),
  payout bigint,
  created_at timestamptz not null default now()
);

create table public.pledges (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('question','mission')),
  target_id uuid not null,
  user_id uuid not null references public.profiles(id),
  amount_eur numeric(10,2) not null check (amount_eur between 1 and 100000),
  message text check (char_length(message) <= 280),
  status text not null default 'pledged' check (status in ('pledged','withdrawn')),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('question','mission')),
  target_id uuid not null,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible','removed')),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('question','mission','comment')),
  target_id uuid not null,
  reporter_id uuid not null references public.profiles(id),
  reason text not null check (char_length(reason) <= 500),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now()
);

create index on public.questions (status, created_at desc);
create index on public.missions (question_id, score desc);
create index on public.stakes (market_id);
create index on public.fuel_ledger (user_id, created_at desc);
create index on public.votes (target_type, target_id);
