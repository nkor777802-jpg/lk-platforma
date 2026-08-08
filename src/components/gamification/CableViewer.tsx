import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { layerColor, type ModelLayer } from "./CableModel3D";

const CableModel3D = lazy(() => import("./CableModel3D"));

export function CableViewer({
  layers,
  visibleCount,
}: {
  layers: ModelLayer[];
  visibleCount: number;
}) {
  const [exploded, setExploded] = useState(false);
  const [section, setSection] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [labels, setLabels] = useState(true);
  const [hidden, setHidden] = useState<string[]>([]);

  const toggleLayer = (code: string) =>
    setHidden((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const shown = layers.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-muted/40">
        <ClientOnly fallback={<Skeleton className="h-[320px] w-full sm:h-[420px]" />}>
          <Suspense fallback={<Skeleton className="h-[320px] w-full sm:h-[420px]" />}>
            <CableModel3D
              layers={layers}
              visibleCount={visibleCount}
              options={{ exploded, section, transparent, hidden }}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Toggle id="exploded" label="Разобрать кабель" checked={exploded} onChange={setExploded} />
        <Toggle id="section" label="Поперечное сечение" checked={section} onChange={setSection} />
        <Toggle id="transparent" label="Прозрачность" checked={transparent} onChange={setTransparent} />
        <Toggle id="labels" label="Названия элементов" checked={labels} onChange={setLabels} />
      </div>

      {labels ? (
        <ul className="space-y-1">
          {shown.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              Конструкция появится после первой выполненной операции.
            </li>
          ) : (
            shown.map((l) => (
              <li key={l.code} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full border"
                  style={{ backgroundColor: layerColor(l.visualType) }}
                />
                <span className="flex-1 truncate">
                  {l.name}
                  {l.materialName ? (
                    <span className="text-muted-foreground"> — {l.materialName}</span>
                  ) : null}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={hidden.includes(l.code) ? "Показать слой" : "Скрыть слой"}
                  onClick={() => toggleLayer(l.code)}
                >
                  {hidden.includes(l.code) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Вращение — перетаскивание мышью, масштабирование — колесо, панорама — правая кнопка.
      </p>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
  );
}
