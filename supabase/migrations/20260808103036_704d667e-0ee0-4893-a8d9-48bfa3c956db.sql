-- Публичный доступ к активным профессиям (только чтение)
GRANT SELECT ON public.professions TO anon;
CREATE POLICY read_professions_public ON public.professions
  FOR SELECT TO anon USING (is_active = true);

CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  unit text,
  email text,
  phone text,
  message text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_requests_consent_required CHECK (consent = true),
  CONSTRAINT contact_requests_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

GRANT INSERT ON public.contact_requests TO anon;
GRANT INSERT, SELECT, UPDATE ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_requests_insert_anon ON public.contact_requests
  FOR INSERT TO anon WITH CHECK (consent = true);
CREATE POLICY contact_requests_insert_auth ON public.contact_requests
  FOR INSERT TO authenticated WITH CHECK (consent = true);
CREATE POLICY contact_requests_read_staff ON public.contact_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY contact_requests_update_staff ON public.contact_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER contact_requests_updated_at BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();