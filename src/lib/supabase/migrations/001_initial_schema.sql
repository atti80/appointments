-- ============================================================
-- Appointment Booking System — Full Database Migration
-- Compatible with Supabase (PostgreSQL 15+)
-- v2: Supabase Auth invites, admin is_active, token removed
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

create type admin_invite_status as enum ('pending', 'accepted', 'expired');

create type template_type as enum ('daily', 'weekly');

create type slot_status as enum ('available', 'pending', 'booked');

create type appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type custom_field_type as enum (
  'text',
  'number',
  'date',
  'boolean',
  'select'
);

create type day_of_week as enum ('0','1','2','3','4','5','6');
-- 0 = Sunday, 1 = Monday ... 6 = Saturday


-- ============================================================
-- OFFICES
-- ============================================================

create table offices (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  slug                        text not null unique,
  logo_url                    text,
  brand_color                 text default '#6366f1',
  welcome_message             text,
  cancellation_cutoff_minutes int  not null default 1440, -- 24 hours
  reminder_minutes_before     int  not null default 1440, -- 24 hours
  booking_timeout_minutes     int  not null default 10,
  default_slot_minutes        int  not null default 30,
  created_at                  timestamptz not null default now()
);

comment on column offices.slug                        is 'URL-safe identifier used in the public booking page URL';
comment on column offices.cancellation_cutoff_minutes is 'Clients cannot cancel within this many minutes of the appointment';
comment on column offices.reminder_minutes_before     is 'How many minutes before the appointment to send the reminder email';
comment on column offices.booking_timeout_minutes     is 'How long a slot stays in pending state before being released';


-- ============================================================
-- ADMINS
-- ============================================================

-- Supabase Auth manages passwords. This table links auth.users to offices.

create table admins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  office_id  uuid not null references offices (id) on delete cascade,
  name       text not null,
  email      text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column admins.user_id   is 'References auth.users managed by Supabase Auth';
comment on column admins.is_active is 'Deactivated admins retain their auth.users record but are denied access via RLS. Use hard delete (service role) for permanent removal.';


-- ============================================================
-- ADMIN INVITES
-- ============================================================

create table admin_invites (
  id                  uuid primary key default gen_random_uuid(),
  office_id           uuid not null references offices (id) on delete cascade,
  invited_by_admin_id uuid not null references admins (id) on delete cascade,
  email               text not null,
  status              admin_invite_status not null default 'pending',
  expires_at          timestamptz not null default now() + interval '48 hours',
  created_at          timestamptz not null default now()
);

comment on table  admin_invites       is 'Tracks pending and accepted invites. The actual invite email and token are handled by Supabase Auth (inviteUserByEmail). This table links an invited email to an office.';
comment on column admin_invites.email is 'Must match the email used in supabase.auth.admin.inviteUserByEmail(). Used to look up the office when the invitee accepts.';


-- ============================================================
-- PRACTITIONERS
-- ============================================================

create table practitioners (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices (id) on delete cascade,
  name       text not null,
  email      text,
  bio        text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);


-- ============================================================
-- SLOT TYPES
-- ============================================================

create table slot_types (
  id               uuid primary key default gen_random_uuid(),
  office_id        uuid not null references offices (id) on delete cascade,
  name             text not null,
  duration_minutes int  not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),

  constraint slot_types_duration_positive check (duration_minutes > 0)
);


-- ============================================================
-- TEMPLATES
-- ============================================================

create table templates (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices (id) on delete cascade,
  name       text not null,
  type       template_type not null,
  created_at timestamptz not null default now()
);

comment on column templates.type is 'daily = single day pattern; weekly = full week pattern';


-- ============================================================
-- TEMPLATE SLOTS
-- ============================================================

create table template_slots (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references templates (id) on delete cascade,
  slot_type_id uuid references slot_types (id) on delete set null,
  day_of_week  day_of_week, -- null = general daily template (no day restriction)
  start_time   time not null,
  end_time     time not null,

  constraint template_slots_time_order check (end_time > start_time)
);

comment on column template_slots.day_of_week is 'Null only allowed for daily templates. If set and applied to a different day, the UI shows a warning.';


-- ============================================================
-- SLOTS
-- ============================================================

create table slots (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references practitioners (id) on delete cascade,
  office_id        uuid not null references offices (id) on delete cascade,
  slot_type_id     uuid references slot_types (id) on delete set null,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           slot_status not null default 'available',
  created_at       timestamptz not null default now(),

  constraint slots_time_order check (ends_at > starts_at)
);

comment on column slots.status is 'available → pending (client starts booking) → booked (confirmed). Cancelled appointments return slot to available.';


-- ============================================================
-- CUSTOM FIELDS
-- ============================================================

create table custom_fields (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references offices (id) on delete cascade,
  label       text not null,
  field_type  custom_field_type not null default 'text',
  is_required boolean not null default false,
  sort_order  int     not null default 0,
  is_active   boolean not null default true,
  -- options is used when field_type = 'select', stored as a JSON array of strings
  options     jsonb
);

comment on column custom_fields.options is 'Only used when field_type is select. Example: ["Option A", "Option B"]';


-- ============================================================
-- CLIENTS
-- ============================================================

create table clients (
  id            uuid primary key default gen_random_uuid(),
  office_id     uuid not null references offices (id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  no_show_count int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ============================================================
-- CLIENT FIELD VALUES
-- ============================================================

create table client_field_values (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients (id) on delete cascade,
  custom_field_id uuid not null references custom_fields (id) on delete cascade,
  value           text,

  constraint client_field_values_unique unique (client_id, custom_field_id)
);


-- ============================================================
-- APPOINTMENTS
-- ============================================================

create table appointments (
  id               uuid primary key default gen_random_uuid(),
  office_id        uuid not null references offices (id) on delete cascade,
  slot_id          uuid not null references slots (id) on delete restrict,
  client_id        uuid not null references clients (id) on delete restrict,
  practitioner_id  uuid not null references practitioners (id) on delete restrict,
  status           appointment_status not null default 'pending',
  cancel_token     text not null unique default encode(gen_random_bytes(32), 'hex'),
  reschedule_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  notes            text,   -- internal only, never shown to client
  email_sent       boolean not null default false,
  processing_at    timestamptz, -- soft lock for the cleanup cron job
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column appointments.notes            is 'Internal notes by admin or practitioner. Never visible to the client.';
comment on column appointments.cancel_token     is 'Unguessable token embedded in confirmation email cancel link';
comment on column appointments.reschedule_token is 'Unguessable token embedded in confirmation email reschedule link';
comment on column appointments.processing_at    is 'Stamped by the cleanup job before processing. Prevents double-processing in concurrent runs.';


-- ============================================================
-- APPOINTMENT FIELD VALUES
-- ============================================================

create table appointment_field_values (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references appointments (id) on delete cascade,
  custom_field_id uuid not null references custom_fields (id) on delete cascade,
  value           text,

  constraint appointment_field_values_unique unique (appointment_id, custom_field_id)
);

comment on table appointment_field_values is 'Snapshot of custom field values at the time of booking. Preserved even if the field definition changes later.';


-- ============================================================
-- INDEXES
-- ============================================================

-- Offices
create index on offices (slug);

-- Admins
create index on admins (office_id);
create index on admins (user_id);

-- Admin invites
create index on admin_invites (office_id);
create index on admin_invites (email);

-- Practitioners
create index on practitioners (office_id);

-- Slot types
create index on slot_types (office_id);

-- Templates
create index on templates (office_id);

-- Template slots
create index on template_slots (template_id);

-- Slots
create index on slots (practitioner_id);
create index on slots (office_id);
create index on slots (status);
create index on slots (starts_at);
-- Composite: public booking page queries slots by practitioner + date + status
create index on slots (practitioner_id, starts_at, status);

-- Custom fields
create index on custom_fields (office_id);

-- Clients
create index on clients (office_id);
create index on clients (email);

-- Appointments
create index on appointments (office_id);
create index on appointments (slot_id);
create index on appointments (client_id);
create index on appointments (practitioner_id);
create index on appointments (status);
create index on appointments (created_at);

-- Composite: cleanup job queries pending appointments by status + created_at
create index on appointments (status, created_at) where status = 'pending'::appointment_status;
-- Composite: reminder job queries confirmed appointments by status + slot starts_at
create index on appointments (status, slot_id) where status = 'confirmed'::appointment_status;

-- Client field values
create index on client_field_values (client_id);

-- Appointment field values
create index on appointment_field_values (appointment_id);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_clients
  before update on clients
  for each row execute function set_updated_at();

create trigger set_updated_at_appointments
  before update on appointments
  for each row execute function set_updated_at();


-- ============================================================
-- HELPER FUNCTION: check slot conflicts before applying a template
-- Returns rows of conflicting slot times for a given practitioner and date range.
-- Used by the admin UI to warn before applying a template.
-- ============================================================
create or replace function check_template_conflicts(
  p_practitioner_id uuid,
  p_starts_at       timestamptz[],
  p_ends_at         timestamptz[]
)
returns table (
  conflict_starts_at timestamptz,
  conflict_ends_at   timestamptz,
  conflict_status    slot_status
)
language sql stable as $$
  with proposed as (
    select sa, ea
    from unnest(p_starts_at) with ordinality as a(sa, i)
    join unnest(p_ends_at)   with ordinality as b(ea, i) using (i)
  )
  select distinct s.starts_at, s.ends_at, s.status
  from slots s
  join proposed p
    on s.starts_at < p.ea
   and s.ends_at   > p.sa
  where s.practitioner_id = p_practitioner_id
    and s.status in ('available', 'pending', 'booked');
$$;

comment on function check_template_conflicts is
  'Pass arrays of proposed starts_at and ends_at timestamps. Returns any existing slots that overlap. Used to warn the admin before applying a template.';


-- ============================================================
-- HELPER FUNCTION: claim a pending appointment for cleanup
-- Atomically stamps processing_at so only one job instance processes it.
-- Returns true if the claim succeeded, false if another process got there first.
-- ============================================================

create or replace function claim_pending_appointment(p_appointment_id uuid, p_lock_seconds int default 30)
returns boolean
language plpgsql as $$
declare
  rows_updated int;
begin
  update appointments
  set processing_at = now()
  where id = p_appointment_id
    and status = 'pending'
    and (processing_at is null or processing_at < now() - (p_lock_seconds || ' seconds')::interval)
  ;
  get diagnostics rows_updated = row_count;
  return rows_updated = 1;
end;
$$;

comment on function claim_pending_appointment is
  'Atomically locks a pending appointment for the cleanup job. Returns true if this caller owns the lock, false if another process already claimed it.';


create or replace function claim_stale_pending_appointments(p_lock_seconds int default 30)
returns setof uuid
language plpgsql as $$
begin
  return query
  update appointments
  set processing_at = now()
  where status = 'pending'
    and created_at < now() - (
      select booking_timeout_minutes || ' minutes'
      from offices
      where id = appointments.office_id
    )::interval
    and (processing_at is null or processing_at < now() - (p_lock_seconds || ' seconds')::interval)
  returning id;
end;
$$;


create or replace function create_office_and_first_admin(
  p_office_name  text,
  p_office_slug  text,
  p_admin_name   text,
  p_admin_email  text,
  p_admin_user_id uuid  -- the auth.users id created by Supabase Auth
)
returns void
language plpgsql as $$
declare
  v_office_id uuid;
begin
  -- Create the office
  insert into offices (name, slug)
  values (p_office_name, p_office_slug)
  returning id into v_office_id;

  -- Create the first admin linked to that office
  insert into admins (user_id, office_id, name, email)
  values (p_admin_user_id, v_office_id, p_admin_name, p_admin_email);
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table offices                  enable row level security;
alter table admins                   enable row level security;
alter table admin_invites            enable row level security;
alter table practitioners            enable row level security;
alter table slot_types               enable row level security;
alter table templates                enable row level security;
alter table template_slots           enable row level security;
alter table slots                    enable row level security;
alter table custom_fields            enable row level security;
alter table clients                  enable row level security;
alter table client_field_values      enable row level security;
alter table appointments             enable row level security;
alter table appointment_field_values enable row level security;


-- Helper function: returns the office_id for the currently logged-in admin
-- Returns null if admin is deactivated, which causes all RLS policies to deny access
create or replace function my_office_id()
returns uuid language sql stable security definer as $$
  select office_id from admins where user_id = auth.uid() and is_active = true limit 1;
$$;


-- --------------------------------------------------------
-- OFFICES: admins can read/update their own office
-- --------------------------------------------------------
create policy "admins can view their office"
  on offices for select
  using (id = my_office_id());

create policy "admins can update their office"
  on offices for update
  using (id = my_office_id());


-- --------------------------------------------------------
-- ADMINS: admins can view other active admins in their office
-- --------------------------------------------------------
create policy "admins can view office admins"
  on admins for select
  using (office_id = my_office_id());

create policy "admins can deactivate office admins"
  on admins for update
  using (office_id = my_office_id());

create policy "admins can delete office admins"
  on admins for delete
  using (office_id = my_office_id());

-- Note: hard-deleting an admin also requires deleting auth.users via service role.
-- Do both in a single server action using the Supabase service role client.


-- --------------------------------------------------------
-- ADMIN INVITES
-- --------------------------------------------------------
create policy "admins can manage invites for their office"
  on admin_invites for all
  using (office_id = my_office_id());

-- The accept-invite page looks up the office by email from the Supabase auth session.
-- No token needed — Supabase Auth handles the invite token in the email link.
create policy "public can read invite by email"
  on admin_invites for select
  using (true);


-- --------------------------------------------------------
-- PRACTITIONERS
-- --------------------------------------------------------
create policy "admins can manage their practitioners"
  on practitioners for all
  using (office_id = my_office_id());

-- Public booking page can read active practitioners
create policy "public can view active practitioners"
  on practitioners for select
  using (is_active = true);


-- --------------------------------------------------------
-- SLOT TYPES
-- --------------------------------------------------------
create policy "admins can manage slot types"
  on slot_types for all
  using (office_id = my_office_id());

create policy "public can view active slot types"
  on slot_types for select
  using (is_active = true);


-- --------------------------------------------------------
-- TEMPLATES & TEMPLATE SLOTS
-- --------------------------------------------------------
create policy "admins can manage templates"
  on templates for all
  using (office_id = my_office_id());

create policy "admins can manage template slots"
  on template_slots for all
  using (
    template_id in (
      select id from templates where office_id = my_office_id()
    )
  );


-- --------------------------------------------------------
-- SLOTS
-- --------------------------------------------------------
create policy "admins can manage slots"
  on slots for all
  using (office_id = my_office_id());

-- Public booking page can read available slots
create policy "public can view available slots"
  on slots for select
  using (status = 'available');


-- --------------------------------------------------------
-- CUSTOM FIELDS
-- --------------------------------------------------------
create policy "admins can manage custom fields"
  on custom_fields for all
  using (office_id = my_office_id());

create policy "public can view active custom fields"
  on custom_fields for select
  using (is_active = true);


-- --------------------------------------------------------
-- CLIENTS
-- --------------------------------------------------------
create policy "admins can manage clients"
  on clients for all
  using (office_id = my_office_id());


-- --------------------------------------------------------
-- CLIENT FIELD VALUES
-- --------------------------------------------------------
create policy "admins can manage client field values"
  on client_field_values for all
  using (
    client_id in (
      select id from clients where office_id = my_office_id()
    )
  );


-- --------------------------------------------------------
-- APPOINTMENTS
-- --------------------------------------------------------
create policy "admins can manage appointments"
  on appointments for all
  using (office_id = my_office_id());



-- --------------------------------------------------------
-- APPOINTMENT FIELD VALUES
-- --------------------------------------------------------
create policy "admins can manage appointment field values"
  on appointment_field_values for all
  using (
    appointment_id in (
      select id from appointments where office_id = my_office_id()
    )
  );



-- ============================================================
-- SEED: default data (optional, remove for production)
-- ============================================================

-- Uncomment to seed a test office for local development:
--
-- insert into offices (name, slug, welcome_message)
-- values ('Demo Practice', 'demo-practice', 'Welcome! Book your appointment below.');
