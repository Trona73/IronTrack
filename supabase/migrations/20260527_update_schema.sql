-- 1. Update public.exercises table
alter table public.exercises add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.exercises add column if not exists type text default 'weighted';

-- Create unique indexes to prevent duplicate names
create unique index if not exists exercises_public_name_idx on public.exercises (name) where user_id is null;
create unique index if not exists exercises_user_name_idx on public.exercises (name, user_id) where user_id is not null;

-- Enable Row Level Security (RLS) on exercises (in case it wasn't enabled)
alter table public.exercises enable row level security;

-- Drop existing select policy if it exists to recreate it cleanly
drop policy if exists "Exercises are viewable by everyone." on public.exercises;

-- Create updated select policy (view public exercises and own custom ones)
create policy "Exercises are viewable by everyone if public or owned by user."
  on public.exercises for select
  using ( user_id is null or auth.uid() = user_id );

-- Create write policies for exercises
create policy "Users can insert their own exercises."
  on public.exercises for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own exercises."
  on public.exercises for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own exercises."
  on public.exercises for delete
  using ( auth.uid() = user_id );


-- 2. Create public.user_settings table
create table if not exists public.user_settings (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  training_start_day integer not null default 1,
  weekly_training_goal integer not null default 3,
  name text,
  weight numeric,
  height numeric,
  age integer,
  gender text,
  activity_level text,
  goal text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on user_settings
alter table public.user_settings enable row level security;

-- Create policies for user_settings
create policy "Users can view their own settings."
  on public.user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings."
  on public.user_settings for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own settings."
  on public.user_settings for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own settings."
  on public.user_settings for delete
  using ( auth.uid() = user_id );


-- 3. Seed standard exercises from src/data.ts
insert into public.exercises (name, equipment, muscle_group, description, image_url, video_url, type)
values
  ('Supino Reto', 'Barra', 'Peito', 'Exercício fundamental para o desenvolvimento do peitoral, tríceps e deltoide anterior. Mantenha as escápulas retraídas e os pés firmes no chão.', 'https://picsum.photos/seed/supino/400/200', 'https://www.youtube.com/results?search_query=como+fazer+supino+reto', 'weighted'),
  ('Agachamento Livre', 'Barra', 'Pernas', 'O rei dos exercícios para pernas. Trabalha quadríceps, glúteos e core. Mantenha a coluna neutra e desça até quebrar a paralela, se a mobilidade permitir.', 'https://picsum.photos/seed/agachamento/400/200', 'https://www.youtube.com/results?search_query=como+fazer+agachamento+livre', 'weighted'),
  ('Levantamento Terra', 'Barra', 'Costas', 'Exercício composto que trabalha toda a cadeia posterior do corpo. Foco na extensão do quadril e em manter a barra próxima ao corpo.', 'https://picsum.photos/seed/terra/400/200', 'https://www.youtube.com/results?search_query=como+fazer+levantamento+terra', 'weighted'),
  ('Desenvolvimento', 'Halteres', 'Ombros', 'Focado no ganho de força e volume dos ombros (deltoides). Pode ser feito sentado ou em pé.', 'https://picsum.photos/seed/desenvolvimento/400/200', 'https://www.youtube.com/results?search_query=como+fazer+desenvolvimento+com+halteres', 'weighted'),
  ('Rosca Direta', 'Barra', 'Braços', 'Clássico para o desenvolvimento dos bíceps. Evite usar o impulso do corpo (roubar) durante a execução.', 'https://picsum.photos/seed/rosca/400/200', 'https://www.youtube.com/results?search_query=como+fazer+rosca+direta', 'weighted'),
  ('Tríceps Polia', 'Cabos', 'Braços', 'Isolador excelente para a porção lateral e medial do tríceps. Mantenha os cotovelos fixos ao lado do corpo.', 'https://picsum.photos/seed/triceps/400/200', 'https://www.youtube.com/results?search_query=como+fazer+triceps+polia', 'weighted'),
  ('Leg Press 45º', 'Máquina', 'Pernas', 'Ótima alternativa para focar nos quadríceps e glúteos com suporte para as costas. Não estenda completamente os joelhos no topo.', 'https://picsum.photos/seed/legpress/400/200', 'https://www.youtube.com/results?search_query=como+fazer+leg+press+45', 'weighted'),
  ('Puxada Frontal', 'Máquina', 'Costas', 'Desenvolve a largura das costas (latíssimo do dorso). Puxe a barra em direção ao peito, estufando-o.', 'https://picsum.photos/seed/puxada/400/200', 'https://www.youtube.com/results?search_query=como+fazer+puxada+frontal', 'weighted'),
  ('Elevação Lateral', 'Halteres', 'Ombros', 'Essencial para o desenvolvimento da porção lateral dos ombros, dando o aspecto de "ombros largos".', 'https://picsum.photos/seed/elevacao/400/200', 'https://www.youtube.com/results?search_query=como+fazer+elevacao+lateral', 'weighted'),
  ('Cadeira Extensora', 'Máquina', 'Pernas', 'Isolador focado exclusivamente nos quadríceps. Excelente para finalização do treino de pernas.', 'https://picsum.photos/seed/extensora/400/200', 'https://www.youtube.com/results?search_query=como+fazer+cadeira+extensora', 'weighted'),
  ('Cadeira Flexora', 'Máquina', 'Pernas', 'Focado no desenvolvimento dos isquiotibiais (posterior de coxa). Controle a fase excêntrica do movimento.', 'https://picsum.photos/seed/flexora/400/200', 'https://www.youtube.com/results?search_query=como+fazer+cadeira+flexora', 'weighted'),
  ('Panturrilha Sentado', 'Máquina', 'Pernas', 'Trabalha especificamente o músculo sóleo da panturrilha. Faça uma pausa no alongamento máximo.', 'https://picsum.photos/seed/panturrilha/400/200', 'https://www.youtube.com/results?search_query=como+fazer+panturrilha+sentado', 'weighted'),
  ('Prancha', 'Peso Corporal', 'Core', 'Exercício isométrico excelente para fortalecimento do core. Mantenha o corpo em linha reta e o abdômen contraído.', 'https://picsum.photos/seed/prancha/400/200', 'https://www.youtube.com/results?search_query=como+fazer+prancha+abdominal', 'weighted'),
  ('Abdominal Supra', 'Peso Corporal', 'Core', 'Focado na porção superior do abdômen. Concentre-se em enrolar o tronco e não apenas levantar a cabeça.', 'https://picsum.photos/seed/abdominal/400/200', 'https://www.youtube.com/results?search_query=como+fazer+abdominal+supra', 'weighted'),
  ('Remada Curvada', 'Barra', 'Costas', 'Constrói espessura e força nas costas. Mantenha a coluna reta e puxe a barra em direção ao umbigo.', 'https://picsum.photos/seed/remada/400/200', 'https://www.youtube.com/results?search_query=como+fazer+remada+curvada', 'weighted')
on conflict (name) where user_id is null
do update set
  equipment = excluded.equipment,
  muscle_group = excluded.muscle_group,
  description = excluded.description,
  image_url = excluded.image_url,
  video_url = excluded.video_url,
  type = excluded.type;
