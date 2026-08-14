import { readFileSync } from "node:fs";
import { supabaseAdmin } from "/dev-server/src/integrations/supabase/client.server";
import { saveDraftVersion, publishVersion } from "/dev-server/src/lib/org-versions.server";

const base64 = readFileSync("/mnt/user-uploads/ШР_ЛК_ДЛЯ_Структуры.xlsx").toString("base64");
const { data: prof } = await supabaseAdmin.from("profiles").select("id, full_name, email").limit(1);
const actorId = prof?.[0]?.id;
if (!actorId) throw new Error("no profiles");
const res = await saveDraftVersion({
  base64,
  fileName: "ШР_ЛК_ДЛЯ_Структуры.xlsx",
  title: "Штатная расстановка (импорт)",
  mapping: null,
  actorId,
  saveProfileName: null,
});
console.log("stats", JSON.stringify(res.stats));
console.log("errors", res.issues.filter((i: any) => i.level === "ERROR").slice(0, 5));
const pub = await publishVersion(res.versionId, new Date().toISOString().slice(0, 10));
console.log("published", JSON.stringify(pub));
