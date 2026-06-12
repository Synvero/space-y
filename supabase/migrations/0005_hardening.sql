-- Hardening (reviewer fix, WO-1 #1 + #4)

-- #1 — Prevent self-escalation of fuel / reputation / role / handle / last_checkin_at.
-- RLS cannot restrict columns, so we use column-level privileges. A logged-in user may
-- only change display_name and bio on their own row (combined with the profiles_update_own
-- RLS policy). All economy/role mutations go through SECURITY DEFINER functions, which run
-- as the owner and bypass these grants. The seed uses the service_role key and is unaffected.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio) on public.profiles to authenticated;

-- #4 — The state-changing RPCs are SECURITY DEFINER and default to PUBLIC execute.
-- They fail safe for anon (auth.uid() is null), but lock the door anyway.
revoke execute on function
  public.place_stake(uuid, boolean, bigint),
  public.daily_checkin(),
  public.resolve_market(uuid, boolean),
  public.claim_landing(uuid, text, text),
  public.verify_landing(uuid, boolean, text)
from anon;
