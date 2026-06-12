-- 1. Create profile on signup + give 1000 Fuel
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  suffix int := 0;
begin
  -- build handle from email prefix
  base_handle := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
  -- trim to 18 chars so suffix fits in 20
  base_handle := substring(base_handle, 1, 18);
  -- ensure min length
  if char_length(base_handle) < 3 then
    base_handle := base_handle || 'usr';
  end if;
  final_handle := base_handle;
  -- handle collisions
  while exists (select 1 from public.profiles where handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (new.id, final_handle, final_handle);

  insert into public.fuel_ledger (user_id, delta, reason)
  values (new.id, 1000, 'signup');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Vote aggregation trigger
create or replace function public.handle_vote_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_target_type text;
  v_target_id uuid;
  v_vote_count int;
  v_absurdity numeric(4,2);
  v_rigor numeric(4,2);
  v_question_absurdity numeric(4,2);
  v_orbit text;
  v_old_score int;
  v_new_score int;
  v_mission_status text;
  v_author_id uuid;
begin
  -- get target info from either old or new row
  if TG_OP = 'DELETE' then
    v_target_type := OLD.target_type;
    v_target_id := OLD.target_id;
  else
    v_target_type := NEW.target_type;
    v_target_id := NEW.target_id;
  end if;

  if v_target_type = 'question' then
    select count(*), avg(value)::numeric(4,2)
    into v_vote_count, v_absurdity
    from public.votes
    where target_type = 'question' and target_id = v_target_id and dimension = 'absurdity';

    -- derive orbit from absurdity
    v_orbit := case
      when v_absurdity >= 8.5 then 'deep_space'
      when v_absurdity >= 7.0 then 'mars'
      when v_absurdity >= 5.0 then 'moon'
      when v_absurdity >= 3.0 then 'geo'
      else 'leo'
    end;

    update public.questions set
      vote_count = v_vote_count,
      absurdity = case when v_vote_count >= 5 then v_absurdity else null end,
      orbit = coalesce(
        case when v_vote_count >= 5 then v_orbit end,
        orbit
      )
    where id = v_target_id;

    -- update scores for all missions on this question
    update public.missions m set
      score = round(
        coalesce((select absurdity from public.questions where id = m.question_id), 0)
        * coalesce(m.rigor, 0)
        * case when m.status = 'landed' then 3 else 1 end
      )
    where question_id = v_target_id and vote_count >= 5;

  elsif v_target_type = 'mission' then
    select count(*), avg(value)::numeric(4,2)
    into v_vote_count, v_rigor
    from public.votes
    where target_type = 'mission' and target_id = v_target_id and dimension = 'rigor';

    select m.status, m.author_id, m.score, m.scored_bonus_paid,
           q.absurdity
    into v_mission_status, v_author_id, v_old_score, v_vote_count, v_question_absurdity
    from public.missions m
    join public.questions q on q.id = m.question_id
    where m.id = v_target_id;

    -- recalculate score
    v_new_score := round(
      coalesce(v_question_absurdity, 0)
      * coalesce(v_rigor, 0)
      * case when v_mission_status = 'landed' then 3 else 1 end
    );

    -- check if this crosses the 5-vote threshold for the first time
    if v_vote_count = 5 then
      -- first scoring: give bonus fuel + rep to author
      update public.missions set
        vote_count = v_vote_count,
        rigor = v_rigor,
        score = v_new_score,
        scored_bonus_paid = true
      where id = v_target_id;

      -- give score bonus fuel
      insert into public.fuel_ledger (user_id, delta, reason, ref_id)
      values (v_author_id, v_new_score, 'score_bonus', v_target_id);

      -- give reputation
      update public.profiles set
        reputation = reputation + round(v_new_score::numeric / 10)
      where id = v_author_id;
    else
      update public.missions set
        vote_count = v_vote_count,
        rigor = case when v_vote_count >= 5 then v_rigor else null end,
        score = case when v_vote_count >= 5 then v_new_score else score end
      where id = v_target_id;
    end if;
  end if;

  return null;
end;
$$;

create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute procedure public.handle_vote_change();


-- 3. Fuel ledger → update profiles.fuel
create or replace function public.handle_fuel_ledger_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set fuel = fuel + NEW.delta
  where id = NEW.user_id;

  if not found then
    raise exception 'Profile not found for user_id %', NEW.user_id;
  end if;

  -- Enforce non-negative balance
  if (select fuel from public.profiles where id = NEW.user_id) < 0 then
    raise exception 'Insufficient fuel balance';
  end if;

  return NEW;
end;
$$;

create trigger on_fuel_ledger_insert
  after insert on public.fuel_ledger
  for each row execute procedure public.handle_fuel_ledger_insert();


-- 4. Auto-create market when question is created
create or replace function public.handle_question_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.markets (question_id, question_text, resolves_at)
  values (
    NEW.id,
    'Will any mission land on this question within 90 days?',
    NEW.created_at + interval '90 days'
  );
  return NEW;
end;
$$;

create trigger on_question_created
  after insert on public.questions
  for each row execute procedure public.handle_question_created();


-- 5. Self-vote prevention trigger
create or replace function public.prevent_self_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author_id uuid;
begin
  if NEW.target_type = 'question' then
    select author_id into v_author_id from public.questions where id = NEW.target_id;
  elsif NEW.target_type = 'mission' then
    select author_id into v_author_id from public.missions where id = NEW.target_id;
  end if;

  if v_author_id = NEW.user_id then
    raise exception 'Self-votes are not allowed';
  end if;

  return NEW;
end;
$$;

create trigger prevent_self_vote_trigger
  before insert on public.votes
  for each row execute procedure public.prevent_self_vote();


-- 6. Reputation on question reaching 5 votes
create or replace function public.handle_question_vote_milestone()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Give +5 rep to author when question first reaches 5 votes
  if NEW.vote_count = 5 and OLD.vote_count < 5 then
    update public.profiles
    set reputation = reputation + 5
    where id = NEW.author_id;
  end if;
  return NEW;
end;
$$;

create trigger on_question_vote_milestone
  after update of vote_count on public.questions
  for each row execute procedure public.handle_question_vote_milestone();
