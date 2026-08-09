INSERT INTO public.site_content (key, title, data)
VALUES (
  'contacts',
  'Контактные данные',
  jsonb_build_object(
    'legalName', 'АО «Людиновокабель»',
    'shortName', 'Людиновокабель',
    'address', '249402, Калужская область, Людиновский район, г. Людиново, пр-т Машиностроителей, д. 1',
    'phone', '8 (800) 222-10-13',
    'internalPhones', '323, 321',
    'email', 'study@ludinovokabel.ru',
    'unit', 'Отдел персонала',
    'workHours', 'Пн–Пт, 08:00–17:00 (МСК)'
  )
)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, title = EXCLUDED.title;

GRANT SELECT ON public.site_content TO anon;

CREATE POLICY "read_site_contacts_public" ON public.site_content
FOR SELECT TO anon USING (key = 'contacts');