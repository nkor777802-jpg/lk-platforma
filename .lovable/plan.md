# Диагностика: пустой экран на /gamification/cabletris

## Фактическая цепочка рендера (проверено в браузере)

1. `__root` → `AuthProvider` → `Outlet` — отрабатывает.
2. `src/routes/_authenticated/route.tsx` — `beforeLoad` **срабатывает**.
3. Сессия существует: `supabase.auth.getUser()` возвращает `admin@lk.com`, редиректа на `/auth` нет.
4. Дальше выполняется `getMyConsentStatus()` и на строках 22-24 бросается
   `throw redirect({ to: "/legal-consent" })`.
5. **До компонента страницы `CabletrisPage` выполнение не доходит**, `CabletrisGame`
   и `CabletrisBoard` не монтируются вообще.
6. Новых runtime-ошибок и rejected promise нет: в headless-браузере с вашей сессией
   `/gamification/cabletris`, `/gamification`, `/dashboard` — все три уходят на `/legal-consent`
   и отрисовывают экран согласия (693 символа текста). Без сессии — уходят на `/auth`.
7. Пустоту даёт сам layout, а не игра:
   - `src/routes/_authenticated/route.tsx:9` — `pendingComponent: () => null`;
   - `src/routes/_authenticated/route.tsx:37` — `if (!mounted) return null`.
   Пока асинхронный `beforeLoad` (два сетевых вызова: `auth.getUser()` + серверная функция
   `getMyConsentStatus`) не завершится и пока не отработает `useEffect`, экран пустой.

## Общесистемность

Причина общесистемная, не связана с игрой: **все** authenticated-маршруты сейчас ведут
на `/legal-consent`. В таблице `legal_consents` **0 записей** для всех 7 пользователей,
при этом обязательных документов `kind = 'site'` — три, поэтому
`getMyConsentStatus()` всегда возвращает `required: true, accepted: false`.

Сейчас ваш предпросмотр открыт именно на `/legal-consent` и отрисован корректно.

## Точный вывод

- Последний успешно выполняемый маршрут: `_authenticated` (`beforeLoad`), затем экран
  `/legal-consent`.
- Первый компонент, который не выполняется: `CabletrisPage`
  (`src/routes/_authenticated/gamification.cabletris.tsx:25`).
- Файл и строка причины: `src/routes/_authenticated/route.tsx:22-24`.
- Причина пустого экрана: гейт согласия на обработку ПД + `null` вместо индикатора загрузки
  на время `beforeLoad` (строки 9 и 37 того же файла).
- Минимальное исправление: нажать «Подтвердить» на `/legal-consent` — после записи согласия
  маршрут игры откроется. Чтобы убрать сам пустой кадр, заменить `pendingComponent: () => null`
  и `return null` на видимый скелет/спиннер.

Правки не вносил.
