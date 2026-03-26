-- ============================================================
-- College List MVP — Initial Schema
-- ============================================================

-- profiles: one row per user, stores their stats + prefs
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  gpa numeric(3,2),
  sat_score integer,
  act_score integer,
  column_preferences jsonb default '{
    "location": true,
    "type": true,
    "attainability": true,
    "acceptance_rate": true,
    "sat_range": true,
    "avg_gpa": true,
    "test_policy": true,
    "net_tuition": true,
    "app_type": true,
    "status": true,
    "notes": true
  }'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- schools: global cache of College Scorecard data
create table if not exists schools (
  id text primary key,
  name text not null,
  city text,
  state text,
  school_type text,
  acceptance_rate numeric(5,4),
  sat_25th integer,
  sat_75th integer,
  avg_gpa numeric(3,2),
  test_policy text,
  net_price integer,
  updated_at timestamptz default now()
);

-- user_schools: each user's college list
create table if not exists user_schools (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  school_id text references schools(id) not null,
  attainability text check (attainability in ('Reach', 'Target', 'Safety')),
  app_type text check (app_type in ('EA', 'ED', 'RD', 'Undecided')) default 'Undecided',
  status text check (status in ('Planning', 'In Progress', 'Submitted', 'Accepted', 'Deferred', 'Waitlisted', 'Rejected')) default 'Planning',
  notes text,
  added_at timestamptz default now(),
  unique(user_id, school_id)
);

-- essay_prompts: manually curated for top schools
create table if not exists essay_prompts (
  id uuid default gen_random_uuid() primary key,
  school_id text references schools(id) on delete cascade not null,
  prompt_text text not null,
  word_limit integer
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table schools enable row level security;
alter table user_schools enable row level security;
alter table essay_prompts enable row level security;

-- profiles: users can only touch their own row
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- schools: everyone can read (public data)
create policy "Anyone can read schools"
  on schools for select using (true);

-- service role can insert/update schools (for seeding + search)
create policy "Service role can manage schools"
  on schools for all using (auth.role() = 'service_role');

-- user_schools: users only see/touch their own rows
create policy "Users can view own list"
  on user_schools for select using (auth.uid() = user_id);

create policy "Users can insert into own list"
  on user_schools for insert with check (auth.uid() = user_id);

create policy "Users can update own list"
  on user_schools for update using (auth.uid() = user_id);

create policy "Users can delete from own list"
  on user_schools for delete using (auth.uid() = user_id);

-- essay_prompts: everyone can read
create policy "Anyone can read essay prompts"
  on essay_prompts for select using (true);

create policy "Service role can manage essay prompts"
  on essay_prompts for all using (auth.role() = 'service_role');

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
