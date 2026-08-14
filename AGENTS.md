<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## О проекте

Платформа обучения и аттестации работников АО «Людиновокабель»: публичный сайт,
личный кабинет работника, админ-панель и модуль организационной структуры.
Весь интерфейс — на русском языке.

## Фирменный стиль

- Палитра: оранжевый `#E3661D` (основной), синий `#112866` (дополнительный),
  бирюзовый `#399EAD` (акцент). Шрифт — Golos Text.
- Цвета только через семантические токены в `src/styles.css`. Хардкод hex,
  `text-white`, `bg-black` и подобных утилит в компонентах запрещён.
- Не изобретать новую стилистику и не изменять логотип. Справочник — `src/lib/brand.ts`.

## Организационная структура

- Единственный источник истины — импортированная штатная расстановка.
  Подразделения, названия и должности не выдумывать.
- Схемы: `src/components/org` (`OrgPoster`, `OrgBranch`, `OrgGraph`, `OrgChart`).
- Экспорт и печать схемы доступны только ролям `admin` и `hr`.

## Архитектура кода

- Роутинг файловый (TanStack Start), страницы — в `src/routes`.
  `src/routeTree.gen.ts` не редактировать.
- `*.functions.ts` — серверные функции, которые можно импортировать из клиента;
  `*.server.ts` — только серверная логика.
- Данные загружаются через `*-queries.ts` + loader (`ensureQueryData`) и
  `useSuspenseQuery`, а не через `useEffect`-фетчинг.
- Автогенерируемые файлы интеграции с бэкендом (`src/integrations/**`) и `.env`
  не редактировать.

## База данных

- Любые изменения схемы — только миграциями.
- Для каждой новой таблицы в `public`: GRANT нужным ролям, включённый RLS и
  явные политики. Роли хранятся в `user_roles`, проверка — через `has_role`.
