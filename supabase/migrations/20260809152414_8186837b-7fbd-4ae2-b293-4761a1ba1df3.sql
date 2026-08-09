GRANT SELECT ON public.management TO anon;
CREATE POLICY "public_read_active_management" ON public.management FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "management_photos_public_read" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'management');