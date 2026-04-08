-- Slots
alter table slots
  alter column starts_at type timestamp using starts_at::timestamp,
  alter column ends_at   type timestamp using ends_at::timestamp;

-- The partial index on appointments references slot timing indirectly
-- but appointments.created_at is fine as timestamptz — it's a true UTC moment.
-- No change needed there.

-- Update the check_template_conflicts function parameter types
create or replace function check_template_conflicts(
  p_practitioner_id uuid,
  p_starts_at       timestamp[],
  p_ends_at         timestamp[]
)
returns table (
  conflict_starts_at timestamp,
  conflict_ends_at   timestamp,
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