CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('site','signature')),
  sort_order int NOT NULL DEFAULT 0,
  storage_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  uploaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_documents_read_authenticated" ON public.legal_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "legal_documents_manage_staff" ON public.legal_documents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.legal_document_versions TO authenticated;
GRANT ALL ON public.legal_document_versions TO service_role;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_document_versions_read_staff" ON public.legal_document_versions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "legal_document_versions_insert_staff" ON public.legal_document_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

CREATE POLICY "legal_docs_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'legal-docs');
CREATE POLICY "legal_docs_write_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'legal-docs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')));
CREATE POLICY "legal_docs_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'legal-docs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')));
CREATE POLICY "legal_docs_delete_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'legal-docs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')));

INSERT INTO public.legal_documents (slug, title, kind, sort_order, storage_path, file_name, mime_type, uploaded_at) VALUES
  ('site-consent-processing','Согласие на обработку персональных данных','site',1,'site/consent-processing.pdf','01_Сайт_Согласие_на_обработку_ПД.pdf','application/pdf',now()),
  ('site-consent-distribution','Согласие на распространение персональных данных','site',2,'site/consent-distribution.pdf','02_Сайт_Согласие_на_распространение_ПД.pdf','application/pdf',now()),
  ('site-privacy-policy','Политика обработки персональных данных','site',3,'site/privacy-policy.pdf','03_Сайт_Политика_обработки_ПД.pdf','application/pdf',now()),
  ('sign-consent-processing','Согласие на обработку персональных данных (бланк для подписи)','signature',4,'signature/consent-processing.pdf','04_Подпись_Согласие_на_обработку_ПД.pdf','application/pdf',now()),
  ('sign-consent-distribution','Согласие на распространение персональных данных (бланк для подписи)','signature',5,'signature/consent-distribution.pdf','05_Подпись_Согласие_на_распространение_ПД.pdf','application/pdf',now()),
  ('sign-privacy-policy','Политика обработки персональных данных (бланк для подписи)','signature',6,'signature/privacy-policy.pdf','06_Подпись_Политика_обработки_ПД.pdf','application/pdf',now());