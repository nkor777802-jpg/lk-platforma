import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineLoading } from "@/components/states";
import { orgWorkCenterLinksQuery } from "@/lib/org-queries";
import { setWorkCenterLink } from "@/lib/org.functions";

export function OrgWorkCenterLinks() {
  const qc = useQueryClient();
  const data = useQuery(orgWorkCenterLinksQuery());
  const setLink = useServerFn(setWorkCenterLink);

  const mutate = useMutation({
    mutationFn: (v: { departmentId: string; workCenterId: string; linked: boolean }) => setLink({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org", "work-center-links"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (data.isLoading) return <InlineLoading />;
  const { links = [], centers = [], departments = [] } = data.data ?? {};
  const linked = new Set(links.map((l) => `${l.department_id}:${l.work_center_id}`));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Производственная структура остаётся отдельной: здесь задаются связи «подразделение ↔ рабочий центр»
        для аналитики и обучения.
      </p>
      {centers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Рабочие центры не заведены.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Подразделение</th>
                {centers.map((c) => (
                  <th key={c.id} className="p-2 text-left text-xs font-medium">
                    {c.name}
                    {c.code ? ` (${c.code})` : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="p-2 break-words">{d.name}</td>
                  {centers.map((c) => (
                    <td key={c.id} className="p-2">
                      <Checkbox
                        checked={linked.has(`${d.id}:${c.id}`)}
                        onCheckedChange={(v) =>
                          mutate.mutate({ departmentId: d.id, workCenterId: c.id, linked: Boolean(v) })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
