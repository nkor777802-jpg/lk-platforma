
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.manages_user(uuid, uuid) FROM anon;

CREATE POLICY "read_lms_files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('materials','media','videos'));
CREATE POLICY "admin_write_lms_files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('materials','media','videos') AND public.is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('materials','media','videos') AND public.is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('materials','media','videos') AND public.is_admin(auth.uid()));

INSERT INTO public.test_settings (is_default, total_questions, common_questions, professional_questions, pass_percent, time_limit_minutes, allow_retry, max_attempts)
VALUES (true, 20, 5, 15, 80, 30, true, 3);

INSERT INTO public.prompt_versions (name, content, version, is_active) VALUES (
 'Правила тестирования',
 'Сформируй итоговый тест по профессии сотрудника.
1. Всего вопросов: согласно структурированным настройкам теста.
2. Часть вопросов берётся из общих тем (охрана труда, качество, безопасность), остальные — профессиональные.
3. У каждого вопроса ровно четыре варианта ответа, один правильный.
4. Правильный ответ никогда не передаётся в клиентскую часть до завершения попытки.
5. Оценка: процент правильных ответов; проходной балл берётся из настроек.
6. Практическое задание оценивается отдельно и включается в итоговый протокол.
7. Итоговое заключение: «Аттестован» при достижении проходного балла и успешном практическом задании, иначе «Не аттестован».',
 1, true);

INSERT INTO public.achievements (code, title, description, icon, condition_type, condition_value, sort_order) VALUES
 ('first_step','Первый шаг','Начато первое обучение','Footprints','first_progress',NULL,1),
 ('profession_studied','Профессия изучена','Все материалы профессии изучены','GraduationCap','course_complete',NULL,2),
 ('flawless','Без ошибок','Тест пройден без единой ошибки','Target','perfect_test',NULL,3),
 ('tech_expert','Знаток технологии','Пройдено тестирование по технологии производства','Cog','test_pass',1,4),
 ('profession_expert','Эксперт профессии','Успешная аттестация по профессии','Award','test_pass',1,5),
 ('production_master','Мастер производства','Успешная аттестация по трём профессиям','ShieldCheck','test_pass',3,6);

INSERT INTO public.material_categories (name, slug, sort_order) VALUES
 ('Охрана труда','ohrana-truda',1),
 ('Качество','kachestvo',2),
 ('Технология производства','tehnologiya',3),
 ('Оборудование','oborudovanie',4),
 ('Материалы','materialy',5),
 ('Безопасность','bezopasnost',6),
 ('Производственная культура','kultura',7);
