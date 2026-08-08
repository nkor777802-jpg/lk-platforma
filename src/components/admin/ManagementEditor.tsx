import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { adminTableQuery } from "@/lib/admin-queries";
import { archiveRow, saveRow } from "@/lib/admin.functions";
import { deleteManagementPhoto, uploadManagementPhoto } from "@/lib/management.functions";
import { signedUrl } from "@/lib/storage";
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

type Row = Record<string, unknown>;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ManagementEditor() {
  const qc = useQueryClient();
  const query = useQuery(adminTableQuery("management", "*", "sort_order"));
  const save = useServerFn(saveRow);
  const archive = useServerFn(archiveRow);
  const uploadPhoto = useServerFn(uploadManagementPhoto);
  const removePhoto = useServerFn(deleteManagementPhoto);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string | null; values: Record<string, unknown> }) =>
      save({ data: { table: "management", id: payload.id ?? null, values: payload.values } }),
    onSuccess: () => {
      toast.success("Сохранено");
      setOpen(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (payload: { id: string; active: boolean }) =>
      archive({ data: { table: "management", id: payload.id, active: payload.active } }),
    onSuccess: () => {
      toast.success("Статус обновлён");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!editing?.["id"]) throw new Error("Сначала сохраните запись");
      if (file.size > MAX_FILE_SIZE) throw new Error("Файл не должен превышать 5 МБ");
      const base64 = await fileToBase64(file);
      return uploadPhoto({ data: { id: String(editing["id"]), fileName: file.name, base64 } });
    },
    onSuccess: (res) => {
      toast.success("Фото загружено");
      setPhotoPath(res.path);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!editing?.["id"] || !photoPath) throw new Error("Нет фото для удаления");
      return removePhoto({ data: { id: String(editing["id"]), path: photoPath } });
    },
    onSuccess: () => {
      toast.success("Фото удалено");
      setPhotoPreview(null);
      setPhotoPath(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openForm = (row: Row | null) => {
    setEditing(row);
    setValues({
      full_name: row?.["full_name"] ?? "",
      position: row?.["position"] ?? "",
      bio: row?.["bio"] ?? "",
      sort_order: row?.["sort_order"] ?? 0,
      is_active: row?.["is_active"] ?? true,
    });
    setPhotoPath((row?.["photo_url"] as string | null) ?? null);
    setPhotoPreview(null);
    setOpen(true);
  };

  const submit = () => {
    if (!values["full_name"]) {
      toast.error("Заполните ФИО");
      return;
    }
    if (!values["position"]) {
      toast.error("Заполните должность");
      return;
    }
    const payload = {
      full_name: values["full_name"],
      position: values["position"],
      bio: values["bio"] || null,
      sort_order: values["sort_order"] === "" ? 0 : Number(values["sort_order"]),
      is_active: Boolean(values["is_active"]),
    };
    saveMutation.mutate({ id: (editing?.["id"] as string) ?? null, values: payload });
  };

  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    uploadMutation.mutate(file);
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const columns: Column<Row>[] = [
    { key: "full_name", label: "ФИО" },
    { key: "position", label: "Должность" },
    {
      key: "is_active",
      label: "Статус",
      render: (row) => (
        <Badge variant={row["is_active"] === false ? "outline" : "secondary"}>
          {row["is_active"] === false ? "В архиве" : "Активно"}
        </Badge>
      ),
    },
    {
      key: "__actions",
      label: "Действия",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openForm(row)}>
            Изменить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => archiveMutation.mutate({ id: row["id"] as string, active: row["is_active"] === false })}
          >
            {row["is_active"] === false ? "Восстановить" : "В архив"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-secondary sm:text-xl">Руководство</h2>
          <p className="text-sm text-muted-foreground">
            Фото и данные членов руководства. Изображения хранятся в защищённом бакете.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm(null)} className="w-full sm:w-auto">
              <Plus className="mr-1.5 h-4 w-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Редактирование" : "Новая запись"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-full_name">ФИО *</Label>
                <Input
                  id="m-full_name"
                  value={String(values["full_name"] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-position">Должность *</Label>
                <Input
                  id="m-position"
                  value={String(values["position"] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, position: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-bio">Биография / описание</Label>
                <Textarea
                  id="m-bio"
                  value={String(values["bio"] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-sort_order">Порядок</Label>
                <Input
                  id="m-sort_order"
                  type="number"
                  value={String(values["sort_order"] ?? 0)}
                  onChange={(e) => setValues((v) => ({ ...v, sort_order: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="m-is_active"
                  checked={Boolean(values["is_active"])}
                  onCheckedChange={(c) => setValues((v) => ({ ...v, is_active: c }))}
                />
                <span className="text-sm text-muted-foreground">{values["is_active"] ? "Активно" : "В архиве"}</span>
              </div>

              {editing ? (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <Label>Фото</Label>
                  <ManagementPhotoPreview path={photoPath} />
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Предпросмотр"
                      className="h-32 w-32 rounded-md object-cover"
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onFileChange(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-4 w-4" />
                      Загрузить фото
                    </Button>
                    {photoPath ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate()}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Удалить
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  После сохранения записи появится возможность загрузить фото.
                </p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={submit}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
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
        <AdminTable rows={query.data as Row[]} columns={columns} searchKeys={["full_name", "position"]} />
      )}
    </section>
  );
}

function ManagementPhotoPreview({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!path) {
      setUrl(null);
      return;
    }
    signedUrl(path, "management").then((u) => {
      if (mounted) setUrl(u);
    });
    return () => {
      mounted = false;
    };
  }, [path]);

  if (!path) return null;
  if (!url) return <InlineLoading />;

  return (
    <img
      src={url}
      alt="Фото руководителя"
      className="h-32 w-32 rounded-md object-cover"
    />
  );
}
