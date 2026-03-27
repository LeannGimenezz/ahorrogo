-- ================================================================
-- AHORROGO — Supabase PostgreSQL Schema
-- ================================================================

-- ─── Users ─────────────────────────────────────────────────────

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    address text unique not null,
    alias text not null,
    xp integer default 0,
    level integer default 1 constraint level_range check (level between 1 and 5),
    streak integer default 0 constraint streak_non_negative check (streak >= 0),
    last_deposit_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create unique index if not exists idx_users_address on public.users(address);
create index if not exists idx_users_alias on public.users(alias);

-- ─── Vaults ────────────────────────────────────────────────────

create table if not exists public.vaults (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null constraint name_length check (length(name) <= 100),
    icon text not null default '🏠',
    target numeric(18, 2) not null constraint target_positive check (target > 0),
    current numeric(18, 2) default 0 constraint current_non_negative check (current >= 0),
    vault_type text not null constraint vault_type_enum check (
        vault_type in ('savings', 'rental', 'p2p')
    ),
    beneficiary text,
    locked boolean default false,
    unlock_date timestamptz,
    status text default 'active' constraint status_enum check (
        status in ('active', 'completed', 'cancelled')
    ),
    contract_address text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    constraint vault_target_current check (current <= target + (target * 0.01))
);

create index if not exists idx_vaults_user_id on public.vaults(user_id);
create index if not exists idx_vaults_status on public.vaults(status);
create index if not exists idx_vaults_type on public.vaults(vault_type);

-- ─── Activities ───────────────────────────────────────────────

create table if not exists public.activities (
    id uuid primary key default gen_random_uuid(),
    vault_id uuid not null references public.vaults(id) on delete cascade,
    activity_type text not null constraint activity_type_enum check (
        activity_type in ('deposit', 'withdraw', 'yield', 'transfer')
    ),
    amount numeric(18, 2) not null,
    tx_hash text,
    block_number integer,
    metadata jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_activities_vault_id on public.activities(vault_id);
create index if not exists idx_activities_type on public.activities(activity_type);
create index if not exists idx_activities_created on public.activities(created_at desc);
create index if not exists idx_activities_tx_hash on public.activities(tx_hash) where tx_hash is not null;

-- ─── Transfers (P2P) ───────────────────────────────────────────

create table if not exists public.transfers (
    id uuid primary key default gen_random_uuid(),
    from_vault_id uuid not null references public.vaults(id),
    to_alias text not null,
    amount numeric(18, 2) not null constraint transfer_amount check (amount > 0),
    status text default 'pending' constraint transfer_status check (
        status in ('pending', 'confirmed', 'cancelled', 'expired')
    ),
    expires_at timestamptz not null,
    confirmed_at timestamptz,
    created_at timestamptz default now()
);

create index if not exists idx_transfers_from_vault on public.transfers(from_vault_id);
create index if not exists idx_transfers_status on public.transfers(status);
create index if not exists idx_transfers_expires on public.transfers(expires_at);

-- ─── Penguin State (denormalized) ─────────────────────────────

create table if not exists public.penguin_states (
    user_id uuid primary key references public.users(id) on delete cascade,
    mood text default 'idle' constraint mood_enum check (
        mood in ('idle', 'happy', 'celebrating', 'waiting')
    ),
    accessories jsonb default '[]',
    total_yield_earned numeric(18, 2) default 0,
    updated_at timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    body text,
    notification_type text not null,
    read boolean default false,
    created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, read) where not read;
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- ─── Audit Log ────────────────────────────────────────────────

create table if not exists public.audit_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id),
    action text not null,
    entity_type text,
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_audit_user on public.audit_log(user_id);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id);

-- ================================================================
-- TRIGGERS AUTO-UPDATE
-- ================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at
    before update on public.users
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.vaults;
create trigger set_updated_at
    before update on public.vaults
    for each row execute function public.handle_updated_at();

drop trigger if exists set_penguin_updated_at on public.penguin_states;
create trigger set_penguin_updated_at
    before update on public.penguin_states
    for each row execute function public.handle_updated_at();

-- ================================================================
-- FUNCTIONS
-- ================================================================

create or replace function public.calculate_level(p_xp integer)
returns integer as $$
begin
    if p_xp >= 1000 then return 5;
    elsif p_xp >= 600 then return 4;
    elsif p_xp >= 300 then return 3;
    elsif p_xp >= 100 then return 2;
    else return 1;
    end if;
end;
$$ language plpgsql immutable;

create or replace function public.get_total_saved(p_user_id uuid)
returns numeric(18, 2) as $$
declare
    v_total numeric(18, 2);
begin
    select coalesce(sum(current), 0) into v_total
    from public.vaults
    where user_id = p_user_id and status = 'active';
    
    return v_total;
end;
$$ language plpgsql;

create or replace function public.get_completed_goals_count(p_user_id uuid)
returns integer as $$
declare
    v_count integer;
begin
    select count(*) into v_count
    from public.vaults
    where user_id = p_user_id and status = 'completed';
    
    return v_count;
end;
$$ language plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table public.users enable row level security;
alter table public.vaults enable row level security;
alter table public.activities enable row level security;
alter table public.transfers enable row level security;
alter table public.penguin_states enable row level security;
alter table public.notifications enable row level security;

-- Users: users can only see their own row
create policy "users_select_own"
    on public.users for select
    using (address = current_setting('app.current_address', true));

create policy "users_update_own"
    on public.users for update
    using (address = current_setting('app.current_address', true));

-- Vaults: users can only see their own vaults
create policy "vaults_select_own"
    on public.vaults for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "vaults_insert_own"
    on public.vaults for insert
    with check (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "vaults_update_own"
    on public.vaults for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- Activities: follow vault access
create policy "activities_select_own"
    on public.activities for select
    using (
        vault_id in (
            select id from public.vaults 
            where user_id in (
                select id from public.users 
                where address = current_setting('app.current_address', true)
            )
        )
    );

create policy "activities_insert_own"
    on public.activities for insert
    with check (
        vault_id in (
            select id from public.vaults 
            where user_id in (
                select id from public.users 
                where address = current_setting('app.current_address', true)
            )
        )
    );

-- Notifications: users can only see their own
create policy "notifications_select_own"
    on public.notifications for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "notifications_update_own"
    on public.notifications for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- Penguin states: follow user
create policy "penguin_select_own"
    on public.penguin_states for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "penguin_update_own"
    on public.penguin_states for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- ================================================================
-- REALTIME
-- ================================================================

alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.penguin_states;
alter publication supabase_realtime add table public.vaults;
