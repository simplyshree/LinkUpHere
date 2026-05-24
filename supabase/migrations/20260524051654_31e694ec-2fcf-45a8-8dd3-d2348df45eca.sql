
-- Allow public read of events
drop policy if exists "events viewable by authenticated" on public.events;
create policy "events viewable by anyone"
  on public.events for select to anon, authenticated using (true);

-- Allow public read of aggregate interest counts (just event_id)
drop policy if exists "interests viewable by authenticated" on public.event_interests;
create policy "interest counts viewable by anyone"
  on public.event_interests for select to anon, authenticated using (true);
