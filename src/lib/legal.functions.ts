import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Список документов по персональным данным. Доступен всем авторизованным. */
export const listLegalDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("legal_documents")
      .select("id, slug, title, kind, sort_order, storage_path, file_name, mime_type, file_size, uploaded_at, uploaded_by")
      .order("sort_order");
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const uploaderIds = Array.from(
      new Set(rows.map((r) => r.uploaded_by).filter((v): v is string => Boolean(v))),
    );
    let names = new Map<string, string>();
    if (uploaderIds.length > 0) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uploaderIds);
      names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));
    }
    return rows.map((r) => ({ ...r, uploaded_by_name: r.uploaded_by ? names.get(r.uploaded_by) ?? null : null }));
  });

/** Регистрация новой версии документа после загрузки файла в бакет legal-docs. */
export const saveLegalDocumentVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1),
        storagePath: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        fileSize: z.number().int().nonnegative(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc, error: findError } = await supabaseAdmin
      .from("legal_documents")
      .select("id, storage_path, file_name, mime_type, file_size, uploaded_by")
      .eq("slug", data.slug)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!doc) throw new Error("Документ не найден");

    if (doc.storage_path) {
      await supabaseAdmin.from("legal_document_versions").insert({
        document_id: doc.id,
        storage_path: doc.storage_path,
        file_name: doc.file_name,
        mime_type: doc.mime_type,
        file_size: doc.file_size,
        uploaded_by: doc.uploaded_by,
      });
    }

    const { error } = await supabaseAdmin
      .from("legal_documents")
      .update({
        storage_path: data.storagePath,
        file_name: data.fileName,
        mime_type: data.mimeType,
        file_size: data.fileSize,
        uploaded_by: context.userId,
        uploaded_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
    if (error) throw new Error(error.message);

    await logAction({
      actorId: context.userId,
      action: "legal-document.upload",
      entity: "legal_documents",
      entityId: doc.id,
      details: { slug: data.slug, fileName: data.fileName },
    });
    return { ok: true };
  });

/** Статус согласий текущего пользователя по обязательным документам. */
export const getMyConsentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: docs, error } = await context.supabase
      .from("legal_documents")
      .select("id, slug, title, kind, sort_order, storage_path, uploaded_at")
      .eq("kind", "site")
      .order("sort_order");
    if (error) throw new Error(error.message);

    const { data: consents, error: cErr } = await context.supabase
      .from("legal_consents")
      .select("document_id, accepted_at")
      .eq("user_id", context.userId);
    if (cErr) throw new Error(cErr.message);

    const accepted = new Map((consents ?? []).map((c) => [c.document_id, c.accepted_at]));
    const items = (docs ?? []).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      hasFile: Boolean(d.storage_path),
      acceptedAt: accepted.get(d.id) ?? null,
    }));
    return {
      items,
      required: items.length > 0,
      accepted: items.length > 0 && items.every((i) => i.acceptedAt),
    };
  });

/** Фиксация согласия работника по всем обязательным документам. */
export const acceptLegalConsents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: docs, error } = await context.supabase
      .from("legal_documents")
      .select("id, uploaded_at")
      .eq("kind", "site");
    if (error) throw new Error(error.message);
    const rows = (docs ?? []).map((d) => ({
      user_id: context.userId,
      document_id: d.id,
      document_version: d.uploaded_at,
    }));
    if (rows.length === 0) return { ok: true };
    const { error: insErr } = await context.supabase
      .from("legal_consents")
      .upsert(rows, { onConflict: "user_id,document_id", ignoreDuplicates: true });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });
