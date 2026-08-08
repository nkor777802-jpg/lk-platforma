import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { adminTableQuery } from "@/lib/admin-queries";
import { archiveRow, saveRow } from "@/lib/admin.functions";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { ErrorState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

type Row = Record<string, unknown>;

export function EntityManager({
  table,
  title,
  description,
  fields,
  columns,
  searchKeys = ["name", "title"],
  archivable = true,
  select,
  orderBy,
}: {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  columns: Column<Row>[];
  searchKeys?: string[];
  archivable?: boolean;
  select?: string;
  orderBy?: string;
}) {
  const qc = useQueryClient();
  const query = useQuery(adminTableQuery(table, select, orderBy));
  const save = useServerFn(saveRow);
  const archive = useServerFn(archiveRow);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string | null; values: Record<string, unknown> }) =>
      save({ data: { table, id: payload.id ?? null, values: payload.values } }),
    onSuccess: () => {
      toast.success("Сохранено");
      setOpen(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (payload: { id: string; active: boolean }) =>
      archive({ data: { table, id: payload.id, active: payload.active } }),
    onSuccess: () => {
      toast.success("Статус обновлён");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openForm = (row: Row | null) => {
    setEditing(row);
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      initial[f.name] = row?.[f.name] ?? (f.type === "boolean" ? true : "");
    });
    setValues(initial);
    setOpen(true);
  };

  const submit = () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.required && (v === "" || v === null || v === undefined)) {
        toast.error(`Заполните поле «${f.label}»`);
        return;
      }
      if (f.type === "number") payload[f.name] = v === "" ? null : Number(v);
      else if (f.type === "boolean") payload[f.name] = Boolean(v);
      else payload[f.name] = v === "" ? null : v;
    }
    saveMutation.mutate({ id: (editing?.["id"] as string) ?? null, values: payload });
  };

  const allColumns: Column<Row>[] = [
    ...columns,
    ...(archivable
      ? [
          {
            key: "is_active",
            label: "Статус",
            render: (row: Row) => (
              <Badge variant={row["is_active"] === false ? "outline" : "secondary"}>
                {row["is_active"] === false ? "В архиве" : "Активно"}
              </Badge>
            ),
          },
        ]
      : []),
    {
      key: "__actions",
      label: "Действия",
      className: "text-right",
      render: (row: Row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openForm(row)}>
            Изменить
          </Button>
          {archivable ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                archiveMutation.mutate({
                  id: row["id"] as string,
                  active: row["is_active"] === false,
                })
              }
            >
              {row["is_active"] === false ? "Восстановить" : "В архив"}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-secondary">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm(null)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Редактирование" : "Новая запись"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={`f-${f.name}`}>
                    {f.label}
                    {f.required ? " *" : ""}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`f-${f.name}`}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  ) : f.type === "boolean" ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`f-${f.name}`}
                        checked={Boolean(values[f.name])}
                        onCheckedChange={(c) => setValues((v) => ({ ...v, [f.name]: c }))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {values[f.name] ? "Да" : "Нет"}
                      </span>
                    </div>
                  ) : f.type === "select" ? (
                    <Select
                      value={String(values[f.name] ?? "")}
                      onValueChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                    >
                      <SelectTrigger id={`f-${f.name}`}>
                        <SelectValue placeholder="Не выбрано" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`f-${f.name}`}
                      type={f.type === "number" ? "number" : "text"}
                      placeholder={f.placeholder}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={submit} disabled={saveMutation.isPending}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {query.isPending ? (
        <InlineLoading />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} />
      ) : (
        <AdminTable rows={query.data as Row[]} columns={allColumns} searchKeys={searchKeys} />
      )}
    </section>
  );
}
