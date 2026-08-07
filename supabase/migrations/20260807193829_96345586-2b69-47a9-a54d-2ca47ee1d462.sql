
-- ROLES
CREATE TYPE public.app_role AS ENUM ('employee','manager','hr','admin');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  parent_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  head_name text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  personnel_number text,
  email text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  position text,
  profession_id uuid,
  grade text,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('hr','admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.manages_user(_manager uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _target AND (
      p.manager_id = _manager
      OR (p.department_id IS NOT NULL AND p.department_id = (SELECT department_id FROM public.profiles WHERE id = _manager)
          AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _manager AND role = 'manager'))
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CONTENT
CREATE TABLE public.professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  name text NOT NULL,
  slug text UNIQUE,
  short_description text,
  description text,
  image_url text,
  grades text[],
  skills text[],
  equipment text[],
  duration_hours int,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_profession_fk
  FOREIGN KEY (profession_id) REFERENCES public.professions(id) ON DELETE SET NULL;

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_common boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  module_type text NOT NULL DEFAULT 'materials',
  sort_order int NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'document',
  file_url text,
  external_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  category_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_mandatory_for_all boolean NOT NULL DEFAULT false,
  tags text[],
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  topic text,
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  video_url text,
  external_url text,
  thumbnail_url text,
  duration_seconds int,
  is_company_video boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_description text,
  purpose text,
  applications text[],
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  position text NOT NULL,
  bio text,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  title text,
  body text,
  image_url text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  topic text,
  category text,
  text text NOT NULL,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium',
  source_material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  is_common boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PRACTICAL TASKS
CREATE TABLE public.practical_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  title text NOT NULL,
  instruction text,
  task_type text NOT NULL DEFAULT 'sequence',
  image_url text,
  max_score int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.practical_task_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.practical_tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  match_target text,
  image_url text,
  correct_position int,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TEST SETTINGS / PROMPTS
CREATE TABLE public.test_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  total_questions int NOT NULL DEFAULT 20,
  common_questions int NOT NULL DEFAULT 5,
  professional_questions int NOT NULL DEFAULT 15,
  pass_percent int NOT NULL DEFAULT 80,
  time_limit_minutes int,
  allow_retry boolean NOT NULL DEFAULT true,
  max_attempts int NOT NULL DEFAULT 3,
  shuffle_questions boolean NOT NULL DEFAULT true,
  shuffle_options boolean NOT NULL DEFAULT true,
  show_correct_answer boolean NOT NULL DEFAULT false,
  lock_answer boolean NOT NULL DEFAULT true,
  grading_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Правила тестирования',
  content text NOT NULL,
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ASSIGNMENTS / PROGRESS
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  stage_key text,
  status text NOT NULL DEFAULT 'not_started',
  progress_percent int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  attempt_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'in_progress',
  total_questions int NOT NULL DEFAULT 0,
  correct_answers int NOT NULL DEFAULT 0,
  score_percent numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean,
  settings_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE public.test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  question_text text NOT NULL DEFAULT '',
  selected_option_id uuid,
  selected_text text,
  correct_text text,
  is_correct boolean,
  answered_at timestamptz NOT NULL DEFAULT now(),
  time_spent_seconds int,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.practical_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.practical_tasks(id) ON DELETE SET NULL,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  score int NOT NULL DEFAULT 0,
  max_score int NOT NULL DEFAULT 100,
  passed boolean NOT NULL DEFAULT false,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  condition_type text NOT NULL DEFAULT 'manual',
  condition_value int,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments, public.profiles, public.user_roles,
  public.professions, public.courses, public.course_modules, public.material_categories,
  public.materials, public.videos, public.products, public.company_history, public.management,
  public.site_content, public.questions, public.answer_options, public.practical_tasks,
  public.practical_task_items, public.test_settings, public.prompt_versions, public.assignments,
  public.learning_progress, public.test_attempts, public.test_answers, public.practical_results,
  public.achievements, public.employee_achievements TO authenticated;

GRANT ALL ON public.departments, public.profiles, public.user_roles,
  public.professions, public.courses, public.course_modules, public.material_categories,
  public.materials, public.videos, public.products, public.company_history, public.management,
  public.site_content, public.questions, public.answer_options, public.practical_tasks,
  public.practical_task_items, public.test_settings, public.prompt_versions, public.assignments,
  public.learning_progress, public.test_attempts, public.test_answers, public.practical_results,
  public.achievements, public.employee_achievements TO service_role;

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_achievements ENABLE ROW LEVEL SECURITY;

-- content tables: read for authenticated, write for admin
CREATE POLICY "read_departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_departments" ON public.departments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_professions" ON public.professions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_professions" ON public.professions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_modules" ON public.course_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_modules" ON public.course_modules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_matcat" ON public.material_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_matcat" ON public.material_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_videos" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_videos" ON public.videos FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_products" ON public.products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_history" ON public.company_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_history" ON public.company_history FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_management" ON public.management FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_management" ON public.management FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_site_content" ON public.site_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_site_content" ON public.site_content FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read_achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_achievements" ON public.achievements FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- practical tasks: items with answers only for admins; tasks readable
CREATE POLICY "read_practical_tasks" ON public.practical_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_practical_tasks" ON public.practical_tasks FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_practical_items" ON public.practical_task_items FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- questions & answers: staff only (employees go through server functions)
CREATE POLICY "staff_questions" ON public.questions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "staff_answer_options" ON public.answer_options FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- test settings: staff read, admin write. prompts: admin only
CREATE POLICY "staff_test_settings" ON public.test_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin_test_settings" ON public.test_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_prompts" ON public.prompt_versions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- profiles
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), id));
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admin_profiles_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "read_own_roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admin_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- assignments / progress / attempts
CREATE POLICY "own_assignments" ON public.assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "staff_assignments_write" ON public.assignments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "own_progress" ON public.learning_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "own_progress_write" ON public.learning_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_progress_update" ON public.learning_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_progress" ON public.learning_progress FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own_attempts" ON public.test_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "admin_attempts" ON public.test_attempts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own_answers" ON public.test_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id
    AND (a.user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), a.user_id))));

CREATE POLICY "own_practical_results" ON public.practical_results FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));

CREATE POLICY "own_emp_achievements" ON public.employee_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "admin_emp_achievements" ON public.employee_achievements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER t1 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t2 BEFORE UPDATE ON public.professions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t3 BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t4 BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t5 BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t6 BEFORE UPDATE ON public.learning_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
