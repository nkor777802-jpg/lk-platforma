ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id);
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS version text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS actualized_at date;
CREATE INDEX IF NOT EXISTS materials_lesson_idx ON public.materials(lesson_id);
CREATE INDEX IF NOT EXISTS materials_course_idx ON public.materials(course_id);