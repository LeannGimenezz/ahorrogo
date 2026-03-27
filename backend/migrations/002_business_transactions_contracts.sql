-- ================================================================
-- AHORROGO — Business Transactions + Smart Contract Intents
-- ================================================================

-- Perfil de recepción (Beexo alias/cvu/qr)
create table if not exists public.receive_profiles (
    user_id uuid primary key references public.users(id) on delete cascade,
    beexo_alias text not null,
    cvu text,
    wallet_address text not null,
    qr_payload text not null,
    updated_at timestamptz default now()
);

create index if not exists idx_receive_profiles_alias on public.receive_profiles(beexo_alias);

-- Registro de swaps solicitados por usuario
create table if not exists public.swap_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    from_token text not null,
    to_token text not null,
    amount numeric(18, 8) not null constraint swap_amount_positive check (amount > 0),
    quoted_rate numeric(18, 8),
    estimated_received numeric(18, 8),
    status text default 'pending' check (status in ('pending', 'confirmed', 'failed', 'cancelled')),
    tx_hash text,
    metadata jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_swap_transactions_user on public.swap_transactions(user_id);
create index if not exists idx_swap_transactions_status on public.swap_transactions(status);

-- Contratos/intenciones de negocio (P2P, alquiler, timelock)
create table if not exists public.business_contracts (
    id uuid primary key default gen_random_uuid(),
    contract_type text not null check (contract_type in ('p2p_protected', 'rental_guarantee', 'timelock_goal', 'scheduled_release')),
    status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'released', 'cancelled', 'expired')),
    owner_user_id uuid not null references public.users(id) on delete cascade,
    counterparty_address text,
    vault_id uuid references public.vaults(id) on delete set null,
    on_chain_vault_id bigint,
    amount numeric(18, 2),
    release_date timestamptz,
    guarantee_months integer,
    approval_tx_hash text,
    release_tx_hash text,
    summary jsonb,
    metadata jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_business_contracts_owner on public.business_contracts(owner_user_id);
create index if not exists idx_business_contracts_status on public.business_contracts(status);
create index if not exists idx_business_contracts_type on public.business_contracts(contract_type);

-- Reglas de liberación por porcentaje
create table if not exists public.release_rules (
    id uuid primary key default gen_random_uuid(),
    business_contract_id uuid not null references public.business_contracts(id) on delete cascade,
    label text not null,
    percentage numeric(5, 2) not null check (percentage > 0 and percentage <= 100),
    release_day integer check (release_day between 1 and 31),
    target_address text,
    is_active boolean default true,
    created_at timestamptz default now()
);

create index if not exists idx_release_rules_contract on public.release_rules(business_contract_id);

-- Triggers updated_at
drop trigger if exists set_updated_at_swap_transactions on public.swap_transactions;
create trigger set_updated_at_swap_transactions
    before update on public.swap_transactions
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_business_contracts on public.business_contracts;
create trigger set_updated_at_business_contracts
    before update on public.business_contracts
    for each row execute function public.handle_updated_at();

-- RLS
alter table public.receive_profiles enable row level security;
alter table public.swap_transactions enable row level security;
alter table public.business_contracts enable row level security;
alter table public.release_rules enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'receive_profiles_select_own') then
    create policy "receive_profiles_select_own"
        on public.receive_profiles for select
        using (user_id in (select id from public.users where address = current_setting('app.current_address', true)));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'swap_transactions_select_own') then
    create policy "swap_transactions_select_own"
        on public.swap_transactions for select
        using (user_id in (select id from public.users where address = current_setting('app.current_address', true)));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'swap_transactions_insert_own') then
    create policy "swap_transactions_insert_own"
        on public.swap_transactions for insert
        with check (user_id in (select id from public.users where address = current_setting('app.current_address', true)));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'business_contracts_select_own') then
    create policy "business_contracts_select_own"
        on public.business_contracts for select
        using (owner_user_id in (select id from public.users where address = current_setting('app.current_address', true)));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'business_contracts_insert_own') then
    create policy "business_contracts_insert_own"
        on public.business_contracts for insert
        with check (owner_user_id in (select id from public.users where address = current_setting('app.current_address', true)));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'release_rules_select_own') then
    create policy "release_rules_select_own"
        on public.release_rules for select
        using (business_contract_id in (
            select id from public.business_contracts
            where owner_user_id in (select id from public.users where address = current_setting('app.current_address', true))
        ));
  end if;
end $$;
