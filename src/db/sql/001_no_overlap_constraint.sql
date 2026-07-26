-- Not representable in Drizzle's schema.ts (no EXCLUDE constraint API),
-- so this is tracked as a standalone SQL migration and applied manually
-- via scripts/apply-sql.ts. `drizzle-kit push` does not know about it.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status <> 'CANCELLED');
