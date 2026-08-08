import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

const PAGE_SIZE = 12;

export function AdminTable<T extends Record<string, unknown>>({
  rows,
  columns,
  searchKeys,
  emptyTitle = "Нет записей",
  emptyDescription,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchKeys?.length) return rows;
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {searchKeys?.length ? (
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Поиск…"
            className="w-full sm:max-w-xs"
            aria-label="Поиск по таблице"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} {...(emptyDescription ? { description: emptyDescription } : {})} />
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {visible.map((row, i) => (
              <li
                key={String(row["id"] ?? row["key"] ?? i)}
                className="rounded-lg border border-border bg-card p-3"
              >
                <dl className="space-y-2">
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-2 text-sm"
                    >
                      <dt className="min-w-0 text-muted-foreground">{c.label}</dt>
                      <dd className="min-w-0 break-words">
                        {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className={c.className}>
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row, i) => (
                  <TableRow key={String(row["id"] ?? row["key"] ?? i)}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>
                        {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground sm:justify-end">
              <span>
                Страница {current + 1} из {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Вперёд
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
