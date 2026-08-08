
CREATE TABLE public.qualification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  next_level_id uuid REFERENCES public.qualification_levels(id) ON DELETE SET NULL,
  is_leadership boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualification_levels TO authenticated;
GRANT ALL ON public.qualification_levels TO service_role;
ALTER TABLE public.qualification_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_read" ON public.qualification_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "levels_write" ON public.qualification_levels FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER qualification_levels_updated_at BEFORE UPDATE ON public.qualification_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.qualification_levels(id) ON DELETE CASCADE,
  competency_type text NOT NULL DEFAULT 'knowledge',
  title text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  profession_test_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competencies TO authenticated;
GRANT ALL ON public.competencies TO service_role;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competencies_read" ON public.competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "competencies_write" ON public.competencies FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER competencies_updated_at BEFORE UPDATE ON public.competencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  target_level_id uuid REFERENCES public.qualification_levels(id) ON DELETE SET NULL,
  responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'not_started',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_plans TO authenticated;
GRANT ALL ON public.development_plans TO service_role;
ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_read" ON public.development_plans FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR responsible_id = auth.uid() OR public.is_staff(auth.uid())
         OR public.has_role(auth.uid(),'teacher') OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "plans_write" ON public.development_plans FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER development_plans_updated_at BEFORE UPDATE ON public.development_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.development_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.development_plans(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'course',
  title text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  practical_task_id uuid REFERENCES public.practical_tasks(id) ON DELETE SET NULL,
  test_profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  is_mandatory boolean NOT NULL DEFAULT true,
  due_date date,
  responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'not_started',
  comment text,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_plan_items TO authenticated;
GRANT ALL ON public.development_plan_items TO service_role;
ALTER TABLE public.development_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_items_read" ON public.development_plan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.development_plans p WHERE p.id = plan_id AND (
    p.user_id = auth.uid() OR p.responsible_id = auth.uid() OR public.is_staff(auth.uid())
    OR public.has_role(auth.uid(),'teacher') OR public.manages_user(auth.uid(), p.user_id))));
CREATE POLICY "plan_items_write" ON public.development_plan_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER development_plan_items_updated_at BEFORE UPDATE ON public.development_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.qualification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  from_level_id uuid REFERENCES public.qualification_levels(id) ON DELETE SET NULL,
  to_level_id uuid REFERENCES public.qualification_levels(id) ON DELETE SET NULL,
  basis text,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.qualification_history TO authenticated;
GRANT ALL ON public.qualification_history TO service_role;
ALTER TABLE public.qualification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qual_history_read" ON public.qualification_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'teacher')
         OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "qual_history_insert" ON public.qualification_history FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_qualification_levels_profession ON public.qualification_levels(profession_id, sort_order);
CREATE INDEX idx_competencies_level ON public.competencies(level_id, sort_order);
CREATE INDEX idx_development_plans_user ON public.development_plans(user_id);
CREATE INDEX idx_development_plan_items_plan ON public.development_plan_items(plan_id, sort_order);
CREATE INDEX idx_qualification_history_user ON public.qualification_history(user_id, created_at DESC);
