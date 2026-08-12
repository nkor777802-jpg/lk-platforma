-- 1. Типы обучения
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS training_type text NOT NULL DEFAULT 'initial_profession',
  ADD COLUMN IF NOT EXISTS current_grade text,
  ADD COLUMN IF NOT EXISTS target_grade text,
  ADD COLUMN IF NOT EXISTS target_profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_center_id uuid REFERENCES public.work_centers(id) ON DELETE SET NULL;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS material_scope text NOT NULL DEFAULT 'professional';

ALTER TABLE public.test_settings
  ADD COLUMN IF NOT EXISTS test_scope text NOT NULL DEFAULT 'professional';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS mentor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started';

ALTER TABLE public.simulator_runs
  ADD COLUMN IF NOT EXISTS profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_center_code text,
  ADD COLUMN IF NOT EXISTS scenario text NOT NULL DEFAULT 'route_assembly';

-- 2. Наставник видит подопечных
CREATE OR REPLACE FUNCTION public.is_mentor_of(_mentor uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _target AND p.mentor_id = _mentor)
$$;
REVOKE ALL ON FUNCTION public.is_mentor_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mentor_of(uuid, uuid) TO authenticated, service_role;

-- 3. Шаблоны адаптации
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  duration_days integer NOT NULL DEFAULT 90,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_templates TO authenticated;
GRANT ALL ON public.onboarding_templates TO service_role;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_templates_read" ON public.onboarding_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "onboarding_templates_manage" ON public.onboarding_templates FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER onboarding_templates_updated_at BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.onboarding_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'info',
  section text NOT NULL DEFAULT 'company',
  offset_days integer NOT NULL DEFAULT 0,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  test_settings_id uuid REFERENCES public.test_settings(id) ON DELETE SET NULL,
  link_url text,
  is_required boolean NOT NULL DEFAULT true,
  requires_mentor boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_template_items TO authenticated;
GRANT ALL ON public.onboarding_template_items TO service_role;
ALTER TABLE public.onboarding_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_template_items_read" ON public.onboarding_template_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "onboarding_template_items_manage" ON public.onboarding_template_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER onboarding_template_items_updated_at BEFORE UPDATE ON public.onboarding_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Индивидуальные программы адаптации (snapshot)
CREATE TABLE IF NOT EXISTS public.onboarding_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  template_name text NOT NULL,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  hire_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_programs TO authenticated;
GRANT ALL ON public.onboarding_programs TO service_role;
ALTER TABLE public.onboarding_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_programs_read" ON public.onboarding_programs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id) OR public.is_mentor_of(auth.uid(), user_id));
CREATE POLICY "onboarding_programs_manage" ON public.onboarding_programs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER onboarding_programs_updated_at BEFORE UPDATE ON public.onboarding_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.onboarding_program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.onboarding_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'info',
  section text NOT NULL DEFAULT 'company',
  offset_days integer NOT NULL DEFAULT 0,
  due_date date,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  test_settings_id uuid REFERENCES public.test_settings(id) ON DELETE SET NULL,
  link_url text,
  is_required boolean NOT NULL DEFAULT true,
  requires_mentor boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  mentor_confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_confirmed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_program_items TO authenticated;
GRANT ALL ON public.onboarding_program_items TO service_role;
ALTER TABLE public.onboarding_program_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_program_items_read" ON public.onboarding_program_items FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id) OR public.is_mentor_of(auth.uid(), user_id));
CREATE POLICY "onboarding_program_items_own_update" ON public.onboarding_program_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "onboarding_program_items_staff" ON public.onboarding_program_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.is_mentor_of(auth.uid(), user_id))
  WITH CHECK (public.is_staff(auth.uid()) OR public.is_mentor_of(auth.uid(), user_id));
CREATE TRIGGER onboarding_program_items_updated_at BEFORE UPDATE ON public.onboarding_program_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Обратная связь по адаптации
CREATE TABLE IF NOT EXISTS public.onboarding_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.onboarding_programs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.onboarding_program_items(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.onboarding_feedback TO authenticated;
GRANT ALL ON public.onboarding_feedback TO service_role;
ALTER TABLE public.onboarding_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_feedback_read" ON public.onboarding_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "onboarding_feedback_insert_own" ON public.onboarding_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "onboarding_feedback_staff_update" ON public.onboarding_feedback FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER onboarding_feedback_updated_at BEFORE UPDATE ON public.onboarding_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Паспорт компетенций сотрудника
CREATE TABLE IF NOT EXISTS public.employee_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES public.competencies(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  source text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, competency_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_competencies TO authenticated;
GRANT ALL ON public.employee_competencies TO service_role;
ALTER TABLE public.employee_competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_competencies_read" ON public.employee_competencies FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id) OR public.is_mentor_of(auth.uid(), user_id));
CREATE POLICY "employee_competencies_manage" ON public.employee_competencies FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.is_mentor_of(auth.uid(), user_id))
  WITH CHECK (public.is_staff(auth.uid()) OR public.is_mentor_of(auth.uid(), user_id));
CREATE TRIGGER employee_competencies_updated_at BEFORE UPDATE ON public.employee_competencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_onb_items_user ON public.onboarding_program_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_onb_programs_user ON public.onboarding_programs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_emp_comp_user ON public.employee_competencies(user_id);