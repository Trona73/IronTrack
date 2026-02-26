-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Exercises Table
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  equipment text,
  muscle_group text,
  image_url text,
  description text,
  video_url text,
  created_at timestamptz default now()
);

-- Workout Plans Table
create table if not exists workout_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  name text not null,
  days_of_week integer[], -- Array of integers 0-6
  created_at timestamptz default now()
);

-- Planned Exercises Table (Links Exercises to Plans)
create table if not exists planned_exercises (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references workout_plans(id) on delete cascade,
  exercise_id uuid references exercises(id),
  sets jsonb not null default '[]'::jsonb, -- Array of {reps, weight}
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Workout Sessions Table
create table if not exists workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  plan_id uuid references workout_plans(id),
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz default now()
);

-- Completed Exercises Table (Links Exercises to Sessions)
create table if not exists completed_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  sets jsonb not null default '[]'::jsonb, -- Array of {reps, weight, completedAt, rpe}
  duration_seconds integer default 0,
  created_at timestamptz default now()
);

-- RLS Policies (Row Level Security)
alter table exercises enable row level security;
alter table workout_plans enable row level security;
alter table planned_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table completed_exercises enable row level security;

-- Public Read for Exercises (Assuming shared library)
create policy "Exercises are viewable by everyone" on exercises
  for select using (true);

-- Authenticated Users can manage their own plans
create policy "Users can view own plans" on workout_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own plans" on workout_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update own plans" on workout_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete own plans" on workout_plans
  for delete using (auth.uid() = user_id);

-- Authenticated Users can manage their own planned exercises via plan_id
create policy "Users can view own planned exercises" on planned_exercises
  for select using (
    exists (
      select 1 from workout_plans
      where workout_plans.id = planned_exercises.plan_id
      and workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own planned exercises" on planned_exercises
  for insert with check (
    exists (
      select 1 from workout_plans
      where workout_plans.id = planned_exercises.plan_id
      and workout_plans.user_id = auth.uid()
    )
  );
  
create policy "Users can update own planned exercises" on planned_exercises
  for update using (
    exists (
      select 1 from workout_plans
      where workout_plans.id = planned_exercises.plan_id
      and workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can delete own planned exercises" on planned_exercises
  for delete using (
    exists (
      select 1 from workout_plans
      where workout_plans.id = planned_exercises.plan_id
      and workout_plans.user_id = auth.uid()
    )
  );

-- Authenticated Users can manage their own sessions
create policy "Users can view own sessions" on workout_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own sessions" on workout_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on workout_sessions
  for update using (auth.uid() = user_id);

-- Authenticated Users can manage their own completed exercises via session_id
create policy "Users can view own completed exercises" on completed_exercises
  for select using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = completed_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own completed exercises" on completed_exercises
  for insert with check (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = completed_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );
