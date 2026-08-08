
CREATE TABLE public.simulator_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  total_steps integer NOT NULL DEFAULT 0,
  current_step integer NOT NULL DEFAULT 1,
  correct_steps integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  duration_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.simulator_runs TO authenticated;
GRANT ALL ON public.simulator_runs TO service_role;
ALTER TABLE public.simulator_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulator_runs_own" ON public.simulator_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "simulator_runs_insert_own" ON public.simulator_runs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "simulator_runs_update_own" ON public.simulator_runs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER simulator_runs_updated_at BEFORE UPDATE ON public.simulator_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.simulator_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.simulator_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  process text NOT NULL,
  selected_work_center text,
  expected_work_centers text[] NOT NULL DEFAULT '{}',
  is_correct boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 1,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.simulator_steps TO authenticated;
GRANT ALL ON public.simulator_steps TO service_role;
ALTER TABLE public.simulator_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulator_steps_own" ON public.simulator_steps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.manages_user(auth.uid(), user_id));
CREATE POLICY "simulator_steps_insert_own" ON public.simulator_steps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==== Демо-данные производственного паспорта ====
INSERT INTO public.product_categories (code, name, description) VALUES
  ('SIL', 'Силовые кабели', 'Кабели для передачи и распределения электроэнергии'),
  ('KTR', 'Контрольные кабели', 'Кабели для цепей контроля и управления'),
  ('BRN', 'Бронированные кабели', 'Кабели с металлической броней для прокладки в земле')
ON CONFLICT DO NOTHING;

INSERT INTO public.production_products (code, category, brand, name, description, default_area) VALUES
  ('AVVG-4X16', 'SIL', 'АВВГ', 'АВВГ 4х16', 'Силовой кабель с алюминиевыми жилами в ПВХ изоляции и оболочке', 'Цех №1'),
  ('KVVG-7X15', 'KTR', 'КВВГ', 'КВВГ 7х1,5', 'Контрольный кабель с медными жилами в ПВХ изоляции', 'Цех №2'),
  ('APVBBSHP-3X70', 'BRN', 'АПвБбШп', 'АПвБбШп 3х70', 'Бронированный кабель со сшитой изоляцией и ПЭ оболочкой', 'Цех №3')
ON CONFLICT DO NOTHING;

INSERT INTO public.work_centers (code, name, process, equipment_type, area, site, description) VALUES
  ('WD-01', 'Волочильный стан ВС-1', 'Волочение', 'Волочильный стан', 'Цех №1', 'Людиново', 'Грубое и среднее волочение проволоки'),
  ('WD-02', 'Волочильный стан ВС-2', 'Волочение', 'Волочильный стан', 'Цех №3', 'Людиново', 'Волочение алюминиевой катанки'),
  ('TW-01', 'Крутильная машина КМ-1', 'Скрутка', 'Крутильная машина', 'Цех №1', 'Людиново', 'Скрутка токопроводящих жил'),
  ('TW-02', 'Крутильная машина КМ-2', 'Скрутка', 'Крутильная машина', 'Цех №2', 'Людиново', 'Скрутка изолированных жил в кабель'),
  ('IN-01', 'Экструзионная линия ЭЛ-1', 'Изолирование', 'Экструдер', 'Цех №1', 'Людиново', 'Наложение ПВХ изоляции'),
  ('IN-02', 'Линия сшивки ЛС-1', 'Изолирование', 'Линия непрерывной вулканизации', 'Цех №3', 'Людиново', 'Наложение сшитой полиэтиленовой изоляции'),
  ('AR-01', 'Бронировочная машина БМ-1', 'Бронирование', 'Бронировочная машина', 'Цех №3', 'Людиново', 'Наложение стальной ленточной брони'),
  ('EX-01', 'Экструзионная линия ЭЛ-2', 'Экструзия', 'Экструдер', 'Цех №2', 'Людиново', 'Наложение защитной оболочки'),
  ('EX-02', 'Экструзионная линия ЭЛ-3', 'Экструзия', 'Экструдер', 'Цех №3', 'Людиново', 'Наложение полиэтиленовой оболочки'),
  ('QC-01', 'Испытательная лаборатория ИЛ-1', 'Испытания', 'Испытательный стенд', 'Лаборатория', 'Людиново', 'Электрические и механические испытания'),
  ('PK-01', 'Участок упаковки УП-1', 'Упаковка', 'Намоточный станок', 'Склад', 'Людиново', 'Намотка на барабан и маркировка')
ON CONFLICT DO NOTHING;

INSERT INTO public.production_materials (code, name, category, description) VALUES
  ('M-AL', 'Алюминиевая катанка', 'Проводник', 'Катанка для волочения алюминиевой проволоки'),
  ('M-CU', 'Медная катанка', 'Проводник', 'Катанка для волочения медной проволоки'),
  ('M-PVC', 'ПВХ пластикат', 'Полимер', 'Пластикат для изоляции и оболочки'),
  ('M-XLPE', 'Сшитый полиэтилен', 'Полимер', 'Материал изоляции повышенной нагревостойкости'),
  ('M-PE', 'Полиэтилен', 'Полимер', 'Материал защитной оболочки'),
  ('M-STL', 'Стальная лента', 'Броня', 'Лента для наложения брони')
ON CONFLICT DO NOTHING;

INSERT INTO public.production_routes (product_code, step_number, process, work_center_code, is_allowed, is_required_step, trainer_comment) VALUES
  ('AVVG-4X16', 1, 'Волочение', 'WD-02', true, true, 'Алюминиевая катанка протягивается до нужного диаметра'),
  ('AVVG-4X16', 1, 'Волочение', 'WD-01', true, true, 'Допустимый резервный стан'),
  ('AVVG-4X16', 2, 'Скрутка', 'TW-01', true, true, 'Скрутка проволок в токопроводящую жилу'),
  ('AVVG-4X16', 3, 'Изолирование', 'IN-01', true, true, 'Наложение ПВХ изоляции на жилы'),
  ('AVVG-4X16', 4, 'Скрутка', 'TW-02', true, true, 'Скрутка изолированных жил в сердечник'),
  ('AVVG-4X16', 5, 'Экструзия', 'EX-01', true, true, 'Наложение ПВХ оболочки'),
  ('AVVG-4X16', 6, 'Испытания', 'QC-01', true, true, 'Проверка электрической прочности'),
  ('AVVG-4X16', 7, 'Упаковка', 'PK-01', true, true, 'Намотка на барабан'),
  ('KVVG-7X15', 1, 'Волочение', 'WD-01', true, true, 'Волочение медной проволоки'),
  ('KVVG-7X15', 2, 'Изолирование', 'IN-01', true, true, 'Наложение ПВХ изоляции'),
  ('KVVG-7X15', 3, 'Скрутка', 'TW-02', true, true, 'Скрутка семи изолированных жил'),
  ('KVVG-7X15', 4, 'Экструзия', 'EX-01', true, true, 'Наложение оболочки'),
  ('KVVG-7X15', 5, 'Испытания', 'QC-01', true, true, 'Испытание изоляции'),
  ('KVVG-7X15', 6, 'Упаковка', 'PK-01', true, true, 'Упаковка готового кабеля'),
  ('APVBBSHP-3X70', 1, 'Волочение', 'WD-02', true, true, 'Волочение алюминиевой проволоки'),
  ('APVBBSHP-3X70', 2, 'Скрутка', 'TW-01', true, true, 'Скрутка секторных жил'),
  ('APVBBSHP-3X70', 3, 'Изолирование', 'IN-02', true, true, 'Наложение сшитой изоляции'),
  ('APVBBSHP-3X70', 4, 'Скрутка', 'TW-02', true, true, 'Скрутка изолированных жил'),
  ('APVBBSHP-3X70', 5, 'Бронирование', 'AR-01', true, true, 'Наложение стальной ленточной брони'),
  ('APVBBSHP-3X70', 6, 'Экструзия', 'EX-02', true, true, 'Наложение полиэтиленовой оболочки'),
  ('APVBBSHP-3X70', 7, 'Испытания', 'QC-01', true, true, 'Испытание брони и изоляции'),
  ('APVBBSHP-3X70', 8, 'Упаковка', 'PK-01', true, true, 'Намотка и маркировка')
ON CONFLICT DO NOTHING;

INSERT INTO public.cable_constructions (product_code, layer_number, element_code, element_name, process, material_code, visual_type, layer_description) VALUES
  ('AVVG-4X16', 1, 'CORE', 'Токопроводящая жила', 'Волочение', 'M-AL', 'conductor', 'Алюминиевая многопроволочная жила сечением 16 мм²'),
  ('AVVG-4X16', 2, 'STRAND', 'Скрученная жила', 'Скрутка', 'M-AL', 'stranded', 'Проволоки скручены в круглую жилу'),
  ('AVVG-4X16', 3, 'INSUL', 'Изоляция', 'Изолирование', 'M-PVC', 'insulation', 'ПВХ изоляция каждой жилы'),
  ('AVVG-4X16', 4, 'CORE4', 'Сердечник из 4 жил', 'Скрутка', 'M-PVC', 'stranded', 'Четыре изолированные жилы скручены в сердечник'),
  ('AVVG-4X16', 5, 'SHEATH', 'Оболочка', 'Экструзия', 'M-PVC', 'sheath', 'Наружная ПВХ оболочка'),
  ('KVVG-7X15', 1, 'CORE', 'Токопроводящая жила', 'Волочение', 'M-CU', 'conductor', 'Медная жила 1,5 мм²'),
  ('KVVG-7X15', 2, 'INSUL', 'Изоляция', 'Изолирование', 'M-PVC', 'insulation', 'ПВХ изоляция жилы'),
  ('KVVG-7X15', 3, 'CORE7', 'Сердечник из 7 жил', 'Скрутка', 'M-PVC', 'stranded', 'Семь изолированных жил скручены в сердечник'),
  ('KVVG-7X15', 4, 'SHEATH', 'Оболочка', 'Экструзия', 'M-PVC', 'sheath', 'Наружная ПВХ оболочка'),
  ('APVBBSHP-3X70', 1, 'CORE', 'Токопроводящая жила', 'Волочение', 'M-AL', 'conductor', 'Алюминиевая жила 70 мм²'),
  ('APVBBSHP-3X70', 2, 'STRAND', 'Скрученная жила', 'Скрутка', 'M-AL', 'stranded', 'Уплотнённая скрученная жила'),
  ('APVBBSHP-3X70', 3, 'INSUL', 'Изоляция из СПЭ', 'Изолирование', 'M-XLPE', 'insulation', 'Изоляция из сшитого полиэтилена'),
  ('APVBBSHP-3X70', 4, 'CORE3', 'Сердечник из 3 жил', 'Скрутка', 'M-XLPE', 'stranded', 'Три изолированные жилы скручены в сердечник'),
  ('APVBBSHP-3X70', 5, 'ARMOUR', 'Броня', 'Бронирование', 'M-STL', 'armour', 'Броня из двух стальных лент'),
  ('APVBBSHP-3X70', 6, 'SHEATH', 'Оболочка', 'Экструзия', 'M-PE', 'sheath', 'Наружная полиэтиленовая оболочка')
ON CONFLICT DO NOTHING;

INSERT INTO public.defects (code, process, name, product_category, description, possible_cause, corrective_action) VALUES
  ('D-01', 'Волочение', 'Обрыв проволоки', 'SIL', 'Разрыв проволоки в процессе волочения', 'Превышение вытяжки, износ волоки, дефект катанки', 'Заменить волоку, снизить вытяжку, проверить качество катанки'),
  ('D-02', 'Волочение', 'Риски на поверхности проволоки', 'SIL', 'Продольные царапины на проволоке', 'Загрязнение или износ волоки', 'Очистить и заменить волоку, проверить смазку'),
  ('D-03', 'Скрутка', 'Нарушение шага скрутки', 'KTR', 'Неравномерный шаг скрутки жил', 'Сбой настройки крутильной машины', 'Отрегулировать шаг скрутки и натяжение'),
  ('D-04', 'Изолирование', 'Разнотолщинность изоляции', 'SIL', 'Толщина изоляции неравномерна по окружности', 'Смещение дорна и матрицы экструдера', 'Отцентрировать инструмент, проверить температурный режим'),
  ('D-05', 'Изолирование', 'Пузыри в изоляции', 'SIL', 'Газовые включения в слое изоляции', 'Влажность материала, перегрев расплава', 'Просушить материал, скорректировать температуру'),
  ('D-06', 'Бронирование', 'Задиры и смещение брони', 'BRN', 'Ленты брони наложены с зазором или заходят друг на друга', 'Неправильное натяжение лент', 'Настроить натяжение и перекрытие лент'),
  ('D-07', 'Экструзия', 'Наплывы на оболочке', 'SIL', 'Локальные утолщения наружной оболочки', 'Нестабильная скорость линии', 'Стабилизировать скорость и температуру экструзии'),
  ('D-08', 'Испытания', 'Пробой изоляции', 'BRN', 'Пробой при испытании повышенным напряжением', 'Дефект изоляции, включения, повреждение при скрутке', 'Вырезать дефектный участок, проверить предыдущие операции')
ON CONFLICT DO NOTHING;

-- Участки виртуального завода по реальным процессам
DELETE FROM public.employee_factory_zones;
DELETE FROM public.factory_zones;
INSERT INTO public.factory_zones (code, name, description, icon, unlock_condition, unlock_value, sort_order) VALUES
  ('Волочение', 'Участок волочения', 'Волочильные станы: получение проволоки нужного диаметра', 'Cable', 'process_ops', 1, 1),
  ('Скрутка', 'Участок скрутки', 'Крутильные машины: скрутка жил и сердечника', 'Repeat', 'process_ops', 1, 2),
  ('Изолирование', 'Участок изолирования', 'Наложение изоляции на токопроводящие жилы', 'Layers', 'process_ops', 1, 3),
  ('Бронирование', 'Участок бронирования', 'Наложение металлической брони', 'Shield', 'process_ops', 1, 4),
  ('Экструзия', 'Участок экструзии', 'Наложение защитной оболочки кабеля', 'CircleDot', 'process_ops', 1, 5),
  ('Испытания', 'Испытательная лаборатория', 'Электрические и механические испытания', 'FlaskConical', 'process_ops', 1, 6),
  ('Упаковка', 'Участок упаковки', 'Намотка на барабан, маркировка и отгрузка', 'Package', 'process_ops', 1, 7);
