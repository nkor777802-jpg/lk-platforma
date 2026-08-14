import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileCode2, FileSpreadsheet, Image as ImageIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineLoading } from "@/components/states";
import { OrgGraph } from "@/components/org/OrgGraph";
import { orgStructureQuery, orgVersionsQuery } from "@/lib/org-queries";
import { exportOrgExcel } from "@/lib/org.functions";

export function OrgStructureViewer() {
  const [versionId, setVersionId] = useState<string>("active");
  const versions = useQuery(orgVersionsQuery());
  const structure = useQuery(orgStructureQuery(versionId === "active" ? null : versionId));
  const exportExcel = useServerFn(exportOrgExcel);
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<{ focusKey: string | null; expanded: string[] }>({
    focusKey: null,
    expanded: [],
  });

  const downloadExcel = async () => {
    setBusy(true);
    try {
      const res = await exportExcel({
        data: {
          versionId: versionId === "active" ? null : versionId,
          scope: "all",
          branchKey: view.focusKey,
        },
      });
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
      link.download = res.fileName;
      link.click();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const downloadImage = async (format: "png" | "svg") => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      const mod = await import("html-to-image");
      const dataUrl =
        format === "png"
          ? await mod.toPng(captureRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" })
          : await mod.toSvg(captureRef.current, { backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Оргструктура_${new Date().toISOString().slice(0, 10)}.${format}`;
      link.click();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (structure.isLoading) return <InlineLoading />;
  const data = structure.data;

  if (!data?.version) {
    return (
      <p className="text-sm text-muted-foreground">
        Действующей версии структуры нет. Импортируйте штатную расстановку во вкладке «Импорт ШР».
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={versionId} onValueChange={setVersionId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Действующая версия</SelectItem>
            {(versions.data ?? []).map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={downloadExcel} disabled={busy}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadImage("png")} disabled={busy}>
          <ImageIcon className="mr-2 h-4 w-4" /> PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadImage("svg")} disabled={busy}>
          <FileCode2 className="mr-2 h-4 w-4" /> SVG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams();
            if (versionId !== "active") params.set("versionId", versionId);
            if (view.focusKey) params.set("focus", view.focusKey);
            const qs = params.toString();
            window.open(qs ? `/org/print?${qs}` : "/org/print", "_blank");
          }}
        >
          <Printer className="mr-2 h-4 w-4" /> PDF / печать
        </Button>
        {busy ? <Download className="h-4 w-4 animate-pulse text-muted-foreground" /> : null}
      </div>

      <OrgGraph
        units={data.units}
        workCenters={data.workCenters}
        variant="internal"
        exportRef={captureRef}
        onStateChange={setView}
        title="Организационная структура"
        subtitle={data.version.title}
      />
    </div>
  );
}
