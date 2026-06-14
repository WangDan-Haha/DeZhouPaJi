create extension if not exists pgcrypto;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_player_id uuid,
  status text not null default 'waiting',
  max_players integer not null default 6 check (max_players between 2 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 16),
  player_token text not null,
  seat_index integer not null check (seat_index between 0 and 5),
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, player_token),
  unique(room_id, seat_index)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rooms_host_player_id_fkey'
  ) then
    alter table rooms
      add constraint rooms_host_player_id_fkey
      foreign key (host_player_id) references players(id) on delete set null;
  end if;
end $$;

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  hand_number integer not null default 1,
  status text not null default 'playing',
  stage text not null default 'preflop',
  deck jsonb not null default '[]'::jsonb,
  community_cards jsonb not null default '[]'::jsonb,
  winner_player_ids jsonb not null default '[]'::jsonb,
  showdown_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole_cards jsonb not null default '[]'::jsonb,
  hand_rank text,
  hand_score jsonb,
  is_winner boolean not null default false,
  created_at timestamptz not null default now(),
  unique(game_id, player_id)
);

create table if not exists room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_code on rooms(code);
create index if not exists idx_players_room on players(room_id);
create index if not exists idx_games_room_created on games(room_id, created_at desc);
create index if not exists idx_game_players_game on game_players(game_id);
create index if not exists idx_room_events_room_created on room_events(room_id, created_at desc);

alter table rooms enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table game_players enable row level security;
alter table room_events enable row level security;

create policy "anon can listen to room events" on room_events for select using (true);
