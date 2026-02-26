-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create exercises table
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  equipment text not null,
  muscle_group text not null,
  image_url text,
  description text,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exercises enable row level security;

create policy "Exercises are viewable by everyone."
  on exercises for select
  using ( true );

-- Create workout_plans table
create table public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  days_of_week integer[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workout_plans enable row level security;

create policy "Users can view their own workout plans."
  on workout_plans for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own workout plans."
  on workout_plans for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own workout plans."
  on workout_plans for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own workout plans."
  on workout_plans for delete
  using ( auth.uid() = user_id );

-- Create planned_exercises table
create table public.planned_exercises (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  sets jsonb not null default '[]'::jsonb,
  "order" integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.planned_exercises enable row level security;

create policy "Users can view their own planned exercises."
  on planned_exercises for select
  using ( exists ( select 1 from workout_plans where id = planned_exercises.plan_id and user_id = auth.uid() ) );

create policy "Users can insert their own planned exercises."
  on planned_exercises for insert
  with check ( exists ( select 1 from workout_plans where id = planned_exercises.plan_id and user_id = auth.uid() ) );

create policy "Users can update their own planned exercises."
  on planned_exercises for update
  using ( exists ( select 1 from workout_plans where id = planned_exercises.plan_id and user_id = auth.uid() ) );

create policy "Users can delete their own planned exercises."
  on planned_exercises for delete
  using ( exists ( select 1 from workout_plans where id = planned_exercises.plan_id and user_id = auth.uid() ) );

-- Create workout_sessions table
create table public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  plan_id uuid references public.workout_plans(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workout_sessions enable row level security;

create policy "Users can view their own workout sessions."
  on workout_sessions for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own workout sessions."
  on workout_sessions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own workout sessions."
  on workout_sessions for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own workout sessions."
  on workout_sessions for delete
  using ( auth.uid() = user_id );
