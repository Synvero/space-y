-- place_stake(p_market uuid, p_side boolean, p_amount bigint)
create or replace function public.place_stake(
  p_market uuid,
  p_side boolean,
  p_amount bigint
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_market markets%rowtype;
  v_existing_total bigint;
begin
  -- validate market
  select * into v_market from public.markets where id = p_market for update;
  if not found then
    raise exception 'Market not found';
  end if;
  if v_market.status != 'open' then
    raise exception 'Market is not open';
  end if;
  if v_market.resolves_at <= now() then
    raise exception 'Market has expired';
  end if;

  -- validate amount
  if p_amount < 10 then
    raise exception 'Minimum stake is 10 Fuel';
  end if;

  -- check user cap (500 per market)
  select coalesce(sum(amount), 0) into v_existing_total
  from public.stakes
  where market_id = p_market and user_id = auth.uid();

  if v_existing_total + p_amount > 500 then
    raise exception 'Maximum stake per market is 500 Fuel';
  end if;

  -- debit fuel (trigger will enforce non-negative)
  insert into public.fuel_ledger (user_id, delta, reason, ref_id)
  values (auth.uid(), -p_amount, 'stake', p_market);

  -- create stake
  insert into public.stakes (market_id, user_id, side, amount)
  values (p_market, auth.uid(), p_side, p_amount);
end;
$$;


-- daily_checkin() returns bigint (new balance)
create or replace function public.daily_checkin()
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance bigint;
begin
  if (select last_checkin_at from public.profiles where id = auth.uid()) >= current_date then
    raise exception 'already checked in today';
  end if;

  insert into public.fuel_ledger (user_id, delta, reason)
  values (auth.uid(), 25, 'daily_checkin');

  update public.profiles
  set last_checkin_at = current_date
  where id = auth.uid();

  select fuel into v_new_balance from public.profiles where id = auth.uid();
  return v_new_balance;
end;
$$;


-- resolve_market(p_market uuid, p_outcome boolean)
create or replace function public.resolve_market(
  p_market uuid,
  p_outcome boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller_role text;
  v_market markets%rowtype;
  v_winner_pool bigint;
  v_loser_pool bigint;
  v_burn bigint;
  v_distributable bigint;
  v_stake record;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('mod','admin') then
    raise exception 'Insufficient permissions';
  end if;

  select * into v_market from public.markets where id = p_market for update;
  if not found then raise exception 'Market not found'; end if;
  if v_market.status != 'open' then raise exception 'Market is not open'; end if;

  -- if outcome=true, verify a landed mission exists
  if p_outcome then
    if not exists (
      select 1 from public.missions
      where question_id = v_market.question_id and status = 'landed'
    ) then
      raise exception 'No landed mission found — cannot resolve YES';
    end if;
  end if;

  -- calculate pools
  select coalesce(sum(amount), 0) into v_winner_pool
  from public.stakes where market_id = p_market and side = p_outcome;

  select coalesce(sum(amount), 0) into v_loser_pool
  from public.stakes where market_id = p_market and side != p_outcome;

  -- edge case: no winners → refund everyone
  if v_winner_pool = 0 then
    for v_stake in select * from public.stakes where market_id = p_market loop
      insert into public.fuel_ledger (user_id, delta, reason, ref_id)
      values (v_stake.user_id, v_stake.amount, 'refund', p_market);
      update public.stakes set payout = v_stake.amount where id = v_stake.id;
    end loop;
  else
    v_burn := floor(v_loser_pool * 0.02);
    v_distributable := v_loser_pool - v_burn;

    for v_stake in select * from public.stakes where market_id = p_market and side = p_outcome loop
      declare
        v_payout bigint;
      begin
        v_payout := v_stake.amount + floor(v_stake.amount::numeric / v_winner_pool * v_distributable);
        insert into public.fuel_ledger (user_id, delta, reason, ref_id)
        values (v_stake.user_id, v_payout, 'payout', p_market);
        update public.stakes set payout = v_payout where id = v_stake.id;

        -- +1 reputation per win
        update public.profiles set reputation = reputation + 1 where id = v_stake.user_id;
      end;
    end loop;
  end if;

  update public.markets set
    status = 'resolved',
    outcome = p_outcome,
    resolved_by = auth.uid(),
    resolved_at = now()
  where id = p_market;
end;
$$;


-- claim_landing(p_mission uuid, p_proof_url text, p_note text)
create or replace function public.claim_landing(
  p_mission uuid,
  p_proof_url text,
  p_note text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.missions
  set
    status = 'landing_claimed',
    proof_url = p_proof_url,
    proof_note = p_note
  where id = p_mission
    and author_id = auth.uid()
    and status in ('proposed','building');

  if not found then
    raise exception 'Mission not found or you are not the author';
  end if;
end;
$$;


-- verify_landing(p_mission uuid, p_approve boolean, p_mod_note text)
create or replace function public.verify_landing(
  p_mission uuid,
  p_approve boolean,
  p_mod_note text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller_role text;
  v_mission missions%rowtype;
  v_question_id uuid;
  v_old_score int;
  v_new_score int;
  v_bonus bigint;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('mod','admin') then
    raise exception 'Insufficient permissions';
  end if;

  select * into v_mission from public.missions where id = p_mission and status = 'landing_claimed';
  if not found then raise exception 'Mission not found or not in landing_claimed status'; end if;

  if p_approve then
    v_old_score := v_mission.score;

    -- compute new score with ×3 multiplier
    v_new_score := round(
      coalesce((select absurdity from public.questions where id = v_mission.question_id), 0)
      * coalesce(v_mission.rigor, 0)
      * 3
    );

    update public.missions set
      status = 'landed',
      landed_at = now(),
      score = v_new_score,
      proof_note = coalesce(p_mod_note, proof_note)
    where id = p_mission;

    update public.questions set status = 'landed' where id = v_mission.question_id;

    -- landing bonus fuel = score delta
    v_bonus := greatest(v_new_score - v_old_score, 0);
    if v_bonus > 0 then
      insert into public.fuel_ledger (user_id, delta, reason, ref_id)
      values (v_mission.author_id, v_bonus, 'landing_bonus', p_mission);
    end if;

    -- +20 reputation
    update public.profiles set reputation = reputation + 20 where id = v_mission.author_id;
  else
    update public.missions set
      status = 'proposed',
      proof_note = p_mod_note
    where id = p_mission;
  end if;
end;
$$;
