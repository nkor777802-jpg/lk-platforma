CREATE OR REPLACE FUNCTION public.guard_profile_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Кадровые сотрудники и администраторы меняют профиль без ограничений.
  IF public.is_staff(auth.uid()) OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Работник может править только контактные данные и аватар.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.full_name IS DISTINCT FROM OLD.full_name
     OR NEW.personnel_number IS DISTINCT FROM OLD.personnel_number
     OR NEW.department_id IS DISTINCT FROM OLD.department_id
     OR NEW."position" IS DISTINCT FROM OLD."position"
     OR NEW.position_id IS DISTINCT FROM OLD.position_id
     OR NEW.profession_id IS DISTINCT FROM OLD.profession_id
     OR NEW.grade IS DISTINCT FROM OLD.grade
     OR NEW.manager_id IS DISTINCT FROM OLD.manager_id
     OR NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status
     OR NEW.code IS DISTINCT FROM OLD.code
     OR NEW.hire_date IS DISTINCT FROM OLD.hire_date
  THEN
    RAISE EXCEPTION 'Изменение кадровых данных профиля доступно только отделу персонала';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_self_update ON public.profiles;
CREATE TRIGGER guard_profile_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_self_update();

REVOKE EXECUTE ON FUNCTION public.guard_profile_self_update() FROM anon, authenticated;