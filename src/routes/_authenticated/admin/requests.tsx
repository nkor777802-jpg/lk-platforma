import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, Mail, Phone, User } from "lucide-react";
import { contactRequestsQuery } from "@/lib/admin-queries";
import { updateContactRequestStatus } from "@/lib/admin.functions";
import { AdminTable } from "@/components/admin/AdminTable";
import { ErrorState, InlineLoading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: RequestsPage,
});

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Завершена",
  archived: "В архиве",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_progress: "secondary",
  done: "outline",
  archived: "outline",
};

type RequestRow = {
  id: string;
  full_name: string;
  unit: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function RequestsPage() {
  const query = useQuery(contactRequestsQuery);
  const qc = useQueryClient();
  const update = useServerFn(updateContactRequestStatus);
  const [detail, setDetail] = useState<RequestRow | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      update({ data: { id: payload.id, status: payload.status as never } }),
    onSuccess: () => {
      toast.success("Статус обновлён");
      void qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] });
    },
    onError: (e: Error) => toast.error("Не удалось обновить статус", { description: e.message }),
  });

  if (query.isPending) return <InlineLoading />;
  if (query.isError) return <ErrorState message="Не удалось загрузить заявки." />;

  const rows = (query.data ?? []) as RequestRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Заявки на обучение</h1>
        <p className="text-sm text-muted-foreground">
          Обращения с сайта от сотрудников и кандидатов. Изменяйте статус, чтобы отметить работу с заявкой.
        </p>
      </div>

      <AdminTable<RequestRow>
        rows={rows}
        searchKeys={["full_name", "email", "phone", "unit", "message"]}
        columns={[
          {
            key: "created_at",
            label: "Дата",
            render: (r) => new Date(r.created_at).toLocaleString("ru-RU"),
          },
          {
            key: "full_name",
            label: "ФИО",
            render: (r) => (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{r.full_name}</span>
              </div>
            ),
          },
          {
            key: "contacts",
            label: "Контакты",
            render: (r) => (
              <div className="space-y-1 text-sm">
                {r.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <a href={`mailto:${r.email}`} className="underline underline-offset-4">
                      {r.email}
                    </a>
                  </div>
                ) : null}
                {r.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <a href={`tel:${r.phone}`} className="underline underline-offset-4">
                      {r.phone}
                    </a>
                  </div>
                ) : null}
                {!r.email && !r.phone ? "—" : null}
              </div>
            ),
          },
          {
            key: "unit",
            label: "Подразделение",
            render: (r) => r.unit ?? "—",
          },
          {
            key: "status",
            label: "Статус",
            render: (r) => (
              <Select
                value={r.status}
                onValueChange={(value) => mutation.mutate({ id: r.id, status: value })}
                disabled={mutation.isPending}
              >
                <SelectTrigger className="w-[9.5rem]">
                  <SelectValue>
                    <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <Dialog open={detail?.id === r.id} onOpenChange={(open) => setDetail(open ? r : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setDetail(r)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Просмотр
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Заявка от {r.full_name}</DialogTitle>
                    <DialogDescription>
                      Получена {new Date(r.created_at).toLocaleString("ru-RU")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Подразделение</p>
                        <p>{r.unit ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Статус</p>
                        <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </div>
                    </div>
                    {r.email ? (
                      <div>
                        <p className="text-muted-foreground">E-mail</p>
                        <a href={`mailto:${r.email}`} className="underline underline-offset-4">
                          {r.email}
                        </a>
                      </div>
                    ) : null}
                    {r.phone ? (
                      <div>
                        <p className="text-muted-foreground">Телефон</p>
                        <a href={`tel:${r.phone}`} className="underline underline-offset-4">
                          {r.phone}
                        </a>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-muted-foreground">Сообщение</p>
                      <p className="whitespace-pre-wrap rounded-md border border-border bg-muted p-3">
                        {r.message}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-muted-foreground">Изменить статус</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <Button
                            key={value}
                            variant={r.status === value ? "default" : "outline"}
                            size="sm"
                            disabled={mutation.isPending || r.status === value}
                            onClick={() => mutation.mutate({ id: r.id, status: value })}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ),
          },
        ]}
      />
    </div>
  );
}
