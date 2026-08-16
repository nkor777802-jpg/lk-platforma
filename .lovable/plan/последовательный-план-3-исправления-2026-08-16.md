# Последовательный план: 3 исправления

## 0. Про `rows` в CabletrisBoard

Правка уже не требуется: в `src/components/gamification/cabletris/CabletrisBoard.tsx:25`
объявлено `const rows = grid.length`, в `:84` оно корректно используется, `tsgo --noEmit`
проходит без ошибок. Отдельно для консистентности в `:83` вместо `grid.length` тоже
подставим `rows`.

## Шаг 1. Ошибка «Missing Supabase environment variable(s)»

В `.env` обе переменные (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) заданы, поэтому
локально всё работает. Ошибку бросает `src/integrations/supabase/auth-middleware.ts:39-45`
в окружении статического предпросмотра, где серверные переменные при пререндере
недоступны, а защищённая серверная функция всё равно вызывается.

Что сделаем:
- Найдём точку вызова, которая срабатывает во время пререндера (в первую очередь
  `getMyConsentStatus()` из `beforeLoad` в `src/routes/_authenticated/route.tsx:18`).
- Уберём выполнение защищённых серверных функций на этапе пререндера: проверка согласия
  выполняется только в браузере (`typeof window !== "undefined"`), а не при сборке.
- Проверим сборку и предпросмотр.

## Шаг 2. Пустой экран при заходе в кабинет

Файл `src/routes/_authenticated/route.tsx`:
- строка 9 — `pendingComponent: () => null`;
- строка 37 — `if (!mounted) return null`.

Пока идут `auth.getUser()` и `getMyConsentStatus()`, экран полностью пустой.

Что сделаем:
- Вместо `null` покажем лёгкий скелет в оболочке приложения (существующие компоненты
  `InlineLoading` / `AppShell`), чтобы не было «белого» кадра.
- Поведение гейта согласия и редиректов не меняем.

## Шаг 3. Побочный эффект в игровом хуке

`src/hooks/useCabletris.ts:161-168`: `drop()` вызывает `afterLock()` внутри updater-функции
`setState`, а тот через `pushFx` (:54) вызывает `setFx` и `emitCabletrisEvent` — то есть
изменение состояния и события во время рендера (React пишет предупреждение
«Can't perform a React state update…»).

Что сделаем:
- Посчитаем следующее состояние вне updater'а (как уже сделано в игровом цикле, :144):
  прочитаем `stateRef.current`, вызовем `softDrop`, затем `setState(...)` и после него —
  `pushFx` / `emitCabletrisEvent`.
- Логику игры и правила подсчёта очков не трогаем.

## Проверка

После каждого шага: `tsgo --noEmit` + прогон страницы `/gamification/cabletris`
в headless-браузере с реальной сессией (после подтверждения согласия) и проверка консоли
на ошибки и предупреждения.
