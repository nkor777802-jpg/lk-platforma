import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Factory,
  Maximize2,
  Minus,
  Plus,
  Scan,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import {
  ancestorsOf,
  buildTree,
  findNode,
  keysMatching,
  matches,
  pathTo,
  type OrgNode,
  type OrgUnitData,
  type OrgWorkCenterLink,
} from "@/lib/org-tree";
import { OrgPoster } from "./OrgPoster";
import { OrgBranch } from "./OrgBranch";

interface Props {
  units: OrgUnitData[];
  title?: string;
  subtitle?: string;
  /** Подпись об актуальности данных штатной расстановки. */
  note?: string;
  /** public — без ФИО и ссылок на профили; internal — полный доступ. */
  variant?: "public" | "internal";
  workCenters?: OrgWorkCenterLink[];
  /** Контейнер со схемой (без масштабирования) — для экспорта PNG/SVG. */
  exportRef?: React.RefObject<HTMLDivElement | null>;
  onStateChange?: (state: { focusKey: string | null; expanded: string[]; view?: "tree" | "sheet" }) => void;
}

function num(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

const MIN_SHEET_SCALE = 0.45;

const EXPORT_BG = {
  white: { label: "Белый (для печати)", value: "#ffffff" },
  light: { label: "Светло-серый", value: "#f4f6fa" },
  transparent: { label: "Прозрачный", value: "transparent" },
} as const;

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

/** Ориентировочный формат листа для подсказки в диалоге экспорта (300 dpi). */
function sheetHint(w: number, h: number) {
  const orientation = w >= h ? "альбомная" : "книжная";
  const long = Math.max(w, h);
  const format = long > 3508 ? "A3+" : long > 2480 ? "A3" : "A4";
  return `${format}, ${orientation}`;
}

function fileSlug(name: string) {
  return name.trim().replace(/\s+/g, "-").replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
}

const LEVEL_STYLES = [
  {
    card: "border-primary/40 bg-primary text-primary-foreground shadow-lg",
    meta: "text-primary-foreground/80",
    line: "bg-primary/50",
  },
  {
    card: "border-secondary/40 bg-secondary text-secondary-foreground shadow-md",
    meta: "text-secondary-foreground/80",
    line: "bg-secondary/40",
  },
  {
    card: "border-accent/50 bg-accent text-accent-foreground shadow-sm",
    meta: "text-accent-foreground/80",
    line: "bg-accent/40",
  },
  {
    card: "border-border bg-card text-card-foreground shadow-sm",
    meta: "text-muted-foreground",
    line: "bg-border",
  },
];

function styleFor(level: number) {
  return LEVEL_STYLES[Math.min(level, LEVEL_STYLES.length - 1)]!;
}

export function OrgGraph({
  units,
  title,
  subtitle,
  note,
  variant = "public",
  workCenters = [],
  exportRef,
  onStateChange,
}: Props) {
  const isMobile = useIsMobile();
  const { isStaff } = useAuth();
  const allRoots = useMemo(() => buildTree(units), [units]);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const focusNode = useMemo(() => (focusKey ? findNode(allRoots, focusKey) : null), [allRoots, focusKey]);
  const roots = useMemo(() => (focusNode ? [focusNode] : allRoots), [allRoots, focusNode]);
  const focusCrumbs = useMemo(() => (focusKey ? pathTo(allRoots, focusKey) : []), [allRoots, focusKey]);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(0.9);
  const [view, setView] = useState<"tree" | "sheet">("tree");
  const [sheetScale, setSheetScale] = useState(1);
  const [sheetSize, setSheetSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedByBranch, setExpandedByBranch] = useState<Record<string, string[]>>({});
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScale, setExportScale] = useState(2);
  const [exportBg, setExportBg] = useState<keyof typeof EXPORT_BG>("white");
  const [exportScope, setExportScope] = useState<"view" | "branch">("view");
  const [detail, setDetail] = useState<OrgNode | null>(null);
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const dragging = useRef(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const searchSnapshot = useRef<string[] | null>(null);

  const branchId = focusKey ?? "__all";
  const expanded = useMemo(
    () => new Set(expandedByBranch[branchId] ?? (focusNode ? [focusNode.key] : [])),
    [expandedByBranch, branchId, focusNode],
  );
  const setExpandedKeys = (keys: Iterable<string>) =>
    setExpandedByBranch((prev) => ({ ...prev, [branchId]: [...new Set(keys)] }));

  useEffect(() => {
    if (exportRef) exportRef.current = innerRef.current;
  });

  useEffect(() => {
    onStateChange?.({ focusKey, expanded: [...expanded], view });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, expanded, view]);

  // Начальное состояние из URL (?view=sheet&focus=...&open=a|b).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("view") === "sheet") setView("sheet");
    const f = sp.get("focus");
    if (f) setFocusKey(f);
    const open = sp.get("open");
    if (open) {
      const keys = open.split("|").filter(Boolean);
      setExpandedByBranch({ [f ?? "__all"]: keys });
    }
  }, []);

  // Синхронизация вида, ветки и раскрытия с адресной строкой.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "sheet") url.searchParams.set("view", "sheet");
    else url.searchParams.delete("view");
    if (focusKey) url.searchParams.set("focus", focusKey);
    else url.searchParams.delete("focus");
    const open = expandedByBranch[branchId] ?? [];
    if (open.length) url.searchParams.set("open", open.join("|"));
    else url.searchParams.delete("open");
    window.history.replaceState(null, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, focusKey, expandedByBranch, branchId]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [roots]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const content = contentRef.current;
      if (!canvas || !content) return;
      const cw = canvas.clientWidth;
      const raw = content.scrollWidth;
      const fit = Math.min(1, Math.max(0.4, (cw - 48) / Math.max(raw, 1)));
      setZoom(fit);
      setPan({ x: Math.round((cw - raw * fit) / 2), y: 0 });
    }, 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roots, fullscreen]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const content = contentRef.current;
      if (!canvas || !content) return;
      const cw = canvas.clientWidth;
      const w = content.scrollWidth * zoom;
      if (w < cw) setPan((p) => ({ x: Math.round((cw - w) / 2), y: p.y }));
    }, 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Листовой режим: автоподбор масштаба под размер области.
  useLayoutEffect(() => {
    if (view !== "sheet" || !focusNode) return;
    const canvas = canvasRef.current;
    const inner = innerRef.current;
    if (!canvas || !inner) return;
    const recompute = () => {
      const cw = canvas.clientWidth - 16;
      // Опорная высота фиксирована (не clientHeight канваса), иначе подгонка зациклится.
      const ch = (fullscreen ? window.innerHeight - 220 : window.innerHeight * 0.7) - 16;
      const w = inner.scrollWidth;
      const h = inner.scrollHeight;
      if (w <= 0 || h <= 0 || cw <= 0 || ch <= 0) return;
      const raw = Math.min(1, cw / w, ch / h);
      // Ширина вписывается всегда; по высоте допускаем прокрутку ради читаемости.
      setSheetScale(Math.min(cw / w, Math.max(MIN_SHEET_SCALE, raw)));
      setSheetSize({ w, h });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(canvas);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [view, focusNode, fullscreen, query]);

  const panelKeys = useMemo(() => {
    const acc: string[] = [];
    const walk = (n: OrgNode) => {
      if (n.children.length) acc.push(n.key);
      n.children.forEach(walk);
    };
    roots.forEach(walk);
    return acc;
  }, [roots]);

  // Отбрасываем ключи, которых больше нет в дереве (после смены версии ШР).
  useEffect(() => {
    const alive = new Set(panelKeys);
    setExpandedByBranch((prev) => {
      const cur = prev[branchId];
      if (!cur) return prev;
      const next = cur.filter((k) => alive.has(k));
      if (next.length === cur.length) return prev;
      return { ...prev, [branchId]: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelKeys, branchId]);

  // Поиск раскрывает найденные ветки, но не теряет ручное состояние.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      const snap = searchSnapshot.current;
      searchSnapshot.current = null;
      if (snap) setExpandedByBranch((prev) => ({ ...prev, [branchId]: snap }));
      return;
    }
    if (!searchSnapshot.current) searchSnapshot.current = [...expanded];
    const hits = keysMatching(roots, q);
    if (!hits.length) return;
    const base = searchSnapshot.current ?? [];
    setExpandedByBranch((prev) => ({
      ...prev,
      [branchId]: [...new Set([...base, ...ancestorsOf(roots, hits)])],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roots, branchId]);

  const toggle = (key: string) =>
    setExpandedByBranch((prev) => {
      const cur = new Set(prev[branchId] ?? (focusNode ? [focusNode.key] : []));
      if (cur.has(key)) cur.delete(key);
      else cur.add(key);
      return { ...prev, [branchId]: [...cur] };
    });

  const exportName = focusNode ? fileSlug(focusNode.name) : "обзор";

  const runExport = async (format: "png" | "svg" | "pdf") => {
    const target = innerRef.current;
    if (!target) return;
    setBusy(true);
    const restore = expandedByBranch[branchId] ?? null;
    try {
      if (exportScope === "branch") {
        setExpandedKeys(panelKeys);
        await new Promise((r) => window.setTimeout(r, 350));
      }
      const mod = await import("html-to-image");
      const node = innerRef.current ?? target;
      const options = {
        backgroundColor: EXPORT_BG[exportBg].value,
        skipFonts: true,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: { transform: "none", margin: "0" },
      };
      const stamp = new Date().toISOString().slice(0, 10);
      const baseName = `Оргструктура_${exportName}_${stamp}`;

      if (format === "svg") {
        const dataUrl = await mod.toSvg(node, options);
        triggerDownload(dataUrl, `${baseName}.svg`);
      } else if (format === "png") {
        const dataUrl = await mod.toPng(node, { ...options, pixelRatio: exportScale });
        triggerDownload(dataUrl, `${baseName}.png`);
      } else {
        // PDF: снимок текущего вида вписывается в лист A4/A3 нужной ориентации.
        const bg = EXPORT_BG[exportBg].value;
        const dataUrl = await mod.toPng(node, {
          ...options,
          backgroundColor: bg === "transparent" ? "#ffffff" : bg,
          pixelRatio: exportScale,
        });
        const { jsPDF } = await import("jspdf");
        const pxW = node.scrollWidth;
        const pxH = node.scrollHeight;
        const landscape = pxW >= pxH;
        const format4 = Math.max(pxW, pxH) > 1600 ? "a3" : "a4";
        const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: format4 });
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        const m = 8;
        const footer = 8;
        const k = Math.min((pw - m * 2) / pxW, (ph - m * 2 - footer) / pxH);
        const w = pxW * k;
        const h = pxH * k;
        doc.addImage(dataUrl, "PNG", (pw - w) / 2, m, w, h, undefined, "FAST");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          [title ?? "Организационная структура", focusNode?.name ?? "Вся структура", subtitle ?? "", stamp]
            .filter(Boolean)
            .join("  •  "),
          m,
          ph - 4,
        );
        doc.save(`${baseName}.pdf`);
      }
      setExportOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (exportScope === "branch") {
        setExpandedByBranch((prev) => ({ ...prev, [branchId]: restore ?? (focusNode ? [focusNode.key] : []) }));
      }
      setBusy(false);
    }
  };

  const detailCenters = useMemo(() => {
    if (!detail?.departmentId) return [];
    return workCenters
      .filter((l) => l.departmentId === detail.departmentId && l.center)
      .map((l) => l.center!);
  }, [detail, workCenters]);

  const detailSheet = (
    <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {detail ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-secondary">{detail.name}</SheetTitle>
              <SheetDescription>
                {detail.unitType ? `${detail.unitType} · ` : ""}Штатных единиц {num(detail.planned)}
              </SheetDescription>
            </SheetHeader>
            {detail.managerName ? (
              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">Руководитель: </span>
                {detail.managerName}
              </p>
            ) : null}
            {detail.children.length ? (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setFocusKey(detail.key);
                  setDetail(null);
                }}
              >
                Открыть ветку подразделения
              </Button>
            ) : null}
            {detail.positions.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary">Должности</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detail.positions.map((p) => (
                    <li key={p.name} className="flex justify-between gap-3 border-b border-border py-1">
                      <span className="break-words">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">{num(p.planned)} ед.</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {detail.children.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary">Входящие подразделения</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {detail.children.map((c) => (
                    <li key={c.key} className="break-words">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {variant === "internal" && detail.people.some((p) => p.fullName) ? (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Users className="h-4 w-4" /> Сотрудники
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detail.people
                    .filter((p) => p.fullName)
                    .map((p, i) => (
                      <li key={`${p.fullName}-${i}`} className="border-b border-border py-1">
                        {p.profileId ? (
                          <Link to="/admin/users" className="font-medium text-secondary hover:underline">
                            {p.fullName}
                          </Link>
                        ) : (
                          <span className="font-medium">{p.fullName}</span>
                        )}
                        <span className="block text-xs text-muted-foreground break-words">{p.positionName}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {variant === "internal" && detailCenters.length ? (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Factory className="h-4 w-4" /> Рабочие центры
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detailCenters.map((c) => (
                    <li key={c.id} className="border-b border-border py-1">
                      <span className="font-medium break-words">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[c.code, c.site, c.area, c.process].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );

  // --- Мобильный пошаговый режим ---
  if (isMobile) {
    const currentNode = drillKey ? findNode(roots, drillKey) : null;
    const list = currentNode ? currentNode.children : roots;
    const crumbs = drillKey ? pathTo(roots, drillKey) : [];
    const q = query.trim().toLowerCase();
    const hits = q
      ? units
          .filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              (u.managerName ?? "").toLowerCase().includes(q) ||
              u.positions.some((p) => p.name.toLowerCase().includes(q)) ||
              u.people.some((p) => (p.fullName ?? "").toLowerCase().includes(q)),
          )
          .slice(0, 30)
      : [];

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск подразделения"
            className="pl-9"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Найдено: {hits.length}</p>
            {hits.map((u) => (
              <button
                key={u.key}
                type="button"
                onClick={() => {
                  setDrillKey(u.key);
                  setQuery("");
                }}
                className="w-full rounded-lg border border-border bg-card px-3 py-3 text-left"
              >
                <span className="font-medium text-secondary break-words">{u.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <button type="button" className="hover:underline" onClick={() => setDrillKey(null)}>
                Вся структура
              </button>
              {crumbs.map((c) => (
                <span key={c.key} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button type="button" className="break-words text-left hover:underline" onClick={() => setDrillKey(c.key)}>
                    {c.name}
                  </button>
                </span>
              ))}
            </nav>

            {currentNode ? (
              <div className={`rounded-xl border px-4 py-3 ${styleFor(currentNode.level).card}`}>
                <p className="text-base font-semibold break-words">{currentNode.name}</p>
                {currentNode.managerName ? (
                  <p className={`mt-1 text-xs ${styleFor(currentNode.level).meta}`}>{currentNode.managerName}</p>
                ) : null}
                <p className={`mt-2 text-xs ${styleFor(currentNode.level).meta}`}>
                  Штат {num(currentNode.planned)} · Должностей {num(currentNode.positions.length)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-background text-foreground"
                  onClick={() => setDetail(currentNode)}
                >
                  Подробнее
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              {list.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setDrillKey(n.key)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-secondary"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-secondary break-words">{n.name}</span>
                    <span className="block text-xs text-muted-foreground">Штат {num(n.planned)}</span>
                  </span>
                  {n.children.length ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                </button>
              ))}
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">Вложенных подразделений нет.</p>
              ) : null}
            </div>
          </>
        )}
        {detailSheet}
      </div>
    );
  }

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
          : "flex flex-col overflow-hidden rounded-xl border border-border bg-background"
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="mr-auto min-w-0">
          {title ? <p className="truncate font-semibold text-secondary">{title}</p> : null}
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            className="h-9 pl-9"
          />
        </div>

        {focusNode ? (
          <div className="flex items-center rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("tree")}
              className={`rounded px-2.5 py-1.5 text-xs font-medium ${view === "tree" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Дерево
            </button>
            <button
              type="button"
              onClick={() => setView("sheet")}
              className={`rounded px-2.5 py-1.5 text-xs font-medium ${view === "sheet" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Один лист
            </button>
          </div>
        ) : null}

        <Button variant="outline" size="sm" className="h-9" disabled={busy} onClick={() => downloadImage("png")}>
          <ImageIcon className="mr-2 h-4 w-4" /> PNG{focusNode ? " (ветка)" : ""}
        </Button>
        <Button variant="outline" size="sm" className="h-9" disabled={busy} onClick={() => downloadImage("svg")}>
          <FileCode2 className="mr-2 h-4 w-4" /> SVG{focusNode ? " (ветка)" : ""}
        </Button>

        {focusNode && view === "tree" ? (
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setExpanded(new Set(panelKeys))}>
              Развернуть всё
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setExpanded(new Set())}>
              Свернуть всё
            </Button>
          </>
        ) : null}

        {focusNode && view === "sheet" ? (
          <span className="text-xs text-muted-foreground">Вписано, {Math.round(sheetScale * 100)}%</span>
        ) : null}

        <div className={focusNode && view === "tree" ? "flex items-center gap-1" : "hidden"}>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))} aria-label="Уменьшить">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} aria-label="Увеличить">
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              const canvas = canvasRef.current;
              const content = contentRef.current;
              if (canvas && content) {
                const cw = canvas.clientWidth;
                const raw = content.scrollWidth / zoom;
                const fit = Math.min(1, Math.max(0.4, (cw - 48) / Math.max(raw, 1)));
                setZoom(fit);
                setPan({ x: Math.round((cw - raw * fit) / 2), y: 0 });
              }
            }}
            aria-label="Сбросить вид"
          >
            <Scan className="h-4 w-4" />
          </Button>
        </div>

        {focusNode ? (
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setFullscreen((f) => !f)} aria-label="Во весь экран">
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <button type="button" className="hover:underline" onClick={() => setFocusKey(null)}>
          Вся структура
        </button>
        {focusCrumbs.map((c) => (
          <span key={c.key} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button
              type="button"
              className="text-left hover:underline"
              onClick={() => setFocusKey(c.key)}
            >
              {c.name}
            </button>
          </span>
        ))}
      </nav>

      {focusNode ? (
      <div
        ref={canvasRef}
        className={[
          "org-canvas relative bg-muted/30",
          view === "sheet"
            ? "overflow-x-hidden overflow-y-auto"
            : "cursor-grab overflow-hidden active:cursor-grabbing",
          fullscreen ? "flex-1" : "h-[70vh]",
        ].join(" ")}
        style={
          view === "sheet" && !fullscreen && sheetSize && typeof window !== "undefined"
            ? { height: Math.min(window.innerHeight * 0.7, sheetSize.h * sheetScale + 32) }
            : undefined
        }
        onPointerDown={(e) => {
          if (view === "sheet") return;
          if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;
          dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          if (view === "sheet") return;
          const d = dragRef.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!dragging.current) {
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          setPan({ x: d.px + dx, y: d.py + dy });
        }}
        onPointerUp={() => {
          dragRef.current = null;
          dragging.current = false;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
          dragging.current = false;
        }}
        onWheel={(e) => {
          if (view === "sheet") return;
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          setZoom((z) => Math.min(1.6, Math.max(0.35, z - e.deltaY * 0.001)));
        }}
      >
        <div
          ref={contentRef}
          className={view === "sheet" ? "mx-auto origin-top-left" : "w-max origin-top-left"}
          style={
            view === "sheet"
              ? {
                  transform: `scale(${sheetScale})`,
                  width: sheetSize ? sheetSize.w * sheetScale : undefined,
                  height: sheetSize ? sheetSize.h * sheetScale : undefined,
                }
              : { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }
          }
        >
          <div ref={innerRef} className="bg-background">
            <OrgBranch
              root={focusNode}
              query={query}
              onOpen={(n) => setDetail(n)}
              expanded={expanded}
              onToggle={toggle}
              sheet={view === "sheet"}
            />
          </div>
        </div>
      </div>
      ) : (
        <div className={fullscreen ? "flex-1 overflow-y-auto" : "max-h-[75vh] overflow-y-auto"}>
          <div ref={innerRef} className="bg-background">
            <OrgPoster
              roots={roots}
              note={note}
              query={query}
              onOpen={(n) => setDetail(n)}
              onOpenBranch={(n) => setFocusKey(n.key)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> Руководство
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden /> Службы, отделы и цеха
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden /> Участки, смены, рабочие центры
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden /> Рабочие места и профессии
        </span>
        <span className="ml-auto">
          {!focusNode
            ? "Выберите подразделение, чтобы увидеть подробную структуру"
            : view === "sheet"
              ? sheetScale <= MIN_SHEET_SCALE
                ? "Ветка очень большая — откройте вложенное подразделение или разверните на весь экран"
                : "Вся ветка на одном листе, масштаб подобран автоматически"
              : "Перетаскивайте схему мышью, Ctrl + колесо — масштаб"}
        </span>
      </div>

      {detailSheet}
    </div>
  );
}
