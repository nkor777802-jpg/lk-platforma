-- Работник больше не обновляет строку profiles напрямую: только кадры и админы.
DROP POLICY IF EXISTS own_profile_update ON public.profiles;
CREATE POLICY staff_profile_update ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Контактные данные работник меняет через контролируемую функцию.
CREATE OR REPLACE FUNCTION public.update_own_contacts(
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Требуется авторизация';
  END IF;

  UPDATE public.profiles
     SET phone      = COALESCE(p_phone, phone),
         email      = COALESCE(p_email, email),
         avatar_url = COALESCE(p_avatar_url, avatar_url),
         updated_at = now()
   WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_own_contacts(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_contacts(text, text, text) TO authenticated;