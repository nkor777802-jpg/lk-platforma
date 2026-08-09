# План: изменение email сотрудника в админ-панели

## Цель
Дать администраторам (admin / hr) возможность менять email сотрудника из админ-панели `/admin/users`, а также исправить ошибку дублирования ролей, которая сейчас падает в runtime.

## Что будет сделано

### 1. UI: форма редактирования пользователя
- Добавить поле «Email» в диалог редактирования пользователя (`src/routes/_authenticated/admin/users.tsx`).
- Подставлять текущий email пользователя при открытии диалога.
- Сделать поле необязательным: если оставить пустым — email не меняется.

### 2. Серверная функция `updateAdminUser`
- Расширить входной схему Zod полем `email` (опционально, валидный email).
- Проверить, что вызывающий пользователь имеет роль `admin` или `hr`.
- При изменении email:
  - Проверить уникальность нового адреса в `auth.users` через `supabaseAdmin.auth.admin.listUsers` или запрос к `auth.users`.
  - Вызвать `supabaseAdmin.auth.admin.updateUserById(userId, { email, email_confirm: true })`.
  - Обновить поле `email` в таблице `profiles` для консистентности.
- Записать действие в `audit_log`.

### 3. Исправление дублирования ролей
- В `createAdminUser` и `setUserRoles` заменить «сначала удалить, потом вставить» на `upsert` с `onConflict: 'user_id,role'` или фильтровать дубли перед вставкой.
- Гарантировать, что роль `employee` не вставляется дважды (триггер `handle_new_user` уже добавляет `employee`, поэтому при создании пользователя не нужно повторно вставлять `employee` в `user_roles`).

### 4. Безопасность и аудит
- Изменение email доступно только `admin` и `hr` (manager — нет).
- Все изменения email логируются в `audit_log` с детализацией старого и нового адреса.

## Технические детали
- Файлы для изменения:
  - `src/routes/_authenticated/admin/users.tsx` — UI.
  - `src/lib/admin.functions.ts` — серверные функции `createAdminUser`, `updateAdminUser`, `setUserRoles`.
- Используем `supabaseAdmin.auth.admin.updateUserById` для смены email в Supabase Auth.
- Подтверждение письма не отправляем (`email_confirm: true`), так как аккаунты заводятся администратором.

## Проверка после реализации
- Создать пользователя, затем отредактировать его email — убедиться, что email обновился в Auth и в профиле.
- Проверить, что попытка назначить уже существующую роль не вызывает ошибку `duplicate key value violates unique constraint "user_roles_user_id_role_key"`.
