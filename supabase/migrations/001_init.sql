-- Student Ops School — initial schema
-- Shared pot: any partner may collect fees from any student and spend on any expense.
-- Money movements ALWAYS stamp partner_id (collected_by / spent_by). Soft-delete via void only.
--
-- RLS NOTES (enable after wiring auth):
--   * partners: authenticated partners can SELECT all; INSERT/UPDATE restricted to service role.
--   * students: partners can SELECT/INSERT/UPDATE all students (shared school).
--   * attendance / fee_collections / expenses / progress_notes:
--       SELECT all for authenticated partners;
--       INSERT requires recorded_by / collected_by / spent_by = auth.uid() mapped partner;
--       UPDATE for void only (set voided_at + void_reason); no hard DELETE for money tables.
--   Map auth.users.id → partners.auth_user_id when Supabase Auth is added.
--   Until then this SQL is the target schema; the Expo app uses offline mock store.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- partners (3 owners of the shared school pot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  label         TEXT NOT NULL,          -- A / B / C display badge
  color         TEXT,
  auth_user_id  UUID UNIQUE,           -- link to auth.users later
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  class_name      TEXT NOT NULL,
  guardian_name   TEXT NOT NULL,
  guardian_phone  TEXT,
  admission_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_fee     NUMERIC(12, 2) NOT NULL CHECK (monthly_fee >= 0),
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES partners(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_class_idx ON students(class_name);
CREATE INDEX IF NOT EXISTS students_name_idx ON students(name);

-- ---------------------------------------------------------------------------
-- attendance (one row per student per date)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_name    TEXT NOT NULL,
  date          DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  recorded_by   UUID NOT NULL REFERENCES partners(id),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  note          TEXT,
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_class_date_idx ON attendance(class_name, date);
CREATE INDEX IF NOT EXISTS attendance_recorded_by_idx ON attendance(recorded_by);

-- ---------------------------------------------------------------------------
-- fee_collections — ANY partner may collect from ANY student
-- Soft-delete: voided_at + void_reason (NO hard delete of money rows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method          TEXT NOT NULL CHECK (method IN ('cash', 'upi', 'bank')),
  note            TEXT,
  collected_by    UUID NOT NULL REFERENCES partners(id),  -- NEVER null / anonymous
  collected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at       TIMESTAMPTZ,
  void_reason     TEXT,
  CONSTRAINT fee_void_reason_chk CHECK (
    (voided_at IS NULL AND void_reason IS NULL)
    OR (voided_at IS NOT NULL AND void_reason IS NOT NULL AND length(trim(void_reason)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS fee_collections_student_idx ON fee_collections(student_id);
CREATE INDEX IF NOT EXISTS fee_collections_collected_by_idx ON fee_collections(collected_by);
CREATE INDEX IF NOT EXISTS fee_collections_collected_at_idx ON fee_collections(collected_at);

-- ---------------------------------------------------------------------------
-- expenses — ANY partner may spend on ANY school purpose
-- Soft-delete: voided_at + void_reason
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category      TEXT NOT NULL CHECK (
    category IN (
      'salaries', 'rent', 'utilities', 'supplies',
      'transport', 'maintenance', 'food', 'other'
    )
  ),
  purpose       TEXT NOT NULL,
  method        TEXT NOT NULL CHECK (method IN ('cash', 'upi', 'bank')),
  spent_by      UUID NOT NULL REFERENCES partners(id),  -- NEVER null / anonymous
  spent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at     TIMESTAMPTZ,
  void_reason   TEXT,
  CONSTRAINT expense_void_reason_chk CHECK (
    (voided_at IS NULL AND void_reason IS NULL)
    OR (voided_at IS NOT NULL AND void_reason IS NOT NULL AND length(trim(void_reason)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS expenses_spent_by_idx ON expenses(spent_by);
CREATE INDEX IF NOT EXISTS expenses_spent_at_idx ON expenses(spent_at);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);

-- ---------------------------------------------------------------------------
-- progress_notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  note          TEXT NOT NULL,
  recorded_by   UUID NOT NULL REFERENCES partners(id),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS progress_notes_student_idx ON progress_notes(student_id);

-- ---------------------------------------------------------------------------
-- Seed placeholders (replace UUIDs / names when going live)
-- ---------------------------------------------------------------------------
INSERT INTO partners (id, name, label, color) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Partner A', 'A', '#2563eb'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Partner B', 'B', '#16a34a'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Partner C', 'C', '#ca8a04')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS scaffolding (commented until Auth is wired)
-- ---------------------------------------------------------------------------
-- ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;
--
-- Example policy pattern for fee_collections:
--   CREATE POLICY fee_select ON fee_collections FOR SELECT TO authenticated USING (true);
--   CREATE POLICY fee_insert ON fee_collections FOR INSERT TO authenticated
--     WITH CHECK (collected_by = (SELECT id FROM partners WHERE auth_user_id = auth.uid()));
--   CREATE POLICY fee_void ON fee_collections FOR UPDATE TO authenticated
--     USING (true)
--     WITH CHECK (voided_at IS NOT NULL AND void_reason IS NOT NULL);
--   -- NO DELETE policy for fee_collections / expenses
