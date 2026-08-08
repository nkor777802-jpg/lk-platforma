-- Политики доступа к бакету management для фото руководства
CREATE POLICY "management_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'management');

CREATE POLICY "management_write_staff" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'management' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'management' AND public.is_staff(auth.uid()));

-- Триггер обновления updated_at для таблицы management
CREATE TRIGGER management_updated_at
  BEFORE UPDATE ON public.management
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();