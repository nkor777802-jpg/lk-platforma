export interface OrgUnitData {
  key: string;
  parentKey: string | null;
  name: string;
  unitType: string | null;
  level: number;
  managerName: string | null;
  planned: number;
  actual: number;
  vacant: number;
  departmentId: string | null;
  positions: { name: string; category: string | null; planned: number; actual: number; vacant: number }[];
  people: {
    fullName: string | null;
    positionName: string;
    isVacancy: boolean;
    grade: string | null;
    profileId?: string | null;
  }[];
}

export interface OrgWorkCenterLink {
  departmentId: string | null;
  center: {
    id: string;
    code: string | null;
    name: string;
    site: string | null;
    area: string | null;
    process: string | null;
  } | null;
}

/** Должности руководителей, ИТР и служащих — не относятся к основным производственным рабочим. */
const NON_WORKER_TITLES = [
  "директор",
  "заместитель",
  "главный",
  "начальник",
  "мастер",
  "инженер",
  "ведущий",
  "специалист",
  "менеджер",
  "технолог",
  "конструктор",
  "переводчик",
  "экономист",
  "бухгалтер",
  "диспетчер",
  "кладовщик",
  "секретарь",
  "управляющий",
];

/** Основной производственный рабочий: должность не относится к руководителям/ИТР/служащим. */
export function isProductionWorker(positionName: string): boolean {
  const n = positionName.trim().toLowerCase();
  if (!n) return false;
  return !NON_WORKER_TITLES.some((t) => n.startsWith(t));
}

export interface OrgNode extends OrgUnitData {
  children: OrgNode[];
}

export type OrgMode =
  | "org"
  | "units"
  | "managers"
  | "positions"
  | "employees"
  | "staffing"
  | "production";

export const ORG_MODES: { value: OrgMode; label: string }[] = [
  { value: "org", label: "Оргструктура" },
  { value: "units", label: "Подразделения" },
  { value: "managers", label: "Руководители" },
  { value: "positions", label: "Должности" },
  { value: "employees", label: "Сотрудники" },
  { value: "staffing", label: "Штат / Факт / Вакансии" },
  { value: "production", label: "Производственная структура" },
];

export function buildTree(units: OrgUnitData[]): OrgNode[] {
  const nodes = new Map<string, OrgNode>();
  for (const u of units) nodes.set(u.key, { ...u, children: [] });
  const roots: OrgNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentKey ? nodes.get(node.parentKey) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function findNode(nodes: OrgNode[], key: string): OrgNode | null {
  for (const n of nodes) {
    if (n.key === key) return n;
    const found = findNode(n.children, key);
    if (found) return found;
  }
  return null;
}

export function pathTo(nodes: OrgNode[], key: string): OrgNode[] {
  for (const n of nodes) {
    if (n.key === key) return [n];
    const sub = pathTo(n.children, key);
    if (sub.length) return [n, ...sub];
  }
  return [];
}

export function matches(node: OrgNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (node.name.toLowerCase().includes(q)) return true;
  if ((node.managerName ?? "").toLowerCase().includes(q)) return true;
  if (node.positions.some((p) => p.name.toLowerCase().includes(q))) return true;
  return node.people.some((p) => (p.fullName ?? "").toLowerCase().includes(q));
}

export function keysMatching(nodes: OrgNode[], query: string): string[] {
  const out: string[] = [];
  const walk = (n: OrgNode) => {
    if (matches(n, query)) out.push(n.key);
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export function ancestorsOf(nodes: OrgNode[], keys: string[]): string[] {
  const set = new Set<string>();
  for (const key of keys) for (const n of pathTo(nodes, key)) set.add(n.key);
  return [...set];
}

export function countNodes(node: OrgNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

export function defaultExpanded(roots: OrgNode[], depth = 2): string[] {
  const out: string[] = [];
  const walk = (n: OrgNode, d: number) => {
    if (d < depth) {
      out.push(n.key);
      n.children.forEach((c) => walk(c, d + 1));
    }
  };
  roots.forEach((r) => walk(r, 0));
  return out;
}