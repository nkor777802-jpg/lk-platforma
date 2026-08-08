CREATE TABLE public.factory_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  unlock_condition text NOT NULL DEFAULT 'manual',
  unlock_value integer NOT NULL DEFAULT 1,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.factory_zones TO authenticated;
GRANT ALL ON public.factory_zones TO service_role;
ALTER TABLE public.factory_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factory_zones_read" ON public.factory_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "factory_zones_staff_all" ON public.factory_zones FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER factory_zones_updated_at BEFORE UPDATE ON public.factory_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.employee_factory_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.factory_zones(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, zone_id)
);
GRANT SELECT ON public.employee_factory_zones TO authenticated;
GRANT ALL ON public.employee_factory_zones TO service_role;
ALTER TABLE public.employee_factory_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "efz_own_read" ON public.employee_factory_zones FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.profession_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.professions(id) ON DELETE CASCADE,
  level_code text,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, profession_id)
);
GRANT SELECT ON public.profession_collection TO authenticated;
GRANT ALL ON public.profession_collection TO service_role;
ALTER TABLE public.profession_collection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_own_read" ON public.profession_collection FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE INDEX idx_efz_user ON public.employee_factory_zones(user_id);
CREATE INDEX idx_pc_user ON public.profession_collection(user_id);