-- 1. Codes on existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id);
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_code_key ON public.profiles(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS courses_code_key ON public.courses(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS course_modules_code_key ON public.course_modules(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS materials_code_key ON public.materials(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS questions_code_key ON public.questions(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS test_settings_code_key ON public.test_settings(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS departments_code_key ON public.departments(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS positions_code_key ON public.positions(code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS professions_code_key ON public.professions(code) WHERE code IS NOT NULL;

-- 2. Course lessons
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  material_type text NOT NULL DEFAULT 'text',
  file_url text,
  content text,
  duration_minutes integer,
  is_required boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_lessons_code_key ON public.course_lessons(code) WHERE code IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_read" ON public.course_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_write" ON public.course_lessons FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER course_lessons_updated_at BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Production data
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.production_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  category text,
  brand text,
  name text NOT NULL,
  description text,
  default_area text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  process text,
  equipment_type text,
  area text,
  site text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.production_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL,
  step_number integer NOT NULL,
  process text NOT NULL,
  work_center_code text NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  is_required_step boolean NOT NULL DEFAULT true,
  trainer_comment text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_code, step_number, work_center_code)
);

CREATE TABLE IF NOT EXISTS public.production_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  format text,
  file_url text,
  version text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cable_constructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL,
  layer_number integer NOT NULL,
  element_code text NOT NULL,
  element_name text NOT NULL,
  process text,
  asset_code text,
  material_code text,
  visual_type text,
  layer_description text,
  show_in_learning boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_code, layer_number, element_code)
);

CREATE TABLE IF NOT EXISTS public.defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  process text,
  name text NOT NULL,
  product_category text,
  description text,
  possible_cause text,
  corrective_action text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Import history
CREATE TABLE IF NOT EXISTS public.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  file_name text,
  actor_id uuid REFERENCES auth.users(id),
  actor_name text,
  total_rows integer NOT NULL DEFAULT 0,
  created_rows integer NOT NULL DEFAULT 0,
  updated_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  error_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories, public.production_products, public.work_centers, public.production_routes, public.production_materials, public.model_assets, public.cable_constructions, public.defects TO authenticated;
GRANT SELECT ON public.import_runs TO authenticated;
GRANT ALL ON public.product_categories, public.production_products, public.work_centers, public.production_routes, public.production_materials, public.model_assets, public.cable_constructions, public.defects, public.import_runs TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_constructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prod_cat_read" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_cat_write" ON public.product_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "prod_prod_read" ON public.production_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_prod_write" ON public.production_products FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "wc_read" ON public.work_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "wc_write" ON public.work_centers FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "routes_read" ON public.production_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_write" ON public.production_routes FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "prod_mat_read" ON public.production_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_mat_write" ON public.production_materials FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "assets_read" ON public.model_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_write" ON public.model_assets FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "constr_read" ON public.cable_constructions FOR SELECT TO authenticated USING (true);
CREATE POLICY "constr_write" ON public.cable_constructions FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "defects_read" ON public.defects FOR SELECT TO authenticated USING (true);
CREATE POLICY "defects_write" ON public.defects FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')) WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "import_runs_read" ON public.import_runs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));

CREATE TRIGGER product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER production_products_updated_at BEFORE UPDATE ON public.production_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER work_centers_updated_at BEFORE UPDATE ON public.work_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER production_routes_updated_at BEFORE UPDATE ON public.production_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER production_materials_updated_at BEFORE UPDATE ON public.production_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER model_assets_updated_at BEFORE UPDATE ON public.model_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cable_constructions_updated_at BEFORE UPDATE ON public.cable_constructions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER defects_updated_at BEFORE UPDATE ON public.defects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();