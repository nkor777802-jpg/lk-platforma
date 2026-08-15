# Диагностика ошибки «Uncaught undefined» на /gamification/cabletris

## Что проверено (без изменений кода)

- Маршрут `/gamification/cabletris` зарегистрирован корректно; типы проекта проходят `tsgo --noEmit` без ошибок.
- Данные `data_products.json` и `game_config.json` загружаются в браузере штатно (3 товара, валидный конфиг), картинки `/cabletris/products/*.png` существуют.
- Движок отработал 400 тиков (`tickFall` / `spawnFalling` / `resolveBoard`) без исключений.
- `CabletrisBoard`, `ProductCard`, `CategoryTile`, `CabletrisHud`, `CabletrisResults` не читают `grid`/state без защиты; ошибки `rows is not defined` больше нет.

## Первопричина

Ошибка **не в коде игры**. В журнале ошибок предпросмотра «Uncaught undefined» идёт сразу за
`Hydration failed because the server rendered HTML didn't match the client` на уровне `__root__`
(`<OutletImpl>` → `<Suspense fallback={null}>`).

- Файл: `src/routes/_authenticated/route.tsx`
- Строки: 7 (`ssr: false`) и 17 (`throw redirect({ to: "/legal-consent" })`)
- Выражение, дающее `undefined`: отклонённый промис `beforeLoad`, значение которого — объект
  redirect'а TanStack Router. Он выбрасывается во время гидратации ветки, отрисованной на сервере
  как пустой `Suspense`-fallback (`ssr: false`), поэтому браузер печатает `Uncaught undefined`
  (без стека — выброшен не `Error`).
- Почему срабатывает именно сейчас: в таблице `legal_consents` нет ни одной записи, поэтому
  `getMyConsentStatus()` возвращает `required && !accepted` для любого пользователя, и каждый вход
  на `/gamification/cabletris` уходит в редирект на `/legal-consent` ещё до отрисовки игры.

## Минимальное исправление

1. Вынести проверку согласия из `beforeLoad` в `loader` (или выполнять её только когда
   `router.state.isLoading`, т.е. не во время гидратации), чтобы редирект не выбрасывался
   во время hydration ветки с `ssr: false`.
2. Убрать `try/catch` вокруг проверки: сейчас редирект бросается внутри `try` и повторно
   пробрасывается через `isRedirect(e)`, что маскирует настоящие ошибки `getMyConsentStatus()`.

## Сопутствующий дефект в игре (найден, не связан с «Uncaught undefined»)

`src/hooks/useCabletris.ts:161-168` — `drop()` вызывает `afterLock()` внутри updater-функции
`setState`, а та через `pushFx` (:54) вызывает `setFx` и `emitCabletrisEvent`. Это побочный эффект
во время рендера (React пишет предупреждение «Can't perform a React state update on a component
that hasn't mounted yet»). Минимальная правка — считать новое состояние вне updater'а и вызывать
`pushFx` / события после `setState`, как это уже сделано в игровом цикле (:144).

## Дальше

Правки не применяю — жду подтверждения, какой из двух пунктов делать.
