export type AppRole = "employee" | "manager" | "hr" | "admin" | "teacher";

export const ROLE_LABEL: Record<AppRole, string> = {
  employee: "Сотрудник",
  manager: "Руководитель",
  teacher: "Преподаватель",
  hr: "HR",
  admin: "Администратор",
};

/** Приоритет отображения «основной» роли в таблицах. */
export const ROLE_PRIORITY: AppRole[] = ["admin", "hr", "teacher", "manager", "employee"];

export function primaryRole(roles: AppRole[]): AppRole {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "employee";
}

/**
 * Матрица делегирования: какие роли может назначать/снимать каждый исполнитель.
 * Объединяется по всем ролям, которые есть у исполнителя.
 */
export const ASSIGNABLE_ROLES: Record<AppRole, AppRole[]> = {
  admin: ["employee", "manager", "hr", "admin", "teacher"],
  hr: ["employee", "manager", "teacher"],
  teacher: [],
  manager: ["employee"],
  employee: [],
};

/** Все роли, которые может назначить пользователь с заданным набором ролей. */
export function getAssignableRoles(actorRoles: AppRole[]): AppRole[] {
  const set = new Set<AppRole>();
  for (const role of actorRoles) {
    for (const target of ASSIGNABLE_ROLES[role]) {
      set.add(target);
    }
  }
  return Array.from(set);
}

export function canAssignRole(actorRoles: AppRole[], targetRole: AppRole): boolean {
  return getAssignableRoles(actorRoles).includes(targetRole);
}
