-- 1. Extend existing entities
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS unit_type text,
  ADD COLUMN IF NOT EXISTS manager_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 0;

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL;

-- 2. Versions
CREATE TABLE public.org_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  effective_from date,
  source_file_name text,
  source_file_path text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name text,
  published_at timestamptz,
  archived_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_versions TO authenticated;
GRANT ALL ON public.org_versions TO service_role;
ALTER TABLE public.org_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_versions_read" ON public.org_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_versions_write" ON public.org_versions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 3. Snapshot units
CREATE TABLE public.org_snapshot_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.org_versions(id) ON DELETE CASCADE,
  external_key text NOT NULL,
  parent_key text,
  name text NOT NULL,
  unit_type text,
  level integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_name text,
  planned_units numeric NOT NULL DEFAULT 0,
  actual_units numeric NOT NULL DEFAULT 0,
  vacant_units numeric NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'OK',
  source_row integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, external_key)
);
GRANT SELECT ON public.org_snapshot_units TO authenticated;
GRANT ALL ON public.org_snapshot_units TO service_role;
ALTER TABLE public.org_snapshot_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_snapshot_units_read" ON public.org_snapshot_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_snapshot_units_write" ON public.org_snapshot_units FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 4. Snapshot staffing positions
CREATE TABLE public.org_snapshot_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.org_versions(id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  name text NOT NULL,
  category text,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  planned_units numeric NOT NULL DEFAULT 0,
  actual_units numeric NOT NULL DEFAULT 0,
  vacant_units numeric NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'OK',
  sort_order integer NOT NULL DEFAULT 0,
  source_row integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_snapshot_positions TO authenticated;
GRANT ALL ON public.org_snapshot_positions TO service_role;
ALTER TABLE public.org_snapshot_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_snapshot_positions_read" ON public.org_snapshot_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_snapshot_positions_write" ON public.org_snapshot_positions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 5. Snapshot assignments (employee <-> staffing unit)
CREATE TABLE public.org_snapshot_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.org_versions(id) ON DELETE CASCADE,
  snapshot_position_id uuid REFERENCES public.org_snapshot_positions(id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  position_name text NOT NULL,
  full_name text,
  is_vacancy boolean NOT NULL DEFAULT false,
  hire_date date,
  grade text,
  personnel_number text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rate numeric,
  review_status text NOT NULL DEFAULT 'OK',
  source_row integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_snapshot_assignments TO authenticated;
GRANT ALL ON public.org_snapshot_assignments TO service_role;
ALTER TABLE public.org_snapshot_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_snapshot_assignments_read" ON public.org_snapshot_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_snapshot_assignments_write" ON public.org_snapshot_assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 6. Additional subordination links
CREATE TABLE public.org_subordination (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'functional',
  subordinate_department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  superior_department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  subordinate_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  superior_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_subordination TO authenticated;
GRANT ALL ON public.org_subordination TO service_role;
ALTER TABLE public.org_subordination ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_subordination_read" ON public.org_subordination FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_subordination_write" ON public.org_subordination FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 7. OrgUnit <-> WorkCenter
CREATE TABLE public.org_unit_work_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  work_center_id uuid NOT NULL REFERENCES public.work_centers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, work_center_id)
);
GRANT SELECT ON public.org_unit_work_centers TO authenticated;
GRANT ALL ON public.org_unit_work_centers TO service_role;
ALTER TABLE public.org_unit_work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_unit_work_centers_read" ON public.org_unit_work_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_unit_work_centers_write" ON public.org_unit_work_centers FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 8. Import runs
CREATE TABLE public.org_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES public.org_versions(id) ON DELETE SET NULL,
  file_name text,
  file_path text,
  sheet_name text,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PARSED',
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_import_runs TO authenticated;
GRANT ALL ON public.org_import_runs TO service_role;
ALTER TABLE public.org_import_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_import_runs_read" ON public.org_import_runs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "org_import_runs_write" ON public.org_import_runs FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 9. Mapping profiles
CREATE TABLE public.org_mapping_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sheet_name text,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_mapping_profiles TO authenticated;
GRANT ALL ON public.org_mapping_profiles TO service_role;
ALTER TABLE public.org_mapping_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_mapping_profiles_read" ON public.org_mapping_profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "org_mapping_profiles_write" ON public.org_mapping_profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'hr'));

-- 10. updated_at triggers
CREATE TRIGGER update_org_versions_updated_at BEFORE UPDATE ON public.org_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_org_subordination_updated_at BEFORE UPDATE ON public.org_subordination
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_org_import_runs_updated_at BEFORE UPDATE ON public.org_import_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_org_mapping_profiles_updated_at BEFORE UPDATE ON public.org_mapping_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Indexes
CREATE INDEX idx_org_snapshot_units_version ON public.org_snapshot_units(version_id);
CREATE INDEX idx_org_snapshot_positions_version ON public.org_snapshot_positions(version_id, unit_key);
CREATE INDEX idx_org_snapshot_assignments_version ON public.org_snapshot_assignments(version_id, unit_key);
CREATE INDEX idx_org_versions_status ON public.org_versions(status);