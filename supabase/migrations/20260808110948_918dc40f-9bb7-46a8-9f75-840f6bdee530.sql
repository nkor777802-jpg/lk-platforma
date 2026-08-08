ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS reference_answer text,
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('single','multi','situational','open'));

ALTER TABLE public.test_settings
  ADD COLUMN IF NOT EXISTS retry_interval_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_rule text NOT NULL DEFAULT 'best',
  ADD COLUMN IF NOT EXISTS warn_before_minutes integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'exam';

ALTER TABLE public.test_settings DROP CONSTRAINT IF EXISTS test_settings_result_rule_check;
ALTER TABLE public.test_settings ADD CONSTRAINT test_settings_result_rule_check
  CHECK (result_rule IN ('best','last'));
ALTER TABLE public.test_settings DROP CONSTRAINT IF EXISTS test_settings_mode_check;
ALTER TABLE public.test_settings ADD CONSTRAINT test_settings_mode_check
  CHECK (mode IN ('learning','exam'));

ALTER TABLE public.test_answers
  ADD COLUMN IF NOT EXISTS selected_option_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS text_answer text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS review_score integer,
  ADD COLUMN IF NOT EXISTS review_comment text,
  ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1;

ALTER TABLE public.test_answers DROP CONSTRAINT IF EXISTS test_answers_review_status_check;
ALTER TABLE public.test_answers ADD CONSTRAINT test_answers_review_status_check
  CHECK (review_status IN ('auto','pending','graded'));

DELETE FROM public.test_answers a
  USING public.test_answers b
  WHERE a.attempt_id = b.attempt_id
    AND a.question_id = b.question_id
    AND a.question_id IS NOT NULL
    AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS test_answers_attempt_question_uidx
  ON public.test_answers (attempt_id, question_id) WHERE question_id IS NOT NULL;

ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS grade_result text;

DROP POLICY IF EXISTS "Staff can view test answers" ON public.test_answers;
CREATE POLICY "Staff can view test answers" ON public.test_answers
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR public.has_role(auth.uid(), 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.test_attempts t
      WHERE t.id = test_answers.attempt_id
        AND public.manages_user(auth.uid(), t.user_id)
    )
  );