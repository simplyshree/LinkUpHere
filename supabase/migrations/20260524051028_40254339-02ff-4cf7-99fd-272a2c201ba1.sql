
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text default '',
  year text default '',
  interests text[] not null default '{}',
  avatar_emoji text default '🎓',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles viewable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  starts_at timestamptz not null,
  host text not null default 'Campus Life',
  emoji text not null default '✨',
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events viewable by authenticated"
  on public.events for select to authenticated using (true);

-- event_interests (registrations)
create table public.event_interests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.event_interests enable row level security;

create policy "interests viewable by authenticated"
  on public.event_interests for select to authenticated using (true);
create policy "users register own interest"
  on public.event_interests for insert to authenticated with check (auth.uid() = user_id);
create policy "users remove own interest"
  on public.event_interests for delete to authenticated using (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
